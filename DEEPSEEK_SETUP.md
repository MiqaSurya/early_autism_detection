# DeepSeek API Setup Guide

## Overview
The Early Autism Detector uses DeepSeek API to power the AI chatbox feature, providing intelligent responses to questions about autism, development, and support resources.

## Setup Instructions

### 1. Create DeepSeek Account
1. Visit [platform.deepseek.com](https://platform.deepseek.com)
2. Sign up for a new account
3. Complete the verification process

### 2. Generate API Key
1. Log in to your DeepSeek account
2. Navigate to the API section
3. Create a new API key
4. Copy the API key for use in environment variables

### 3. Configure Environment Variables
Add the following to your `.env.local` file:

```env
# DeepSeek API Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_API_BASE_URL=https://api.deepseek.com
```

### 4. Database Setup
Run the SQL script to create the chat history table:

```bash
# Execute the SQL script in your Supabase dashboard or via CLI
psql -h your-supabase-host -U postgres -d postgres -f create_chat_history_table.sql
```

Or copy and paste the contents of `create_chat_history_table.sql` into your Supabase SQL editor.

## Features

### AI Chatbox
- **Intelligent Responses**: Get accurate, evidence-based information about autism
- **Context Awareness**: Maintains conversation context for better responses
- **Safety Guidelines**: Avoids medical diagnosis and encourages professional consultation

### Chat History
- **Persistent Storage**: All conversations are saved to your account
- **Easy Access**: View and reload previous conversations
- **Privacy**: Your chat history is private and secure
- **Management**: Delete individual chats or clear all history

### Suggested Questions
The chatbox includes helpful suggested questions like:
- "What are early signs of autism in toddlers?"
- "How is autism diagnosed?"
- "What therapies are available for children with autism?"
- "How can I support my child's development?"

## API Configuration

### Model Settings
- **Model**: `deepseek-chat`
- **Temperature**: 0.7 (balanced creativity and accuracy)
- **Max Tokens**: 1000
- **Base URL**: `https://api.deepseek.com/v1/chat/completions`

### System Prompt
The AI is configured with a specialized system prompt that:
- Focuses on autism-related information
- Provides evidence-based responses
- Maintains empathetic and supportive tone
- Avoids medical diagnosis
- Encourages professional consultation when appropriate

## Usage

### Accessing the Chat
1. Log in to your account
2. Go to Dashboard
3. Click on "INFORMATION" service card
4. Start asking questions about autism and development

### Chat History
1. Click "Chat History" button in the chat interface
2. View all previous conversations
3. Click on any conversation to reload it
4. Delete individual chats or clear all history

## Troubleshooting

### Common Issues

**API Key Not Working**
- Verify the API key is correct
- Check that the key has proper permissions
- Ensure the base URL is set correctly

**Chat History Not Loading**
- Verify the chat_history table exists in your database
- Check that RLS policies are properly configured
- Ensure user authentication is working

**Responses Not Generated**
- Check API key configuration
- Verify network connectivity
- Check browser console for error messages

### Error Messages

**"DeepSeek API key not configured"**
- Add `DEEPSEEK_API_KEY` to your environment variables

**"Failed to load chat history"**
- Run the chat history table creation script
- Check database permissions

**"Unauthorized"**
- Ensure user is logged in
- Check authentication configuration

## Security

### Data Privacy
- Chat conversations are stored securely in your Supabase database
- Row Level Security (RLS) ensures users can only access their own data
- API communications are encrypted via HTTPS

### Best Practices
- Keep your API key secure and never commit it to version control
- Regularly monitor API usage to avoid unexpected charges
- Use environment variables for all sensitive configuration

## Support

For issues related to:
- **DeepSeek API**: Contact DeepSeek support
- **Application Issues**: Check the troubleshooting section above
- **Database Issues**: Verify Supabase configuration

## Cost Considerations

DeepSeek API usage is typically charged per token. Monitor your usage through the DeepSeek dashboard to manage costs effectively.
