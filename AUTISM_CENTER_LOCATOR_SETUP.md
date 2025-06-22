# Autism Center Locator Setup Guide

## Overview

Yes, you can absolutely add coordinates of autism centers to help users find the nearest ones! I've implemented a comprehensive solution that includes:

1. **Database structure** for storing autism centers with coordinates
2. **API endpoints** for fetching nearby centers
3. **Interactive map** showing centers with different markers by type
4. **Filtering system** by center type and distance radius
5. **Detailed center information** with contact details and services

## What's Been Added

### 1. Database Schema
- New `autism_centers` table with comprehensive fields:
  - Basic info: name, type, address, coordinates
  - Contact: phone, website, email
  - Details: description, services, age groups, insurance
  - Quality: rating, verification status

### 2. API Endpoints
- `GET /api/autism-centers` - Fetch nearby centers with distance calculation
- `POST /api/autism-centers` - Add new centers (admin)
- Supports filtering by type, radius, and sorting by distance

### 3. Enhanced UI Components
- **Interactive map** with color-coded markers by center type
- **Filter controls** for center type and search radius
- **Center cards** with detailed information
- **Modal dialogs** for full center details
- **Save functionality** to user's saved locations

### 4. Center Types
- **Diagnostic** (blue markers) - Assessment and diagnosis centers
- **Therapy** (green markers) - ABA, speech, occupational therapy
- **Support** (purple markers) - Support groups and family resources
- **Education** (orange markers) - Special education and schools

## Setup Instructions

### Step 1: Update Database Schema

Run the updated SQL migration to add the `autism_centers` table:

```sql
-- Add this to your Supabase migration or run directly in SQL editor
CREATE TABLE IF NOT EXISTS autism_centers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('diagnostic', 'therapy', 'support', 'education')) NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  phone TEXT,
  website TEXT,
  email TEXT,
  description TEXT,
  services TEXT[], -- Array of services offered
  age_groups TEXT[], -- Array of age groups served
  insurance_accepted TEXT[], -- Array of insurance types
  rating DECIMAL(2,1), -- Rating out of 5
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

### Step 2: Populate Sample Data

You can use the provided script to add sample autism centers:

```bash
# Install dependencies if needed
npm install @supabase/supabase-js

# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run the population script
node scripts/populate-autism-centers.js
```

Or manually insert data using the `sample_autism_centers.sql` file in your Supabase SQL editor.

### Step 3: Add Real Autism Centers

To add real autism centers in your area, you can:

1. **Manual Entry**: Use the POST API endpoint or Supabase dashboard
2. **Data Import**: Gather coordinates from Google Maps or other sources
3. **API Integration**: Use Google Places API to find autism-related businesses

#### Getting Coordinates for Real Centers

For each autism center you want to add:

1. **Google Maps Method**:
   - Search for the center on Google Maps
   - Right-click on the location
   - Copy the coordinates (latitude, longitude)

2. **Geocoding API Method**:
   - Use Google Geocoding API to convert addresses to coordinates
   - Example: `https://maps.googleapis.com/maps/api/geocode/json?address=123+Main+St&key=YOUR_API_KEY`

3. **Manual Research**:
   - Find autism centers in your area through:
     - State autism organizations
     - Insurance provider directories
     - Medical center websites
     - Parent support groups

### Step 4: Configure Location Services

The app automatically requests user location permission to show nearby centers. Users can:

- Allow location access for automatic nearby search
- Manually search by adjusting the map center
- Filter by center type (diagnostic, therapy, support, education)
- Adjust search radius (5-100km)

## Features

### For Users
- **Find Nearby Centers**: Automatic location detection and nearby center search
- **Filter Options**: By center type and distance radius
- **Detailed Information**: Contact details, services, ratings, insurance accepted
- **Save Centers**: Add centers to personal saved locations
- **Interactive Map**: Visual representation with color-coded markers

### For Administrators
- **Add Centers**: API endpoint for adding new centers
- **Verify Centers**: Mark centers as verified for quality assurance
- **Update Information**: Modify center details as needed

## Data Structure Example

```javascript
{
  "id": "uuid",
  "name": "Children's Autism Diagnostic Center",
  "type": "diagnostic",
  "address": "123 Medical Plaza, New York, NY 10001",
  "latitude": 40.7589,
  "longitude": -73.9851,
  "phone": "(555) 123-4567",
  "website": "https://example-center.com",
  "email": "info@example-center.com",
  "description": "Comprehensive autism diagnostic services",
  "services": ["ADOS-2 Assessment", "Developmental Evaluation"],
  "age_groups": ["0-3", "4-7", "8-12", "13-18"],
  "insurance_accepted": ["Medicaid", "Blue Cross", "Private Pay"],
  "rating": 4.5,
  "verified": true,
  "distance": 2.3 // Added when searching by location
}
```

## Next Steps

1. **Add Real Data**: Replace sample data with real autism centers in your target areas
2. **Enhance Search**: Add text search functionality for center names
3. **Reviews System**: Allow users to rate and review centers
4. **Directions Integration**: Add "Get Directions" buttons linking to Google Maps
5. **Appointment Booking**: Integrate with center scheduling systems

## Benefits

- **Improved User Experience**: Easy discovery of nearby autism resources
- **Comprehensive Information**: All relevant details in one place
- **Location-Aware**: Automatically shows most relevant centers
- **Flexible Filtering**: Users can find exactly what they need
- **Scalable**: Easy to add more centers as your coverage grows

The system is now ready to help parents and caregivers find autism centers near them with just a few clicks!
