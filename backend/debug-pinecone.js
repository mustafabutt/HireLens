// Debug Pinecone Configuration
// Run this with: node debug-pinecone.js

const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

async function debugPinecone() {
  console.log('🔍 Debugging Pinecone Configuration...\n');
  
  console.log('Environment Variables:');
  console.log('PINECONE_API_KEY:', process.env.PINECONE_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('PINECONE_ENVIRONMENT:', process.env.PINECONE_ENVIRONMENT || '❌ Missing');
  console.log('PINECONE_INDEX_NAME:', process.env.PINECONE_INDEX_NAME || '❌ Missing');
  console.log('');
  
  if (!process.env.PINECONE_API_KEY) {
    console.log('❌ PINECONE_API_KEY is missing');
    return;
  }
  
  try {
    console.log('🔌 Testing different environment configurations...\n');
    
    // Test with your current environment
    console.log('1️⃣ Testing with current environment:', process.env.PINECONE_ENVIRONMENT);
    try {
      const pinecone1 = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
        environment: process.env.PINECONE_ENVIRONMENT,
      });
      
      const indexes1 = await pinecone1.listIndexes();
      console.log('   ✅ Connected successfully');
      console.log('   📋 Indexes found:', indexes1.map(idx => idx.name));
    } catch (error) {
      console.log('   ❌ Failed:', error.message);
    }
    
    // Test with common GCP environments
    console.log('\n2️⃣ Testing with us-east1-aws (common alternative):');
    try {
      const pinecone2 = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
        environment: 'us-east1-aws',
      });
      
      const indexes2 = await pinecone2.listIndexes();
      console.log('   ✅ Connected successfully');
      console.log('   📋 Indexes found:', indexes2.map(idx => idx.name));
      
      if (indexes2.length > 0) {
        console.log('   💡 Found indexes in us-east1-aws!');
        console.log('   🔧 Update your .env to use: PINECONE_ENVIRONMENT=us-east1-aws');
      }
    } catch (error) {
      console.log('   ❌ Failed:', error.message);
    }
    
    // Test with us-west1-gcp
    console.log('\n3️⃣ Testing with us-west1-gcp:');
    try {
      const pinecone3 = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
        environment: 'us-west1-gcp',
      });
      
      const indexes3 = await pinecone3.listIndexes();
      console.log('   ✅ Connected successfully');
      console.log('   📋 Indexes found:', indexes3.map(idx => idx.name));
      
      if (indexes3.length > 0) {
        console.log('   💡 Found indexes in us-west1-gcp!');
        console.log('   🔧 Update your .env to use: PINECONE_ENVIRONMENT=us-west1-gcp');
      }
    } catch (error) {
      console.log('   ❌ Failed:', error.message);
    }
    
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Check your Pinecone console for the correct environment');
    console.log('2. The environment should match where you created the index');
    console.log('3. Common environments: us-east1-aws, us-west1-gcp, us-east1-gcp');
    console.log('4. Make sure the index is in the same project as your API key');
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

debugPinecone(); 