'use client'

import React from 'react'
import { StandaloneRenataChat } from '../chat/standalone-renata-chat'
import { useChatContext } from '@/contexts/TraderraContext'
import { useAuth } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import { useGuestMode } from '@/contexts/GuestModeContext'

export function RenataSidebar() {
  const { isSidebarOpen: aiSidebarOpen } = useChatContext()
  const { isSignedIn, isLoaded } = useAuth()
  const { isGuestMode } = useGuestMode()
  const pathname = usePathname()

  // Never show on landing page, regardless of authentication
  const isLandingPage = pathname === '/' || pathname === ''

  // Don't render if on landing page, not loaded, or sidebar is closed
  // Allow rendering if EITHER signed in OR in guest mode
  if (isLandingPage || !isLoaded || !aiSidebarOpen) {
    return null
  }

  // Check if user is authenticated OR in guest mode
  const canShowSidebar = isSignedIn || isGuestMode
  if (!canShowSidebar) {
    return null
  }

  console.log('[RenataSidebar] Render - FIXED POSITIONING', {
    aiSidebarOpen,
    position: 'fixed',
    top: '64px',
    right: '0',
    bottom: '0',
    width: '480px',
    pathname,
    timestamp: Date.now()
  })

  return (
    <div
      style={{
        position: 'fixed',
        top: '64px',
        right: '0',
        bottom: '0',
        width: '480px',
        backgroundColor: '#111111',
        borderLeft: '1px solid #1a1a1a',
        zIndex: 99999,
        overflow: 'auto'
      }}
    >
      <StandaloneRenataChat />
    </div>
  )
}
