// Test Pinecone Connection
// Run this with: node test-pinecone.js

const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

async function testPinecone() {
  console.log('🔍 Testing Pinecone Connection...\n');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('PINECONE_API_KEY:', process.env.PINECONE_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('PINECONE_ENVIRONMENT:', process.env.PINECONE_ENVIRONMENT || '❌ Missing');
  console.log('PINECONE_INDEX_NAME:', process.env.PINECONE_INDEX_NAME || '❌ Missing');
  console.log('');
  
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_ENVIRONMENT || !process.env.PINECONE_INDEX_NAME) {
    console.log('❌ Missing required environment variables. Please check your .env file.');
    return;
  }
  
  try {
    console.log('🔌 Initializing Pinecone client...');
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
    });
    
    console.log('✅ Pinecone client initialized');
    
    console.log('📋 Listing indexes...hell');
    const indexes = await pinecone.listIndexes();
    
    console.log('Available indexes:', indexes.map(idx => idx.name));
    
    console.log('\n🔍 Checking target index...');
    const targetIndex = indexes.find(idx => idx.name === process.env.PINECONE_INDEX_NAME);
    
    if (targetIndex) {
      console.log('✅ Target index found:', targetIndex.name);
      console.log('Status:', targetIndex.status);
      console.log('Dimensions:', targetIndex.dimension);
      console.log('Metric:', targetIndex.metric);
    } else {
      console.log('❌ Target index not found:', process.env.PINECONE_INDEX_NAME);
      console.log('Available indexes:', indexes.map(idx => idx.name));
    }
    
    if (targetIndex && targetIndex.status === 'Active') {
      console.log('\n🧪 Testing index connection...');
      const index = pinecone.index(process.env.PINECONE_INDEX_NAME);
      
      // Try a simple query to test the connection
      const testQuery = await index.query({
        vector: new Array(3072).fill(0.1), // Test vector
        topK: 1,
        includeMetadata: false
      });
      
      console.log('✅ Index connection successful!');
      console.log('Query response:', testQuery);
    } else {
      console.log('❌ Index is not active or not found');
    }
    
  } catch (error) {
    console.log('❌ Pinecone connection failed:');
    console.log('Error:', error.message);
    
    if (error.message.includes('Request failed to reach Pinecone')) {
      console.log('\n🔧 Troubleshooting tips:');
      console.log('1. Check your internet connection');
      console.log('2. Verify PINECONE_ENVIRONMENT is correct (e.g., us-east1-aws)');
      console.log('3. Ensure your Pinecone index is Active');
      console.log('4. Check https://status.pinecone.io/ for outages');
    }
  }
}

testPinecone(); 