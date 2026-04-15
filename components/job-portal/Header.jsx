"use client"

import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Briefcase, LogOut, User } from 'lucide-react'

export default function Header() {
  const { user, logout, isAuthenticated, isPoster, isSeeker } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">JobConnect</span>
        </div>
        
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user?.name}</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {isPoster ? 'Job Poster' : 'Job Seeker'}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
