"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Briefcase, Search, Building2, UserSearch } from 'lucide-react'

export default function RoleSelection({ onSelectRole }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight">Welcome to JobConnect</h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            The platform that connects talented professionals with amazing opportunities. 
            Choose how you want to use JobConnect today.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card 
            className="group cursor-pointer transition-all hover:border-primary hover:shadow-lg"
            onClick={() => onSelectRole('poster')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-xl">I want to hire</CardTitle>
              <CardDescription>
                Post job listings and find the perfect candidates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Create and manage job postings
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Review candidate applications
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  View applicant CVs and contact info
                </li>
              </ul>
              <Button className="w-full" size="lg">
                Continue as Job Poster
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="group cursor-pointer transition-all hover:border-primary hover:shadow-lg"
            onClick={() => onSelectRole('seeker')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                <UserSearch className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-xl">I want to find a job</CardTitle>
              <CardDescription>
                Browse opportunities and apply to your dream jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Browse available job listings
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  View detailed job descriptions
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Apply with your resume
                </li>
              </ul>
              <Button className="w-full" size="lg" variant="outline">
                Continue as Job Seeker
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account? Choose your role above to login.
        </p>
      </div>
    </div>
  )
}
