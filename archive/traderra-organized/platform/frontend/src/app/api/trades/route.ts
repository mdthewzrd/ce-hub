import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { TraderraTrade } from '@/utils/csv-parser'

// GET /api/trades - Get all trades for the authenticated user
export async function GET() {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user exists in database
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId }
    })

    // Get all trades for the user
    const trades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ trades })
  } catch (error) {
    console.error('Error fetching trades:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/trades - Save multiple trades for the authenticated user
export async function POST(request: Request) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { trades }: { trades: TraderraTrade[] } = await request.json()

    if (!trades || !Array.isArray(trades)) {
      return NextResponse.json({ error: 'Invalid trades data' }, { status: 400 })
    }

    // Ensure user exists in database
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId }
    })

    // Clear existing trades and insert new ones
    await prisma.trade.deleteMany({
      where: { userId }
    })

    // Convert TraderraTrade to database format and insert
    const dbTrades = trades.map((trade) => ({
      userId,
      id: trade.id,
      date: trade.date,
      symbol: trade.symbol,
      side: trade.side,
      quantity: trade.quantity,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      pnl: trade.pnl,
      pnlPercent: trade.pnlPercent,
      commission: trade.commission,
      duration: trade.duration,
      strategy: trade.strategy,
      notes: trade.notes,
      entryTime: trade.entryTime,
      exitTime: trade.exitTime,
      riskAmount: trade.riskAmount,
      riskPercent: trade.riskPercent,
      stopLoss: trade.stopLoss,
      rMultiple: trade.rMultiple,
      mfe: trade.mfe,
      mae: trade.mae
    }))

    await prisma.trade.createMany({
      data: dbTrades
    })

    return NextResponse.json({
      message: 'Trades saved successfully',
      count: trades.length
    })
  } catch (error) {
    console.error('Error saving trades:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/trades - Delete all trades for the authenticated user
export async function DELETE() {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete all trades for the user
    const deletedTrades = await prisma.trade.deleteMany({
      where: { userId }
    })

    return NextResponse.json({
      message: 'All trades deleted successfully',
      deletedCount: deletedTrades.count
    })
  } catch (error) {
    console.error('Error deleting trades:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}