"""
Traderra SQLite Database for Trades

This module provides access to the SQLite database that stores user trading data.
It shares the same database file as the frontend (Prisma-managed).
"""

import aiosqlite
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from .config import settings

logger = logging.getLogger(__name__)

# SQLite database path (same as frontend)
SQLITE_DB_PATH = settings.sqlite_database_url.replace("file:", "").strip()


class TradeData:
    """Trade data model"""
    def __init__(self, **kwargs):
        self.id = kwargs.get('id')
        self.userId = kwargs.get('userId')
        self.date = kwargs.get('date')
        self.symbol = kwargs.get('symbol')
        self.side = kwargs.get('side')
        self.quantity = kwargs.get('quantity')
        self.entryPrice = kwargs.get('entryPrice')
        self.exitPrice = kwargs.get('exitPrice')
        self.pnl = kwargs.get('pnl')
        self.pnlPercent = kwargs.get('pnlPercent')
        self.commission = kwargs.get('commission')
        self.duration = kwargs.get('duration')
        self.strategy = kwargs.get('strategy')
        self.notes = kwargs.get('notes')
        self.entryTime = kwargs.get('entryTime')
        self.exitTime = kwargs.get('exitTime')
        self.riskAmount = kwargs.get('riskAmount')
        self.riskPercent = kwargs.get('riskPercent')
        self.stopLoss = kwargs.get('stopLoss')
        self.rMultiple = kwargs.get('rMultiple')
        self.mfe = kwargs.get('mfe')
        self.mae = kwargs.get('mae')
        self.createdAt = kwargs.get('createdAt')
        self.updatedAt = kwargs.get('updatedAt')

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'id': self.id,
            'userId': self.userId,
            'date': self.date,
            'symbol': self.symbol,
            'side': self.side,
            'quantity': self.quantity,
            'entryPrice': self.entryPrice,
            'exitPrice': self.exitPrice,
            'pnl': self.pnl,
            'pnlPercent': self.pnlPercent,
            'commission': self.commission,
            'duration': self.duration,
            'strategy': self.strategy,
            'notes': self.notes,
            'entryTime': self.entryTime,
            'exitTime': self.exitTime,
            'riskAmount': self.riskAmount,
            'riskPercent': self.riskPercent,
            'stopLoss': self.stopLoss,
            'rMultiple': self.rMultiple,
            'mfe': self.mfe,
            'mae': self.mae,
            'createdAt': self.createdAt,
            'updatedAt': self.updatedAt,
        }


async def get_sqlite_connection() -> aiosqlite.Connection:
    """
    Get a SQLite database connection

    Returns:
        aiosqlite connection object
    """
    db_path = SQLITE_DB_PATH

    # Ensure the database file exists
    if not Path(db_path).exists():
        logger.warning(f"⚠️  SQLite database not found at: {db_path}")
        raise FileNotFoundError(f"Database not found: {db_path}")

    logger.info(f"🔗 Connecting to SQLite database: {db_path}")
    conn = await aiosqlite.connect(db_path)
    conn.row_factory = aiosqlite.Row  # Enable column access by name
    return conn


async def get_user_trades(user_id: str, limit: Optional[int] = None) -> List[TradeData]:
    """
    Get all trades for a specific user

    Args:
        user_id: Clerk user ID
        limit: Optional limit on number of trades returned

    Returns:
        List of TradeData objects
    """
    try:
        async with await get_sqlite_connection() as conn:
            if limit:
                query = """
                    SELECT * FROM Trade
                    WHERE userId = ?
                    ORDER BY date DESC
                    LIMIT ?
                """
                cursor = await conn.execute(query, (user_id, limit))
            else:
                query = """
                    SELECT * FROM Trade
                    WHERE userId = ?
                    ORDER BY date DESC
                """
                cursor = await conn.execute(query, (user_id,))

            rows = await cursor.fetchall()
            trades = [TradeData(**dict(row)) for row in rows]

            logger.info(f"📊 Retrieved {len(trades)} trades for user {user_id}")
            return trades

    except Exception as e:
        logger.error(f"❌ Error fetching trades for user {user_id}: {e}")
        return []


async def get_trade_count(user_id: str) -> int:
    """
    Get the total number of trades for a user

    Args:
        user_id: Clerk user ID

    Returns:
        Number of trades
    """
    try:
        async with await get_sqlite_connection() as conn:
            query = "SELECT COUNT(*) as count FROM Trade WHERE userId = ?"
            cursor = await conn.execute(query, (user_id,))
            row = await cursor.fetchone()
            count = row['count'] if row else 0

            logger.info(f"📈 User {user_id} has {count} trades")
            return count

    except Exception as e:
        logger.error(f"❌ Error counting trades for user {user_id}: {e}")
        return 0


async def get_performance_metrics(user_id: str) -> Dict[str, Any]:
    """
    Calculate performance metrics for a user

    Args:
        user_id: Clerk user ID

    Returns:
        Dictionary containing performance metrics
    """
    try:
        async with await get_sqlite_connection() as conn:
            # Get all trades
            query = """
                SELECT
                    COUNT(*) as total_trades,
                    SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
                    SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) as losing_trades,
                    SUM(pnl) as total_pnl,
                    AVG(CASE WHEN pnl > 0 THEN pnl END) as avg_winner,
                    AVG(CASE WHEN pnl < 0 THEN pnl END) as avg_loser,
                    AVG(rMultiple) as avg_r_multiple,
                    MAX(rMultiple) as max_r_multiple,
                    MIN(rMultiple) as min_r_multiple
                FROM Trade
                WHERE userId = ?
            """
            cursor = await conn.execute(query, (user_id,))
            row = await cursor.fetchone()

            if not row or row['total_trades'] == 0:
                return {
                    'total_trades': 0,
                    'win_rate': 0,
                    'total_pnl': 0,
                    'avg_r_multiple': 0,
                }

            total_trades = row['total_trades']
            winning_trades = row['winning_trades'] or 0
            losing_trades = row['losing_trades'] or 0
            total_pnl = row['total_pnl'] or 0
            avg_winner = row['avg_winner'] or 0
            avg_loser = row['avg_loser'] or 0
            avg_r_multiple = row['avg_r_multiple'] or 0

            # Calculate win rate
            win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0

            # Calculate profit factor
            gross_profit = await _calculate_gross_profit(conn, user_id)
            gross_loss = abs(await _calculate_gross_loss(conn, user_id))
            profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else 0

            # Calculate expectancy (avg R multiple)
            expectancy = avg_r_multiple

            metrics = {
                'total_trades': total_trades,
                'winning_trades': winning_trades,
                'losing_trades': losing_trades,
                'win_rate': round(win_rate, 2),
                'total_pnl': round(total_pnl, 2),
                'avg_winner': round(avg_winner, 2),
                'avg_loser': round(avg_loser, 2),
                'avg_r_multiple': round(avg_r_multiple, 2),
                'max_r_multiple': row['max_r_multiple'] or 0,
                'min_r_multiple': row['min_r_multiple'] or 0,
                'profit_factor': round(profit_factor, 2),
                'expectancy': round(expectancy, 2),
            }

            logger.info(f"📊 Performance metrics for user {user_id}: {metrics}")
            return metrics

    except Exception as e:
        logger.error(f"❌ Error calculating performance metrics for user {user_id}: {e}")
        return {
            'total_trades': 0,
            'win_rate': 0,
            'total_pnl': 0,
            'avg_r_multiple': 0,
        }


async def _calculate_gross_profit(conn: aiosqlite.Connection, user_id: str) -> float:
    """Calculate gross profit from winning trades"""
    query = "SELECT SUM(pnl) as total FROM Trade WHERE userId = ? AND pnl > 0"
    cursor = await conn.execute(query, (user_id,))
    row = await cursor.fetchone()
    return row['total'] or 0


async def _calculate_gross_loss(conn: aiosqlite.Connection, user_id: str) -> float:
    """Calculate gross loss from losing trades"""
    query = "SELECT SUM(pnl) as total FROM Trade WHERE userId = ? AND pnl < 0"
    cursor = await conn.execute(query, (user_id,))
    row = await cursor.fetchone()
    return row['total'] or 0


async def get_trades_by_symbol(user_id: str, symbol: str) -> List[TradeData]:
    """Get all trades for a specific symbol"""
    try:
        async with await get_sqlite_connection() as conn:
            query = """
                SELECT * FROM Trade
                WHERE userId = ? AND symbol = ?
                ORDER BY date DESC
            """
            cursor = await conn.execute(query, (user_id, symbol))
            rows = await cursor.fetchall()
            return [TradeData(**dict(row)) for row in rows]

    except Exception as e:
        logger.error(f"❌ Error fetching trades for symbol {symbol}: {e}")
        return []


async def get_trades_by_strategy(user_id: str, strategy: str) -> List[TradeData]:
    """Get all trades for a specific strategy"""
    try:
        async with await get_sqlite_connection() as conn:
            query = """
                SELECT * FROM Trade
                WHERE userId = ? AND strategy = ?
                ORDER BY date DESC
            """
            cursor = await conn.execute(query, (user_id, strategy))
            rows = await cursor.fetchall()
            return [TradeData(**dict(row)) for row in rows]

    except Exception as e:
        logger.error(f"❌ Error fetching trades for strategy {strategy}: {e}")
        return []


async def get_recent_trades(user_id: str, days: int = 30) -> List[TradeData]:
    """Get trades from the last N days"""
    try:
        async with await get_sqlite_connection() as conn:
            # Calculate date cutoff
            from datetime import datetime, timedelta
            cutoff_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

            query = """
                SELECT * FROM Trade
                WHERE userId = ? AND date >= ?
                ORDER BY date DESC
            """
            cursor = await conn.execute(query, (user_id, cutoff_date))
            rows = await cursor.fetchall()
            return [TradeData(**dict(row)) for row in rows]

    except Exception as e:
        logger.error(f"❌ Error fetching recent trades: {e}")
        return []
