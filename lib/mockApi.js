

const initializeData = () => {
  if (typeof window === 'undefined') return

  if (!localStorage.getItem('mockapi_initialized')) {

    const users = [
      {
        id: 'user_poster_1',
        name: 'Demo Poster',
        email: 'poster@demo.com',
        password: 'password123',
        role: 'poster',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user_seeker_1',
        name: 'Demo Seeker',
        email: 'seeker@demo.com',
        password: 'password123',
        role: 'seeker',
        createdAt: new Date().toISOString()
      }
    ]

    const jobs = [
      {
        id: 'job_1',
        title: 'Senior React Developer',
        company: 'Tech Corp',
        description: 'We are looking for an experienced React developer to join our team. You will be working on cutting-edge web applications and collaborating with designers and backend developers.',
        requirements: '5+ years of experience with React, Strong JavaScript/TypeScript skills, Experience with REST APIs, Knowledge of state management (Redux/Context), Git version control',
        salary: '$120,000 - $150,000',
        location: 'San Francisco, CA (Remote)',
        posterId: 'user_poster_1',
        posterName: 'Demo Poster',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'job_2',
        title: 'Full Stack Engineer',
        company: 'StartupXYZ',
        description: 'Join our fast-growing startup as a Full Stack Engineer. Work with modern technologies and make a real impact on our product.',
        requirements: '3+ years experience, Node.js, React, MongoDB or PostgreSQL, AWS knowledge preferred, Agile methodology experience',
        salary: '$90,000 - $120,000',
        location: 'New York, NY (Hybrid)',
        posterId: 'user_poster_1',
        posterName: 'Demo Poster',
        createdAt: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: 'job_3',
        title: 'Frontend Developer',
        company: 'Digital Agency',
        description: 'Creative digital agency seeking a talented Frontend Developer to build beautiful, responsive websites for our diverse client base.',
        requirements: 'HTML, CSS, JavaScript expertise, React or Vue.js, Responsive design, Animation libraries (GSAP, Framer Motion), Eye for design',
        salary: '$70,000 - $90,000',
        location: 'Los Angeles, CA (On-site)',
        posterId: 'user_poster_1',
        posterName: 'Demo Poster',
        createdAt: new Date(Date.now() - 259200000).toISOString()
      }
    ]

    localStorage.setItem('mockapi_users', JSON.stringify(users))
    localStorage.setItem('mockapi_jobs', JSON.stringify(jobs))
    localStorage.setItem('mockapi_applications', JSON.stringify([]))
    localStorage.setItem('mockapi_initialized', 'true')
  }
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

const getUsers = () => JSON.parse(localStorage.getItem('mockapi_users') || '[]')
const setUsers = (users) => localStorage.setItem('mockapi_users', JSON.stringify(users))

const getJobs = () => JSON.parse(localStorage.getItem('mockapi_jobs') || '[]')
const setJobs = (jobs) => localStorage.setItem('mockapi_jobs', JSON.stringify(jobs))

const getApplications = () => JSON.parse(localStorage.getItem('mockapi_applications') || '[]')
const setApplications = (apps) => localStorage.setItem('mockapi_applications', JSON.stringify(apps))

const generateToken = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role, name: user.name }

  return btoa(JSON.stringify(payload))
}

const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token))
  } catch {
    return null
  }
}

export const mockApi = {

  init() {
    initializeData()
  },

  async signup(name, email, password, role) {
    const users = getUsers()

    if (users.find(u => u.email === email)) {
      throw new Error('Email already registered')
    }

    const user = {
      id: generateId(),
      name,
      email,
      password,
      role,
      createdAt: new Date().toISOString()
    }

    users.push(user)
    setUsers(users)

    const token = generateToken(user)
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    }
  },

  async login(email, password) {
    const users = getUsers()
    const user = users.find(u => u.email === email && u.password === password)

    if (!user) {
      throw new Error('Invalid credentials')
    }

    const token = generateToken(user)
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    }
  },

  async getAllJobs() {
    const jobs = getJobs()
    return jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  async getJobById(id) {
    const jobs = getJobs()
    const job = jobs.find(j => j.id === id)
    if (!job) throw new Error('Job not found')
    return job
  },

  async getMyJobs(token) {
    const user = decodeToken(token)
    if (!user || user.role !== 'poster') throw new Error('Unauthorized')

    const jobs = getJobs()
    return jobs.filter(j => j.posterId === user.id)
  },

  async createJob(token, jobData) {
    const user = decodeToken(token)
    if (!user || user.role !== 'poster') throw new Error('Only job posters can create jobs')

    const jobs = getJobs()
    const job = {
      id: generateId(),
      ...jobData,
      posterId: user.id,
      posterName: user.name,
      createdAt: new Date().toISOString()
    }

    jobs.push(job)
    setJobs(jobs)
    return job
  },

  async updateJob(token, jobId, updates) {
    const user = decodeToken(token)
    if (!user || user.role !== 'poster') throw new Error('Unauthorized')

    const jobs = getJobs()
    const index = jobs.findIndex(j => j.id === jobId)

    if (index === -1) throw new Error('Job not found')
    if (jobs[index].posterId !== user.id) throw new Error('You can only update your own jobs')

    jobs[index] = { ...jobs[index], ...updates }
    setJobs(jobs)
    return jobs[index]
  },

  async deleteJob(token, jobId) {
    const user = decodeToken(token)
    if (!user || user.role !== 'poster') throw new Error('Unauthorized')

    const jobs = getJobs()
    const job = jobs.find(j => j.id === jobId)

    if (!job) throw new Error('Job not found')
    if (job.posterId !== user.id) throw new Error('You can only delete your own jobs')

    const filteredJobs = jobs.filter(j => j.id !== jobId)
    setJobs(filteredJobs)

    const apps = getApplications().filter(a => a.jobId !== jobId)
    setApplications(apps)

    return { success: true }
  },

  async applyForJob(token, applicationData) {
    const user = decodeToken(token)
    if (!user || user.role !== 'seeker') throw new Error('Only job seekers can apply')

    const { jobId, name, email, phone, resume } = applicationData

    const jobs = getJobs()
    const job = jobs.find(j => j.id === jobId)
    if (!job) throw new Error('Job not found')

    const apps = getApplications()
    const alreadyApplied = apps.find(a => a.jobId === jobId && a.applicantId === user.id)
    if (alreadyApplied) throw new Error('You have already applied for this job')

    const application = {
      id: generateId(),
      jobId,
      jobTitle: job.title,
      applicantId: user.id,
      name,
      email,
      phone,
      resume,
      createdAt: new Date().toISOString()
    }

    apps.push(application)
    setApplications(apps)
    return application
  },

  async getReceivedApplications(token) {
    const user = decodeToken(token)
    if (!user || user.role !== 'poster') throw new Error('Unauthorized')

    const jobs = getJobs()
    const myJobIds = jobs.filter(j => j.posterId === user.id).map(j => j.id)

    const apps = getApplications()
    return apps.filter(a => myJobIds.includes(a.jobId))
  },

  async getJobApplications(token, jobId) {
    const user = decodeToken(token)
    if (!user || user.role !== 'poster') throw new Error('Unauthorized')

    const jobs = getJobs()
    const job = jobs.find(j => j.id === jobId)

    if (!job || job.posterId !== user.id) throw new Error('Access denied')

    const apps = getApplications()
    return apps.filter(a => a.jobId === jobId)
  }
}

if (typeof window !== 'undefined') {
  mockApi.init()
}
