# Autism Early Detection Companion - App Blueprint

## 1. Project Breakdown

**App Name**: Autism Early Detection Companion (AEDCompanion)

**Platform**: Web application (responsive design for all devices)

**Vision & Goals**: AEDCompanion is designed to help parents and caregivers identify potential signs of autism spectrum disorder (ASD) across different developmental stages through age-appropriate questionnaires. The app provides immediate AI-powered information about autism and helps locate nearby diagnostic centers and treatment facilities. Our goal is to support families throughout their journey, from initial screening to ongoing support, by providing reliable resources in a simple, accessible interface.

**Primary Use Case**: 
1. Parents and caregivers screening children (ages 12 months - 18 years) using age-specific assessment tools
2. Healthcare providers using the platform as a preliminary screening tool
3. Families seeking age-appropriate resources and nearby support services
4. Educational professionals looking for autism screening tools and resources

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
- shadcn/ui for accessible and customizable components

**Authentication & Database**:
- Supabase Auth for user management and session handling
- Supabase PostgreSQL for structured data storage

**Maps & Location Services**:
- Leaflet.js with OpenStreetMap for interactive maps
- Supabase PostGIS for geospatial queries
- ShadCN for accessible, pre-built components (buttons, forms, dialogs)

**Backend (BaaS)**: 
- Supabase for:
  - PostgreSQL database (questionnaire results storage)
  - Authentication (email/password)
  - Storage (future PDF report generation)

**APIs & Services**:
- OpenAI API (GPT-4) for information chatbot
- OpenStreetMap Nominatim API for geocoding

**Deployment & Infrastructure**: 
- Vercel for frontend hosting and CI/CD
- Supabase Cloud for backend infrastructure
- GitHub Actions for automated testing and deployment

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

### 3. Age-Specific Screening Tools
- Multiple validated questionnaires for different age groups:
  - Toddler (12-36 months): M-CHAT-R inspired
  - Preschool (3-5 years): PARS adapted
  - School-age (6-12 years): CAST based
  - Adolescent (13-18 years): AQ inspired
- Adaptive questioning based on age and responses
- Progress indicator with age-appropriate visuals
- Comprehensive results including:
  - Age-normalized risk assessment
  - Developmental milestone tracking
  - Printable summary with age-specific recommendations
  - Customized next steps based on age and risk level

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
   - `children` (user_id, name, date_of_birth, gender)
   - `questionnaires` (age_group, type, version)
   - `questions` (questionnaire_id, text, category, age_group)
   - `assessments` (child_id, questionnaire_id, started_at, completed_at)
   - `responses` (assessment_id, question_id, answer)
   - `scoring_ranges` (questionnaire_id, min_score, max_score, risk_level)
   - `centers` (name, location, services, PostGIS point)

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