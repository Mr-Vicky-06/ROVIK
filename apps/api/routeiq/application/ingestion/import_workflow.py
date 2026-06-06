import logging
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from routeiq.infrastructure.database.models import OrderImportJobModel, OrderImportRowModel
from routeiq.application.ingestion.ocr_engine import ocr_engine
from routeiq.application.ingestion.ai_extractor import ai_extractor
from routeiq.application.ingestion.geocoding_service import geocoding_service
from routeiq.realtime.connection_manager import connection_manager

logger = logging.getLogger(__name__)

class ImportWorkflow:
    async def process_smart_import(
        self, 
        job_id: str, 
        organization_id: str, 
        file_bytes: bytes, 
        file_ext: str, 
        db: AsyncSession
    ):
        """
        Background task that processes an uploaded document (Image/PDF) end-to-end.
        """
        try:
            # Step 1: Update Status
            await self._update_job_status(db, job_id, "extracting_text")
            await self._broadcast(organization_id, job_id, "extracting_text", "Extracting raw text via OCR...")
            
            # Step 2: OCR Extraction
            if file_ext.lower() == 'pdf':
                raw_text = await ocr_engine.extract_text_from_pdf(file_bytes)
            else:
                raw_text = await ocr_engine.extract_text_from_image(file_bytes)
                
            if not raw_text or not raw_text.strip():
                raise ValueError("No text could be extracted from the document.")

            # Step 3: AI Structuring
            await self._update_job_status(db, job_id, "structuring_data")
            await self._broadcast(organization_id, job_id, "structuring_data", "AI is structuring delivery data...")
            extracted_orders = await ai_extractor.extract_orders(raw_text)
            
            if not extracted_orders:
                raise ValueError("AI could not detect any delivery orders in the document.")

            # Step 4: Geocoding & Validation (Row by Row)
            await self._update_job_status(db, job_id, "validating")
            await self._broadcast(organization_id, job_id, "validating", f"Validating and Geocoding {len(extracted_orders)} orders...")
            
            # Create import rows
            total_success = 0
            total_failed = 0
            
            for idx, order_data in enumerate(extracted_orders):
                errors = []
                # Basic schema validation (just in case AI missed something)
                if not order_data.get("customer_name"):
                    errors.append("Missing Customer Name")
                if not order_data.get("delivery_address"):
                    errors.append("Missing Delivery Address")
                
                # Geocoding
                if "Delivery Address" not in errors:
                    coords = await geocoding_service.geocode_address(order_data["delivery_address"])
                    if coords:
                        order_data["delivery_latitude"] = coords[0]
                        order_data["delivery_longitude"] = coords[1]
                    else:
                        errors.append("Could not geocode delivery address")
                        order_data["delivery_latitude"] = 0.0
                        order_data["delivery_longitude"] = 0.0
                
                is_valid = len(errors) == 0
                if is_valid:
                    total_success += 1
                else:
                    total_failed += 1

                # Save row to staging table
                row = OrderImportRowModel(
                    id=str(uuid4()),
                    job_id=job_id,
                    row_index=idx,
                    raw_data=order_data, # store raw AI output as baseline
                    parsed_data=order_data, # editable representation
                    is_valid=is_valid,
                    validation_errors=errors,
                    status="pending"
                )
                db.add(row)

            # Update Job aggregates
            job = await self._get_job(db, job_id)
            if job:
                job.total_rows = len(extracted_orders)
                job.success_rows = total_success
                job.failed_rows = total_failed
                job.status = "pending_approval"
            
            await db.commit()
            await self._broadcast(organization_id, job_id, "pending_approval", "Validation complete. Awaiting user approval.")

        except Exception as e:
            logger.error(f"Smart Import Failed for job {job_id}: {e}")
            await self._update_job_status(db, job_id, "failed", str(e))
            await self._broadcast(organization_id, job_id, "failed", f"Import Failed: {str(e)}")

    async def _update_job_status(self, db: AsyncSession, job_id: str, status: str, error_msg: str | None = None):
        job = await self._get_job(db, job_id)
        if job:
            job.status = status
            if error_msg:
                # Create a new dict to avoid mutating JSONB directly which sometimes isn't tracked
                new_meta = dict(job.metadata_fields or {})
                new_meta["error"] = error_msg
                job.metadata_fields = new_meta
            await db.commit()

    async def _get_job(self, db: AsyncSession, job_id: str) -> OrderImportJobModel | None:
        result = await db.execute(select(OrderImportJobModel).where(OrderImportJobModel.id == job_id))
        return result.scalar_one_or_none()
        
    async def _broadcast(self, organization_id: str, job_id: str, status: str, message: str):
        payload = {
            "type": "IMPORT_PROGRESS",
            "job_id": job_id,
            "status": status,
            "message": message
        }
        await connection_manager.broadcast(organization_id, payload)

import_workflow = ImportWorkflow()
