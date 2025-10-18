"""
Traderra Database Configuration

Database connection management using asyncpg for PostgreSQL.
Optimized for the folder management system with JSONB support.
"""

import asyncio
import logging
from typing import AsyncGenerator, Optional
from contextlib import asynccontextmanager

import asyncpg
from asyncpg import Connection, Pool

from .config import settings

logger = logging.getLogger(__name__)

# Global connection pool
_connection_pool: Optional[Pool] = None


async def create_connection_pool() -> Pool:
    """
    Create and configure AsyncPG connection pool

    Returns:
        Configured connection pool
    """
    try:
        pool = await asyncpg.create_pool(
            host=settings.database_host,
            port=settings.database_port,
            user=settings.database_user,
            password=settings.database_password,
            database=settings.database_name,
            ssl=settings.database_ssl,
            min_size=settings.database_pool_min_size,
            max_size=settings.database_pool_max_size,
            command_timeout=60,
            server_settings={
                'application_name': 'traderra_api',
                'timezone': 'UTC',
            }
        )

        logger.info(f"✅ Database connection pool created: {settings.database_host}:{settings.database_port}")
        return pool

    except Exception as e:
        logger.error(f"❌ Failed to create database connection pool: {e}")
        raise


async def get_connection_pool() -> Pool:
    """
    Get the global connection pool, creating it if necessary

    Returns:
        Database connection pool
    """
    global _connection_pool

    if _connection_pool is None:
        _connection_pool = await create_connection_pool()

    return _connection_pool


async def close_connection_pool():
    """Close the global connection pool"""
    global _connection_pool

    if _connection_pool:
        await _connection_pool.close()
        _connection_pool = None
        logger.info("✅ Database connection pool closed")


@asynccontextmanager
async def get_database_connection() -> AsyncGenerator[Connection, None]:
    """
    Dependency to provide database connection from pool

    Usage:
        async def my_endpoint(db: Connection = Depends(get_database_connection)):
            result = await db.fetchval("SELECT 1")
    """
    pool = await get_connection_pool()

    async with pool.acquire() as connection:
        try:
            yield connection
        except Exception as e:
            logger.error(f"Database operation error: {e}")
            raise


async def init_database():
    """
    Initialize database with required extensions and run migrations

    This should be called during application startup
    """
    try:
        pool = await get_connection_pool()

        async with pool.acquire() as connection:
            # Enable required extensions
            await connection.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

            # Check if migrations table exists
            table_exists = await connection.fetchval("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = 'schema_migrations'
                )
            """)

            if not table_exists:
                # Create migrations tracking table
                await connection.execute("""
                    CREATE TABLE schema_migrations (
                        version VARCHAR(255) PRIMARY KEY,
                        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                """)
                logger.info("✅ Created schema_migrations table")

            # Check if folders table exists (indicates migration was run)
            folders_exists = await connection.fetchval("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = 'folders'
                )
            """)

            if not folders_exists:
                logger.warning("⚠️  Folders table not found. Database migration required.")
                logger.info("Run the migration script: migrations/001_create_folders_and_content.sql")
            else:
                logger.info("✅ Database schema is ready")

    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise


async def run_migration(migration_file: str):
    """
    Run a specific migration file

    Args:
        migration_file: Path to the migration SQL file
    """
    try:
        pool = await get_connection_pool()

        # Read migration file
        with open(migration_file, 'r') as f:
            migration_sql = f.read()

        async with pool.acquire() as connection:
            # Execute migration in a transaction
            async with connection.transaction():
                await connection.execute(migration_sql)

                # Record migration
                migration_name = migration_file.split('/')[-1].replace('.sql', '')
                await connection.execute(
                    "INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING",
                    migration_name
                )

        logger.info(f"✅ Migration completed: {migration_name}")

    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        raise


async def check_database_health() -> dict:
    """
    Check database connectivity and basic health

    Returns:
        Health status information
    """
    try:
        pool = await get_connection_pool()

        async with pool.acquire() as connection:
            # Basic connectivity test
            result = await connection.fetchval("SELECT 1")

            # Check key tables exist
            tables_check = await connection.fetch("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name IN ('folders', 'content_items')
            """)

            # Get some basic stats
            folder_count = 0
            content_count = 0

            if any(row['table_name'] == 'folders' for row in tables_check):
                folder_count = await connection.fetchval("SELECT COUNT(*) FROM folders")

            if any(row['table_name'] == 'content_items' for row in tables_check):
                content_count = await connection.fetchval("SELECT COUNT(*) FROM content_items")

            return {
                "status": "healthy",
                "connectivity": result == 1,
                "tables": [row['table_name'] for row in tables_check],
                "stats": {
                    "total_folders": folder_count,
                    "total_content_items": content_count
                },
                "pool_stats": {
                    "size": pool.get_size(),
                    "min_size": pool.get_min_size(),
                    "max_size": pool.get_max_size(),
                }
            }

    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }


# For backwards compatibility with SQLAlchemy patterns
async def get_async_session():
    """
    Compatibility function for existing code expecting SQLAlchemy sessions

    Note: This actually returns asyncpg connections, not SQLAlchemy sessions
    """
    async with get_database_connection() as connection:
        yield connection