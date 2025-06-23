# 🗺️ Geoapify Integration Setup Guide

This guide walks you through setting up Geoapify for maps and geocoding in the Early Autism Detector application.

## 🎯 Why Geoapify?

Geoapify offers several advantages over Google Maps:
- ✅ **Free tier**: 3,000 requests/day free
- ✅ **No credit card required** for free tier
- ✅ **Excellent geocoding** and address search
- ✅ **Multiple map styles** available
- ✅ **Simple API** with great documentation
- ✅ **GDPR compliant** and privacy-focused

## 🚀 Step-by-Step Setup

### Step 1: Create Geoapify Account

1. **Go to Geoapify**
   - Visit [geoapify.com](https://www.geoapify.com/)
   - Click "Get Started for Free"

2. **Sign Up**
   - Enter your email address
   - Create a password
   - Verify your email

3. **No Credit Card Required**
   - Unlike Google Maps, you can start immediately
   - Free tier includes 3,000 requests/day

### Step 2: Get Your API Key

1. **Access Dashboard**
   - Log into your Geoapify account
   - Go to your dashboard

2. **Find API Keys**
   - Navigate to "API Keys" section
   - You'll see your default API key

3. **Copy API Key**
   - Copy the API key (looks like: `1234567890abcdef1234567890abcdef`)
   - Keep this secure - don't share it publicly

### Step 3: Add to Environment Variables

1. **Local Development**
   - Open your `.env.local` file
   - Add this line:
   ```env
   NEXT_PUBLIC_GEOAPIFY_API_KEY=your-actual-api-key-here
   ```

2. **Vercel Deployment**
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add:
     - **Name**: `NEXT_PUBLIC_GEOAPIFY_API_KEY`
     - **Value**: Your actual API key
     - **Environment**: Production (and Preview if needed)

### Step 4: Test the Integration

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Visit Locator Page**
   - Go to `/dashboard/locator`
   - You should see the Geoapify map loading

3. **Test Features**
   - ✅ Search for addresses
   - ✅ Use "Current Location" button
   - ✅ View autism centers on map
   - ✅ Get directions to centers

## 🔧 Features Included

### 🔍 Address Search
- **Autocomplete suggestions** as you type
- **Geoapify geocoding** for accurate results
- **Current location detection** with browser geolocation
- **Address formatting** for consistent display

### 🗺️ Interactive Map
- **Geoapify tile layers** with multiple styles
- **Custom markers** for different center types
- **User location marker** with pulsing animation
- **Popup information** with center details
- **Zoom and pan** controls

### 📍 Location Features
- **Distance calculation** using Haversine formula
- **Radius filtering** (5km to 100km)
- **Type filtering** (diagnostic, therapy, support, education)
- **Directions integration** with Google Maps
- **Save favorite locations**

## 🎨 Customization Options

### Map Styles
You can change the map style by modifying the tile URL in `GeoapifyMap.tsx`:

```typescript
// Current style: OSM Bright
url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${apiKey}`}

// Other available styles:
// OSM Carto: osm-carto
// Dark Matter: dark-matter
// Positron: positron
// OSM Liberty: osm-liberty
```

### Marker Colors
Customize marker colors in `GeoapifyMap.tsx`:

```typescript
const colors = {
  diagnostic: '#ef4444',  // Red
  therapy: '#10b981',     // Green
  support: '#8b5cf6',     // Purple
  education: '#f97316',   // Orange
  default: '#6b7280'      // Gray
}
```

## 📊 API Usage Monitoring

### Free Tier Limits
- **3,000 requests/day** free
- **Geocoding**: ~1 request per address search
- **Map tiles**: ~20-50 requests per map view
- **Autocomplete**: ~1 request per keystroke (debounced)

### Monitor Usage
1. **Geoapify Dashboard**
   - Check your daily usage
   - View request statistics
   - Monitor API key performance

2. **Optimize Usage**
   - Autocomplete is debounced (300ms)
   - Map tiles are cached by browser
   - Distance calculations use local Haversine formula

## 🔒 Security Best Practices

### API Key Security
- ✅ **Use environment variables** - never hardcode keys
- ✅ **Restrict domains** in Geoapify dashboard (production)
- ✅ **Monitor usage** for unexpected spikes
- ✅ **Rotate keys** periodically

### Domain Restrictions (Production)
1. **Go to Geoapify Dashboard**
2. **Select your API key**
3. **Add domain restrictions**:
   - `your-domain.vercel.app`
   - `your-custom-domain.com`

## 🆘 Troubleshooting

### Common Issues

**Map not loading**
- ✅ Check API key is set correctly
- ✅ Verify environment variable name: `NEXT_PUBLIC_GEOAPIFY_API_KEY`
- ✅ Check browser console for errors

**Address search not working**
- ✅ Ensure API key has geocoding permissions
- ✅ Check network requests in browser dev tools
- ✅ Verify you haven't exceeded daily limits

**Markers not showing**
- ✅ Check center data has valid latitude/longitude
- ✅ Verify map zoom level is appropriate
- ✅ Check browser console for JavaScript errors

### Debug Mode
Enable debug logging by adding to your component:

```typescript
// Add to GeoapifyMap.tsx
console.log('Geoapify API Key:', process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY?.substring(0, 8) + '...')
console.log('Centers to display:', centers.length)
```

## 🔄 Migration from Google Maps

If you were previously using Google Maps:

1. **Keep both APIs** during transition
2. **Test thoroughly** with real data
3. **Update environment variables** in production
4. **Monitor performance** and user feedback
5. **Remove Google Maps** dependencies when satisfied

## 📈 Upgrading Plans

If you need more than 3,000 requests/day:

1. **Geoapify Pro Plans**
   - Starting at $1 per 1,000 requests
   - Volume discounts available
   - No setup fees

2. **Monitor Usage First**
   - Most applications stay within free tier
   - Optimize before upgrading

## ✅ Success Checklist

- [ ] Geoapify account created
- [ ] API key obtained
- [ ] Environment variable set locally
- [ ] Environment variable set in Vercel
- [ ] Map loads correctly
- [ ] Address search works
- [ ] Current location detection works
- [ ] Autism centers display on map
- [ ] Directions functionality works
- [ ] Save locations feature works

## 🎉 You're All Set!

Your Early Autism Detector application now uses Geoapify for:
- 🗺️ **Interactive maps** with custom styling
- 🔍 **Address search** with autocomplete
- 📍 **Location detection** and geocoding
- 🧭 **Directions** and navigation
- 💾 **Saved locations** management

The locator feature is now more reliable, faster, and doesn't require a credit card to get started!

---

**Need help?** Check the [Geoapify documentation](https://docs.geoapify.com/) or contact support.
