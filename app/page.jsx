"use client"

import { useState } from 'react'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import Header from '@/components/job-portal/Header'
import RoleSelection from '@/components/job-portal/RoleSelection'
import AuthForms from '@/components/job-portal/AuthForms'
import PosterDashboard from '@/components/job-portal/PosterDashboard'
import SeekerDashboard from '@/components/job-portal/SeekerDashboard'

function JobPortalContent() {
  const { isAuthenticated, isPoster, isSeeker, loading } = useAuth()
  const [selectedRole, setSelectedRole] = useState(null)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        {isPoster && <PosterDashboard />}
        {isSeeker && <SeekerDashboard />}
      </div>
    )
  }

  if (selectedRole) {
    return (
      <AuthForms
        selectedRole={selectedRole}
        onBack={() => setSelectedRole(null)}
      />
    )
  }

  return <RoleSelection onSelectRole={setSelectedRole} />
}

export default function Home() {
  return (
    <AuthProvider>
      <JobPortalContent />
    </AuthProvider>
  )
}
