from uuid import uuid4, UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import io
import pandas as pd

from routeiq.infrastructure.database.session import get_session
from routeiq.infrastructure.database.models import OrderModel, OrderImportJobModel, OrderImportRowModel
from routeiq.schemas.auth import Principal, Role
from routeiq.schemas.common import Page
from routeiq.schemas.operations import OrderCreate, OrderRead, OrderUpdate
from routeiq.security.auth import require_roles
from routeiq.application.ingestion.import_workflow import import_workflow

router = APIRouter()

@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    db: AsyncSession = Depends(get_session),
    principal: Principal = Depends(require_roles(Role.ADMIN, Role.DISPATCHER)),
):
    order_id = str(uuid4())
    order = OrderModel(
        id=order_id,
        organization_id=principal.organization_id,
        order_number=f"ORD-{order_id[:8].upper()}",
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        pickup_address=payload.pickup_address,
        delivery_address=payload.delivery_address,
        pickup_latitude=payload.pickup_latitude,
        pickup_longitude=payload.pickup_longitude,
        delivery_latitude=payload.delivery_latitude,
        delivery_longitude=payload.delivery_longitude,
        priority=payload.priority,
        package_weight=payload.package_weight,
        package_dimensions=payload.package_dimensions,
        delivery_deadline=payload.delivery_deadline,
        notes=payload.notes,
        status="pending"
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


@router.get("", response_model=Page[OrderRead])
async def list_orders(
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    status: str | None = None,
    db: AsyncSession = Depends(get_session),
    principal: Principal = Depends(require_roles(Role.ADMIN, Role.DISPATCHER, Role.FLEET_MANAGER)),
):
    query = select(OrderModel).where(OrderModel.organization_id == principal.organization_id)
    if status:
        query = query.where(OrderModel.status == status)
        
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    orders = result.scalars().all()
    
    total_query = select(OrderModel).where(OrderModel.organization_id == principal.organization_id)
    if status:
        total_query = total_query.where(OrderModel.status == status)
    total_result = await db.execute(total_query)
    total = len(total_result.scalars().all())

    return Page(items=list(orders), total=total, limit=limit, offset=offset)


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(
    order_id: str,
    db: AsyncSession = Depends(get_session),
    principal: Principal = Depends(require_roles(Role.ADMIN, Role.DISPATCHER, Role.FLEET_MANAGER)),
):
    query = select(OrderModel).where(OrderModel.id == order_id, OrderModel.organization_id == principal.organization_id)
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    return order


@router.patch("/{order_id}", response_model=OrderRead)
async def update_order(
    order_id: str,
    payload: OrderUpdate,
    db: AsyncSession = Depends(get_session),
    principal: Principal = Depends(require_roles(Role.ADMIN, Role.DISPATCHER)),
):
    query = select(OrderModel).where(OrderModel.id == order_id, OrderModel.organization_id == principal.organization_id)
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(order, key, value)
        
    await db.commit()
    await db.refresh(order)
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: str,
    db: AsyncSession = Depends(get_session),
    principal: Principal = Depends(require_roles(Role.ADMIN, Role.DISPATCHER)),
):
    query = select(OrderModel).where(OrderModel.id == order_id, OrderModel.organization_id == principal.organization_id)
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    await db.delete(order)
    await db.commit()
    return None

@router.post("/import", status_code=status.HTTP_200_OK)
async def bulk_import_orders(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_session),
    principal: Principal = Depends(require_roles(Role.ADMIN, Role.DISPATCHER)),
):
    if not file.filename or not file.filename.endswith(('.csv', '.xlsx', '.json')):
        raise HTTPException(status_code=400, detail="Only CSV, XLSX, and JSON files are supported")
        
    contents = await file.read()
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith('.json'):
            df = pd.read_json(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
        
    df = df.fillna("")
    
    job_id = str(uuid4())
    job = OrderImportJobModel(
        id=job_id,
        organization_id=principal.organization_id,
        file_name=file.filename,
        import_type="bulk",
        status="validating",
        total_rows=len(df)
    )
    db.add(job)
    
    success_count = 0
    failed_count = 0
    
    for idx, row in df.iterrows():
        row_dict = row.to_dict()
        errors = []
        if not row_dict.get("customer_name"):
            errors.append("Missing customer_name")
        if not row_dict.get("delivery_address"):
            errors.append("Missing delivery_address")
            
        is_valid = len(errors) == 0
        if is_valid:
            success_count += 1
        else:
            failed_count += 1
            
        import_row = OrderImportRowModel(
            id=str(uuid4()),
            job_id=job_id,
            row_index=idx,
            raw_data=row_dict,
            parsed_data=row_dict,
            is_valid=is_valid,
            validation_errors=errors,
            status="pending"
        )
        db.add(import_row)
        
    job.success_rows = success_count
    job.failed_rows = failed_count
    job.status = "pending_approval"
    
    await db.commit()
    return {"status": "success", "job_id": job_id, "total": len(df), "valid": success_count, "invalid": failed_count}

@router.post("/smart-import", status_code=status.HTTP_202_ACCEPTED)
async def smart_import_orders(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_session),
    principal: Principal = Depends(require_roles(Role.ADMIN, Role.DISPATCHER)),
):
    valid_extensions = ('.pdf', '.png', '.jpg', '.jpeg')
    if not file.filename or not file.filename.lower().endswith(valid_extensions):
        raise HTTPException(status_code=400, detail=f"Only PDF and Image formats are supported {valid_extensions}")
        
    contents = await file.read()
    file_ext = file.filename.split('.')[-1] if file.filename else "jpg"
    
    job_id = str(uuid4())
    job = OrderImportJobModel(
        id=job_id,
        organization_id=principal.organization_id,
        file_name=file.filename,
        import_type="smart",
        status="queued"
    )
    db.add(job)
    await db.commit()
    
    # Trigger the heavy OCR/AI pipeline in the background
    background_tasks.add_task(
        import_workflow.process_smart_import, 
        job_id, 
        principal.organization_id, 
        contents, 
        file_ext, 
        db
    )
    
    return {"status": "queued", "job_id": job_id, "message": "Smart import is processing in the background."}

@router.get("/import-jobs/{job_id}/preview")
async def get_import_preview(
    job_id: UUID,
    db: AsyncSession = Depends(get_session),
    principal: Principal = Depends(require_roles(Role.ADMIN, Role.DISPATCHER)),
):
    job_query = select(OrderImportJobModel).where(OrderImportJobModel.id == job_id, OrderImportJobModel.organization_id == principal.organization_id)
    job_result = await db.execute(job_query)
    job = job_result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    rows_query = select(OrderImportRowModel).where(OrderImportRowModel.job_id == job_id).order_by(OrderImportRowModel.row_index)
    rows_result = await db.execute(rows_query)
    rows = rows_result.scalars().all()
    
    return {
        "job": {
            "id": job.id,
            "status": job.status,
            "file_name": job.file_name,
            "total_rows": job.total_rows,
            "success_rows": job.success_rows,
            "failed_rows": job.failed_rows,
            "import_type": job.import_type
        },
        "rows": rows
    }

@router.post("/import-jobs/{job_id}/commit")
async def commit_import_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_session),
    principal: Principal = Depends(require_roles(Role.ADMIN, Role.DISPATCHER)),
):
    job_query = select(OrderImportJobModel).where(OrderImportJobModel.id == job_id, OrderImportJobModel.organization_id == principal.organization_id)
    job_result = await db.execute(job_query)
    job = job_result.scalar_one_or_none()
    
    if not job or job.status != "pending_approval":
        raise HTTPException(status_code=400, detail="Job not found or not in pending_approval status")
        
    rows_query = select(OrderImportRowModel).where(OrderImportRowModel.job_id == job_id, OrderImportRowModel.is_valid == True, OrderImportRowModel.status == "pending")
    rows_result = await db.execute(rows_query)
    rows = rows_result.scalars().all()
    
    orders_to_insert = []
    for row in rows:
        data = row.parsed_data or {}
        new_id = str(uuid4())
        order = OrderModel(
            id=new_id,
            organization_id=principal.organization_id,
            order_number=f"IMP-{new_id[:8].upper()}",
            customer_name=str(data.get("customer_name", "Unknown")),
            customer_phone=str(data.get("customer_phone")) if data.get("customer_phone") else None,
            pickup_address=data.get("pickup_address"),
            delivery_address=str(data.get("delivery_address", "")),
            pickup_latitude=float(data.get("pickup_latitude") or data.get("pickup_lat")) if (data.get("pickup_latitude") or data.get("pickup_lat")) else None,
            pickup_longitude=float(data.get("pickup_longitude") or data.get("pickup_lng")) if (data.get("pickup_longitude") or data.get("pickup_lng")) else None,
            delivery_latitude=float(data.get("delivery_latitude") or data.get("delivery_lat")) if (data.get("delivery_latitude") or data.get("delivery_lat")) else 0.0,
            delivery_longitude=float(data.get("delivery_longitude") or data.get("delivery_lng")) if (data.get("delivery_longitude") or data.get("delivery_lng")) else 0.0,
            priority=str(data.get("priority", "medium")),
            package_weight=float(data["package_weight"]) if data.get("package_weight") else None,
            package_dimensions=data.get("package_dimensions") if isinstance(data.get("package_dimensions"), dict) else None,
            notes=str(data.get("notes")) if data.get("notes") else None,
            status="pending"
        )
        orders_to_insert.append(order)
        row.status = "imported"
        
    if orders_to_insert:
        db.add_all(orders_to_insert)
        
    job.status = "completed"
    await db.commit()
    
    return {"status": "success", "imported_count": len(orders_to_insert)}
