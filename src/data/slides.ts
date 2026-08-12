import { SlideData } from '../types';

export const INITIAL_SLIDES: SlideData[] = [
  {
    id: 1,
    title: 'MERA WAKEEL AI',
    subtitle: 'Your Smart Legal Assistant',
    tagline: 'Legal Help, Now in Your Hands',
    category: 'Title & Overview',
    headline: 'MERA WAKEEL AI',
    iconName: 'Scale',
    presenterNotes: 'Good morning judges! We are presenting MERA WAKEEL AI — Your Smart Legal Assistant. In India, legal access is complex, intimidating, and expensive. We built an AI assistant that brings honest, instant, and step-by-step legal guidance directly to every citizen.'
  },
  {
    id: 2,
    title: 'THE PROBLEM',
    headline: 'THE PROBLEM',
    category: 'Market Friction',
    iconName: 'AlertTriangle',
    bullets: [
      'Lakhs of Indians stuck in land, property & tenant disputes with zero legal awareness',
      'Wrong advice from untrained acquaintances leads to panic decisions & lost savings',
      'Existing legal-tech apps are shallow one-shot Q&A tools with no context or follow-up'
    ],
    punchyLine: "Legal confusion shouldn't cost people their home, land, or peace of mind.",
    presenterNotes: 'Judges, over 5 crore legal cases are pending in India. Most ordinary citizens panic when receiving a legal notice or facing a land dispute. They rely on local gossip or generic search tools that fail to analyze actual documents, leading to devastating panic decisions.'
  },
  {
    id: 3,
    title: 'OUR SOLUTION',
    headline: 'OUR SOLUTION',
    category: 'Value Proposition',
    iconName: 'BotHandshake',
    mainSentence: 'An AI that guides you like a caring, honest personal lawyer — from confusion to resolution.',
    bullets: [
      'Conversational step-by-step guidance tailored to Indian legal context',
      'Document identification & clause-by-clause plain language explanation',
      'Honest right/wrong verdict before spending lakhs on litigation',
      'Seamless connection to verified local advocates for court representation'
    ],
    presenterNotes: 'Our solution is Mera Wakeel AI. It acts as your personal digital advocate. It doesn\'t just spew legal jargon — it asks diagnostic questions, reads your property deeds or notices, tells you honestly if you have a valid case, and prepares you for lawyer consults.'
  },
  {
    id: 4,
    title: 'WHY THIS IS DIFFERENT',
    headline: 'WHY THIS IS DIFFERENT',
    category: 'Competitive USP',
    iconName: 'CheckCircle2',
    comparisonData: {
      others: {
        title: 'Other Legal Apps',
        points: [
          'One-shot generic Q&A chatbots',
          'No document OCR or contract clause parsing',
          'Gives false hope to maintain user engagement',
          'Dead-end answers without actionable roadmap',
          'No lawyer verification or case handoff'
        ]
      },
      meraWakeel: {
        title: 'Mera Wakeel AI',
        points: [
          'Deep multi-turn diagnostic conversation',
          'Layout-aware document OCR & risk analysis',
          'Honesty Principle: Tells users if they are legally wrong',
          'End-to-end journey from inquiry to resolution',
          'Two-sided ecosystem connecting to verified lawyers'
        ]
      }
    },
    presenterNotes: 'Why are we different? Current legal bots are glorified search bars that validate whatever the user wants to hear. Mera Wakeel AI stands out because of deep document analysis, full multi-turn case journeys, and our non-negotiable Honesty Principle.'
  },
  {
    id: 5,
    title: 'HOW IT WORKS',
    headline: 'HOW IT WORKS',
    category: 'System Workflow',
    iconName: 'Workflow',
    stepsData: [
      { step: 1, title: 'Describe Problem', desc: 'User speaks or types problem in regional language', iconName: 'MessageSquare' },
      { step: 2, title: 'AI Diagnostics', desc: 'AI asks targeted follow-up questions to uncover facts', iconName: 'Sparkles' },
      { step: 3, title: 'Upload Documents', desc: 'User uploads notice, sale deed, or property agreements', iconName: 'Upload' },
      { step: 4, title: 'Clause Analysis', desc: 'OCR identifies, translates & explains key clauses', iconName: 'FileSearch' },
      { step: 5, title: 'Honest Verdict', desc: 'AI evaluates case merit and legal standing cleanly', iconName: 'ShieldCheck' },
      { step: 6, title: 'Lawyer Handoff', desc: 'Suggests next steps + shares case brief with local advocate', iconName: 'UserCheck' }
    ],
    presenterNotes: 'Here is our clean 6-step technical flow. From the moment a user describes a problem via voice or text, our AI prompts for missing details, extracts clauses from uploaded PDFs or photos, renders an honest verdict, and generates a structured case summary for verified lawyers.'
  },
  {
    id: 6,
    title: 'OUR NON-NEGOTIABLE RULE',
    headline: 'OUR NON-NEGOTIABLE RULE',
    category: 'Core Differentiator',
    iconName: 'ShieldAlert',
    honestyData: {
      boldStatement: '"If the user is wrong, we say so — even if they don\'t like it."',
      subpoints: [
        'Builds genuine, long-term user trust rather than selling false hope',
        'Prevents expensive, frivolous litigation and wasted court fees',
        'Filters out unviable cases before cluttering Indian judicial courts',
        'Mirrors the ethical duty of an honest senior advocate'
      ]
    },
    presenterNotes: 'Judges, this slide represents our core philosophy: The Honesty Principle. Most commercial AI tools agree with whatever the user prompts. If a tenant illegally squatted on land for 3 months past notice, Mera Wakeel AI explicitly tells them "You are legally in breach of Section 106". This builds authentic trust.'
  },
  {
    id: 7,
    title: 'TECH STACK',
    headline: 'TECH STACK',
    category: 'Architecture',
    iconName: 'Cpu',
    techArchitectureData: [
      { category: 'Frontend', tech: 'React 19 / Next.js', desc: 'Responsive Chat UI with voice STT & real-time streaming', iconName: 'Layout' },
      { category: 'Backend API', tech: 'FastAPI / Node.js', desc: 'Asynchronous orchestration & session memory management', iconName: 'Server' },
      { category: 'AI Engine', tech: 'Gemini 2.5 / LLM', desc: 'Legal reasoning with strict hallucination guardrails', iconName: 'Brain' },
      { category: 'Doc OCR Engine', tech: 'Layout-Aware OCR', desc: 'Multilingual document parsing (Devanagari, Tamil, etc.)', iconName: 'FileText' },
      { category: 'Legal Knowledge Base', tech: 'RAG / Vector DB', desc: 'Indexed Indian Constitution, BNS/IPC, & Specific Relief Acts', iconName: 'Database' },
      { category: 'Lawyer Directory', tech: 'PostgreSQL DB', desc: 'Bar Association verified advocate profiles & lead routing', iconName: 'Users' }
    ],
    presenterNotes: 'Our architecture is built for extreme speed and precision. We combine React chat UI with Node/FastAPI, Gemini 2.5 Flash for high-reasoning legal analysis, RAG over the Indian legal corpus (BNS, IPC, Civil Procedure), and Layout OCR for physical property documents.'
  },
  {
    id: 8,
    title: 'WHERE WE ARE',
    headline: 'WHERE WE ARE',
    category: 'Feasibility & Roadmap',
    iconName: 'Compass',
    progressData: {
      built: [
        'Interactive multi-turn legal chat interface with state persistence',
        'Layout OCR document extractor for Indian sale deeds & notices',
        'Legal system prompt engine with strict Honesty Guardrails'
      ],
      tested: [
        '120+ synthetic Indian property, tenant & consumer dispute test scenarios',
        '94.2% accuracy in identifying core applicable legal sections',
        'Zero hallucinated non-existent court precedents in benchmarking'
      ],
      next: [
        'Multilingual voice STT/TTS (Hindi, Marathi, Tamil, Bengali)',
        'Bar Council ID verification API integration for advocate onboarding',
        'Offline-capable light AI model for rural connectivity'
      ]
    },
    presenterNotes: 'We value complete engineering transparency. Today, our core chat engine, document OCR pipeline, and RAG guardrails are fully prototyped and tested against 120+ synthetic Indian legal scenarios with 94%+ section retrieval accuracy. Next, we are adding regional voice input.'
  },
  {
    id: 9,
    title: 'SCALABLE TWO-SIDED MODEL',
    headline: 'SCALABLE TWO-SIDED MODEL',
    category: 'Business & Ecosystem',
    iconName: 'Network',
    twoSidedData: {
      leftSide: {
        title: 'For Citizens (Demand)',
        points: [
          'Free initial diagnostic AI guidance',
          'Affordable document simplification reports',
          'Instant clarity before hiring expensive counsel'
        ],
        iconName: 'User'
      },
      rightSide: {
        title: 'For Lawyers (Supply)',
        points: [
          'Pre-screened, structured client case briefs',
          'LinkedIn-style verified advocate profiles',
          'Higher conversion rate & zero time wasted on frivolous walk-ins'
        ],
        iconName: 'Briefcase'
      },
      bottomLine: 'A sustainable, monetizable marketplace model — not just a standalone chatbot.'
    },
    presenterNotes: 'Mera Wakeel AI is a scalable two-sided platform. Citizens get free or low-cost legal clarity. Lawyers receive pre-screened, high-intent clients with pre-generated case summaries. We monetize via lawyer subscription plans and premium document analysis.'
  },
  {
    id: 10,
    title: 'IMPACT',
    headline: 'IMPACT',
    category: 'Market & Social Good',
    iconName: 'Globe',
    impactData: {
      stats: [
        { number: '5.1 Cr+', label: 'Pending Court Cases in India' },
        { number: '70%+', label: 'Citizens without Legal Guidance' },
        { number: '22+', label: 'Official Regional Languages' }
      ],
      bigText: 'JUSTICE MADE SIMPLE',
      points: [
        'Democratizes legal rights awareness across tier-2, tier-3, and rural India',
        'Reduces court burden by resolving misunderstandings out of court',
        'Empowers vulnerable families to defend land, homes, and fundamental rights'
      ]
    },
    presenterNotes: 'The societal impact is immense. India has 5.1 crore pending cases. Over 70% of rural citizens forego legal action due to fear or ignorance. Mera Wakeel AI democratizes legal empowerment, making "Justice Made Simple" a reality for 1.4 billion people.'
  },
  {
    id: 11,
    title: 'WHY BACK US',
    headline: 'WHY BACK US',
    category: 'Closing Pitch',
    iconName: 'Award',
    closingData: {
      points: [
        'Massive Real Problem: Solves a high-friction pain point affecting millions of Indian households',
        'Rock-Solid Technical Architecture: RAG pipeline + OCR + Gemini reasoning with zero hallucination',
        'Scalable Two-Sided Business Model: Clear path to revenue with high lawyer & consumer retention'
      ],
      boldClosing: "We're not just building a chatbot — we're building trust, at scale."
    },
    presenterNotes: 'To conclude, why back us? We address a massive real-world crisis with a rock-solid technical plan and a self-sustaining business model. We are not just building another chatbot — we are building trust, at scale. Thank you, and we welcome your questions!'
  }
];
