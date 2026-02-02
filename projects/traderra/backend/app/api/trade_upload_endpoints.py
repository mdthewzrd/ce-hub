"""
Trade Upload Endpoints

API endpoints for uploading Tradervue CSV files with deduplication.
Supports upsert operations (update existing, insert new) with batch tracking.
"""

import hashlib
import json
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from io import StringIO

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import pandas as pd

from ..core.database import get_database_connection
from asyncpg import Connection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/trades", tags=["trades"])


# ============================================================================
# Pydantic Models
# ============================================================================

class TradeImportBatch(BaseModel):
    """Model for tracking import batches"""
    id: str
    user_id: str
    file_name: str
    imported_at: datetime
    trade_count: int
    updated_count: int = 0
    status: str  # 'success' | 'partial' | 'failed'
    errors: Optional[str] = None


class TradeData(BaseModel):
    """Model for trade data from Tradervue CSV"""
    symbol: str
    side: str  # "Long" or "Short"
    entry_price: float
    exit_price: Optional[float] = None
    quantity: int
    pnl: Optional[float] = None
    entry_date: str
    exit_date: Optional[str] = None
    commissions: Optional[float] = None
    fees: Optional[float] = None


class UploadResponse(BaseModel):
    """Response model for trade upload"""
    success: bool
    message: str
    batch_id: Optional[str] = None
    new_count: int = 0
    updated_count: int = 0
    duplicate_count: int = 0
    error_count: int = 0
    errors: List[str] = Field(default_factory=list)
    preview: List[Dict[str, Any]] = Field(default_factory=list)


class UploadPreviewResponse(BaseModel):
    """Response model for upload preview"""
    success: bool
    file_name: str
    total_trades: int
    duplicates: int
    new_trades: int
    preview: List[Dict[str, Any]]


# ============================================================================
# Helper Functions
# ============================================================================

def generate_trade_hash(trade: TradeData) -> str:
    """
    Generate SHA-256 hash for duplicate detection.
    Hash is based on key trade fields.
    """
    key_data = {
        "entry_date": trade.entry_date,
        "symbol": trade.symbol,
        "side": trade.side,
        "quantity": trade.quantity,
        "entry_price": trade.entry_price,
        "exit_price": trade.exit_price,
    }
    data_string = json.dumps(key_data, sort_keys=True)
    return hashlib.sha256(data_string.encode()).hexdigest()


async def parse_tradervue_csv(csv_content: str) -> List[TradeData]:
    """
    Parse Tradervue CSV format into TradeData objects.
    Handles the specific format documented in TRADERVUE_CSV_FIXES.md
    """
    try:
        df = pd.read_csv(StringIO(csv_content))

        # Validate required columns
        required_columns = [
            'Open Datetime', 'Close Datetime', 'Symbol', 'Side',
            'Volume', 'Entry Price', 'Exit Price', 'Net P&L'
        ]
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")

        trades = []
        for _, row in df.iterrows():
            try:
                # Parse dates
                entry_date = str(row['Open Datetime'])
                exit_date = str(row['Close Datetime']) if pd.notna(row['Close Datetime']) else None

                # Parse numeric values with safe defaults
                def safe_float(val):
                    if pd.isna(val):
                        return 0.0
                    val_str = str(val).strip()
                    if val_str in ['', 'N/A', 'n/a', 'Inf', 'inf', 'Infinity', '-Inf', '-inf']:
                        return 0.0
                    cleaned = val_str.replace('$', '').replace(',', '').replace('%', '')
                    try:
                        return float(cleaned)
                    except ValueError:
                        return 0.0

                entry_price = safe_float(row['Entry Price'])
                exit_price = safe_float(row['Exit Price'])
                pnl = safe_float(row['Net P&L'])

                # Parse quantity
                try:
                    quantity = int(float(row['Volume']))
                except (ValueError, TypeError):
                    quantity = 0

                # Parse commissions and fees
                commissions = safe_float(row.get('Commissions', 0))
                fees = safe_float(row.get('Fees', 0))

                trade = TradeData(
                    symbol=str(row['Symbol']).strip(),
                    side=str(row['Side']).strip().capitalize(),
                    entry_price=entry_price,
                    exit_price=exit_price if exit_price > 0 else None,
                    quantity=quantity,
                    pnl=pnl,
                    entry_date=entry_date,
                    exit_date=exit_date,
                    commissions=commissions,
                    fees=fees
                )
                trades.append(trade)
            except Exception as e:
                logger.warning(f"Error parsing trade row: {e}")
                continue

        return trades

    except Exception as e:
        logger.error(f"Error parsing CSV: {e}")
        raise


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/upload/preview", response_model=UploadPreviewResponse)
async def preview_trade_upload(
    file: UploadFile = File(...),
    user_id: str = "default_user"
):
    """
    Preview trade upload without importing.
    Shows duplicate detection results and trade count summary.
    """
    try:
        # Read CSV content
        content = await file.read()
        csv_text = content.decode('utf-8-sig')  # Handle BOM

        # Parse trades
        trades = await parse_tradervue_csv(csv_text)

        if not trades:
            raise HTTPException(status_code=400, detail="No valid trades found in CSV")

        # Check for duplicates
        async with get_database_connection() as conn:
            # Get existing hashes for this user
            existing_hashes = await conn.fetch(
                """
                SELECT DISTINCT data_hash
                FROM content_items
                WHERE user_id = $1
                AND type = 'trade_entry'
                AND content->>'trade_hash' IS NOT NULL
                """,
                user_id
            )
            existing_hash_set = {row['data_hash'] for row in existing_hashes}

            # Count duplicates and new trades
            new_trades = []
            duplicates = 0

            for trade in trades:
                trade_hash = generate_trade_hash(trade)
                if trade_hash in existing_hash_set:
                    duplicates += 1
                else:
                    new_trades.append(trade)

        # Prepare preview (first 10 trades)
        preview_data = []
        for trade in trades[:10]:
            trade_hash = generate_trade_hash(trade)
            is_duplicate = trade_hash in existing_hash_set
            preview_data.append({
                "symbol": trade.symbol,
                "side": trade.side,
                "entry_date": trade.entry_date,
                "entry_price": trade.entry_price,
                "exit_price": trade.exit_price,
                "quantity": trade.quantity,
                "pnl": trade.pnl,
                "is_duplicate": is_duplicate,
                "hash": trade_hash[:16] + "..."  # First 16 chars for display
            })

        return UploadPreviewResponse(
            success=True,
            file_name=file.filename,
            total_trades=len(trades),
            duplicates=duplicates,
            new_trades=len(new_trades),
            preview=preview_data
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Preview error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Preview failed: {str(e)}")


@router.post("/upload", response_model=UploadResponse)
async def upload_trades(
    file: UploadFile = File(...),
    user_id: str = "default_user",
    import_if_exists: str = "update"  # 'update' | 'skip' | 'error'
):
    """
    Upload trades from Tradervue CSV file with deduplication.

    Parameters:
    - file: CSV file from Tradervue export
    - user_id: User identifier for ownership
    - import_if_exists: How to handle duplicates ('update', 'skip', 'error')
    """
    try:
        # Read CSV content
        content = await file.read()
        csv_text = content.decode('utf-8-sig')

        # Parse trades
        trades = await parse_tradervue_csv(csv_text)

        if not trades:
            raise HTTPException(status_code=400, detail="No valid trades found in CSV")

        # Create import batch record
        batch_id = hashlib.sha256(f"{user_id}_{file.filename}_{datetime.now().isoformat()}".encode()).hexdigest()[:32]

        async with get_database_connection() as conn:
            async with conn.transaction():
                # Create import batch tracking record
                await conn.execute(
                    """
                    INSERT INTO content_items (user_id, type, title, content, metadata, tags, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                    """,
                    user_id,
                    'import_batch',
                    f"Import: {file.filename}",
                    json.dumps({
                        "batch_id": batch_id,
                        "file_name": file.filename,
                        "trade_count": len(trades),
                        "imported_at": datetime.now().isoformat()
                    }),
                    {"batch_id": batch_id},
                    ["import", "csv", "tradervue"]
                )

                new_count = 0
                updated_count = 0
                duplicate_count = 0
                errors = []

                # Get root folder or create one for trades
                root_folder = await conn.fetchval(
                    "SELECT id FROM folders WHERE user_id = $1 AND parent_id IS NULL LIMIT 1",
                    user_id
                )

                # Process each trade
                for i, trade in enumerate(trades):
                    try:
                        trade_hash = generate_trade_hash(trade)

                        # Check for existing trade with same hash
                        existing = await conn.fetchrow(
                            """
                            SELECT id, content FROM content_items
                            WHERE user_id = $1
                            AND type = 'trade_entry'
                            AND content->>'trade_hash' = $2
                            LIMIT 1
                            """,
                            user_id, trade_hash
                        )

                        # Prepare trade content
                        trade_content = {
                            "trade_hash": trade_hash,
                            "trade_data": {
                                "symbol": trade.symbol,
                                "side": trade.side,
                                "entry_price": trade.entry_price,
                                "exit_price": trade.exit_price,
                                "quantity": trade.quantity,
                                "pnl": trade.pnl,
                                "commissions": trade.commissions,
                                "fees": trade.fees,
                                "entry_date": trade.entry_date,
                                "exit_date": trade.exit_date
                            },
                            "blocks": [],
                            "import_batch": batch_id
                        }

                        title = f"{trade.symbol} {trade.side} {trade.quantity}"

                        if existing:
                            # Handle existing trade
                            if import_if_exists == "update":
                                await conn.execute(
                                    """
                                    UPDATE content_items
                                    SET content = $1, updated_at = NOW()
                                    WHERE id = $2
                                    """,
                                    json.dumps(trade_content),
                                    existing['id']
                                )
                                updated_count += 1
                            elif import_if_exists == "skip":
                                duplicate_count += 1
                            else:  # error
                                errors.append(f"Row {i+1}: Duplicate trade found ({title})")
                        else:
                            # Create new trade
                            await conn.execute(
                                """
                                INSERT INTO content_items (user_id, type, title, content, metadata, folder_id, tags, created_at, updated_at)
                                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                                """,
                                user_id,
                                'trade_entry',
                                title,
                                json.dumps(trade_content),
                                {
                                    "import_batch": batch_id,
                                    "symbol": trade.symbol,
                                    "side": trade.side,
                                    "entry_date": trade.entry_date
                                },
                                root_folder,
                                ["trade", trade.symbol.lower(), trade.side.lower()]
                            )
                            new_count += 1

                    except Exception as e:
                        errors.append(f"Row {i+1}: {str(e)}")
                        logger.warning(f"Error processing trade {i}: {e}")

                # Update import batch with results
                status = "success" if not errors else "partial" if new_count + updated_count > 0 else "failed"

                await conn.execute(
                    """
                    UPDATE content_items
                    SET content = content || jsonb_build_object('status', $1, 'new_count', $2, 'updated_count', $3, 'duplicate_count', $4, 'errors', $5)
                    WHERE type = 'import_batch' AND content->>'batch_id' = $6
                    """,
                    status, new_count, updated_count, duplicate_count, json.dumps(errors[:100]), batch_id
                )

        # Prepare preview data for response
        preview_data = []
        for trade in trades[:5]:
            preview_data.append({
                "symbol": trade.symbol,
                "side": trade.side,
                "entry_price": trade.entry_price,
                "pnl": trade.pnl
            })

        return UploadResponse(
            success=new_count + updated_count > 0,
            message=f"Import complete: {new_count} new, {updated_count} updated, {duplicate_count} duplicates",
            batch_id=batch_id,
            new_count=new_count,
            updated_count=updated_count,
            duplicate_count=duplicate_count,
            error_count=len(errors),
            errors=errors[:20],  # Return first 20 errors
            preview=preview_data
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/imports")
async def list_import_batches(
    user_id: str = "default_user",
    limit: int = 20
):
    """List recent import batches for a user"""
    try:
        async with get_database_connection() as conn:
            rows = await conn.fetch(
                """
                SELECT id, title, content, created_at, updated_at
                FROM content_items
                WHERE user_id = $1 AND type = 'import_batch'
                ORDER BY created_at DESC
                LIMIT $2
                """,
                user_id, limit
            )

            batches = []
            for row in rows:
                content = json.loads(row['content']) if isinstance(row['content'], str) else row['content']
                batches.append({
                    "id": str(row['id']),
                    "file_name": content.get('file_name', 'Unknown'),
                    "trade_count": content.get('trade_count', 0),
                    "new_count": content.get('new_count', 0),
                    "updated_count": content.get('updated_count', 0),
                    "duplicate_count": content.get('duplicate_count', 0),
                    "status": content.get('status', 'unknown'),
                    "imported_at": row['created_at'].isoformat()
                })

            return {"success": True, "batches": batches}

    except Exception as e:
        logger.error(f"List imports error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/imports/{batch_id}")
async def delete_import_batch(
    batch_id: str,
    user_id: str = "default_user"
):
    """
    Delete an import batch and optionally its associated trades.
    Note: This does not delete the trades themselves, just the batch record.
    """
    try:
        async with get_database_connection() as conn:
            # Delete batch record
            result = await conn.execute(
                """
                DELETE FROM content_items
                WHERE user_id = $1 AND type = 'import_batch' AND content->>'batch_id' = $2
                """,
                user_id, batch_id
            )

            if result == "DELETE 0":
                raise HTTPException(status_code=404, detail="Import batch not found")

            return {"success": True, "message": "Import batch deleted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete batch error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
