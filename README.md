# 🧠 Early Autism Detector

A comprehensive web application for early autism screening using the M-CHAT-R (Modified Checklist for Autism in Toddlers - Revised) assessment tool. Built with Next.js, TypeScript, and Supabase.

## ✨ Features

### 🔐 Authentication & User Management
- Secure user registration and login
- Email verification and password reset
- Protected routes with middleware

### 👶 Child Profile Management
- Create and manage multiple child profiles
- Track child information (name, date of birth, gender, notes)
- Delete child profiles with confirmation
- Age calculation and display

### 📋 M-CHAT-R Assessment
- Official M-CHAT-R questionnaire implementation
- 20 evidence-based questions
- Child selection before assessment
- Real-time progress tracking
- Automatic scoring algorithm

### 📊 Progress Tracking & History
- Complete assessment history per child
- Visual timeline of assessments
- Score progression tracking
- Risk level visualization (Low/Medium/High)
- Improvement/decline indicators
- Recommended actions based on results

### 🗺️ Autism Center Locator
- Interactive map with autism centers
- Search and filter functionality
- Center details and contact information
- Save favorite centers
- Get directions to centers

### 🎨 Modern UI/UX
- Responsive design for all devices
- Clean, accessible interface
- Toast notifications for user feedback
- Loading states and error handling

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (Authentication, Database)
- **APIs**: OpenAI GPT-4, Google Maps
- **Deployment**: Vercel

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- Supabase account
- OpenAI API key
- Google Maps API key

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_GMAPS_KEY=your_google_maps_api_key
```

## Setup Instructions

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/MiqaSurya/early_autism_detection.git
   cd early_autism_detection
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

4. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL setup scripts in the `supabase/` directory
   - Update your environment variables with Supabase credentials

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Deployment on Vercel

For detailed deployment instructions, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

**Quick Deploy:**
1. Fork this repository
2. Connect to Vercel
3. Set environment variables
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MiqaSurya/early_autism_detection)

## Database Schema

### questionnaire_responses
```sql
create table questionnaire_responses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  answers jsonb,
  risk_level text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table questionnaire_responses enable row level security;

-- Create policy
create policy "Users can only access their own responses"
  on questionnaire_responses
  for all
  using (auth.uid() = user_id);
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- M-CHAT-R™ (Modified Checklist for Autism in Toddlers, Revised) for inspiration
- CDC and Autism Speaks for reliable autism information resources
