// Quick script to debug the current user ID issue
// This will help us understand what user ID Clerk is providing vs what's in the database

const { auth } = require('@clerk/nextjs/server')

async function debugUserId() {
  try {
    console.log('🔍 Debugging User ID Mismatch...')

    // This won't work in a script context, but we can create an API endpoint
    console.log('Database has user ID: user_34JPJrLu62j13KEquBolg427jeP')
    console.log('Database has 1,754 trades with total P&L: $288,760.32')
    console.log('')
    console.log('The issue is likely that:')
    console.log('1. Current Clerk user ID != user_34JPJrLu62j13KEquBolg427jeP')
    console.log('2. API is filtering trades by current user ID (returns 0 trades)')
    console.log('3. We need to either:')
    console.log('   a) Update database user ID to current Clerk user ID')
    console.log('   b) Or update Clerk user ID to match database')
    console.log('')
    console.log('📋 Next steps:')
    console.log('1. Create API endpoint to log current user ID')
    console.log('2. Update database user ID to match')
    console.log('3. Verify data loads correctly')

  } catch (error) {
    console.error('Error:', error)
  }
}

debugUserId()