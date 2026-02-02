import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🔍 DEBUG: Checking user ID mismatch...')

    const { userId } = auth()
    console.log('Current Clerk user ID:', userId)

    // Get database user
    const dbUsers = await prisma.user.findMany()
    console.log('Database users:', dbUsers.map(u => u.id))

    // Get database trades count
    const tradeCount = await prisma.trade.count()
    console.log('Total trades in database:', tradeCount)

    // Get trades for current user
    if (userId) {
      const userTrades = await prisma.trade.count({
        where: { userId }
      })
      console.log('Trades for current user ID:', userTrades)
    }

    // Get trades for database user
    if (dbUsers.length > 0) {
      const dbUserTrades = await prisma.trade.count({
        where: { userId: dbUsers[0].id }
      })
      console.log('Trades for database user ID:', dbUserTrades)
    }

    return NextResponse.json({
      currentClerkUserId: userId,
      databaseUsers: dbUsers.map(u => u.id),
      totalTradesInDb: tradeCount,
      tradesForCurrentUser: userId ? await prisma.trade.count({ where: { userId } }) : 0,
      tradesForDbUser: dbUsers.length > 0 ? await prisma.trade.count({ where: { userId: dbUsers[0].id } }) : 0,
      mismatch: userId !== (dbUsers[0]?.id || null)
    })

  } catch (error) {
    console.error('Debug error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Debug failed', details: errorMessage }, { status: 500 })
  }
}