export const tasks = [
  {
    id: "1",
    title: "Build a Responsive Landing Page",
    description:
      "Create a modern, responsive landing page for a SaaS product using HTML, CSS, and JavaScript. Include hero section, features, testimonials, and footer.",
    difficulty: "Beginner",
    domain: "Web Development",
    deadline: "2026-03-15",
    status: "in-progress",
    points: 100,
    requirements: [
      "Mobile-first responsive design",
      "Semantic HTML structure",
      "CSS Grid/Flexbox layout",
      "Smooth scroll navigation",
      "Contact form with validation",
    ],
  },
  {
    id: "2",
    title: "Design a Mobile App UI Kit",
    description:
      "Design a comprehensive UI kit for a fitness tracking mobile application including all core screens and components.",
    difficulty: "Intermediate",
    domain: "UI/UX Design",
    deadline: "2026-03-20",
    status: "available",
    points: 200,
    requirements: [
      "10+ screen designs",
      "Component library",
      "Color system and typography",
      "Dark mode variant",
      "Interactive prototype",
    ],
  },
  {
    id: "3",
    title: "Write SEO Blog Articles",
    description:
      "Write 3 SEO-optimized blog articles (1500+ words each) for a digital marketing agency on trending topics.",
    difficulty: "Beginner",
    domain: "Content Writing",
    deadline: "2026-03-10",
    status: "completed",
    points: 150,
    requirements: [
      "Keyword research",
      "SEO-optimized structure",
      "Engaging meta descriptions",
      "Internal linking strategy",
      "Plagiarism-free content",
    ],
  },
  {
    id: "4",
    title: "Develop a REST API",
    description:
      "Build a RESTful API for an e-commerce platform with authentication, product management, and order processing.",
    difficulty: "Advanced",
    domain: "Backend Development",
    deadline: "2026-04-01",
    status: "available",
    points: 350,
    requirements: [
      "JWT Authentication",
      "CRUD operations",
      "Input validation",
      "Error handling middleware",
      "API documentation with Swagger",
    ],
  },
  {
    id: "5",
    title: "Create Social Media Graphics",
    description:
      "Design a set of 20 social media graphics for an upcoming product launch campaign across Instagram, Twitter, and LinkedIn.",
    difficulty: "Intermediate",
    domain: "Graphic Design",
    deadline: "2026-03-25",
    status: "available",
    points: 180,
    requirements: [
      "Brand consistency",
      "Platform-specific sizing",
      "Engaging visual hierarchy",
      "Call-to-action elements",
      "Source file delivery",
    ],
  },
  {
    id: "6",
    title: "Data Analysis Dashboard",
    description:
      "Create an interactive data analysis dashboard using Python and visualization libraries for a retail company's sales data.",
    difficulty: "Advanced",
    domain: "Data Science",
    deadline: "2026-04-10",
    status: "available",
    points: 300,
    requirements: [
      "Data cleaning and preprocessing",
      "Statistical analysis",
      "Interactive visualizations",
      "Trend identification",
      "Executive summary report",
    ],
  },
]

export const recentActivity = [
  {
    id: 1,
    action: "Submitted task",
    task: "Build a Responsive Landing Page",
    time: "2 hours ago",
    status: "pending",
  },
  {
    id: 2,
    action: "Received feedback",
    task: "Write SEO Blog Articles",
    time: "5 hours ago",
    status: "completed",
  },
  {
    id: 3,
    action: "Started task",
    task: "Design a Mobile App UI Kit",
    time: "1 day ago",
    status: "in-progress",
  },
  {
    id: 4,
    action: "Completed assessment",
    task: "Web Development Skills",
    time: "2 days ago",
    status: "completed",
  },
]

export const stats = {
  tasksCompleted: 12,
  totalTasks: 20,
  averageScore: 87,
  hoursLogged: 48,
  currentStreak: 5,
  portfolioProjects: 8,
}

export const skills = [
  { name: "HTML/CSS", level: 90 },
  { name: "JavaScript", level: 78 },
  { name: "React", level: 72 },
  { name: "UI/UX Design", level: 85 },
  { name: "Content Writing", level: 68 },
  { name: "Python", level: 55 },
]

export const portfolioProjects = [
  {
    id: 1,
    title: "E-commerce Landing Page",
    domain: "Web Development",
    score: 92,
    date: "2026-02-10",
    description: "A fully responsive e-commerce landing page with modern design patterns and smooth animations.",
    tags: ["HTML", "CSS", "JavaScript", "Responsive"],
  },
  {
    id: 2,
    title: "Fitness App UI Design",
    domain: "UI/UX Design",
    score: 88,
    date: "2026-01-28",
    description: "Complete UI kit for a fitness tracking app with 15+ screen designs and interactive prototype.",
    tags: ["Figma", "UI Kit", "Mobile", "Prototype"],
  },
  {
    id: 3,
    title: "Tech Blog Articles",
    domain: "Content Writing",
    score: 85,
    date: "2026-01-15",
    description: "SEO-optimized blog articles on emerging tech trends for a digital marketing agency.",
    tags: ["SEO", "Blog", "Content", "Marketing"],
  },
  {
    id: 4,
    title: "Task Management API",
    domain: "Backend Development",
    score: 90,
    date: "2026-02-05",
    description: "RESTful API for a task management application with authentication and real-time updates.",
    tags: ["Node.js", "Express", "MongoDB", "REST"],
  },
]

export const assessmentQuestions = [
  {
    id: 1,
    question: "What does CSS stand for?",
    options: [
      "Creative Style Sheets",
      "Cascading Style Sheets",
      "Computer Style Sheets",
      "Colorful Style Sheets",
    ],
    correct: 1,
  },
  {
    id: 2,
    question: "Which HTML element is used for the largest heading?",
    options: ["<heading>", "<h6>", "<h1>", "<head>"],
    correct: 2,
  },
  {
    id: 3,
    question: "What property is used to change the background color in CSS?",
    options: ["bgcolor", "color", "background-color", "bg-color"],
    correct: 2,
  },
  {
    id: 4,
    question: "Which of the following is a JavaScript framework?",
    options: ["Django", "Laravel", "React", "Flask"],
    correct: 2,
  },
  {
    id: 5,
    question: "What does API stand for?",
    options: [
      "Application Programming Interface",
      "Advanced Program Integration",
      "Application Process Integration",
      "Advanced Programming Interface",
    ],
    correct: 0,
  },
]

export const chatMessages = [
  {
    id: 1,
    role: "assistant" as const,
    content: "Hello! I'm your AI career assistant. How can I help you today with your freelancing journey?",
    time: "10:00 AM",
  },
  {
    id: 2,
    role: "user" as const,
    content: "I want to improve my web development skills. What should I focus on?",
    time: "10:01 AM",
  },
  {
    id: 3,
    role: "assistant" as const,
    content:
      "Based on your skill assessment, I'd recommend focusing on these areas:\n\n1. **React & Next.js** - Your JavaScript foundation is strong (78%), so advancing to modern frameworks would be ideal.\n\n2. **TypeScript** - Adding type safety to your projects will make you more competitive.\n\n3. **API Development** - Understanding backend fundamentals will make you a more versatile freelancer.\n\nWould you like me to suggest specific tasks for any of these areas?",
    time: "10:01 AM",
  },
]

export const testimonials = [
  {
    name: "Sarah Chen",
    role: "Freelance Developer",
    content:
      "InternHub AI transformed my career. The AI-powered feedback helped me improve my coding skills faster than any bootcamp.",
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "UI/UX Designer",
    content:
      "The virtual internships gave me real-world experience that helped me land my first freelancing clients within weeks.",
    avatar: "MJ",
  },
  {
    name: "Priya Patel",
    role: "Content Writer",
    content:
      "The portfolio builder and AI scoring gave me the confidence to pitch to premium clients. My income doubled in 3 months.",
    avatar: "PP",
  },
]

export const mentorStudents = [
  {
    id: 1,
    name: "Alex Rivera",
    email: "alex@example.com",
    domain: "Web Development",
    progress: 75,
    tasksCompleted: 15,
    avgScore: 82,
    lastActive: "2 hours ago",
  },
  {
    id: 2,
    name: "Jordan Lee",
    email: "jordan@example.com",
    domain: "UI/UX Design",
    progress: 60,
    tasksCompleted: 12,
    avgScore: 88,
    lastActive: "1 day ago",
  },
  {
    id: 3,
    name: "Sam Kim",
    email: "sam@example.com",
    domain: "Content Writing",
    progress: 90,
    tasksCompleted: 18,
    avgScore: 91,
    lastActive: "30 minutes ago",
  },
  {
    id: 4,
    name: "Taylor Morgan",
    email: "taylor@example.com",
    domain: "Data Science",
    progress: 45,
    tasksCompleted: 9,
    avgScore: 76,
    lastActive: "3 days ago",
  },
  {
    id: 5,
    name: "Casey Brown",
    email: "casey@example.com",
    domain: "Backend Development",
    progress: 55,
    tasksCompleted: 11,
    avgScore: 79,
    lastActive: "5 hours ago",
  },
]

export const adminStats = {
  totalUsers: 2547,
  activeStudents: 1823,
  mentors: 45,
  totalTasks: 156,
  completionRate: 73,
  avgSatisfaction: 4.6,
}
