'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Brain, Settings, TrendingUp, BarChart3, FileText, Calendar, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserProfile } from '@/components/auth/user-profile'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Trades', href: '/trades', icon: TrendingUp },
  { name: 'Stats', href: '/statistics', icon: BarChart3 },
  { name: 'Summary', href: '/daily-summary', icon: Camera },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Journal', href: '/journal', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface TopNavProps {
  onAiToggle: () => void
  aiOpen: boolean
}

export function TopNav() {
  const pathname = usePathname()

  return (
    <nav className="h-16 studio-surface studio-border border-b  flex items-center justify-between shadow-studio-lg" style={{
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.25), 0 8px 16px rgba(0, 0, 0, 0.15), 0 1px 0px rgba(255, 255, 255, 0.08) inset'
    }}>
      {/* Left side - Logo and Navigation */}
      <div className="flex items-center space-x-2 pl-3">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Brain className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold studio-text">Traderra</span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-1 px-1.5 py-1 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'studio-muted hover:bg-[#161616] hover:studio-text'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </a>
            )
          })}
        </div>
      </div>

      {/* Right side - User only */}
      <div className="flex items-center space-x-1 pr-3">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-foreground">T</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-medium studio-text">Demo Account</span>
          </div>
        </div>
      </div>
    </nav>
  )
}

export function TopNavigation({ onAiToggle, aiOpen }: TopNavProps) {
  const pathname = usePathname()

  return (
    <nav className="h-16 studio-surface studio-border border-b  flex items-center justify-between shadow-studio-lg" style={{
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.25), 0 8px 16px rgba(0, 0, 0, 0.15), 0 1px 0px rgba(255, 255, 255, 0.08) inset'
    }}>
      {/* Left side - Logo and Navigation */}
      <div className="flex items-center space-x-2 pl-3">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Brain className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold studio-text">Traderra</span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-1 px-1.5 py-1 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'studio-muted hover:bg-[#161616] hover:studio-text'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </a>
            )
          })}
        </div>
      </div>

      {/* Right side - User and AI */}
      <div className="flex items-center space-x-1 pr-3">
        <button
          onClick={onAiToggle}
          className={cn(
            'flex items-center space-x-1 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors',
            aiOpen
              ? 'bg-primary/10 text-primary'
              : 'studio-muted hover:bg-[#161616] hover:studio-text'
          )}
        >
          <Brain className="h-4 w-4" />
          <span className="hidden sm:inline">Renata</span>
        </button>

        <div className="flex items-center space-x-1 pl-3 border-l border-[#1a1a1a]">
          <UserProfile />
        </div>
      </div>
    </nav>
  )
}