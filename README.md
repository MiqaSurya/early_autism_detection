# Autism Early Detection Companion (AEDCompanion)

A web application designed to help parents and caregivers identify potential early signs of autism spectrum disorder (ASD) through a structured questionnaire, provide immediate AI-powered information about autism, and locate nearby diagnostic centers and treatment facilities.

## Features

- Early Signs Questionnaire (M-CHAT-R inspired)
- AI-powered Information Chat
- Treatment Center Locator
- User Authentication
- Responsive Design

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

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/early-autism-detector.git
   cd early-autism-detector
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   - Create a new Supabase project
   - Set up the following tables:
     - users (auth.users extension)
     - questionnaire_responses
     - saved_locations (future feature)

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

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
