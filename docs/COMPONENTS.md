# 🧩 Component Documentation

This document provides comprehensive documentation for all React components in the Early Autism Detector application.

## Component Architecture

The application follows a modular component architecture with the following structure:

```
src/components/
├── ui/              # Reusable UI components (buttons, cards, etc.)
├── auth/            # Authentication-related components
├── dashboard/       # Dashboard navigation and layout
├── assessment/      # M-CHAT-R assessment components
├── progress/        # Progress tracking and history
├── locator/         # Autism center locator
├── map/             # Map-related components
├── chat/            # AI chat interface
└── questionnaire/   # Questionnaire and results
```

## UI Components

### Button
**Path**: `src/components/ui/button.tsx`

A versatile button component with multiple variants and sizes.

**Props**:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}
```

**Usage**:
```tsx
<Button variant="primary" size="lg">
  Click me
</Button>
```

### Card
**Path**: `src/components/ui/card.tsx`

Container component for grouping related content.

**Props**:
```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}
```

**Usage**:
```tsx
<Card className="p-6">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>
```

## Authentication Components

### LoginForm
**Path**: `src/components/auth/login-form.tsx`

Handles user authentication with email and password.

**Props**: None (self-contained)

**Features**:
- Email/password validation
- Loading states
- Error handling
- Automatic redirect on success

**Usage**:
```tsx
<LoginForm />
```

### SignUpForm
**Path**: `src/components/auth/signup-form.tsx`

Handles user registration with email verification.

**Props**: None (self-contained)

**Features**:
- Email/password validation
- Password confirmation
- Email verification flow
- Error handling

**Usage**:
```tsx
<SignUpForm />
```

## Dashboard Components

### DashboardNav
**Path**: `src/components/dashboard/nav.tsx`

Main navigation component for the dashboard.

**Props**:
```typescript
interface DashboardNavProps {
  user: User
}
```

**Features**:
- Responsive navigation
- Active route highlighting
- User profile dropdown
- Logout functionality

**Usage**:
```tsx
<DashboardNav user={session.user} />
```

## Assessment Components

### QuestionForm
**Path**: `src/components/assessment/question-form.tsx`

Renders M-CHAT-R assessment questions with progress tracking.

**Props**:
```typescript
interface QuestionFormProps {
  questions: Question[]
  assessmentId: string
  onComplete: (score: number) => void
}
```

**Features**:
- Question navigation
- Progress indicator
- Response validation
- Score calculation

**Usage**:
```tsx
<QuestionForm 
  questions={mchatQuestions}
  assessmentId="assessment-id"
  onComplete={handleComplete}
/>
```

## Progress Components

### ProgressDashboard
**Path**: `src/components/progress/progress-dashboard.tsx`

Comprehensive progress tracking dashboard for child development.

**Props**:
```typescript
interface ProgressDashboardProps {
  childId: string
}
```

**Features**:
- Assessment history visualization
- Milestone tracking
- Progress charts
- Intervention tracking
- Notes management

**Usage**:
```tsx
<ProgressDashboard childId="child-uuid" />
```

### AssessmentHistory
**Path**: `src/components/progress/assessment-history.tsx`

Displays historical assessment results with trends.

**Props**:
```typescript
interface AssessmentHistoryProps {
  childId: string
}
```

**Features**:
- Timeline view
- Score trends
- Risk level indicators
- Assessment comparison

**Usage**:
```tsx
<AssessmentHistory childId="child-uuid" />
```

## Questionnaire Components

### ResultsView
**Path**: `src/components/questionnaire/results-view.tsx`

Displays M-CHAT-R assessment results with recommendations.

**Props**:
```typescript
interface ResultsViewProps {
  score: number
  interpretation: string
  riskLevel: 'Low Risk' | 'Medium Risk' | 'High Risk'
  onClose?: () => void
}
```

**Features**:
- Risk level visualization
- Detailed interpretation
- Recommended actions
- Center locator integration

**Usage**:
```tsx
<ResultsView 
  score={75}
  interpretation="Assessment interpretation"
  riskLevel="Medium Risk"
  onClose={handleClose}
/>
```

## Map Components

### LocationDetector
**Path**: `src/components/map/location-detector.tsx`

Detects user's current location for map functionality.

**Props**:
```typescript
interface LocationDetectorProps {
  onLocationFound?: (position: [number, number]) => void
  onLocationError?: (error: GeolocationPositionError) => void
}
```

**Features**:
- GPS location detection
- Accuracy visualization
- Error handling
- Permission management

**Usage**:
```tsx
<LocationDetector 
  onLocationFound={handleLocationFound}
  onLocationError={handleLocationError}
/>
```

## Chat Components

### ChatInterface
**Path**: `src/components/chat/chat-interface.tsx`

AI-powered chat interface for autism-related questions.

**Props**: None (self-contained)

**Features**:
- Real-time messaging
- Suggested questions
- Chat history
- Message persistence

**Usage**:
```tsx
<ChatInterface />
```

## Locator Components

### AutismCenterMap
**Path**: `src/components/locator/autism-center-map.tsx`

Interactive map displaying nearby autism centers.

**Props**:
```typescript
interface AutismCenterMapProps {
  centers: AutismCenter[]
  userLocation?: [number, number]
  onCenterSelect?: (center: AutismCenter) => void
}
```

**Features**:
- Interactive markers
- Center filtering
- Distance calculation
- Directions integration

**Usage**:
```tsx
<AutismCenterMap 
  centers={nearbyCenter}
  userLocation={[lat, lng]}
  onCenterSelect={handleCenterSelect}
/>
```

## Component Patterns

### Loading States
Most components implement consistent loading patterns:

```tsx
if (loading) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}
```

### Error Handling
Components use consistent error display patterns:

```tsx
if (error) {
  return (
    <div className="text-center py-8">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <p className="text-red-600">{error}</p>
    </div>
  )
}
```

### Form Validation
Forms implement client-side validation with user feedback:

```tsx
const [errors, setErrors] = useState<Record<string, string>>({})

const validateForm = () => {
  const newErrors: Record<string, string> = {}
  
  if (!email) newErrors.email = 'Email is required'
  if (!password) newErrors.password = 'Password is required'
  
  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}
```

## Styling Guidelines

### Tailwind CSS Classes
Components use consistent Tailwind CSS patterns:

- **Spacing**: `p-4`, `m-2`, `space-y-4`
- **Colors**: `bg-blue-600`, `text-gray-700`, `border-gray-300`
- **Typography**: `text-lg`, `font-semibold`, `leading-6`
- **Layout**: `flex`, `grid`, `items-center`, `justify-between`

### Responsive Design
All components are mobile-first responsive:

```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Content */}
</div>
```

## Accessibility

### ARIA Labels
Components include proper ARIA attributes:

```tsx
<button 
  aria-label="Close dialog"
  aria-expanded={isOpen}
  role="button"
>
  Close
</button>
```

### Keyboard Navigation
Interactive components support keyboard navigation:

```tsx
<div 
  tabIndex={0}
  onKeyDown={handleKeyDown}
  role="button"
>
  Interactive element
</div>
```

## Testing

### Component Testing
Components are designed for easy testing:

```tsx
// Example test structure
describe('Button Component', () => {
  it('renders with correct variant', () => {
    render(<Button variant="primary">Test</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-primary')
  })
})
```

### Props Validation
TypeScript interfaces ensure type safety:

```typescript
interface ComponentProps {
  required: string
  optional?: number
  callback: (data: any) => void
}
```
