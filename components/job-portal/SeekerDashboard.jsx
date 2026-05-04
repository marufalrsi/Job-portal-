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

const emptyCv = {
  firstName: '',
  lastName: '',
  address: '',
  email: '',
  phone: '',
  gender: '',
  age: '',
  education: [
    {
      institution: '',
      country: '',
      passingYear: '',
      grade: '',
      subject: ''
    }
  ],
  experience: [
    {
      project: '',
      role: '',
      years: ''
    }
  ],
  languages: ''
}

const formatLanguages = (languages) => {
  if (Array.isArray(languages)) return languages.join(', ')
  return languages || ''
}

const parseLanguages = (languages) => {
  if (!languages) return []
  return languages.split(',').map(item => item.trim()).filter(Boolean)
}

const normalizeCvData = (cv) => {
  if (!cv) return null

  const education = Array.isArray(cv.education)
    ? cv.education
    : cv.education && typeof cv.education === 'object'
      ? [cv.education]
      : []

  const experience = Array.isArray(cv.experience)
    ? cv.experience
    : cv.experience && typeof cv.experience === 'object'
      ? [cv.experience]
      : []

  return {
    ...emptyCv,
    ...cv,
    education: education.length ? education : emptyCv.education,
    experience: experience.length ? experience : emptyCv.experience,
    languages: Array.isArray(cv.languages) ? cv.languages : parseLanguages(cv.languages),
    phone: cv.phone || '',
    age: cv.age || ''
  }
}

const generateCvText = (cv) => {
  if (!cv) return ''
  const educationText = (cv.education || []).map((edu, index) =>
    `  ${index + 1}. ${edu.institution} | ${edu.country} | ${edu.passingYear} | ${edu.grade} | ${edu.subject}`
  ).join('\n')
  const experienceText = (cv.experience || []).map((exp, index) =>
    `  ${index + 1}. ${exp.project} | ${exp.role} | ${exp.years} years`
  ).join('\n')

  return [
    `Name: ${cv.firstName} ${cv.lastName}`.trim(),
    `Address: ${cv.address}`,
    `Email: ${cv.email}`,
    `Phone: ${cv.phone}`,
    `Gender: ${cv.gender}`,
    `Age: ${cv.age}`,
    'Education:',
    educationText,
    'Work Experience:',
    experienceText,
    `Languages: ${formatLanguages(cv.languages)}`
  ].join('\n')
}

export default function SeekerDashboard() {
  const { user, token, authFetch } = useAuth()
  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [selectedJob, setSelectedJob] = useState(null)

  const [isApplyOpen, setIsApplyOpen] = useState(false)
  const [isCvOpen, setIsCvOpen] = useState(false)
  const [isCvPreviewOpen, setIsCvPreviewOpen] = useState(false)
  const [applyingTo, setApplyingTo] = useState(null)
  const [appliedJobs, setAppliedJobs] = useState([])
  const [applicationForm, setApplicationForm] = useState({
    name: '',
    email: '',
    phone: '',
    resume: ''
  })
  const [cvForm, setCvForm] = useState(emptyCv)
  const [cvData, setCvData] = useState(null)

  useEffect(() => {
    loadJobs()
  }, [])

  useEffect(() => {
    if (user) {
      setApplicationForm(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }))
      setCvForm(prev => ({
        ...prev,
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || ''
      }))
    }
  }, [user])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedCv = localStorage.getItem('jobportal_seeker_cv')
    if (storedCv) {
      try {
        const parsed = JSON.parse(storedCv)
        setCvData(normalizeCvData(parsed))
      } catch {

      }
    }
  }, [])

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
    setApplicationForm(prev => ({
      ...prev,
      resume: prev.resume.trim() || generateCvText(cvData)
    }))
  }

  const handleApplicationChange = (e) => {
    const { name, value } = e.target
    setApplicationForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmitApplication = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!cvData?.firstName) {
      setError('Please create and save your CV before applying.')
      return
    }

    const resumeText = applicationForm.resume.trim() || generateCvText(cvData)

    try {
      const response = await authFetch('/api/apply', {
        method: 'POST',
        body: JSON.stringify({
          jobId: applyingTo.id,
          ...applicationForm,
          resume: resumeText,
          cv: {
            ...cvData,
            age: Number(cvData.age)
          }
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
      <div className='flex justify-between items-center mb-8'>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Find Your Dream Job</h1>
          <p className="text-muted-foreground">Browse {jobs.length} available positions</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button className="p-2" variant="outline" size="sm"
            onClick={() => {
              const normalizedCv = cvData ? normalizeCvData(cvData) : null
              setCvForm(normalizedCv ? {
                ...normalizedCv,
                languages: formatLanguages(normalizedCv.languages)
              } : {
                ...emptyCv,
                email: user?.email || ''
              })
              setIsCvOpen(true)
              setError('')
            }}
          >
            Create / Edit CV
          </Button>
          <Button className="p-2" variant="outline" size="sm"
            variant="outline"
            onClick={() => {
              if (!cvData?.firstName) {
                setError('Save your CV first to preview it.')
                return
              }
              setIsCvPreviewOpen(true)
            }}
          >
            Show CV
          </Button>
        </div>
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

      {}
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

      {}
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
          {filteredJobs.map((job, index) => (
            <Card
              key={job._id || job.id || index}
              className={`transition-all hover:shadow-md cursor-pointer ${
                selectedJob?._id === (job._id || job.id) ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedJob(selectedJob?._id === (job._id || job.id) ? null : job)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      {hasApplied(job._id || job.id) && (
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

      {}
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
                    placeholder="maruf all rushafi"
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
                    placeholder="marufallrushafi@example.com"
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
                  placeholder="+880xxxxxxxxxx"
                  value={applicationForm.phone}
                  onChange={handleApplicationChange}
                  required
                />
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                {cvData?.firstName ? (
                  <p>Your saved CV will be attached to this application. Add extra notes below if needed.</p>
                ) : (
                  <p className="text-destructive">Save your CV first so recruiters can see your full profile.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-resume">Additional Notes / Cover Letter</Label>
                <Textarea
                  id="app-resume"
                  name="resume"
                  placeholder="Add an optional note or cover letter here. If left blank, your saved CV will be used as the application summary."
                  value={applicationForm.resume}
                  onChange={handleApplicationChange}
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">
                  You can leave this blank to submit your saved CV in its entirety.
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

      <Dialog open={isCvOpen} onOpenChange={setIsCvOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{cvData?.firstName ? 'Edit Your CV' : 'Create Your CV'}</DialogTitle>
            <DialogDescription>
              Fill in your profile details, education, experience, and language skills.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault();
              if (!cvForm.firstName || !cvForm.lastName) {
                setError('Please complete the CV form before saving.')
                return
              }
              const validatedCv = {
                ...cvForm,
                age: Number(cvForm.age),
                phone: cvForm.phone || '',
                languages: parseLanguages(cvForm.languages)
              }
              if (!validatedCv.age || validatedCv.age <= 0) {
                setError('Please provide a valid age.')
                return
              }
              const invalidEducation = validatedCv.education.some(edu =>
                !edu.institution || !edu.country || !edu.passingYear || !edu.grade || !edu.subject
              )
              if (invalidEducation) {
                setError('Please fill in all education fields for each qualification.')
                return
              }
              const invalidExperience = validatedCv.experience.some(exp =>
                !exp.project || !exp.role || !exp.years
              )
              if (invalidExperience) {
                setError('Please fill in all fields for each work experience entry.')
                return
              }
              if (!validatedCv.languages.length) {
                setError('Please add at least one language skill.')
                return
              }
              localStorage.setItem('jobportal_seeker_cv', JSON.stringify(validatedCv))
              setCvData(validatedCv)
              setIsCvOpen(false)
              setSuccess('Your CV has been saved.')
            }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cv-firstName">First Name</Label>
                  <Input
                    id="cv-firstName"
                    name="firstName"
                    value={cvForm.firstName}
                    onChange={(e) => setCvForm(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cv-lastName">Last Name</Label>
                  <Input
                    id="cv-lastName"
                    name="lastName"
                    value={cvForm.lastName}
                    onChange={(e) => setCvForm(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cv-email">Email</Label>
                <Input
                  id="cv-email"
                  name="email"
                  type="email"
                  value={cvForm.email}
                  onChange={(e) => setCvForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cv-phone">Phone Number</Label>
                <Input
                  id="cv-phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={cvForm.phone}
                  onChange={(e) => setCvForm(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cv-address">Address</Label>
                <Input
                  id="cv-address"
                  name="address"
                  value={cvForm.address}
                  onChange={(e) => setCvForm(prev => ({ ...prev, address: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cv-gender">Gender</Label>
                  <Input
                    id="cv-gender"
                    name="gender"
                    value={cvForm.gender}
                    onChange={(e) => setCvForm(prev => ({ ...prev, gender: e.target.value }))}
                    placeholder="Male / Female"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cv-age">Age</Label>
                  <Input
                    id="cv-age"
                    name="age"
                    type="number"
                    value={cvForm.age}
                    min="1"
                    onChange={(e) => setCvForm(prev => ({ ...prev, age: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cv-languages">Language Skills</Label>
                  <Input
                    id="cv-languages"
                    name="languages"
                    placeholder="English, Spanish, ..."
                    value={cvForm.languages}
                    onChange={(e) => setCvForm(prev => ({ ...prev, languages: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Educational Qualifications</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCvForm(prev => ({
                      ...prev,
                      education: [
                        ...prev.education,
                        { institution: '', country: '', passingYear: '', grade: '', subject: '' }
                      ]
                    }))}
                  >
                    Add Qualification
                  </Button>
                </div>
                <div className="space-y-4">
                  {cvForm.education.map((edu, index) => (
                    <div key={`edu-${index}`} className="rounded-lg border border-muted p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold">Qualification {index + 1}</p>
                        {cvForm.education.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setCvForm(prev => ({
                              ...prev,
                              education: prev.education.filter((_, i) => i !== index)
                            }))}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Input
                          id={`cv-education-institution-${index}`}
                          placeholder="Institution"
                          value={edu.institution}
                          onChange={(e) => setCvForm(prev => ({
                            ...prev,
                            education: prev.education.map((item, i) => i === index ? { ...item, institution: e.target.value } : item)
                          }))}
                          required
                        />
                        <Input
                          id={`cv-education-country-${index}`}
                          placeholder="Country"
                          value={edu.country}
                          onChange={(e) => setCvForm(prev => ({
                            ...prev,
                            education: prev.education.map((item, i) => i === index ? { ...item, country: e.target.value } : item)
                          }))}
                          required
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <Input
                          id={`cv-education-passingYear-${index}`}
                          placeholder="Passing Year"
                          value={edu.passingYear}
                          onChange={(e) => setCvForm(prev => ({
                            ...prev,
                            education: prev.education.map((item, i) => i === index ? { ...item, passingYear: e.target.value } : item)
                          }))}
                          required
                        />
                        <Input
                          id={`cv-education-grade-${index}`}
                          placeholder="Grade"
                          value={edu.grade}
                          onChange={(e) => setCvForm(prev => ({
                            ...prev,
                            education: prev.education.map((item, i) => i === index ? { ...item, grade: e.target.value } : item)
                          }))}
                          required
                        />
                        <Input
                          id={`cv-education-subject-${index}`}
                          placeholder="Subject"
                          value={edu.subject}
                          onChange={(e) => setCvForm(prev => ({
                            ...prev,
                            education: prev.education.map((item, i) => i === index ? { ...item, subject: e.target.value } : item)
                          }))}
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Work Experience</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCvForm(prev => ({
                      ...prev,
                      experience: [
                        ...prev.experience,
                        { project: '', role: '', years: '' }
                      ]
                    }))}
                  >
                    Add Experience
                  </Button>
                </div>
                <div className="space-y-4">
                  {cvForm.experience.map((exp, index) => (
                    <div key={`exp-${index}`} className="rounded-lg border border-muted p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold">Experience {index + 1}</p>
                        {cvForm.experience.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setCvForm(prev => ({
                              ...prev,
                              experience: prev.experience.filter((_, i) => i !== index)
                            }))}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <Input
                          id={`cv-experience-project-${index}`}
                          placeholder="Project"
                          value={exp.project}
                          onChange={(e) => setCvForm(prev => ({
                            ...prev,
                            experience: prev.experience.map((item, i) => i === index ? { ...item, project: e.target.value } : item)
                          }))}
                          required
                        />
                        <Input
                          id={`cv-experience-role-${index}`}
                          placeholder="Role"
                          value={exp.role}
                          onChange={(e) => setCvForm(prev => ({
                            ...prev,
                            experience: prev.experience.map((item, i) => i === index ? { ...item, role: e.target.value } : item)
                          }))}
                          required
                        />
                        <Input
                          id={`cv-experience-years-${index}`}
                          placeholder="Years"
                          value={exp.years}
                          onChange={(e) => setCvForm(prev => ({
                            ...prev,
                            experience: prev.experience.map((item, i) => i === index ? { ...item, years: e.target.value } : item)
                          }))}
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCvOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save CV</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCvPreviewOpen} onOpenChange={setIsCvPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Your CV Preview</DialogTitle>
            <DialogDescription>
              Review the CV that will be shared with recruiters when you apply.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 rounded-lg border border-muted p-4 bg-muted/50 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-lg font-semibold">{cvData?.firstName} {cvData?.lastName}</p>
                <p>{cvData?.email}</p>
                <p>{cvData?.phone}</p>
                <p>{cvData?.address}</p>
              </div>
              <div>
                <p><span className="font-semibold">Gender:</span> {cvData?.gender}</p>
                <p><span className="font-semibold">Age:</span> {cvData?.age}</p>
                <p><span className="font-semibold">Languages:</span> {formatLanguages(cvData?.languages)}</p>
              </div>
            </div>
            <div>
              <p className="font-semibold">Education</p>
              {(cvData?.education || []).map((edu, index) => (
                <div key={`preview-edu-${index}`} className="space-y-1">
                  <p className="font-semibold">Qualification {index + 1}</p>
                  <p>{edu.institution} — {edu.subject}</p>
                  <p>{edu.country} | {edu.passingYear} | {edu.grade}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="font-semibold">Work Experience</p>
              {(cvData?.experience || []).map((exp, index) => (
                <div key={`preview-exp-${index}`} className="space-y-1">
                  <p className="font-semibold">Experience {index + 1}</p>
                  <p>{exp.project}</p>
                  <p>{exp.role} — {exp.years} years</p>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setIsCvPreviewOpen(false)}>
                Close Preview
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
