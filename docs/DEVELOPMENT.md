# 🛠️ Development Guide

This guide provides comprehensive information for developers working on the Early Autism Detector project.

## Table of Contents
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Development Setup

### Prerequisites
- **Node.js**: 18.0.0 or later
- **npm**: 9.0.0 or later
- **Git**: Latest version
- **VS Code**: Recommended IDE

### Environment Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MiqaSurya/early_autism_detection.git
   cd early_autism_detection
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # AI APIs (optional)
   OPENAI_API_KEY=your_openai_api_key
   
   # Google Maps
   NEXT_PUBLIC_GMAPS_KEY=your_google_maps_api_key
   
   # Optional
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=your_verified_sender_email
   ```

4. **Database setup**:
   ```bash
   # Run database migrations
   npm run db:setup
   
   # Populate sample data
   npm run db:seed
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

### IDE Configuration

#### VS Code Extensions
Install these recommended extensions:
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

#### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

## Project Structure

```
early_autism_detection/
├── docs/                    # Documentation
├── public/                  # Static assets
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Dashboard pages
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── assessment/     # Assessment components
│   │   ├── progress/       # Progress tracking
│   │   ├── locator/        # Center locator
│   │   ├── map/            # Map components
│   │   ├── chat/           # Chat interface
│   │   └── questionnaire/  # Questionnaire components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── middleware.ts       # Next.js middleware
├── supabase/               # Database migrations
├── package.json            # Dependencies and scripts
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── next.config.js          # Next.js configuration
```

## Coding Standards

### TypeScript Guidelines

1. **Use strict TypeScript**:
   ```typescript
   // Good
   interface UserProps {
     id: string
     name: string
     email?: string
   }
   
   // Avoid
   const user: any = {...}
   ```

2. **Define interfaces for props**:
   ```typescript
   interface ButtonProps {
     variant: 'primary' | 'secondary'
     size: 'sm' | 'md' | 'lg'
     children: React.ReactNode
     onClick?: () => void
   }
   ```

3. **Use type guards**:
   ```typescript
   function isValidEmail(email: string): boolean {
     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
   }
   ```

### React Component Guidelines

1. **Use functional components with hooks**:
   ```typescript
   export function MyComponent({ title }: { title: string }) {
     const [count, setCount] = useState(0)
     
     return <div>{title}: {count}</div>
   }
   ```

2. **Extract custom hooks**:
   ```typescript
   function useCounter(initialValue = 0) {
     const [count, setCount] = useState(initialValue)
     
     const increment = () => setCount(c => c + 1)
     const decrement = () => setCount(c => c - 1)
     
     return { count, increment, decrement }
   }
   ```

3. **Use proper error boundaries**:
   ```typescript
   function ErrorFallback({ error }: { error: Error }) {
     return (
       <div role="alert">
         <h2>Something went wrong:</h2>
         <pre>{error.message}</pre>
       </div>
     )
   }
   ```

### CSS and Styling

1. **Use Tailwind CSS classes**:
   ```tsx
   <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
     <h2 className="text-xl font-semibold text-gray-900">Title</h2>
   </div>
   ```

2. **Create reusable component variants**:
   ```typescript
   const buttonVariants = cva(
     "inline-flex items-center justify-center rounded-md font-medium",
     {
       variants: {
         variant: {
           default: "bg-primary text-primary-foreground",
           destructive: "bg-destructive text-destructive-foreground"
         },
         size: {
           default: "h-10 px-4 py-2",
           sm: "h-9 px-3",
           lg: "h-11 px-8"
         }
       }
     }
   )
   ```

### API Development

1. **Use consistent error handling**:
   ```typescript
   export async function POST(request: Request) {
     try {
       const body = await request.json()
       
       // Validation
       if (!body.email) {
         return NextResponse.json(
           { error: 'Email is required' },
           { status: 400 }
         )
       }
       
       // Process request
       const result = await processRequest(body)
       
       return NextResponse.json(result)
     } catch (error) {
       console.error('API Error:', error)
       return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
       )
     }
   }
   ```

2. **Validate input data**:
   ```typescript
   import { z } from 'zod'
   
   const CreateChildSchema = z.object({
     name: z.string().min(1, 'Name is required'),
     dateOfBirth: z.string().datetime(),
     gender: z.enum(['male', 'female', 'other']).optional()
   })
   
   const body = CreateChildSchema.parse(await request.json())
   ```

## Development Workflow

### Git Workflow

1. **Branch naming**:
   - Features: `feature/add-progress-tracking`
   - Bug fixes: `fix/assessment-scoring-bug`
   - Hotfixes: `hotfix/security-patch`

2. **Commit messages**:
   ```
   feat: add progress tracking dashboard
   fix: resolve assessment scoring calculation
   docs: update API documentation
   style: format code with prettier
   refactor: extract common validation logic
   test: add unit tests for scoring algorithm
   ```

3. **Pull request process**:
   - Create feature branch from `main`
   - Make changes with descriptive commits
   - Write/update tests
   - Update documentation
   - Create pull request with description
   - Request code review
   - Address feedback
   - Merge after approval

### Code Review Guidelines

1. **Review checklist**:
   - [ ] Code follows style guidelines
   - [ ] Tests are included and passing
   - [ ] Documentation is updated
   - [ ] No security vulnerabilities
   - [ ] Performance considerations addressed
   - [ ] Accessibility requirements met

2. **Review comments**:
   - Be constructive and specific
   - Suggest improvements with examples
   - Ask questions for clarification
   - Approve when ready

## Testing

### Unit Testing
```typescript
// Example test file: __tests__/scoring.test.ts
import { calculateRiskLevel } from '@/lib/scoring'

describe('calculateRiskLevel', () => {
  it('should return low risk for score 0-2', () => {
    expect(calculateRiskLevel(1)).toBe('low')
    expect(calculateRiskLevel(2)).toBe('low')
  })
  
  it('should return medium risk for score 3-7', () => {
    expect(calculateRiskLevel(5)).toBe('medium')
  })
  
  it('should return high risk for score 8+', () => {
    expect(calculateRiskLevel(10)).toBe('high')
  })
})
```

### Integration Testing
```typescript
// Example API test
import { POST } from '@/app/api/assessments/route'

describe('/api/assessments', () => {
  it('should create new assessment', async () => {
    const request = new Request('http://localhost:3000/api/assessments', {
      method: 'POST',
      body: JSON.stringify({
        childId: 'test-child-id',
        responses: [{ questionId: 'q1', answer: 'yes' }]
      })
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.id).toBeDefined()
  })
})
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test scoring.test.ts
```

## Performance Optimization

### Code Splitting
```typescript
// Lazy load components
const ProgressDashboard = lazy(() => import('@/components/progress/progress-dashboard'))

function ProgressPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProgressDashboard />
    </Suspense>
  )
}
```

### Image Optimization
```typescript
import Image from 'next/image'

<Image
  src="/autism-center.jpg"
  alt="Autism Center"
  width={300}
  height={200}
  priority={false}
  placeholder="blur"
/>
```

### Database Optimization
```typescript
// Use proper indexing
const { data } = await supabase
  .from('assessments')
  .select('id, score, risk_level, completed_at')
  .eq('child_id', childId)
  .order('completed_at', { ascending: false })
  .limit(10)
```

## Security Best Practices

1. **Input validation**:
   ```typescript
   const sanitizedInput = DOMPurify.sanitize(userInput)
   ```

2. **Environment variables**:
   ```typescript
   // Never expose secrets in client-side code
   const apiKey = process.env.OPENAI_API_KEY // Server-side only
   ```

3. **Authentication checks**:
   ```typescript
   const { data: { session } } = await supabase.auth.getSession()
   if (!session) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   }
   ```

## Deployment

### Build Process
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

### Environment-specific Configurations
- **Development**: Hot reloading, detailed error messages
- **Staging**: Production build, test data
- **Production**: Optimized build, real data, monitoring

## Contributing

### Getting Started
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

### Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow project guidelines

For detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).
