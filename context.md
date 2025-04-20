# Autism Early Detection Companion - App Blueprint

## 1. Project Breakdown

**App Name**: Autism Early Detection Companion (AEDCompanion)

**Platform**: Web application (responsive design for all devices)

**Vision & Goals**: AEDCompanion is designed to help parents and caregivers identify potential early signs of autism spectrum disorder (ASD) through a structured questionnaire, provide immediate AI-powered information about autism, and locate nearby diagnostic centers and treatment facilities. The app aims to bridge the gap between initial concerns and professional help by providing reliable resources in a simple, accessible interface.

**Primary Use Case**: 
1. Parents noticing developmental differences in their child (ages 18 months - 5 years)
2. Caregivers wanting to understand autism symptoms better
3. Individuals seeking nearby autism support services

**Authentication Requirements**:
- Email/password signup and login via Supabase Auth
- Session management with JWT tokens
- Password reset functionality
- Role-based access (future expansion for healthcare providers)

## 2. Tech Stack Overview

**Frontend Framework**: 
- React + Next.js (App Router) for SSR and optimized performance
- TypeScript for type safety

**UI Library**: 
- Tailwind CSS for utility-first styling
- ShadCN for accessible, pre-built components (buttons, forms, dialogs)

**Backend (BaaS)**: 
- Supabase for:
  - PostgreSQL database (questionnaire results storage)
  - Authentication (email/password)
  - Storage (future PDF report generation)

**APIs & Services**:
- OpenAI API (GPT-4) for information chatbot
- Google Maps API for location services

**Deployment**: 
- Vercel for CI/CD and hosting

## 3. Core Features

### 1. Welcome Screen
- Clean, calming design with minimal distractions
- Hero section explaining app purpose
- Sign up/login CTAs
- Non-authenticated access to basic information

### 2. Dashboard (Post-Login)
- Three primary action cards:
  1. **Early Signs Questionnaire**
  2. **Autism Information Chat**
  3. **Treatment Center Locator**
- Persistent logout button in header
- User profile quick access

### 3. Early Signs Questionnaire
- 20-30 validated screening questions (M-CHAT inspired)
- Binary (Yes/No) response format
- Progress indicator
- Adaptive questioning based on responses
- Results calculation with:
  - Risk level indicator (low/medium/high)
  - Printable summary
  - Recommended next steps

### 4. Autism Information Chat
- OpenAI-powered chatbot interface
- Pre-trained on reputable autism resources (CDC, Autism Speaks, etc.)
- Response validation to prevent misinformation
- Conversation history
- Suggested questions for new users

### 5. Treatment Center Locator
- Google Maps integration with custom markers
- Geolocation detection (with fallback to manual entry)
- Filter by:
  - Diagnostic centers
  - Therapists
  - Support groups
  - Educational resources
- Directions functionality
- User ratings/reviews (future feature)

## 4. User Flow

1. **Landing Page**
   - New user: Sign up → Email verification → Dashboard
   - Returning user: Login → Dashboard

2. **Dashboard Decisions**:
   - Option A: Questionnaire → Questions → Results → Dashboard
   - Option B: Information Chat → Q&A session → Dashboard
   - Option C: Locator → Map view → Location details → Dashboard

3. **Session End**:
   - Header logout button → Confirm logout → Return to landing

## 5. Design & UI/UX Guidelines

**Color Scheme**:
- Primary: Soft blue (#5D9BFF) - trust, calmness
- Secondary: Warm yellow (#FFD166) - hope, positivity
- Neutral: Cool grays (#F8FAFC to #1E293B)
- Accent: Soft green (#06D6A0) - growth, health

**Typography**:
- Headings: Inter Bold (accessible sans-serif)
- Body: Inter Regular
- Special: Open Dyslexic option in settings

**Key UI Components (ShadCN)**:
- Cards for dashboard options
- Progress stepper for questionnaire
- Custom dialog for results display
- Command menu for chat interface
- Sheet component for location details

**Accessibility**:
- WCAG AA compliance
- Keyboard navigable
- Reduced motion option
- High contrast mode

## 6. Technical Implementation

### Frontend Structure (Next.js)
```
/app
  /(auth)
    /login
    /signup
  /dashboard
    /questionnaire
      /[id] (dynamic questions)
    /chat
    /locator
  /api
    /auth (Supabase handlers)
    /chat (OpenAI proxy)
    /locations (Google Maps)
```

### Supabase Setup
1. Tables:
   - `users` (auth extended profiles)
   - `questionnaire_responses` (user_id, answers, score)
   - `saved_locations` (future feature)

2. Row Level Security:
   - User can only access their own data
   - Public read for location info

### Key Implementation Details

**Questionnaire Flow**:
```tsx
// Dynamic question loading
async function loadQuestion(id: string) {
  const { data } = await supabase
    .from('questions')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

// Score calculation
function calculateScore(answers: boolean[]) {
  const riskFactors = answers.filter(Boolean).length;
  if (riskFactors >= 8) return 'high';
  if (riskFactors >= 4) return 'medium';
  return 'low';
}
```

**AI Chat**:
```tsx
// API route handler
export async function POST(req: Request) {
  const { messages } = await req.json();
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are an autism information specialist...",
      },
      ...messages,
    ],
    temperature: 0.7,
  });
  return NextResponse.json(response.choices[0].message);
}
```

**Location Finder**:
```tsx
// Map component
function LocationMap() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GMAPS_KEY!,
    libraries: ['places'],
  });

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={10}
    >
      <MarkerF position={center} />
    </GoogleMap>
  ) : <Spinner />;
}
```

## 7. Development Setup

### Requirements
- Node.js 18+
- npm 9+
- Supabase account
- Google Cloud project with Maps and Places API enabled
- OpenAI API key

### Setup Instructions
1. Clone repository:
   ```bash
   git clone https://github.com/your-repo/aed-companion.git
   cd aed-companion
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_GMAPS_KEY`

4. Database setup:
   ```bash
   npx supabase login
   npx supabase link --project-ref your-project-ref
   npx supabase gen types typescript --local > lib/database.types.ts
   ```

5. Run dev server:
   ```bash
   npm run dev
   ```

### Deployment
1. Connect GitHub repo to Vercel
2. Set same environment variables
3. Enable automatic deployments on push to main

### Testing
- Jest + React Testing Library for unit tests
- Cypress for E2E flows
- Storybook for UI component development