import React, { useState, useEffect } from 'react';
import { BookOpen, PenTool, Trophy, Calendar, Clock, CheckCircle, ArrowRight, Users, Star, MessageSquare, ThumbsUp, Eye, Award, TrendingUp, FileText, Send, User, Heart, LogOut, Bell, CreditCard, X, Share2, Image as ImageIcon } from 'lucide-react';
import { onAuthChange, login, signup, logout as firebaseLogout } from './services/auth';
import { 
  recordEnrollment, 
  publishEssay as publishEssayToDb, 
  deleteEssay as deleteEssayFromDb 
} from './services/firestore';
import { createPaymentIntent } from './services/payment';
import { auth, db } from './services/firebase';
import AdminDashboard from './AdminDashboard.js';
import { getDocs, collection } from 'firebase/firestore';

/**
 * ACADEMY OF CURIOSITY - HYBRID MODEL
 * 
 * Features:
 * ✅ Essay writing challenges (philosophy, economics, psychology, creative writing)
 * ✅ Skill learning (cooking, DIY, photography, etc.) with flexible timelines
 * ✅ Accountability partner auto-matching
 * ✅ Partner validation flow (private → opt-in public)
 * ✅ Outcome gallery with community engagement
 * ✅ Flexible duration (not rigid 2-week sprints)
 */

export default function AdultUniversity() {
  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        setCurrentUser({
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          uid: user.uid,
        });
        setIsAuthenticated(true);
        // Auto-match accountability partner on first login
        if (!accountabilityPartner) {
          matchAccountabilityPartner();
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setActiveTab('home');
      }
    });
    return () => unsubscribe();
  }, []);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [selectedChallengeForPayment, setSelectedChallengeForPayment] = useState(null);

  // Core state
  const [activeTab, setActiveTab] = useState('home');
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [selectedEssay, setSelectedEssay] = useState(null);
  const [enrolled, setEnrolled] = useState([]);
  const [viewingWeek, setViewingWeek] = useState(null);
  const [likedEssays, setLikedEssays] = useState([]);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [essayDraft, setEssayDraft] = useState({ title: '', content: '', versions: [] });
  const [submittedEssays, setSubmittedEssays] = useState([]);
  const [subscriptionPlan, setSubscriptionPlan] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showVersionHistory, setShowVersionHistory] = useState(null);
  const [challenges, setChallenges] = useState([]);
  
  // Accountability partner state
  const [accountabilityPartner, setAccountabilityPartner] = useState(null);
  const [partnerMessages, setPartnerMessages] = useState([]);
  const [newPartnerMessage, setNewPartnerMessage] = useState('');
  const [essayToValidate, setEssayToValidate] = useState(null);
  const [outcomePublic, setOutcomePublic] = useState([]);
  const [partnerValidationFeedback, setPartnerValidationFeedback] = useState('');

  // Available accountability partners
  const partnerPool = [
    { id: 1, name: 'James Rodriguez', interests: ['Philosophy', 'Economics'], completed: 3, streak: 8 },
    { id: 2, name: 'Maria Santos', interests: ['Creative Writing', 'Philosophy'], completed: 5, streak: 12 },
    { id: 3, name: 'Alex Chen', interests: ['Economics', 'Psychology'], completed: 2, streak: 5 },
    { id: 4, name: 'Jordan Lee', interests: ['Creative Writing', 'Psychology'], completed: 4, streak: 9 }
  ];

  const matchAccountabilityPartner = () => {
    const randomPartner = partnerPool[Math.floor(Math.random() * partnerPool.length)];
    setAccountabilityPartner(randomPartner);
    setPartnerMessages([
      { 
        author: randomPartner.name, 
        text: `Hi! I'm ${randomPartner.name}, your accountability partner. Looking forward to supporting you through your learning journey!`,
        time: 'Just now',
        isPartner: true
      }
    ]);
  };

  // Load challenges from Firestore and combine with defaults
  useEffect(() => {
    const loadChallenges = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'challenges'));
        const firestoreChallenges = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Combine Firestore challenges with defaults
        // Use a Set to avoid duplicates by ID
        const allChallenges = [...defaultChallenges];
        
        firestoreChallenges.forEach(fsChal => {
          const exists = allChallenges.some(c => c.id === fsChal.id);
          if (!exists) {
            allChallenges.push(fsChal);
          }
        });
        
        setChallenges(allChallenges);
      } catch (error) {
        console.error('Error loading challenges:', error);
        // If Firestore fails, just use defaults
        setChallenges(defaultChallenges);
      }
    };
    loadChallenges();
  }, []);

  /**
 * ACADEMY OF CURIOSITY - ENRICHED CHALLENGES
 * Complete with learning objectives, source materials, and structured resources
 */

const defaultChallenges = [
  {
    id: 1,
    title: "The Philosophy of Everyday Life",
    category: "Philosophy",
    type: "essay",
    duration: "Flexible",
    participants: 1247,
    difficulty: "Intermediate",
    description: "Explore how ancient wisdom applies to modern living. Write essays on stoicism, existentialism, and practical philosophy.",
    tasks: [
      { id: 1, name: "Read Meditations excerpt", status: "pending" },
      { id: 2, name: "Write essay on stoicism", status: "pending" },
      { id: 3, name: "Share with partner", status: "pending" },
      { id: 4, name: "Revise based on feedback", status: "pending" }
    ],
    startDate: "Nov 18, 2025",
    price: 0,
    weeks: [
      { week: 1, title: "Introduction to Stoicism", prompt: "How can Marcus Aurelius's 'Meditations' guide us through modern challenges?", dueDate: "Nov 25", essays: 47 },
      { week: 2, title: "Existential Freedom", prompt: "What does Sartre mean by 'existence precedes essence' and how does it apply to your life?", dueDate: "Dec 2", essays: 0 }
    ],
    resources: [
      { type: "book", title: "Meditations by Marcus Aurelius", source: "Penguin Classics", description: "The foundational text on Stoic philosophy. Focus on Book II (self-mastery) and Book V (acceptance)." },
      { type: "video", title: "Stoicism 101: Ancient Wisdom for Modern Life", source: "Philosophy Tube (YouTube)", description: "30-min intro covering core Stoic concepts: dichotomy of control, virtue, and tranquility." },
      { type: "article", title: "The Stoic Art of Living", source: "The Atlantic", description: "Modern applications of Stoic philosophy to anxiety, failure, and meaning." },
      { type: "podcast", title: "Daily Stoic Podcast", source: "Ryan Holiday", description: "15-min episodes exploring practical Stoicism with real-world examples." }
    ],
    learnings: [
      "The dichotomy of control: What's in your power vs. what's not",
      "Virtue as the highest good (wisdom, justice, courage, temperance)",
      "Premeditatio malorum: Mental preparation for challenges",
      "Living in accordance with nature and reason",
      "Emotional resilience through perspective shifts"
    ]
  },

  {
    id: 2,
    title: "Make Hollandaise Sauce",
    category: "Cooking",
    type: "skill",
    duration: "2 weeks",
    participants: 412,
    difficulty: "Beginner",
    description: "Master the classic French sauce from scratch. Learn the technique, troubleshoot common issues, and cook something delicious.",
    tasks: [
      { id: 1, name: "Watch Gordon Ramsay's tutorial", status: "pending" },
      { id: 2, name: "Study emulsification science", status: "pending" },
      { id: 3, name: "Practice making sauce (attempt 1)", status: "pending" },
      { id: 4, name: "Cook final dish with eggs royale", status: "pending" },
      { id: 5, name: "Photograph and share results", status: "pending" }
    ],
    startDate: "Now",
    price: 0,
    outcome: "Cook and photograph eggs Royale with perfect hollandaise",
    resources: [
      { type: "video", title: "Hollandaise 101 - Gordon Ramsay", source: "YouTube", description: "5-min fast-paced tutorial. Key: warm yolks, cold butter, whisking constantly." },
      { type: "video", title: "Emulsification Technique Breakdown", source: "Serious Eats", description: "Deep dive into WHY hollandaise works (emulsion science)." },
      { type: "article", title: "The Science of Hollandaise", source: "Cook's Illustrated", description: "Temperature control, ratios, troubleshooting broken sauce." },
      { type: "article", title: "5 Classic French Sauces You Must Master", source: "Bon Appétit", description: "Learn hollandaise in context of béarnaise, beurre blanc, and variations." }
    ],
    learnings: [
      "Emulsion basics: fat in liquid stays stable when whisked properly",
      "Temperature management (yolks 40-50°C, butter 50-60°C)",
      "Whisking technique: speed and angle affect stability",
      "Fixing a broken sauce: add cold water and whisk, or start fresh",
      "Variations: béarnaise (add tarragon), blender method (faster)"
    ]
  },

  {
    id: 3,
    title: "Creative Non-Fiction Workshop",
    category: "Writing",
    type: "essay",
    duration: "6 weeks",
    participants: 892,
    difficulty: "All Levels",
    description: "Master the art of telling true stories. Learn narrative techniques, voice development, and memoir writing.",
    tasks: [
      { id: 1, name: "Write about a transformative moment", status: "pending" },
      { id: 2, name: "Create character profiles", status: "pending" },
      { id: 3, name: "Write dialogue-heavy scene", status: "pending" },
      { id: 4, name: "Polish and edit your best piece", status: "pending" },
      { id: 5, name: "Get partner feedback", status: "pending" },
      { id: 6, name: "Share to community portfolio", status: "pending" }
    ],
    startDate: "Nov 20, 2025",
    price: 0,
    weeks: [
      { week: 1, title: "Finding Your Voice", prompt: "Write about a moment that changed you. Focus on sensory details and honest emotion.", dueDate: "Nov 27", essays: 34 }
    ],
    resources: [
      { type: "book", title: "The Art of Memoir by Mary Karr", source: "Harper", description: "Master class on finding your authentic voice, structure, and emotional truth in personal narrative." },
      { type: "book", title: "Crafting True Stories by Jessica Lahey", source: "Algonquin", description: "Practical techniques for turning real events into compelling narratives." },
      { type: "article", title: "The Anatomy of a Great Scene", source: "Poets & Writers", description: "How to use dialogue, action, and reflection to bring moments alive." },
      { type: "podcast", title: "The Moth: True Stories Told Live", source: "Spotify/Apple Podcasts", description: "Award-winning storytellers sharing personal narratives - listen for technique." }
    ],
    learnings: [
      "Show vs. tell: Use sensory details and scenes instead of summary",
      "Character development: Reveal personality through action and speech",
      "Dialogue: Make it sound natural while advancing story and revealing character",
      "Narrative structure: Beginning, middle, end with clear emotional arc",
      "Finding your voice: Authenticity and perspective make your story unique"
    ]
  },

  {
    id: 4,
    title: "Economics for the Curious Mind",
    category: "Economics",
    type: "essay",
    duration: "5 weeks",
    participants: 2103,
    difficulty: "Beginner",
    description: "Understand economic principles through real-world examples. No math required, just curiosity.",
    tasks: [
      { id: 1, name: "Analyze local pricing patterns", status: "pending" },
      { id: 2, name: "Study market failure example", status: "pending" },
      { id: 3, name: "Write case study analysis", status: "pending" },
      { id: 4, name: "Document behavioral bias observations", status: "pending" },
      { id: 5, name: "Design economic policy proposal", status: "pending" }
    ],
    startDate: "Nov 25, 2025",
    price: 0,
    weeks: [
      { week: 1, title: "Supply & Demand in Daily Life", prompt: "Analyze pricing of something you buy regularly.", dueDate: "Dec 2", essays: 0 }
    ],
    resources: [
      { type: "book", title: "Freakonomics by Steven Levitt", source: "William Morrow", description: "Economics in everyday life: incentives, cheating, and hidden truths about human behavior." },
      { type: "video", title: "Economics in 2 Minutes", source: "Crash Course Economics (YouTube)", description: "Quick, visual explanations of supply/demand, inflation, market failures." },
      { type: "article", title: "The Economics of Pricing", source: "Harvard Business Review", description: "Why companies price things the way they do and what it reveals about markets." },
      { type: "podcast", title: "Planet Money", source: "NPR", description: "Real economic stories: cotton, fake drugs, underwater mortgages, and more." }
    ],
    learnings: [
      "Supply and demand: How scarcity and desire determine price",
      "Incentives: People respond to incentives in predictable ways",
      "Market failures: When free markets don't produce optimal outcomes",
      "Behavioral economics: How psychology influences economic decisions",
      "Trade-offs: Every choice has costs and benefits"
    ]
  },

  {
    id: 5,
    title: "Urban Photography Basics",
    category: "Photography",
    type: "skill",
    duration: "3 weeks",
    participants: 567,
    difficulty: "Beginner",
    description: "Learn to capture compelling photographs in city environments. No fancy camera needed.",
    tasks: [
      { id: 1, name: "Learn composition rules (rule of thirds)", status: "pending" },
      { id: 2, name: "Shoot 50 urban photos", status: "pending" },
      { id: 3, name: "Edit best shots (lighting, contrast)", status: "pending" },
      { id: 4, name: "Create curated series (5-10 photos)", status: "pending" }
    ],
    startDate: "Dec 1, 2025",
    price: 0,
    outcome: "Urban photography series (5-10 curated images)",
    resources: [
      { type: "video", title: "Composition Fundamentals", source: "YouTube - Matti Haapoja", description: "Rule of thirds, leading lines, depth of field - applied to urban photography." },
      { type: "article", title: "Urban Photography Tips & Tricks", source: "Digital Camera World", description: "Work with available light, find interesting angles, capture street scenes." },
      { type: "book", title: "The Photographer's Eye by Michael Freeman", source: "Focal Press", description: "Deep dive into composition, light, and visual storytelling." },
      { type: "podcast", title: "Master Photography", source: "SpotLight Magazine", description: "Interviews with urban photographers and technical talks on gear-free shooting." }
    ],
    learnings: [
      "Composition: Rule of thirds, leading lines, foreground/background depth",
      "Light: Golden hour, shadows, contrast, and how to work with available light",
      "Framing: Choosing what to include/exclude tells the story",
      "Color and B&W: When to use each for maximum impact",
      "Post-processing: Subtle edits to enhance mood (contrast, saturation, clarity)"
    ]
  },

  {
    id: 6,
    title: "Psychology of Decision Making",
    category: "Psychology",
    type: "essay",
    duration: "3 weeks",
    participants: 1567,
    difficulty: "Intermediate",
    description: "Dive into behavioral economics, cognitive biases, and how we make choices in daily life.",
    tasks: [
      { id: 1, name: "Keep bias journal for 7 days", status: "pending" },
      { id: 2, name: "Research cognitive bias case study", status: "pending" },
      { id: 3, name: "Analyze major personal decision", status: "pending" },
      { id: 4, name: "Design personal decision system", status: "pending" }
    ],
    startDate: "Dec 2, 2025",
    price: 0,
    weeks: [],
    resources: [
      { type: "book", title: "Thinking, Fast and Slow by Daniel Kahneman", source: "Farrar, Straus and Giroux", description: "Nobel laureate explains System 1 (intuitive) vs System 2 (deliberate) thinking and our cognitive biases." },
      { type: "video", title: "Cognitive Biases Explained", source: "Crash Course Psychology (YouTube)", description: "Confirmation bias, anchoring, availability heuristic, and 10+ others in 10 minutes." },
      { type: "article", title: "The Psychology of Money", source: "Morgan Housel blog", description: "How emotions and biases drive financial decisions and wealth building." },
      { type: "podcast", title: "Hidden Brain", source: "NPR", description: "Deep dives into unconscious biases that influence our choices and behaviors." }
    ],
    learnings: [
      "Cognitive biases: Systematic errors in how we process information",
      "Anchoring: First number we see influences all subsequent estimates",
      "Confirmation bias: We seek information that confirms existing beliefs",
      "Loss aversion: Losses feel twice as painful as equivalent gains feel good",
      "Mental accounting: How we categorize and think about money affects decisions"
    ]
  },

  {
    id: 7,
    title: "Fix Your Home: DIY Plumbing",
    category: "DIY",
    type: "skill",
    duration: "2 weeks",
    participants: 892,
    difficulty: "Beginner",
    description: "Learn to fix common plumbing issues: leaky faucets, running toilets, and more.",
    tasks: [
      { id: 1, name: "Watch plumbing basics tutorial", status: "pending" },
      { id: 2, name: "Identify and diagnose your issue", status: "pending" },
      { id: 3, name: "Gather tools and materials", status: "pending" },
      { id: 4, name: "Complete the repair", status: "pending" },
      { id: 5, name: "Document before/after with photos", status: "pending" }
    ],
    startDate: "Now",
    price: 0,
    outcome: "Fixed plumbing issue (before/after documentation)",
    resources: [
      { type: "video", title: "Leaky Faucet Repair 101", source: "YouTube - Home Repair Tutor", description: "Step-by-step fix for the most common plumbing problem. 15 minutes, 3 tools needed." },
      { type: "video", title: "Toilet Running? Fix it in 10 Minutes", source: "YouTube - The Handyman", description: "Replace flapper valve, adjust fill valve. Most common cause and fix." },
      { type: "article", title: "Essential Plumbing Tools You Actually Need", source: "This Old House", description: "5 tools that solve 80% of DIY plumbing problems (wrench, plunger, snake, etc)." },
      { type: "resource", title: "PEX vs Copper: Which is Better?", source: "Lowe's Learning Center", description: "Understand pipe materials before attempting repairs or upgrades." }
    ],
    learnings: [
      "Water shut-off valve: FIRST step in any plumbing emergency",
      "Compression fittings: How to properly tighten and seal connections",
      "Trap and vent system: Why water traps prevent sewer gases",
      "Common issues: Leaks, running toilets, slow drains - causes and fixes",
      "When to call a plumber: Know your limits (main line, gas lines, complex work)"
    ]
  },

  {
    id: 8,
    title: "Watercolor Painting for Beginners",
    category: "Art",
    type: "skill",
    duration: "4 weeks",
    participants: 634,
    difficulty: "Beginner",
    description: "Learn watercolor basics through guided projects. Build skills from wash techniques to detailed landscapes.",
    tasks: [
      { id: 1, name: "Buy basic watercolor supplies", status: "pending" },
      { id: 2, name: "Practice water and pigment control", status: "pending" },
      { id: 3, name: "Paint guided landscape tutorial", status: "pending" },
      { id: 4, name: "Create original watercolor painting", status: "pending" },
      { id: 5, name: "Photograph and share your work", status: "pending" }
    ],
    startDate: "Dec 5, 2025",
    price: 0,
    outcome: "Original watercolor painting",
    resources: [
      { type: "book", title: "The Artist's Way by Julia Cameron", source: "Tarcher Penguin", description: "Creative exercises to overcome blocks and develop your artistic voice." },
      { type: "video", title: "Watercolor Basics: Washes & Blending", source: "YouTube - Watercolor by Shibasaki", description: "Foundation techniques: wet-on-wet, glazing, color mixing in water." },
      { type: "article", title: "Essential Watercolor Supplies Guide", source: "Artists Network", description: "What you actually need (and don't) to get started painting with watercolor." },
      { type: "podcast", title: "The Art Owl Podcast", source: "Spotify", description: "Watercolor artists discuss techniques, inspiration, and overcoming perfectionism." }
    ],
    learnings: [
      "Transparency: Watercolor's defining feature - light shines through pigment",
      "Water control: More water = lighter, more fluid. Less water = darker, more control",
      "Wet-on-wet: Pigment flows on wet paper for soft, blended effects",
      "Glazing: Layering transparent washes to build color and depth",
      "Composition: Plan value (light/dark) before adding detail"
    ]
  },

  {
    id: 9,
    title: "Stoic Practices for Modern Life",
    category: "Philosophy",
    type: "essay",
    duration: "4 weeks",
    participants: 1823,
    difficulty: "Intermediate",
    description: "Apply stoic philosophy to modern challenges. Write reflections on control, virtue, and contentment.",
    tasks: [
      { id: 1, name: "Read Epictetus Enchiridion", status: "pending" },
      { id: 2, name: "Practice dichotomy of control", status: "pending" },
      { id: 3, name: "Write reflection essays (3)", status: "pending" },
      { id: 4, name: "Share journal with partner", status: "pending" }
    ],
    startDate: "Nov 18, 2025",
    price: 0,
    weeks: [],
    resources: [
      { type: "book", title: "The Enchiridion by Epictetus", source: "Dover Classics", description: "Ancient Stoic manual: 53 short teachings on virtue, acceptance, and tranquility." },
      { type: "book", title: "A Guide to the Good Life by William Irvine", source: "Oxford University Press", description: "Modern interpretation of Stoicism with practical exercises for daily life." },
      { type: "article", title: "The Dichotomy of Control: Epictetus's Secret to Contentment", source: "The Stoic", description: "Deep dive into the most powerful Stoic principle." },
      { type: "podcast", title: "The Stoic Mettle Podcast", source: "Podcast platforms", description: "Daily 10-min Stoic teachings and modern applications." }
    ],
    learnings: [
      "Epictetus framework: Some things in your control, some not",
      "What IS in your control: beliefs, desires, aversions, judgments",
      "What's NOT: body, property, reputation, position, health",
      "Focus: Spend energy only on what you control",
      "Virtue: The only true good is moral character"
    ]
  },

  {
    id: 10,
    title: "Writing Your Family Story",
    category: "Writing",
    type: "essay",
    duration: "6 weeks",
    participants: 743,
    difficulty: "All Levels",
    description: "Document family history through personal narrative. Interview relatives and craft compelling stories.",
    tasks: [
      { id: 1, name: "Interview 3 family members", status: "pending" },
      { id: 2, name: "Write three family stories", status: "pending" },
      { id: 3, name: "Edit and refine narratives", status: "pending" },
      { id: 4, name: "Create family story portfolio", status: "pending" }
    ],
    startDate: "Nov 25, 2025",
    price: 0,
    weeks: [],
    resources: [
      { type: "book", title: "Tell Your Story by David Cornwell", source: "DavidCornwell.net", description: "How to interview family, preserve memories, and craft meaningful narratives." },
      { type: "article", title: "The Art of the Interview", source: "The Paris Review", description: "Questions that reveal character and elicit unexpected stories." },
      { type: "resource", title: "StoryCorps Interview Guide", source: "storycorps.org", description: "Proven questions to ask family members - free downloadable guide." },
      { type: "podcast", title: "The Moth: Family Stories", source: "Spotify/Apple", description: "Curated stories about family relationships, inheritance, and connection." }
    ],
    learnings: [
      "Active listening: Ask follow-up questions that deepen the story",
      "Recording vs notes: Capture exact words, tone, and hesitations",
      "Story structure: Find the conflict, turning point, and resolution",
      "Intergenerational themes: What patterns emerge across generations?",
      "Preservation: Written, recorded, or video - create artifacts that last"
    ]
  },

  {
    id: 11,
    title: "Baking Bread: Sourdough Starter",
    category: "Cooking",
    type: "skill",
    duration: "3 weeks",
    participants: 1205,
    difficulty: "Intermediate",
    description: "Create and maintain a sourdough starter, then bake your first loaf. Learn ancient fermentation techniques.",
    tasks: [
      { id: 1, name: "Create sourdough starter", status: "pending" },
      { id: 2, name: "Feed and monitor for 7 days", status: "pending" },
      { id: 3, name: "Mix first sourdough dough", status: "pending" },
      { id: 4, name: "Ferment and shape loaf", status: "pending" },
      { id: 5, name: "Bake and document results", status: "pending" }
    ],
    startDate: "Dec 1, 2025",
    price: 0,
    outcome: "Homemade sourdough loaf with photos",
    resources: [
      { type: "video", title: "Sourdough Starter from Scratch", source: "YouTube - FoodWishes", description: "Flour + water + time = starter. Maintain by feeding ratio 1:1:1 (starter:flour:water)." },
      { type: "article", title: "Sourdough Fermentation Guide", source: "Perfect Loaf", description: "Timeline, temperatures, and signs of proper fermentation." },
      { type: "book", title: "Flour Water Salt Yeast by Ken Forkish", source: "WW Norton", description: "Science-based sourdough recipes with detailed fermentation instructions." },
      { type: "resource", title: "Troubleshooting Your Sourdough", source: "King Arthur Baking", description: "Dense crumb? Weak crust? Flat loaf? Chart of causes and solutions." }
    ],
    learnings: [
      "Wild yeast fermentation: Lactobacillus produces sour flavor AND rise",
      "Starter maintenance: Feed at ratio 1:1:1 for sustained culture",
      "Bulk fermentation: 4-6 hours at room temp, until dough increases 50-75%",
      "Autolyse: Rest dough 30-60 min before mixing - develops gluten",
      "Scoring and baking: High heat, steam, proper timing = open crumb"
    ]
  },

  {
    id: 12,
    title: "Building a Personal Stoic Practice",
    category: "Philosophy",
    type: "essay",
    duration: "8 weeks",
    participants: 456,
    difficulty: "Advanced",
    description: "Deep dive into Stoic philosophy and create your own daily practice. Advanced philosophy students welcome.",
    tasks: [
      { id: 1, name: "Read Marcus Aurelius completely", status: "pending" },
      { id: 2, name: "Study Seneca's letters", status: "pending" },
      { id: 3, name: "Design personal stoic practice", status: "pending" },
      { id: 4, name: "Write 8 weekly reflections", status: "pending" },
      { id: 5, name: "Create practice manifesto", status: "pending" }
    ],
    startDate: "Dec 1, 2025",
    price: 49,
    weeks: [],
    resources: [
      { type: "book", title: "Meditations by Marcus Aurelius", source: "Oxford Classics", description: "Complete Roman emperor's personal journal - written as philosophy to himself." },
      { type: "book", title: "Letters from a Stoic by Seneca", source: "Penguin Classics", description: "124 letters on virtue, friendship, aging, death, and finding meaning." },
      { type: "book", title: "Stoicism: A Very Short Introduction by Brad Inwood", source: "Oxford", description: "Academic but accessible overview of Stoic history, key figures, and ideas." },
      { type: "course", title: "Stoicism 101 - Complete Guide", source: "Coursera/Udemy", description: "Video lectures covering all three Stoic schools and their application today." }
    ],
    learnings: [
      "The Four Cardinal Virtues: Wisdom, Justice, Courage, Temperance",
      "Oikeiosis: Understanding natural social bonds and duty",
      "Prosoche: Mindful attention to your impressions and judgments",
      "Apatheia: Freedom from destructive emotions (not numbness)",
      "Telos: Living in accordance with reason and universal nature"
    ]
  },

  {
    id: 13,
    title: "Political Philosophy: Power & Justice",
    category: "Philosophy",
    type: "essay",
    duration: "6 weeks",
    participants: 589,
    difficulty: "Advanced",
    description: "Explore political philosophy through reading Plato, Rousseau, and modern thinkers. Write analytical essays.",
    tasks: [
      { id: 1, name: "Read Plato's Republic (selections)", status: "pending" },
      { id: 2, name: "Study social contract theory", status: "pending" },
      { id: 3, name: "Analyze current political issue", status: "pending" },
      { id: 4, name: "Write 4 analytical essays", status: "pending" },
      { id: 5, name: "Debate with community", status: "pending" }
    ],
    startDate: "Nov 20, 2025",
    price: 0,
    weeks: [],
    resources: [
      { type: "book", title: "The Republic by Plato", source: "Penguin Classics", description: "Socratic dialogues on justice, the ideal state, and philosopher-kings." },
      { type: "book", title: "The Social Contract by Jean-Jacques Rousseau", source: "Dover", description: "Foundation of modern democratic theory - legitimacy of government power." },
      { type: "book", title: "A Theory of Justice by John Rawls", source: "Harvard University Press", description: "Modern political philosophy: justice as fairness, original position, veil of ignorance." },
      { type: "article", title: "The Concept of Power in Political Theory", source: "Stanford Encyclopedia of Philosophy", description: "Academic but clear overview of how power and justice relate." }
    ],
    learnings: [
      "Plato's ideal: Philosopher-kings rule through wisdom, not wealth or birth",
      "Social contract: Government legitimacy comes from consent of governed",
      "Rawls' veil of ignorance: Design society as if you don't know your position",
      "Justice vs power: Can might make right, or does justice require fairness?",
      "Application: What do these theories tell us about modern governance?"
    ]
  },

  {
    id: 14,
    title: "Podcast Production Basics",
    category: "Media",
    type: "skill",
    duration: "4 weeks",
    participants: 234,
    difficulty: "Beginner",
    description: "Learn to record, edit, and publish your first podcast episode. No experience needed.",
    tasks: [
      { id: 1, name: "Set up recording space", status: "pending" },
      { id: 2, name: "Record first raw episode", status: "pending" },
      { id: 3, name: "Edit audio (intro, outro, cuts)", status: "pending" },
      { id: 4, name: "Create podcast cover art", status: "pending" },
      { id: 5, name: "Publish first episode", status: "pending" }
    ],
    startDate: "Dec 3, 2025",
    price: 0,
    outcome: "Published podcast episode",
    resources: [
      { type: "guide", title: "Home Podcast Setup Guide", source: "Podbean", description: "Mic under $50, free software, acoustic treatment with blankets. That's it." },
      { type: "article", title: "Free Podcast Editing Software Comparison", source: "Podbean Blog", description: "Audacity vs Reaper vs Adobe Audition - features, learning curve, export options." },
      { type: "video", title: "Podcast Editing Workflow", source: "YouTube - Podcast Engineering", description: "Step by step: import, cut, normalize, add music, export." },
      { type: "resource", title: "Podcast Hosting & Distribution", source: "Spotify for Podcasters", description: "Upload once, distribute to all platforms (Spotify, Apple, Google, etc)." }
    ],
    learnings: [
      "Audio basics: Gain staging, normalization, avoiding clipping",
      "Recording technique: Mic placement, room tone, consistent volume",
      "Editing workflow: Cut filler words (ums, ahs), adjust levels, add transitions",
      "Mixing: Background music levels, intro/outro placement, pacing",
      "Distribution: Submit once to Spotify for Podcasters, reaches 30+ platforms"
    ]
  },

  {
    id: 15,
    title: "The Art of Persuasive Writing",
    category: "Writing",
    type: "essay",
    duration: "5 weeks",
    participants: 967,
    difficulty: "Intermediate",
    description: "Master persuasive techniques through argumentative essays. Learn to convince readers through logic and rhetoric.",
    tasks: [
      { id: 1, name: "Study persuasive techniques (ethos, pathos, logos)", status: "pending" },
      { id: 2, name: "Analyze 3 persuasive speeches/articles", status: "pending" },
      { id: 3, name: "Write 3 persuasive essays", status: "pending" },
      { id: 4, name: "Get partner feedback on arguments", status: "pending" },
      { id: 5, name: "Revise and publish strongest essay", status: "pending" }
    ],
    startDate: "Nov 28, 2025",
    price: 0,
    weeks: [],
    resources: [
      { type: "book", title: "Thank You for Arguing by Jay Heinrichs", source: "Three Rivers Press", description: "Rhetoric made practical: how to win arguments through ethos, pathos, logos." },
      { type: "article", title: "The Anatomy of Persuasive Writing", source: "Medium", description: "Structure: hook, credibility, logical argument, emotional appeal, call to action." },
      { type: "video", title: "Famous Speeches Analyzed", source: "YouTube - The Speech Writer", description: "MLK, Kennedy, Obama: how they use rhetoric to persuade." },
      { type: "resource", title: "Logical Fallacies Explained", source: "YourLogicalFallacyIs.com", description: "Ad hominem, strawman, appeal to authority, bandwagon - spot them and avoid them." }
    ],
    learnings: [
      "Ethos: Establish credibility and trustworthiness before making arguments",
      "Pathos: Emotional connection - make readers FEEL the importance",
      "Logos: Logical argument - facts, evidence, clear reasoning",
      "Structure: Hook interest → build credibility → present evidence → emotional appeal → call to action",
      "Counterargument: Acknowledge opposing view then rebut it - stronger persuasion"
    ]
  }
];

  // Check if on admin page
  if (window.location.pathname === '/admin') {
    return <AdminDashboard />;
  }

  const communityEssays = [
    {
      id: 1,
      title: "Finding Stoicism in the Subway",
      author: "Sarah Chen",
      challenge: "The Philosophy of Everyday Life",
      excerpt: "The 6 train was delayed again. As passengers around me groaned, I remembered Marcus Aurelius: 'You have power over your mind - not outside events.'",
      readTime: "8 min read",
      likes: 142,
      comments: 28,
      views: 1834,
      publishedDate: "2 days ago",
      validatedByPartner: true,
      isPublic: true,
      fullText: `The 6 train was delayed again. As passengers around me groaned and checked their phones frantically, I remembered Marcus Aurelius: "You have power over your mind - not outside events. Realize this, and you will find strength."

This wasn't just ancient philosophy anymore—it was survival guidance for modern urban life.

I've spent the last three weeks studying Stoicism as part of the Academy's philosophy challenge, and what started as an intellectual exercise has become a daily practice. The subway, that cramped theater of human frustration, has become my training ground.

The Stoics divided the world into two categories: things we can control and things we cannot. The train delay? Cannot control. My reaction to it? Entirely within my power. This seems obvious when written out, but in the moment—when you're late for a meeting, when the person next to you is eating something pungent, when the air conditioning fails in July—this simple distinction becomes revolutionary.`
    },
    {
      id: 2,
      title: "The Economics of My Morning Coffee",
      author: "James Rodriguez",
      challenge: "Economics for the Curious Mind",
      excerpt: "I've bought the same coffee at the same café for three years. Last week, the price jumped from $4.50 to $5.75. My outrage lasted exactly until I learned why.",
      readTime: "6 min read",
      likes: 89,
      comments: 15,
      views: 1203,
      publishedDate: "4 days ago",
      validatedByPartner: true,
      isPublic: true,
      fullText: `I've bought the same coffee at the same café for three years. Last week, the price jumped from $4.50 to $5.75. My outrage lasted exactly until I learned why.

This simple price increase became the perfect case study for my economics challenge. What looks like corporate greed is actually a complex web of global supply chains, commodity markets, and local business realities.`
    },
    {
      id: 3,
      title: "My Grandmother's Hands",
      author: "Maria Santos",
      challenge: "Creative Non-Fiction Workshop",
      excerpt: "She taught me to make empanadas when I was seven, her fingers moving with the kind of confidence that comes from five decades of repetition.",
      readTime: "10 min read",
      likes: 234,
      comments: 41,
      views: 2567,
      publishedDate: "1 week ago",
      validatedByPartner: true,
      isPublic: true,
      fullText: `She taught me to make empanadas when I was seven, her fingers moving with the kind of confidence that comes from five decades of repetition.

"Watch carefully," she said in Spanish, though she knew I understood better than I spoke. "The dough tells you when it's ready."`
    }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      if (authMode === 'login') {
        if (!authForm.email || !authForm.password) {
          alert('Please enter email and password');
          return;
        }
        await login(authForm.email, authForm.password);
      } else {
        if (!authForm.name || !authForm.email || !authForm.password) {
          alert('Please fill in all fields');
          return;
        }
        await signup(authForm.email, authForm.password, authForm.name);
      }
      setShowAuthModal(false);
      setAuthForm({ name: '', email: '', password: '' });
    } catch (error) {
      alert(`${authMode === 'login' ? 'Login' : 'Signup'} failed: ${error.message}`);
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseLogout();
    } catch (error) {
      alert(`Logout failed: ${error.message}`);
      console.error(error);
    }
  };

  const handleEnroll = async (challengeId) => {
    if (!isAuthenticated || !auth.currentUser) {
      alert('Please log in to enroll');
      setShowAuthModal(true);
      return;
    }

    const challenge = challenges.find(c => c.id === challengeId);

    if (challenge.price > 0) {
      setSelectedChallengeForPayment(challenge);
      setShowStripeModal(true);
      return;
    }

    try {
      await recordEnrollment(auth.currentUser.uid, challengeId);
      if (!enrolled.includes(challengeId)) {
        setEnrolled([...enrolled, challengeId]);
        alert(`✅ Enrolled in "${challenge.title}"!\n\nYour accountability partner ${accountabilityPartner?.name} will support you through this.`);
      }
    } catch (error) {
      alert(`Enrollment failed: ${error.message}`);
      console.error(error);
    }
  };

  const handlePublishEssay = async () => {
    if (!essayDraft.title || !essayDraft.content) {
      alert('Please enter both title and content');
      return;
    }

    if (!auth.currentUser) {
      alert('Please log in to publish');
      setShowAuthModal(true);
      return;
    }

    // First, show to partner (private)
    const newEssay = {
      id: Date.now(),
      title: essayDraft.title,
      author: currentUser?.name || 'Anonymous',
      challenge: selectedChallenge?.title || 'Your Challenge',
      excerpt: essayDraft.content.substring(0, 150),
      readTime: Math.ceil(essayDraft.content.split(' ').length / 200) + ' min read',
      likes: 0,
      comments: 0,
      views: 0,
      publishedDate: 'Just now',
      fullText: essayDraft.content,
      versions: [{ 
        content: essayDraft.content, 
        savedAt: new Date().toLocaleString() 
      }],
      authorId: auth.currentUser.uid,
      validatedByPartner: false,
      isPublic: false
    };

    setSubmittedEssays([...submittedEssays, newEssay]);
    setEssayToValidate(newEssay);
    setEssayDraft({ title: '', content: '', versions: [] });

    // Add partner message
    const partnerMsg = {
      author: accountabilityPartner.name,
      text: `I'll review your essay "${newEssay.title}" and give you feedback!`,
      time: 'Just now',
      isPartner: true
    };
    setPartnerMessages([...partnerMessages, partnerMsg]);

    alert('✅ Essay saved!\n\nYour accountability partner will review it now. Once they approve, you can choose to share publicly.');
  };

  const handlePartnerValidation = () => {
    if (!partnerValidationFeedback.trim() || !essayToValidate) {
      alert('Please provide feedback');
      return;
    }

    // Partner validates essay
    const validatedEssay = {
      ...essayToValidate,
      validatedByPartner: true
    };

    setSubmittedEssays(submittedEssays.map(e => e.id === essayToValidate.id ? validatedEssay : e));
    
    const msg = {
      author: 'You',
      text: `Thanks for the feedback! "${essayToValidate.title}" looks great.`,
      time: 'Just now',
      isPartner: false
    };
    setPartnerMessages([...partnerMessages, msg]);

    alert('✅ Your partner approved!\n\nYou can now choose to share this essay with the community.');
    setEssayToValidate(null);
    setPartnerValidationFeedback('');
  };

  const handleSharePublicly = (essayId) => {
    if (!outcomePublic.includes(essayId)) {
      setOutcomePublic([...outcomePublic, essayId]);
      alert('✅ Essay shared to community gallery!\n\nOthers can now see, like, and comment on your work.');
    }
  };

  const handleAddPartnerMessage = () => {
    if (newPartnerMessage.trim()) {
      const msg = {
        author: 'You',
        text: newPartnerMessage,
        time: 'Just now',
        isPartner: false
      };
      setPartnerMessages([...partnerMessages, msg]);
      setNewPartnerMessage('');

      // Simulate partner response
      setTimeout(() => {
        const responses = [
          "That's great insight!",
          "I totally agree with you on that.",
          "Have you thought about...?",
          "This reminds me of something I read recently.",
          "Keep up the great work!"
        ];
        const response = {
          author: accountabilityPartner.name,
          text: responses[Math.floor(Math.random() * responses.length)],
          time: 'Just now',
          isPartner: true
        };
        setPartnerMessages(prev => [...prev, response]);
      }, 1000);
    }
  };

  const handleLike = (essayId) => {
    if (likedEssays.includes(essayId)) {
      setLikedEssays(likedEssays.filter(id => id !== essayId));
    } else {
      setLikedEssays([...likedEssays, essayId]);
    }
  };

  const handleAddComment = (essayId) => {
    if (newComment.trim()) {
      const essayComments = comments[essayId] || [];
      setComments({
        ...comments,
        [essayId]: [...essayComments, { text: newComment, author: 'You', time: 'Just now' }]
      });
      setNewComment('');
    }
  };

  const isEnrolled = (challengeId) => enrolled.includes(challengeId);
  const enrolledChallenges = challenges.filter(c => enrolled.includes(c.id));

  return (
    <div className="min-h-screen bg-white">
      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-8 relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4">
              <X className="w-6 h-6 text-gray-400" />
            </button>
            
            <h2 className="text-3xl font-serif text-gray-900 mb-6">
              {authMode === 'login' ? 'Welcome Back' : 'Join the Academy'}
            </h2>

            <form onSubmit={handleLogin} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-gray-900"
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-gray-900"
                  required
                />
              </div>

              <button type="submit" className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-sm text-gray-600"
              >
                {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-gray-900" />
              <h1 className="text-2xl font-serif text-gray-900">Academy of Curiosity</h1>
            </div>
            <nav className="flex items-center space-x-8">
              <button
                onClick={() => { setActiveTab('home'); setSelectedChallenge(null); setSelectedEssay(null); }}
                className={`text-sm ${activeTab === 'home' ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Challenges
              </button>
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => { setActiveTab('enrolled'); setSelectedChallenge(null); }}
                    className={`text-sm ${activeTab === 'enrolled' ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    My Learning
                  </button>
                  <button
                    onClick={() => { setActiveTab('community'); setSelectedEssay(null); }}
                    className={`text-sm ${activeTab === 'community' || activeTab === 'reading' ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Community
                  </button>
                  <button
                    onClick={() => setActiveTab('write')}
                    className={`text-sm ${activeTab === 'write' ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Write
                  </button>
                  <button
                    onClick={() => setActiveTab('partner')}
                    className={`text-sm ${activeTab === 'partner' ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Partner
                  </button>
                  <button
                    onClick={() => setActiveTab('portfolio')}
                    className={`text-sm ${activeTab === 'portfolio' ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Portfolio
                  </button>
                </>
              )}
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-4 ml-4 pl-4 border-l">
                  <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {currentUser?.name.charAt(0).toUpperCase()}
                  </div>
                  <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-gray-900">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="px-5 py-2 bg-gray-900 text-white text-sm rounded-full">
                  Sign In
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Home Tab */}
        {activeTab === 'home' && !selectedChallenge && (
          <>
            <div className="mb-16">
              <h2 className="text-5xl font-serif text-gray-900 mb-6 leading-tight">
                Learn, write, and grow with a community of curious minds.
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
                Join challenges to write essays on philosophy, economics, and psychology. 
                Learn practical skills like cooking and photography. Get matched with an accountability partner. 
                Share your work and get feedback from the community.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-8 mb-16 pb-16 border-b border-gray-200">
              <div>
                <div className="text-4xl font-bold text-gray-900 mb-2">5,809</div>
                <div className="text-sm text-gray-600">Active Learners</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-gray-900 mb-2">89%</div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-gray-900 mb-2">12,450</div>
                <div className="text-sm text-gray-600">Essays & Projects</div>
              </div>
            </div>

            <div className="mb-12">
              <h3 className="text-3xl font-serif text-gray-900 mb-8">Available Challenges</h3>
              <div className="space-y-12">
                {challenges.map((challenge) => (
                  <article key={challenge.id} className="border-b border-gray-200 pb-12 last:border-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                            {challenge.type === 'essay' ? '✍️ Essay' : '🎯 Skill'}
                          </span>
                          <span className="text-xs font-medium text-gray-900 uppercase tracking-wide">
                            {challenge.category}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600">{challenge.duration}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600">{challenge.difficulty}</span>
                        </div>
                        <h4 
                          className="text-2xl font-serif text-gray-900 mb-4 hover:text-gray-700 cursor-pointer"
                          onClick={() => setSelectedChallenge(challenge)}
                        >
                          {challenge.title}
                        </h4>
                        <p className="text-gray-600 text-lg leading-relaxed mb-4">
                          {challenge.description}
                        </p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>{challenge.participants.toLocaleString()} learning</span>
                          </div>
                          {challenge.type === 'skill' && challenge.outcome && (
                            <div className="flex items-center space-x-2">
                              <Award className="w-4 h-4" />
                              <span>Create: {challenge.outcome}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setSelectedChallenge(challenge)}
                        className="text-sm text-gray-900 hover:text-gray-600 flex items-center space-x-2"
                      >
                        <span>View details</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      {!isEnrolled(challenge.id) && (
                        <button
                          onClick={() => handleEnroll(challenge.id)}
                          className="ml-auto px-6 py-2 bg-gray-900 text-white text-sm rounded-full hover:bg-gray-800 transition"
                        >
                          Start
                        </button>
                      )}
                      {isEnrolled(challenge.id) && (
                        <div className="ml-auto flex items-center space-x-2 text-green-600 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span>In Progress</span>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Challenge Detail */}
        {selectedChallenge && activeTab === 'home' && (
          <div>
            <button
              onClick={() => setSelectedChallenge(null)}
              className="text-sm text-gray-600 hover:text-gray-900 mb-8"
            >
              ← Back to challenges
            </button>
            <article>
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    {selectedChallenge.type === 'essay' ? '✍️ Essay' : '🎯 Skill'}
                  </span>
                  <span className="text-xs font-medium text-gray-900 uppercase tracking-wide">
                    {selectedChallenge.category || 'Learning'}
                  </span>
                </div>
                <h2 className="text-5xl font-serif text-gray-900 mb-6 leading-tight">
                  {selectedChallenge.title}
                </h2>
                <div className="flex items-center space-x-6 text-sm text-gray-600 mb-8">
                  {selectedChallenge.participants && (
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>{(selectedChallenge.participants || 0).toLocaleString()} learning</span>
                    </div>
                  )}
                  {selectedChallenge.duration && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{selectedChallenge.duration}</span>
                    </div>
                  )}
                  {selectedChallenge.difficulty && (
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4" />
                      <span>{selectedChallenge.difficulty}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="prose prose-lg max-w-none mb-12">
                <p className="text-xl text-gray-700 leading-relaxed mb-8">
                  {selectedChallenge.description || 'Join this learning challenge'}
                </p>
                
                {selectedChallenge.tasks && selectedChallenge.tasks.length > 0 && (
                  <>
                    <h3 className="text-2xl font-serif text-gray-900 mb-6 mt-12">What You'll Do</h3>
                    <div className="space-y-4 mb-12">
                      {selectedChallenge.tasks.map((task, idx) => (
                        <div key={idx} className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                          <span className="text-gray-700 text-lg">{typeof task === 'string' ? task : task.name || task}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {selectedChallenge.type === 'skill' && selectedChallenge.resources && (
                  <>
                    <h3 className="text-2xl font-serif text-gray-900 mb-6">Learning Resources</h3>
                    <div className="space-y-3 mb-12">
                      {selectedChallenge.resources.map((resource, idx) => (
                        <div key={idx} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl">📚</div>
                          <div>
                            <div className="font-medium text-gray-900">{resource.title}</div>
                            <div className="text-sm text-gray-600 capitalize">{resource.type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {selectedChallenge.type === 'essay' && selectedChallenge.weeks && (
                  <>
                    <h3 className="text-2xl font-serif text-gray-900 mb-6">Sample Prompts</h3>
                    <div className="space-y-4 mb-12">
                      {selectedChallenge.weeks.map((week) => (
                        <div key={week.week} className="border border-gray-200 rounded-lg p-6">
                          <div className="text-sm font-medium text-gray-900 mb-2">Week {week.week}: {week.title}</div>
                          <p className="text-gray-600 italic">{week.prompt}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <h3 className="text-2xl font-serif text-gray-900 mb-6">How It Works</h3>
                <div className="bg-gray-50 p-8 rounded-lg mb-8 space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">1️⃣</div>
                    <div>
                      <div className="font-semibold text-gray-900">Get matched with an accountability partner</div>
                      <div className="text-gray-600">Someone with similar interests to support you</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">2️⃣</div>
                    <div>
                      <div className="font-semibold text-gray-900">Create your work</div>
                      <div className="text-gray-600">Write essays or complete your skill project at your own pace</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">3️⃣</div>
                    <div>
                      <div className="font-semibold text-gray-900">Share with your partner (private)</div>
                      <div className="text-gray-600">Get feedback and validation before going public</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">4️⃣</div>
                    <div>
                      <div className="font-semibold text-gray-900">Share publicly (optional)</div>
                      <div className="text-gray-600">Get likes, comments, and inspire others in the community</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-8">
                {!isEnrolled(selectedChallenge.id) ? (
                  <button
                    onClick={() => handleEnroll(selectedChallenge.id)}
                    className="px-8 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition text-base"
                  >
                    Start This Challenge
                  </button>
                ) : (
                  <div className="flex items-center space-x-3 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-lg">You're enrolled! Your partner is {accountabilityPartner?.name}</span>
                  </div>
                )}
              </div>
            </article>
          </div>
        )}

        {/* My Learning Tab */}
       {/* My Learning Tab */}
        {activeTab === 'enrolled' && !viewingWeek && (
          <div>
            <h2 className="text-4xl font-serif text-gray-900 mb-8">My Learning Journey</h2>
            {enrolledChallenges.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-600 mb-8">You haven't enrolled in any challenges yet.</p>
                <button
                  onClick={() => setActiveTab('home')}
                  className="px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition"
                >
                  Browse Challenges
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {enrolledChallenges.map((challenge) => (
                  <div key={challenge.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="p-8">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <span className="text-xs font-medium text-gray-900 uppercase tracking-wide">
                            {challenge.category}
                          </span>
                          <h3 className="text-2xl font-serif text-gray-900 mt-2 mb-3">
                            {challenge.title}
                          </h3>
                          <p className="text-gray-600 mb-4">{challenge.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Started {challenge.startDate}</span>
                            <span>•</span>
                            <span>{challenge.duration}</span>
                          </div>
                        </div>
                        <Trophy className="w-8 h-8 text-yellow-500" />
                      </div>
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-gray-600">Progress: Week 1 of {challenge.weeks.length}</span>
                          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-900" style={{ width: '25%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Weekly Schedule</h4>
                      <div className="space-y-2">
                        {challenge.weeks.map((week) => (
                          <button
                            key={week.week}
                            onClick={() => setViewingWeek({ challenge, week })}
                            className="w-full text-left p-4 bg-white rounded-lg hover:shadow-md transition border border-gray-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-1">
                                  <span className="text-sm font-medium text-gray-900">Week {week.week}</span>
                                  {week.week === 1 && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>}
                                  {week.essays > 0 && <span className="text-xs text-gray-500">{week.essays} essays submitted</span>}
                                </div>
                                <div className="text-sm text-gray-700">{week.title}</div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Week Detail View */}
        {viewingWeek && activeTab === 'enrolled' && (
          <div>
            <button
              onClick={() => setViewingWeek(null)}
              className="text-sm text-gray-600 hover:text-gray-900 mb-8"
            >
              ← Back to my learning
            </button>
            <div className="mb-8">
              <div className="text-xs font-medium text-gray-900 uppercase tracking-wide mb-2">
                {viewingWeek.challenge.category} • Week {viewingWeek.week.week} of {viewingWeek.challenge.weeks.length}
              </div>
              <h2 className="text-4xl font-serif text-gray-900 mb-4">{viewingWeek.week.title}</h2>
              <div className="text-sm text-gray-600 mb-6">Due {viewingWeek.week.dueDate}</div>
            </div>

            <div className="border border-gray-200 rounded-lg p-8 mb-8 bg-gray-50">
              <div className="flex items-start space-x-3 mb-4">
                <FileText className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">This Week's Prompt</h3>
                  <p className="text-gray-700 text-lg italic leading-relaxed">{viewingWeek.week.prompt}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <button
                onClick={() => setActiveTab('write')}
                className="p-6 border-2 border-gray-900 rounded-lg hover:bg-gray-50 transition text-left"
              >
                <PenTool className="w-6 h-6 text-gray-900 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Write Your Essay</h3>
                <p className="text-sm text-gray-600">Start working on your response to this week's prompt.</p>
              </button>
              <button
                onClick={() => setActiveTab('community')}
                className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition text-left"
              >
                <Users className="w-6 h-6 text-gray-600 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Read Community Essays</h3>
                <p className="text-sm text-gray-600">{viewingWeek.week.essays} essays from fellow learners.</p>
              </button>
            </div>

            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-xl font-serif text-gray-900 mb-6">Learning Resources</h3>
              <p className="text-gray-600 mb-6">Curated materials to deepen your understanding of this week's topic.</p>
              
              {viewingWeek.challenge.id === 1 && viewingWeek.week.week === 1 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <BookOpen className="w-5 h-5 text-blue-700 mt-1" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-blue-900 mb-2">Essential Reading</div>
                        <div className="text-sm text-blue-800 mb-1 font-medium">Meditations by Marcus Aurelius (Book 2-4)</div>
                        <p className="text-sm text-blue-700">Focus on passages about accepting what we cannot control. Gregory Hays translation recommended for modern readers.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border-l-4 border-purple-500 p-5 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-purple-700 mt-1" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-purple-900 mb-2">Article</div>
                        <div className="text-sm text-purple-800 mb-1 font-medium">"The Stoic Philosophy of Marcus Aurelius" - Stanford Encyclopedia</div>
                        <p className="text-sm text-purple-700">Academic overview of Marcus Aurelius's philosophical framework and the dichotomy of control.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <Users className="w-5 h-5 text-green-700 mt-1" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-green-900 mb-2">Practical Exercise</div>
                        <div className="text-sm text-green-800 mb-1 font-medium">Daily Stoic Practice: Morning Preparation</div>
                        <p className="text-sm text-green-700">Each morning, identify three things outside your control that might frustrate you today. Practice accepting them in advance.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <Award className="w-5 h-5 text-amber-700 mt-1" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-amber-900 mb-2">Optional Deep Dive</div>
                        <div className="text-sm text-amber-800 mb-1 font-medium">"10 Excerpts from Meditations" - Big Think</div>
                        <p className="text-sm text-amber-700">Accessible analysis of key Stoic concepts with modern applications and real-world examples.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {viewingWeek.challenge.id === 2 && viewingWeek.week.week === 1 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <BookOpen className="w-5 h-5 text-blue-700 mt-1" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-blue-900 mb-2">Essential Reading</div>
                        <div className="text-sm text-blue-800 mb-1 font-medium">Creative Nonfiction Elements</div>
                        <p className="text-sm text-blue-700">Focus on sensory details, scene-setting, and emotional truth. Study how Lee Gutkind defines "creative nonfiction" as factual writing with literary techniques.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border-l-4 border-purple-500 p-5 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-purple-700 mt-1" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-purple-900 mb-2">Craft Resource</div>
                        <div className="text-sm text-purple-800 mb-1 font-medium">Show Don't Tell Technique</div>
                        <p className="text-sm text-purple-700">Learn to use concrete details and action rather than abstract statements. Transform "I was nervous" into visceral descriptions.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <PenTool className="w-5 h-5 text-green-700 mt-1" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-green-900 mb-2">Writing Exercise</div>
                        <div className="text-sm text-green-800 mb-1 font-medium">Five Senses Inventory</div>
                        <p className="text-sm text-green-700">Before writing your essay, list what you saw, heard, smelled, tasted, and touched during your chosen moment. Use these as building blocks.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <Star className="w-5 h-5 text-amber-700 mt-1" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-amber-900 mb-2">Mentor Texts</div>
                        <div className="text-sm text-amber-800 mb-1 font-medium">Read: "The Fourth State of Matter" by Jo Ann Beard</div>
                        <p className="text-sm text-amber-700">Masterful example of weaving personal narrative with sensory details and emotional resonance. Notice her use of present tense.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(!viewingWeek.challenge.id || (viewingWeek.challenge.id !== 1 && viewingWeek.challenge.id !== 2)) && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <BookOpen className="w-5 h-5 text-blue-700 mt-1" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-blue-900 mb-2">Essential Reading</div>
                        <div className="text-sm text-blue-800 mb-1 font-medium">Core concepts for this week's assignment</div>
                        <p className="text-sm text-blue-700">Primary texts and foundational materials to support your learning.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border-l-4 border-purple-500 p-5 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-purple-700 mt-1" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-purple-900 mb-2">Supplementary Article</div>
                        <div className="text-sm text-purple-800 mb-1 font-medium">Additional context and perspectives</div>
                        <p className="text-sm text-purple-700">Deepen your understanding with contemporary analysis and research.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Community Tab */}
        {activeTab === 'community' && !selectedEssay && (
          <div>
            <div className="mb-12">
              <h2 className="text-4xl font-serif text-gray-900 mb-4">Community Outcomes</h2>
              <p className="text-lg text-gray-600">See what others have created and shared. Get inspired.</p>
            </div>

            <div className="space-y-12">
              {[...communityEssays, ...submittedEssays.filter(e => outcomePublic.includes(e.id))].map((essay) => {
                const fullText = essay.fullText || essay.content || '';
                const readTime = essay.readTime || (fullText ? Math.ceil(fullText.split(' ').length / 200) + ' min read' : '5 min read');
                const views = essay.views || 0;
                const excerpt = essay.excerpt || (fullText ? fullText.substring(0, 150) : 'No content');
                return (
                  <article key={essay.id} className="border border-gray-200 rounded-lg p-8 hover:shadow-md transition">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {essay.author.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{essay.author}</div>
                        <div className="text-xs text-gray-500">{essay.publishedDate}</div>
                      </div>
                      {essay.validatedByPartner && (
                        <div className="ml-auto flex items-center space-x-1 text-green-600 text-xs font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          <span>Partner Approved</span>
                        </div>
                      )}
                    </div>
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">{essay.challenge}</div>
                      <h3 
                        className="text-2xl font-serif text-gray-900 mb-3 hover:text-gray-700 cursor-pointer"
                        onClick={() => setSelectedEssay(essay)}
                      >
                        {essay.title}
                      </h3>
                      <p className="text-gray-600 text-lg leading-relaxed">{excerpt}</p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <span>{readTime}</span>
                        <div className="flex items-center space-x-2">
                          <Eye className="w-4 h-4" />
                          <span>{views}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Heart className="w-4 h-4" />
                          <span>{essay.likes}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedEssay(essay)}
                        className="text-sm text-gray-900 hover:text-gray-600 font-medium"
                      >
                        Read →
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* Write Tab */}
        {activeTab === 'write' && (
          <div>
            <h2 className="text-4xl font-serif text-gray-900 mb-8">Create Your Work</h2>
            <div className="max-w-4xl mx-auto">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-8 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your Work (Private to {accountabilityPartner?.name})</h3>
                  <p className="text-sm text-gray-600">Write your essay or document your project. Your accountability partner will review it before you share publicly.</p>
                </div>
                <div className="p-8">
                  <input
                    type="text"
                    value={essayDraft.title}
                    onChange={(e) => setEssayDraft({ ...essayDraft, title: e.target.value })}
                    placeholder="Your title..."
                    className="w-full text-3xl font-serif text-gray-900 mb-6 outline-none placeholder-gray-400 pb-4 border-b border-gray-200"
                  />
                  <textarea
                    value={essayDraft.content}
                    onChange={(e) => setEssayDraft({ ...essayDraft, content: e.target.value })}
                    placeholder="Write your essay or reflection..."
                    className="w-full h-96 text-lg text-gray-700 outline-none resize-none placeholder-gray-400 leading-relaxed"
                  />
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center space-x-3 text-sm text-gray-500">
                      <span>{essayDraft.content.split(' ').length} words</span>
                    </div>
                    <button 
                      onClick={handlePublishEssay}
                      className="px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition font-medium"
                    >
                      Send to {accountabilityPartner?.name}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">💡</div>
                  <div>
                    <div className="font-semibold text-blue-900 mb-1">How this works</div>
                    <div className="text-sm text-blue-800">
                      Your work is private to you and {accountabilityPartner?.name}. They'll give you feedback and validate your work. 
                      Once approved, you can choose to share it publicly with the community.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Accountability Partner Tab */}
        {activeTab === 'partner' && (
          <div>
            <h2 className="text-4xl font-serif text-gray-900 mb-8">Your Accountability Partner</h2>
            
            {accountabilityPartner ? (
              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2">
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="p-8 bg-gradient-to-r from-green-50 to-transparent border-b border-gray-200">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                          {accountabilityPartner.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-2xl font-serif text-gray-900">{accountabilityPartner.name}</h3>
                          <p className="text-gray-600">{accountabilityPartner.completed} challenges completed • {accountabilityPartner.streak}-day streak 🔥</p>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="p-8 h-96 overflow-y-auto bg-gray-50">
                      <div className="space-y-4">
                        {partnerMessages.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.isPartner ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.isPartner ? 'bg-white text-gray-900 border border-gray-200' : 'bg-gray-900 text-white'}`}>
                              <p className="text-sm">{msg.text}</p>
                              <div className={`text-xs mt-1 ${msg.isPartner ? 'text-gray-500' : 'text-gray-400'}`}>{msg.time}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-gray-200 bg-white">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newPartnerMessage}
                          onChange={(e) => setNewPartnerMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddPartnerMessage()}
                          placeholder="Say something..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900"
                        />
                        <button
                          onClick={handleAddPartnerMessage}
                          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Essay Validation */}
                  {essayToValidate && (
                    <div className="mt-8 border-2 border-blue-300 rounded-lg p-8 bg-blue-50">
                      <h3 className="text-xl font-serif text-gray-900 mb-4">Review {currentUser?.name}'s Work</h3>
                      <div className="mb-6 p-4 bg-white rounded border border-gray-200">
                        <div className="text-sm font-medium text-gray-600 mb-2">Title</div>
                        <div className="text-lg font-serif text-gray-900">{essayToValidate.title}</div>
                      </div>
                      <textarea
                        value={partnerValidationFeedback}
                        onChange={(e) => setPartnerValidationFeedback(e.target.value)}
                        placeholder="Give supportive feedback..."
                        className="w-full h-24 p-4 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:border-gray-900 mb-4"
                      />
                      <div className="flex space-x-3">
                        <button
                          onClick={handlePartnerValidation}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                        >
                          ✅ Approve & Send Feedback
                        </button>
                        <button
                          onClick={() => setEssayToValidate(null)}
                          className="px-6 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Partner Stats */}
                <div>
                  <div className="border border-gray-200 rounded-lg p-6 sticky top-24">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Your Partnership</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide mb-2">Interests</div>
                        <div className="flex flex-wrap gap-2">
                          {accountabilityPartner.interests.map(interest => (
                            <span key={interest} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-600 uppercase tracking-wide mb-2">Stats</div>
                        <div className="space-y-2 text-sm text-gray-700">
                          <div>✅ {accountabilityPartner.completed} challenges completed</div>
                          <div>🔥 {accountabilityPartner.streak}-day streak</div>
                          <div>💬 Supportive & engaged</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-600 mb-8">Start learning to get matched with a partner!</p>
              </div>
            )}
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div>
            <div className="mb-12">
              <h2 className="text-4xl font-serif text-gray-900 mb-4">Your Portfolio</h2>
              <p className="text-lg text-gray-600">Your work, validated by your partner, shared with the community.</p>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-12">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="text-2xl font-bold text-gray-900">{submittedEssays.length}</span>
                </div>
                <div className="text-sm text-gray-600">Essays Created</div>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Share2 className="w-5 h-5 text-blue-500" />
                  <span className="text-2xl font-bold text-gray-900">{outcomePublic.length}</span>
                </div>
                <div className="text-sm text-gray-600">Shared Publicly</div>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="text-2xl font-bold text-gray-900">{enrolled.length}</span>
                </div>
                <div className="text-sm text-gray-600">Challenges Active</div>
              </div>
            </div>

            {submittedEssays.length === 0 ? (
              <div className="text-center py-16 border border-gray-200 rounded-lg">
                <PenTool className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-600 mb-8">Start a challenge to create your first piece.</p>
                <button
                  onClick={() => setActiveTab('write')}
                  className="px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition"
                >
                  Create Your First Work
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-2xl font-serif text-gray-900">Your Work</h3>
                {submittedEssays.map((essay, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-xl font-serif text-gray-900">{essay.title}</h4>
                          {essay.validatedByPartner && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Approved</span>
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2">{essay.excerpt}</p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Created: {essay.publishedDate}</div>
                          <div>Challenge: {essay.challenge}</div>
                        </div>
                      </div>
                      {essay.validatedByPartner && !outcomePublic.includes(essay.id) && (
                        <button
                          onClick={() => handleSharePublicly(essay.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium ml-4"
                        >
                          Share Publicly
                        </button>
                      )}
                      {outcomePublic.includes(essay.id) && (
                        <div className="ml-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center space-x-1">
                          <Share2 className="w-4 h-4" />
                          <span>Shared</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}