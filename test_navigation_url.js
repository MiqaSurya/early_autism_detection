// Test script to verify navigation URL parameters
// Run this in browser console to test the URL generation

function testNavigationURL() {
  // Sample destination data
  const destination = {
    lat: 3.2139586500000004,
    lon: 101.65417499919278,
    name: "Taman Permata Fadason, Jinjang, Kepong, Kuala Lumpur, Malaysia",
    address: "Taman Permata Fadason, Jinjang, Kepong, Kuala Lumpur, Malaysia"
  }

  // Create URL parameters as the component does
  const params = new URLSearchParams({
    name: destination.name,
    address: destination.address || destination.name,
    latitude: destination.lat.toString(),
    longitude: destination.lon.toString(),
    type: 'diagnostic'
  })

  const url = `/dashboard/turn-by-turn?${params.toString()}`
  
  console.log('Generated Navigation URL:', url)
  console.log('URL Parameters:')
  for (const [key, value] of params.entries()) {
    console.log(`  ${key}: ${value}`)
  }
  
  return url
}

// Test the function
testNavigationURL()
