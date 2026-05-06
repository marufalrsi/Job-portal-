

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dns = require('dns');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

dns.setServers(['8.8.8.8', '1.1.1.1']);
console.log('Using DNS servers:', dns.getServers());

app.use(cors());
app.use(express.json());

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb+srv://marufallrushafi11_db_user:12345678910@cluster0.nmc3xzb.mongodb.net/jobPortal?retryWrites=true&w=majority';

mongoose.set('strictQuery', false);

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.log('Continuing without database connection for testing...');

  });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['poster', 'seeker'], required: true },
  createdAt: { type: Date, default: Date.now }
});

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: String, required: true },
  salary: { type: String, required: true },
  location: { type: String, required: true },
  posterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  posterName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const cvSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  address: { type: String, required: true },
  email: { type: String, required: true },
  gender: { type: String, required: true },
  age: { type: Number, required: true },
  education: [{
    institution: { type: String, required: true },
    country: { type: String, required: true },
    passingYear: { type: String, required: true },
    grade: { type: String, required: true },
    subject: { type: String, required: true }
  }],
  experience: [{
    project: { type: String, required: true },
    role: { type: String, required: true },
    years: { type: String, required: true }
  }],
  languages: [{ type: String }]
}, { _id: false })

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  jobTitle: { type: String, required: true },
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  resume: { type: String, required: true },
  cv: { type: cvSchema, required: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Job = mongoose.model('Job', jobSchema);
const Application = mongoose.model('Application', applicationSchema);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['poster', 'seeker'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 }).lean();
    res.json(jobs);
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Server error fetching jobs' });
  }
});

app.get('/api/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).lean();

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Server error fetching job' });
  }
});

app.get('/api/jobs/poster/my-jobs', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'poster') {
      return res.status(403).json({ error: 'Only job posters can access this' });
    }

    const jobs = await Job.find({ posterId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json(jobs);
  } catch (error) {
    console.error('Get poster jobs error:', error);
    res.status(500).json({ error: 'Server error fetching your jobs' });
  }
});

app.post('/api/jobs', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'poster') {
      return res.status(403).json({ error: 'Only job posters can create jobs' });
    }

    const { title, company, description, requirements, salary, location } = req.body;

    if (!title || !company || !description || !requirements || !salary || !location) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const job = new Job({
      title,
      company,
      description,
      requirements,
      salary,
      location,
      posterId: req.user.id,
      posterName: req.user.name
    });
    await job.save();

    res.status(201).json({ message: 'Job created successfully', job });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Server error creating job' });
  }
});

app.put('/api/jobs/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'poster') {
      return res.status(403).json({ error: 'Only job posters can update jobs' });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.posterId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own jobs' });
    }

    const { title, company, description, requirements, salary, location } = req.body;
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { title, company, description, requirements, salary, location },
      { new: true }
    ).lean();

    res.json({ message: 'Job updated successfully', job: updatedJob });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Server error updating job' });
  }
});

app.delete('/api/jobs/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'poster') {
      return res.status(403).json({ error: 'Only job posters can delete jobs' });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.posterId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own jobs' });
    }

    await Job.findByIdAndDelete(req.params.id);
    await Application.deleteMany({ jobId: req.params.id });

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Server error deleting job' });
  }
});

app.post('/api/apply', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'seeker') {
      return res.status(403).json({ error: 'Only job seekers can apply for jobs' });
    }

      const { jobId, name, email, phone, resume, cv } = req.body;

    if (!jobId || !name || !email || !phone || !resume || !resume.trim()) {
      return res.status(400).json({ error: 'All fields and application summary are required' });
    }

    if (cv) {
      const requiredCvFields = [
        cv.firstName,
        cv.lastName,
        cv.address,
        cv.email,
        cv.gender,
        cv.age,
        cv.education?.length > 0 && cv.education[0].institution,
        cv.education?.length > 0 && cv.education[0].country,
        cv.education?.length > 0 && cv.education[0].passingYear,
        cv.education?.length > 0 && cv.education[0].grade,
        cv.education?.length > 0 && cv.education[0].subject,
        cv.experience?.length > 0 && cv.experience[0].project,
        cv.experience?.length > 0 && cv.experience[0].role,
        cv.experience?.length > 0 && cv.experience[0].years,
        cv.languages?.length > 0
      ]

      if (requiredCvFields.some(field => !field)) {
        return res.status(400).json({ error: 'Complete CV details are required for the application' });
      }
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const alreadyApplied = await Application.findOne({ jobId, applicantId: req.user.id });

    if (alreadyApplied) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }

    const application = new Application({
      jobId,
      jobTitle: job.title,
      applicantId: req.user.id,
      name,
      email,
      phone,
      resume,
      cv
    });
    await application.save();

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ error: 'Server error submitting application' });
  }
});

app.get('/api/apply/received', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'poster') {
      return res.status(403).json({ error: 'Only job posters can view applications' });
    }

    const posterJobs = await Job.find({ posterId: req.user.id }).lean();
    const jobIds = posterJobs.map(job => job._id);
    const applications = await Application.find({ jobId: { $in: jobIds } }).sort({ createdAt: -1 }).lean();

    res.json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Server error fetching applications' });
  }
});

app.get('/api/apply/job/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'poster') {
      return res.status(403).json({ error: 'Only job posters can view job applications' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.posterId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const applications = await Application.find({ jobId: req.params.id }).sort({ createdAt: -1 }).lean();
    res.json(applications);
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ error: 'Server error fetching job applications' });
  }
});

app.get('/api/apply/my-applications', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'seeker') {
      return res.status(403).json({ error: 'Only job seekers can view their applications' });
    }

    const applications = await Application.find({ applicantId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json(applications);
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ error: 'Server error fetching your applications' });
  }
});

app.get('/', (req, res) => {
  res.send('Job Portal API is running. Use /api/health to check database connection.');
});

app.get('/api/health', (req, res) => {
  const state = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  res.json({
    api: 'Job Portal Backend',
    dbState: states[state] || state,
    dbName: mongoose.connection.name,
    dbHost: mongoose.connection.host,
    dbPort: mongoose.connection.port,
    connected: state === 1
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Connected backend to MongoDB Atlas');
});

module.exports = app;
