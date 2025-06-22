# 🔌 API Documentation

This document provides comprehensive documentation for all API endpoints in the Early Autism Detector application.

## Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-app-name.vercel.app/api`

## Authentication

Most endpoints require authentication using Supabase session cookies. The middleware automatically handles authentication for protected routes.

### Authentication Headers
```
Cookie: sb-access-token=<token>; sb-refresh-token=<refresh-token>
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "data": {...},
  "success": true
}
```

### Error Response
```json
{
  "error": "Error message",
  "success": false
}
```

## Endpoints

### Authentication

#### POST `/api/auth/login`
Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "email_confirmed_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error Codes:**
- `401` - Invalid credentials
- `400` - Missing email or password

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent. Please check your inbox."
}
```

**Error Codes:**
- `400` - Email already registered or invalid data
- `500` - Server error

#### POST `/api/auth-proxy`
Unified authentication proxy for various auth actions.

**Request Body:**
```json
{
  "action": "signIn|signUp|signOut",
  "email": "user@example.com",
  "password": "password123",
  "phone": "+1234567890" // Optional, alternative to email
}
```

### Autism Centers

#### GET `/api/autism-centers`
Retrieve nearby autism centers with distance calculation.

**Query Parameters:**
- `lat` (required): Latitude coordinate
- `lng` (required): Longitude coordinate
- `radius` (optional): Search radius in kilometers (default: 25)
- `type` (optional): Filter by center type (`diagnostic`, `therapy`, `support`, `education`)
- `limit` (optional): Maximum results to return (default: 20)

**Example Request:**
```
GET /api/autism-centers?lat=40.7128&lng=-74.0060&radius=50&type=therapy&limit=10
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "ABC Autism Center",
    "type": "therapy",
    "address": "123 Main St, New York, NY 10001",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "phone": "+1-555-0123",
    "website": "https://example.com",
    "email": "info@example.com",
    "description": "Comprehensive autism therapy services",
    "services": ["ABA", "Speech Therapy", "Occupational Therapy"],
    "age_groups": ["2-5", "6-12", "13-18"],
    "insurance_accepted": ["Medicaid", "Private Insurance"],
    "rating": 4.5,
    "verified": true,
    "distance": 2.3,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

**Error Codes:**
- `400` - Missing latitude or longitude
- `500` - Database error

#### POST `/api/autism-centers`
Add a new autism center (requires authentication).

**Request Body:**
```json
{
  "name": "New Autism Center",
  "type": "therapy",
  "address": "456 Oak St, City, State 12345",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "phone": "+1-555-0456",
  "website": "https://newcenter.com",
  "email": "contact@newcenter.com",
  "description": "New autism therapy center",
  "services": ["ABA", "Speech Therapy"],
  "age_groups": ["2-5", "6-12"],
  "insurance_accepted": ["Medicaid"],
  "rating": 4.0,
  "verified": false
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "New Autism Center",
  // ... other fields
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Error Codes:**
- `401` - Unauthorized (not logged in)
- `400` - Missing required fields or invalid type
- `500` - Database error

### Saved Locations

#### GET `/api/saved-locations`
Retrieve user's saved locations (requires authentication).

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "My Favorite Center",
    "type": "therapy",
    "address": "123 Main St, City, State",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "phone": "+1-555-0123",
    "notes": "Great staff, convenient location",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST `/api/saved-locations`
Save a new location (requires authentication).

**Request Body:**
```json
{
  "name": "Favorite Therapy Center",
  "type": "therapy",
  "address": "789 Pine St, City, State",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "phone": "+1-555-0789",
  "notes": "Recommended by pediatrician"
}
```

#### PATCH `/api/saved-locations/[id]`
Update a saved location (requires authentication).

**Request Body:** Same as POST, all fields optional.

#### DELETE `/api/saved-locations/[id]`
Delete a saved location (requires authentication).

**Response:**
```json
{
  "success": true,
  "message": "Location deleted successfully"
}
```

### Chat System

#### POST `/api/chat`
Send a message to the AI chat system (requires authentication).

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What are early signs of autism?"
    }
  ]
}
```

**Response:**
```json
{
  "role": "assistant",
  "content": "Early signs of autism may include..."
}
```

#### GET `/api/chat/history`
Retrieve user's chat history (requires authentication).

**Query Parameters:**
- `limit` (optional): Number of messages to retrieve (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "question": "What are early signs of autism?",
    "answer": "Early signs of autism may include...",
    "timestamp": "2024-01-01T00:00:00Z"
  }
]
```

#### POST `/api/chat/init-history`
Initialize chat history for a user (requires authentication).

### Testing Endpoints

#### GET `/api/test-supabase`
Test Supabase connection and authentication.

**Response:**
```json
{
  "message": "Supabase connection successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Error Handling

### Common Error Codes
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Error Response Format
```json
{
  "error": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Rate Limiting

API endpoints are subject to rate limiting:
- **Authentication endpoints**: 5 requests per minute per IP
- **Chat endpoints**: 10 requests per minute per user
- **Data endpoints**: 100 requests per minute per user

## Data Validation

All endpoints validate input data using Zod schemas. Common validation rules:
- Email addresses must be valid format
- Passwords must be at least 6 characters
- Coordinates must be valid latitude/longitude values
- Required fields cannot be empty or null

## Security

- All endpoints use HTTPS in production
- Authentication tokens are httpOnly cookies
- CORS is configured for allowed origins only
- Input sanitization prevents XSS attacks
- SQL injection protection via Supabase RLS
