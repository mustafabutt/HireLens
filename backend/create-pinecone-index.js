// Create Pinecone Index
// Run this with: node create-pinecone-index.js

const { Pinecone } = require('@pinecone-database/pinecone');
const { console } = require('inspector');
require('dotenv').config();

async function createPineconeIndex() {
  console.log('🔧 Creating Pinecone Index...\n');
  
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
      apiKey: process.env.PINECONE_API_KEY
    });
    
    console.log('✅ Pinecone client initialized');
    
    console.log('📋 Checking existing indexes...');
    const indexes = await pinecone.listIndexes();

    console.log('Current indexes:', indexes.map(idx => idx.name));
    
    // Check if index already exists
    const existingIndex = indexes.find(idx => idx.name === process.env.PINECONE_INDEX_NAME);
    
    if (existingIndex) {
      console.log(`\n⚠️  Index '${process.env.PINECONE_INDEX_NAME}' already exists!`);
      console.log('Status:', existingIndex.status);
      console.log('Dimensions:', existingIndex.dimension);
      console.log('Metric:', existingIndex.metric);
      
      if (existingIndex.status === 'Active') {
        console.log('✅ Index is already active and ready to use!');
        return;
      } else if (existingIndex.status === 'Pending') {
        console.log('⏳ Index is still being created. Please wait a few minutes and try again.');
        return;
      }
    }
    
    console.log(`\n🏗️  Creating index '${process.env.PINECONE_INDEX_NAME}'...`);
    
    // Create the index
    await pinecone.createIndex({
      name: process.env.PINECONE_INDEX_NAME,
      dimension: 3072, // For text-embedding-3-large
      metric: 'cosine', // Best for text similarity
      spec: {
        serverless: {
          cloud: 'gcp', // Since your environment is us-east1-gcp
          region: 'us-east1'
        }
      }
    });
    
    console.log('✅ Index creation initiated successfully!');
    console.log('\n⏳ The index will be ready in 1-2 minutes.');
    console.log('You can check the status in the Pinecone console: https://app.pinecone.io/');
    console.log('\n🔄 Run this script again to check when it\'s ready.');
    
  } catch (error) {
    console.log('❌ Failed to create index:');
    console.log('Error:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n💡 The index already exists. Check the Pinecone console for its status.');
    } else if (error.message.includes('Request failed to reach Pinecone')) {
      console.log('\n🔧 Troubleshooting tips:');
      console.log('1. Check your internet connection');
      console.log('2. Verify PINECONE_ENVIRONMENT is correct');
      console.log('3. Check https://status.pinecone.io/ for outages');
      console.log('4. Ensure your API key has permission to create indexes');
    }
  }
}

createPineconeIndex(); 