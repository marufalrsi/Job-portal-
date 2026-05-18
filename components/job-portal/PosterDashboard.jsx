"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus, Pencil, Trash2, MapPin, DollarSign, Building2,
  Users, Eye, AlertCircle, Briefcase, Calendar, Mail, Phone, FileText
} from 'lucide-react'

export default function PosterDashboard() {
  const { user, token, authFetch } = useAuth()
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    requirements: '',
    salary: '',
    location: ''
  })

  const [viewingApplications, setViewingApplications] = useState(null)
  const [jobApplications, setJobApplications] = useState([])

  const getDocId = (doc) => doc?._id || doc?.id || ''
  const normalizeId = (id) => id ? String(id) : ''
  const getApplicationCount = (jobId) => {
    const normalizedJobId = normalizeId(jobId)
    return applications.filter(app => normalizeId(app.jobId) === normalizedJobId).length
  }

  const getCvEducation = (cv) => Array.isArray(cv?.education) ? cv.education[0] : cv?.education
  const getCvExperience = (cv) => Array.isArray(cv?.experience) ? cv.experience[0] : cv?.experience

  useEffect(() => {
    loadData()
  }, [token])

  const loadData = async () => {
    try {
      setLoading(true)
      const [jobsRes, appsRes] = await Promise.all([
        authFetch('/api/jobs/poster/my-jobs'),
        authFetch('/api/apply/received')
      ])

      if (!jobsRes.ok) {
        throw new Error(await jobsRes.json().then(data => data.error || 'Failed to load jobs'))
      }
      if (!appsRes.ok) {
        throw new Error(await appsRes.json().then(data => data.error || 'Failed to load applications'))
      }

      const jobsData = await jobsRes.json()
      const appsData = await appsRes.json()
      setJobs(jobsData)
      setApplications(appsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      description: '',
      requirements: '',
      salary: '',
      location: ''
    })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await authFetch('/api/jobs', {
        method: 'POST',
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error(await response.json().then(data => data.error || 'Failed to create job'))
      }

      setSuccess('Job posted successfully!')
      setIsCreateOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await authFetch(`/api/jobs/${getDocId(selectedJob)}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error(await response.json().then(data => data.error || 'Failed to update job'))
      }

      setSuccess('Job updated successfully!')
      setIsEditOpen(false)
      setSelectedJob(null)
      resetForm()
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job? All applications will also be deleted.')) {
      return
    }

    setError('')
    setSuccess('')

    try {
      const response = await authFetch(`/api/jobs/${jobId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(await response.json().then(data => data.error || 'Failed to delete job'))
      }

      setSuccess('Job deleted successfully!')
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  const openEditDialog = (job) => {
    setSelectedJob(job)
    setFormData({
      title: job.title,
      company: job.company,
      description: job.description,
      requirements: job.requirements,
      salary: job.salary,
      location: job.location
    })
    setIsEditOpen(true)
  }

  const viewApplicationsForJob = async (job) => {
    try {
      const response = await authFetch(`/api/apply/job/${getDocId(job)}`)
      if (!response.ok) {
        throw new Error(await response.json().then(data => data.error || 'Failed to load applications'))
      }
      const apps = await response.json()
      setJobApplications(apps)
      setViewingApplications(job)
    } catch (err) {
      setError(err.message)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground">Manage your job postings and review applications</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Post New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Job Posting</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new job listing
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g., Senior Software Developer"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      name="company"
                      placeholder="e.g., Infosys Bangladesh"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salary">Salary Range</Label>
                    <Input
                      id="salary"
                      name="salary"
                      placeholder="e.g., ৳ 30,000 - 50,000"
                      value={formData.salary}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="e.g., Dhaka, Bangladesh (Remote)"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Job Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the role, responsibilities, and benefits offered. Example: We are looking for talented professionals to join our growing team in Bangladesh..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    name="requirements"
                    placeholder="Example: Bachelor's degree, 2+ years experience, Strong communication skills, Knowledge of relevant technologies..."
                    value={formData.requirements}
                    onChange={handleInputChange}
                    rows={4}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Job</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs Posted</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average per Job</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs.length ? (applications.length / jobs.length).toFixed(1) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="jobs">My Job Postings</TabsTrigger>
          <TabsTrigger value="applications">All Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          {jobs.length === 0 ? (
            <Card className="p-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No jobs posted yet</h3>
              <p className="mt-2 text-muted-foreground">
                Create your first job posting to start receiving applications
              </p>
              <Button className="mt-4" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Post Your First Job
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {jobs.map(job => (
                <Card key={getDocId(job)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{job.title}</CardTitle>
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
                        <Users className="mr-1 h-3 w-3" />
                        {getApplicationCount(getDocId(job))} Applications
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Posted on {formatDate(job.createdAt)}
                    </p>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => viewApplicationsForJob(job)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Applications
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(job)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(getDocId(job))}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          {applications.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No applications yet</h3>
              <p className="mt-2 text-muted-foreground">
                Applications will appear here when candidates apply to your jobs
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {applications.map(app => (
                <Card key={getDocId(app)}>
                  <CardHeader>
                    <CardTitle className="text-lg">{app.name}</CardTitle>
                    <CardDescription>Applied for: {app.jobTitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${app.email}`} className="text-primary hover:underline">
                        {app.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{app.phone}</span>
                    </div>
                    <div className="flex flex-col gap-4 text-sm">
                      <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 text-sm space-y-2">
                        <p className="font-semibold text-primary">Cover Letter / Extra Notes</p>
                        {app.coverLetter ? (
                          <p className="whitespace-pre-wrap">{app.coverLetter}</p>
                        ) : (
                          <p className="italic text-muted-foreground">No extra notes provided by the applicant.</p>
                        )}
                      </div>
                      <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
                        <p className="font-semibold">Candidate CV</p>
                        {app.cv ? (
                          (() => {
                            const educations = Array.isArray(app.cv.education)
                              ? app.cv.education
                              : app.cv.education && typeof app.cv.education === 'object'
                                ? [app.cv.education]
                                : []
                            const experiences = Array.isArray(app.cv.experience)
                              ? app.cv.experience
                              : app.cv.experience && typeof app.cv.experience === 'object'
                                ? [app.cv.experience]
                                : []
                            return (
                              <div className="space-y-2">
                                <p>{app.cv.firstName} {app.cv.lastName}</p>
                                <p>{app.cv.address}</p>
                                <p>{app.cv.email}</p>
                                <p>{app.cv.gender} · {app.cv.age} years</p>
                                <p className="font-medium">Education:</p>
                                {educations.length > 0 ? educations.map((edu, index) => (
                                  <div key={`education-${index}`} className="space-y-1">
                                    <p className="font-semibold">{edu?.institution || 'N/A'} — {edu?.subject || 'N/A'}</p>
                                    <p>{edu?.country || 'N/A'} | {edu?.passingYear || 'N/A'} | {edu?.grade || 'N/A'}</p>
                                  </div>
                                )) : (
                                  <p className="text-muted-foreground">No education details available.</p>
                                )}
                                <p className="font-medium">Experience:</p>
                                {experiences.length > 0 ? experiences.map((exp, index) => (
                                  <div key={`experience-${index}`} className="space-y-1">
                                    <p className="font-semibold">{exp?.project || 'N/A'}</p>
                                    <p>{exp?.role || 'N/A'} — {exp?.years || 'N/A'} years</p>
                                  </div>
                                )) : (
                                  <p className="text-muted-foreground">No experience details available.</p>
                                )}
                                <p className="text-muted-foreground">Languages: {Array.isArray(app.cv.languages) ? app.cv.languages.join(', ') : app.cv.languages}</p>
                              </div>
                            )
                          })()
                        ) : (
                          <p className="whitespace-pre-wrap">{app.resume}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Applied on {formatDate(app.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Job Posting</DialogTitle>
            <DialogDescription>
              Update the details of your job listing
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Job Title</Label>
                  <Input
                    id="edit-title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-company">Company Name</Label>
                  <Input
                    id="edit-company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-salary">Salary Range</Label>
                  <Input
                    id="edit-salary"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Job Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-requirements">Requirements</Label>
                <Textarea
                  id="edit-requirements"
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  rows={4}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={!!viewingApplications} onOpenChange={() => setViewingApplications(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Applications for {viewingApplications?.title}</DialogTitle>
            <DialogDescription>
              {jobApplications.length} candidate(s) have applied for this position
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {jobApplications.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No applications yet for this job</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobApplications.map(app => (
                  <Card key={getDocId(app)}>
                    <CardHeader>
                      <CardTitle className="text-lg">{app.name}</CardTitle>
                      <CardDescription>
                        Applied on {formatDate(app.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${app.email}`} className="text-primary hover:underline">
                          {app.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{app.phone}</span>
                      </div>
                      <div className="space-y-4">
                        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 text-sm space-y-2">
                          <p className="font-semibold text-primary">Cover Letter / Extra Notes</p>
                          {app.coverLetter ? (
                            <p className="whitespace-pre-wrap">{app.coverLetter}</p>
                          ) : (
                            <p className="italic text-muted-foreground">No extra notes provided by the applicant.</p>
                          )}
                        </div>
                        <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
                          <p className="font-semibold">Candidate CV</p>
                          {app.cv ? (
                            (() => {
                              const educations = Array.isArray(app.cv.education)
                                ? app.cv.education
                                : app.cv.education && typeof app.cv.education === 'object'
                                  ? [app.cv.education]
                                  : []
                              const experiences = Array.isArray(app.cv.experience)
                                ? app.cv.experience
                                : app.cv.experience && typeof app.cv.experience === 'object'
                                  ? [app.cv.experience]
                                  : []
                              return (
                                <div className="space-y-2">
                                  <p className="font-semibold">{app.cv.firstName} {app.cv.lastName}</p>
                                  <p>{app.cv.address}</p>
                                  <p>{app.cv.email}</p>
                                  <p>{app.cv.gender} · {app.cv.age} years</p>
                                  <p className="font-medium">Education:</p>
                                  {educations.length > 0 ? educations.map((edu, index) => (
                                    <div key={`education-${index}`} className="space-y-1">
                                      <p className="font-semibold">{edu?.institution || 'N/A'} — {edu?.subject || 'N/A'}</p>
                                      <p>{edu?.country || 'N/A'} | {edu?.passingYear || 'N/A'} | {edu?.grade || 'N/A'}</p>
                                    </div>
                                  )) : (
                                    <p className="text-muted-foreground">No education details available.</p>
                                  )}
                                  <p className="font-medium">Experience:</p>
                                  {experiences.length > 0 ? experiences.map((exp, index) => (
                                    <div key={`experience-${index}`} className="space-y-1">
                                      <p className="font-semibold">{exp?.project || 'N/A'}</p>
                                      <p>{exp?.role || 'N/A'} — {exp?.years || 'N/A'} years</p>
                                    </div>
                                  )) : (
                                    <p className="text-muted-foreground">No experience details available.</p>
                                  )}
                                  <p className="text-muted-foreground">Languages: {Array.isArray(app.cv.languages) ? app.cv.languages.join(', ') : app.cv.languages}</p>
                                </div>
                              )
                            })()
                          ) : (
                            <p className="whitespace-pre-wrap">{app.resume}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
