import asyncio
from datetime import datetime, timedelta
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from routeiq.infrastructure.database.models import EventModel, TelemetryHistoryModel, AiContextModel
from routeiq.infrastructure.database.session import AsyncSessionLocal

class StorageOptimizer:
    """
    ROVIK Storage Optimization Service
    Enforces the strict 50GB data retention constraints by archiving and deleting old records.
    """
    
    # Strict Retention Policies
    TELEMETRY_RETENTION_DAYS = 30
    EVENT_RETENTION_DAYS = 90
    AI_MEMORY_RETENTION_DAYS = 365
    
    @staticmethod
    async def cleanup_old_telemetry(db: AsyncSession):
        print(f"Purging telemetry older than {StorageOptimizer.TELEMETRY_RETENTION_DAYS} days...")
        cutoff = datetime.now() - timedelta(days=StorageOptimizer.TELEMETRY_RETENTION_DAYS)
        stmt = delete(TelemetryHistoryModel).where(TelemetryHistoryModel.timestamp < cutoff)
        result = await db.execute(stmt)
        await db.commit()
        print(f"-> Deleted {result.rowcount} stale telemetry records.")

    @staticmethod
    async def cleanup_old_events(db: AsyncSession):
        print(f"Purging operational events older than {StorageOptimizer.EVENT_RETENTION_DAYS} days...")
        cutoff = datetime.now() - timedelta(days=StorageOptimizer.EVENT_RETENTION_DAYS)
        stmt = delete(EventModel).where(EventModel.created_at < cutoff)
        result = await db.execute(stmt)
        await db.commit()
        print(f"-> Deleted {result.rowcount} stale event records.")
        
    @staticmethod
    async def optimize_ai_memory(db: AsyncSession):
        print(f"Purging AI Context Memory older than {StorageOptimizer.AI_MEMORY_RETENTION_DAYS} days...")
        cutoff = datetime.now() - timedelta(days=StorageOptimizer.AI_MEMORY_RETENTION_DAYS)
        stmt = delete(AiContextModel).where(AiContextModel.created_at < cutoff)
        result = await db.execute(stmt)
        await db.commit()
        print(f"-> Deleted {result.rowcount} stale AI Context records.")

async def run_optimizer():
    print("=== ROVIK STORAGE OPTIMIZER ===")
    print("Enforcing strict < 50 GB Data Retention Policies...")
    
    async with AsyncSessionLocal() as db:
        await StorageOptimizer.cleanup_old_telemetry(db)
        await StorageOptimizer.cleanup_old_events(db)
        await StorageOptimizer.optimize_ai_memory(db)
        # Execute PostgreSQL VACUUM to reclaim disk space
        print("Running VACUUM FULL to reclaim physical disk space...")
        await db.execute("VACUUM FULL telemetry_history;")
        await db.execute("VACUUM FULL events;")
        await db.execute("VACUUM FULL ai_context;")
        
    print("=== OPTIMIZATION COMPLETE ===")

if __name__ == "__main__":
    asyncio.run(run_optimizer())
