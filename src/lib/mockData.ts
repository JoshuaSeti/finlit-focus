// Mock data for the FinLit website - will be replaced with database later

export interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  active: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  imageUrl: string;
  category: string;
  published: boolean;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  category: string;
  downloadCount: number;
}

export interface ContactForm {
  id: string;
  schoolName: string;
  contactPerson: string;
  email: string;
  phone: string;
  message: string;
  requestType: string;
  date: string;
  status: 'new' | 'contacted' | 'resolved';
}

export const mockCarouselSlides: CarouselSlide[] = [
  {
    id: '1',
    title: 'Empowering Youth Through Financial Education',
    subtitle: 'Learn it. Earn it. Lead it.',
    description: 'We provide comprehensive financial literacy programs to schools across Zambia and Zimbabwe, helping young people build a foundation for financial success.',
    imageUrl: '/placeholder.svg',
    ctaText: 'Learn More',
    ctaLink: '/about',
    active: true,
  },
  {
    id: '2',
    title: 'Financial Literacy for Every Student',
    subtitle: 'Building Tomorrow\'s Leaders',
    description: 'Our curriculum covers budgeting, saving, investing, and entrepreneurship—essential skills for the modern economy.',
    imageUrl: '/placeholder.svg',
    ctaText: 'Our Programs',
    ctaLink: '/resources',
    active: true,
  },
  {
    id: '3',
    title: 'Partner With Us',
    subtitle: 'Bring FinLit to Your School',
    description: 'Join the movement to create financially literate communities. Contact us to bring our programs to your institution.',
    imageUrl: '/placeholder.svg',
    ctaText: 'Contact Us',
    ctaLink: '/contact',
    active: true,
  },
];

export const mockBlogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Teaching Kids About Money: A Guide for Parents',
    excerpt: 'Financial education starts at home. Here are practical tips for introducing money concepts to children of all ages.',
    content: 'Full article content here...',
    author: 'Sarah Banda',
    date: '2025-12-28',
    imageUrl: '/placeholder.svg',
    category: 'Tips',
    published: true,
  },
  {
    id: '2',
    title: 'FinLit Partners with 50 New Schools in Lusaka',
    excerpt: 'We\'re excited to announce our expansion into 50 additional schools, reaching over 10,000 new students.',
    content: 'Full article content here...',
    author: 'FinLit Team',
    date: '2025-12-20',
    imageUrl: '/placeholder.svg',
    category: 'News',
    published: true,
  },
  {
    id: '3',
    title: 'The Importance of Early Financial Education',
    excerpt: 'Research shows that children who learn about money early are more likely to develop healthy financial habits as adults.',
    content: 'Full article content here...',
    author: 'Dr. James Moyo',
    date: '2025-12-15',
    imageUrl: '/placeholder.svg',
    category: 'Research',
    published: true,
  },
  {
    id: '4',
    title: 'Student Success Stories: Meet Our Young Entrepreneurs',
    excerpt: 'Inspiring stories from students who have used their financial literacy knowledge to start small businesses.',
    content: 'Full article content here...',
    author: 'FinLit Team',
    date: '2025-12-10',
    imageUrl: '/placeholder.svg',
    category: 'Success Stories',
    published: true,
  },
];

export const mockResources: Resource[] = [
  {
    id: '1',
    title: 'Budgeting Basics Workbook',
    description: 'A comprehensive workbook teaching students how to create and maintain a personal budget.',
    fileUrl: '#',
    fileType: 'PDF',
    category: 'Workbooks',
    downloadCount: 1250,
  },
  {
    id: '2',
    title: 'Savings Challenge Poster',
    description: 'A fun, interactive poster that helps students track their savings progress.',
    fileUrl: '#',
    fileType: 'PDF',
    category: 'Posters',
    downloadCount: 890,
  },
  {
    id: '3',
    title: 'Teacher\'s Guide to Financial Literacy',
    description: 'A complete guide for educators on how to integrate financial literacy into their curriculum.',
    fileUrl: '#',
    fileType: 'PDF',
    category: 'Teacher Resources',
    downloadCount: 567,
  },
  {
    id: '4',
    title: 'Entrepreneurship Starter Kit',
    description: 'Everything students need to plan and launch their first small business venture.',
    fileUrl: '#',
    fileType: 'ZIP',
    category: 'Business',
    downloadCount: 432,
  },
];

export const mockContactForms: ContactForm[] = [
  {
    id: '1',
    schoolName: 'Lusaka International School',
    contactPerson: 'Mr. Peter Chanda',
    email: 'pchanda@lis.edu.zm',
    phone: '+260 97 123 4567',
    message: 'We are interested in implementing your financial literacy program for our Grade 8-12 students.',
    requestType: 'Program Inquiry',
    date: '2025-12-30',
    status: 'new',
  },
  {
    id: '2',
    schoolName: 'Harare Secondary School',
    contactPerson: 'Mrs. Grace Mutasa',
    email: 'gmutasa@hss.ac.zw',
    phone: '+263 78 234 5678',
    message: 'Looking to schedule a meeting to discuss partnership opportunities.',
    requestType: 'Partnership',
    date: '2025-12-29',
    status: 'contacted',
  },
  {
    id: '3',
    schoolName: 'Ndola Community School',
    contactPerson: 'Ms. Faith Mwanza',
    email: 'faith.m@ncs.edu.zm',
    phone: '+260 96 345 6789',
    message: 'We would like to request materials for our after-school financial literacy club.',
    requestType: 'Materials Request',
    date: '2025-12-25',
    status: 'resolved',
  },
];
