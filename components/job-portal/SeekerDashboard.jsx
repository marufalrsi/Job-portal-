"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Search, MapPin, DollarSign, Building2, Briefcase, 
  Calendar, AlertCircle, Send, CheckCircle, Clock
} from 'lucide-react'

export default function SeekerDashboard() {
  const { user, token, authFetch } = useAuth()
  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Selected job for detail view
  const [selectedJob, setSelectedJob] = useState(null)
  
  // Application state
  const [isApplyOpen, setIsApplyOpen] = useState(false)
  const [applyingTo, setApplyingTo] = useState(null)
  const [appliedJobs, setAppliedJobs] = useState([])
  const [applicationForm, setApplicationForm] = useState({
    name: '',
    email: '',
    phone: '',
    resume: ''
  })

  // Load jobs
  useEffect(() => {
    loadJobs()
  }, [])

  // Pre-fill user info when component loads
  useEffect(() => {
    if (user) {
      setApplicationForm(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }))
    }
  }, [user])

  // Filter jobs based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredJobs(jobs)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = jobs.filter(job => 
        job.title.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term)
      )
      setFilteredJobs(filtered)
    }
  }, [searchTerm, jobs])

  const loadJobs = async () => {
    try {
      setLoading(true)
      const response = await authFetch('/api/jobs')
      if (!response.ok) {
        throw new Error(await response.json().then(data => data.error || 'Failed to load jobs'))
      }
      const jobsData = await response.json()
      setJobs(jobsData)
      setFilteredJobs(jobsData)

      // Load applied jobs from localStorage to track which ones user has applied to
      const applied = JSON.parse(localStorage.getItem('applied_jobs') || '[]')
      setAppliedJobs(applied)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyClick = (job) => {
    setApplyingTo(job)
    setIsApplyOpen(true)
    setError('')
  }

  const handleApplicationChange = (e) => {
    const { name, value } = e.target
    setApplicationForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmitApplication = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await authFetch('/api/apply', {
        method: 'POST',
        body: JSON.stringify({
          jobId: applyingTo.id,
          ...applicationForm
        })
      })

      if (!response.ok) {
        throw new Error(await response.json().then(data => data.error || 'Failed to submit application'))
      }

      const application = await response.json()
      const newAppliedJobs = [...appliedJobs, applyingTo.id]
      setAppliedJobs(newAppliedJobs)
      localStorage.setItem('applied_jobs', JSON.stringify(newAppliedJobs))

      setSuccess(`Successfully applied to ${applyingTo.title} at ${applyingTo.company}!`)
      setIsApplyOpen(false)
      setApplyingTo(null)
      setApplicationForm(prev => ({ ...prev, phone: '', resume: '' }))
    } catch (err) {
      setError(err.message)
    }
  }

  const hasApplied = (jobId) => appliedJobs.includes(jobId)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTimeSince = (dateString) => {
    const diff = Date.now() - new Date(dateString).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return `${Math.floor(days / 30)} months ago`
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading job listings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Find Your Dream Job</h1>
        <p className="text-muted-foreground">Browse {jobs.length} available positions</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search jobs by title, company, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-muted-foreground">
            Showing {filteredJobs.length} result{filteredJobs.length !== 1 ? 's' : ''} for &quot;{searchTerm}&quot;
          </p>
        )}
      </div>

      {/* Job Listings */}
      {filteredJobs.length === 0 ? (
        <Card className="p-12 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No jobs found</h3>
          <p className="mt-2 text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms' : 'Check back later for new opportunities'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredJobs.map(job => (
            <Card 
              key={job.id} 
              className={`transition-all hover:shadow-md cursor-pointer ${
                selectedJob?.id === job.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      {hasApplied(job.id) && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Applied
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        {job.salary}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    <Clock className="mr-1 h-3 w-3" />
                    {getTimeSince(job.createdAt)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-sm text-muted-foreground ${
                  selectedJob?.id === job.id ? '' : 'line-clamp-2'
                }`}>
                  {job.description}
                </p>
                
                {selectedJob?.id === job.id && (
                  <div className="mt-4 space-y-4">
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Requirements</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {job.requirements}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Posted on {formatDate(job.createdAt)}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                {hasApplied(job.id) ? (
                  <Button variant="outline" disabled>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Application Submitted
                  </Button>
                ) : (
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleApplyClick(job)
                    }}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Apply Now
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Application Dialog */}
      <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Apply for {applyingTo?.title}</DialogTitle>
            <DialogDescription>
              at {applyingTo?.company} - {applyingTo?.location}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitApplication}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="app-name">Full Name</Label>
                  <Input
                    id="app-name"
                    name="name"
                    placeholder="John Doe"
                    value={applicationForm.name}
                    onChange={handleApplicationChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-email">Email</Label>
                  <Input
                    id="app-email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={applicationForm.email}
                    onChange={handleApplicationChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-phone">Phone Number</Label>
                <Input
                  id="app-phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={applicationForm.phone}
                  onChange={handleApplicationChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-resume">Resume / Cover Letter</Label>
                <Textarea
                  id="app-resume"
                  name="resume"
                  placeholder="Paste your resume or write a cover letter here. Include your relevant experience, skills, and why you're interested in this position..."
                  value={applicationForm.resume}
                  onChange={handleApplicationChange}
                  rows={8}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Tip: Include your work experience, education, skills, and why you&apos;re a great fit for this role.
                </p>
              </div>
            </div>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsApplyOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Send className="mr-2 h-4 w-4" />
                Submit Application
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
