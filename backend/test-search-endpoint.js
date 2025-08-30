// Test the actual search endpoint
// Run this with: node test-search-endpoint.js

const axios = require('axios');

async function testSearchEndpoint() {
  console.log('🔍 Testing actual search endpoint...\n');
  
  try {
    // Test the search endpoint
    const searchUrl = 'http://localhost:3000/search/cv';
    
    console.log(`📡 Testing search endpoint: ${searchUrl}`);
    
    const searchData = {
      query: 'react developer'
    };
    
    console.log(`🔍 Search query: ${JSON.stringify(searchData)}`);
    
    const response = await axios.post(searchUrl, searchData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Search request successful!');
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📋 Response data: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.data && Array.isArray(response.data)) {
      console.log(`\n🎯 Found ${response.data.length} results`);
      
      response.data.forEach((result, index) => {
        console.log(`\n   ${index + 1}. CV Details:`);
        console.log(`      ID: ${result.id}`);
        console.log(`      Filename: ${result.filename}`);
        console.log(`      Similarity Score: ${result.similarityScore}`);
        console.log(`      Skills: ${JSON.stringify(result.metadata?.skills)}`);
        console.log(`      Location: ${result.metadata?.location}`);
        console.log(`      Experience: ${result.metadata?.yearsExperience} years`);
      });
    }
    
  } catch (error) {
    console.log('❌ Search endpoint test failed:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.log('   No response received from server');
      console.log('   Make sure your backend server is running on port 3000');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure your backend server is running');
    console.log('   2. Check if the server is on port 3000');
    console.log('   3. Verify the search endpoint is accessible');
  }
}

// Check if axios is available
try {
  require.resolve('axios');
  testSearchEndpoint();
} catch (e) {
  console.log('❌ Axios not found. Installing...');
  console.log('   Run: npm install axios');
  console.log('   Then run this script again');
} 