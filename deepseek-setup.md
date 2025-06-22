# DeepSeek API Integration

## Setup Instructions

1. Create or edit your `.env.local` file in the project root with the following content:

```
# DeepSeek API Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_API_BASE_URL=https://api.deepseek.com  # Adjust if needed

# Keep any existing environment variables
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# OPENAI_API_KEY=your_openai_api_key  # Keep if you want to use both APIs
```

2. Replace `your_deepseek_api_key_here` with the actual DeepSeek API key you provided.

## Implementation Notes

The DeepSeek API will be used for the Autism Information Chat feature, providing AI-powered responses to questions about autism.
