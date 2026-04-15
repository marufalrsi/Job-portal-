"use client"

/**
 * =============================================================================
 * JOB PORTAL - Main Application Page
 * =============================================================================
 * 
 * This application now connects to the Express backend API at localhost:5000.
 * 
 * HOW TO CONNECT TO REAL BACKEND:
 * --------------------------------
 * 1. Start the Express server: cd api && npm install && npm start
 * 2. The server runs on http://localhost:5000
 * 3. Update API_BASE_URL in context/AuthContext.jsx if needed
 * 4. The application will automatically use real API endpoints
 * 
 * HOW TO CONNECT MONGODB:
 * ------------------------
 * 1. In api/server.js, uncomment the MongoDB connection code
 * 2. Install mongoose: cd api && npm install mongoose
 * 3. Add your MongoDB Atlas connection string to MONGODB_URI
 * 4. Comment out the localDB section
 * 5. Uncomment all "// MONGODB:" lines in the route handlers
 * 
 * HOW TO REMOVE LOCALSTORAGE:
 * ----------------------------
 * 1. Delete lib/mockApi.js file
 * 2. In this file, replace mockApi imports with real API calls
 * 3. Update components to use authFetch from AuthContext instead of mockApi
 * 4. All data will be stored in MongoDB instead of localStorage
 * 
 * DEMO ACCOUNTS (for testing):
 * ----------------------------
 * Job Poster: poster@demo.com / password123
 * Job Seeker: seeker@demo.com / password123
 */

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

  // Show loading state
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

  // User is authenticated - show appropriate dashboard
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        {isPoster && <PosterDashboard />}
        {isSeeker && <SeekerDashboard />}
      </div>
    )
  }

  // User has selected a role - show auth forms
  if (selectedRole) {
    return (
      <AuthForms 
        selectedRole={selectedRole} 
        onBack={() => setSelectedRole(null)} 
      />
    )
  }

  // Initial state - show role selection
  return <RoleSelection onSelectRole={setSelectedRole} />
}

export default function Home() {
  return (
    <AuthProvider>
      <JobPortalContent />
    </AuthProvider>
  )
}
