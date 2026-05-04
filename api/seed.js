const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);
console.log('Using DNS servers:', dns.getServers());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://marufallrushafi11_db_user:12345678910@cluster0.nmc3xzb.mongodb.net/jobPortal?retryWrites=true&w=majority';

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

const User = mongoose.model('User', userSchema);
const Job = mongoose.model('Job', jobSchema);

const companies = [
  'Rubicon Group', 'Green Delta Insurance', 'Denim Industries', 'Acme Limited', 'Hexim Pharmaceuticals', 'BRAC', 'Asian Paints', 'Bottle Power', 'Cement Technology', 'Digital Solutions Ltd', 'Techno Corporation', 'Infosys Bangladesh', 'Google Bangladesh', 'Innovate Tech', 'Future Systems', 'Smart Software', 'Web Design Hub', 'Digital Marketing Plus', 'Cloud Systems', 'Next Generation IT'
];

const recruiterNames = [
  'Rahim Ahmed', 'Fatima Khan', 'Sajid Hosen', 'Najma Akter', 'Karim Uddin', 'Tasnim Rahman', 'Shahin Ali', 'Maria Choudhury', 'Rafikul Islam', 'Jahira Begum', 'Hassan Abdullah', 'Aisha Siddiqua', 'Mohammad Karim', 'Lima Sultana', 'Imran Khan', 'Nahid Ferdaus', 'Abdullah Al Mamun', 'Rina Roy', 'Sohel Ahmed', 'Nasim Ara'
];

const jobTitles = ['Software Developer', 'Senior Developer', 'Web Developer', 'Mobile Developer', 'Data Analyst', 'System Administrator', 'IT Manager', 'Project Manager', 'Marketing Executive', 'Sales Representative', 'Customer Service Executive', 'HR Officer', 'Accountant', 'Financial Analyst', 'Content Writer', 'SEO Specialist', 'Graphic Designer', 'UI/UX Designer', 'Business Development Executive', 'Quality Assurance Engineer'];

const locations = ['Dhaka', 'Chittagong', 'Sylhet', 'Khulna', 'Rajshahi', 'Barisal', 'Rangpur', 'Gazipur', 'Narayanganj', 'Pirojpur'];

const salaries = ['৳ ৩০,০০০ - ৫০,০০০', '৳ ৫০,০০০ - ৭০,০০০', '৳ ৭০,০০০ - ৯০,০০০', '৳ ৯০,০০০ - ১,২০,০০০', '৳ ১,২০,০০০ - ১,৫০,০০০', '৳ ১,৫০,০০০ - ২,০০,০০০', '৳ ২,০০,০০০ - ২,৫০,০০০'];

const generateDescription = () => {
  const templates = [
    `We are looking for an experienced and innovative professional who will bring new dimensions to our organization. This position offers a challenging and rewarding opportunity where you can apply your skills and knowledge. Our company delivers world-class service and we believe in employee development. In this role, you will be a valuable member of our team and part of our success story. We value your creativity and innovative thinking and provide opportunities for you to reach your full potential.`,
    `Our organization is a rapidly growing company establishing market leadership. We are seeking a talented professional who will help implement our vision. This position is an excellent opportunity to demonstrate your commitment to excellence and professionalism. We invest in the mental and professional growth of our employees. You will work in a supportive and inclusive work environment where every voice is heard.`,
    `Our department is implementing cutting-edge technology solutions. We are looking for a skilled and motivated professional to join us on this journey. This job provides you the opportunity to learn and apply industry best practices. We promote a culture of continuous learning and provide training for professional development. You will have the opportunity to work on internationally-standard projects and collaborate with team members worldwide.`,
    `Our company is recognized as a leading brand and we continue to grow. We are looking for ambitious and results-driven professionals who want to be part of our success. This position provides the perfect platform for achieving your career goals. We offer a competitive salary package and comprehensive benefits. Our team consists of talented individuals from diverse backgrounds working together for a common purpose.`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
};

const generateRequirements = () => {
  const templates = [
    `- Bachelor's degree in relevant field
- 3+ years of relevant work experience
- Strong communication skills
- Ability to manage teams
- Problem-solving and critical thinking skills
- Proficiency in Microsoft Office Suite`,
    `- Bachelor's degree in Science or Engineering
- 2-5 years of industry experience
- Attention to detail and organizational skills
- Ability to work independently and in teams
- Customer service skills
- Commitment to ethics and integrity`,
    `- Bachelor's degree in any discipline
- 1-3 years of work experience
- Strong written and verbal communication
- Analytical and research skills
- Punctuality and reliability
- Advanced computer knowledge`,
    `- Bachelor's degree in relevant field
- 5+ years of professional experience
- Leadership and management skills
- Strategic thinking
- Networking and relationship-building abilities
- Awareness of international standards`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
};

const seedJobs = async () => {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      family: 4
    });
    console.log('Connected to MongoDB');

    await Job.deleteMany({});
    console.log('Cleared existing jobs');

    let posterUser = await User.findOne({ role: 'poster' });

    if (!posterUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      posterUser = new User({
        name: 'বিশ্বাস রিক্রুটমেন্ট',
        email: 'recruitment@company.com',
        password: hashedPassword,
        role: 'poster'
      });
      await posterUser.save();
      console.log('Created test poster user');
    }

    const jobs = [];
    for (let i = 0; i < 50; i++) {
      const company = bengaliCompanies[Math.floor(Math.random() * bengaliCompanies.length)];
      const title = jobTitles[Math.floor(Math.random() * jobTitles.length)];
      const posterName = bengaliNames[Math.floor(Math.random() * bengaliNames.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const salary = salaries[Math.floor(Math.random() * salaries.length)];

      jobs.push({
        title,
        company,
        description: generateDescription(),
        requirements: generateRequirements(),
        salary,
        location,
        posterId: posterUser._id,
        posterName,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
    }

    await Job.insertMany(jobs);
    console.log(`Successfully seeded ${jobs.length} jobs`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedJobs();
