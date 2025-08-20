// Test Pinecone Connection
// Run this with: node test-pinecone.js

const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

async function testPinecone() {
  console.log('🔍 Testing Pinecone Connection...\n');

  // Check environment variables
  console.log('Environment Variables:');
  console.log('PINECONE_API_KEY:', process.env.PINECONE_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('PINECONE_INDEX_NAME:', process.env.PINECONE_INDEX_NAME || '❌ Missing');
  console.log('');

  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
    console.log('❌ Missing required environment variables. Please check your .env file.');
    return;
  }

  try {
    console.log('🔌 Initializing Pinecone client... ' + process.env.PINECONE_INDEX_NAME);

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    console.log('✅ Pinecone client initialized');

    console.log('📋 Listing indexes...');
    let indexesResponse = await pinecone.listIndexes();
    let indexes = Array.isArray(indexesResponse) ? indexesResponse : indexesResponse.indexes;

    console.log('Available indexes:', indexes.map(idx => idx.name));

    console.log('\n🔍 Checking target index... ' + process.env.PINECONE_INDEX_NAME);
    const targetIndex = indexes.find(idx => idx.name === process.env.PINECONE_INDEX_NAME);

    if (targetIndex) {
      console.log('✅ Target index found:', targetIndex.name);
      console.log('Index details:', targetIndex);

      if (targetIndex.status?.ready) {
        console.log('\n🧪 Testing index connection...');
        const index = pinecone.index(targetIndex.name);

        // Try a simple query
        const testQuery = await index.query({
          vector: new Array(targetIndex.dimension).fill(0.1), // use correct dimension
          topK: 1,
          includeMetadata: false,
        });

        console.log('✅ Index connection successful!');
        console.log('Query response:', testQuery);
      } else {
        console.log('❌ Index is not ready yet. Current status:', targetIndex.status);
      }
    } else {
      console.log('❌ Target index not found:', process.env.PINECONE_INDEX_NAME);
      console.log('Available indexes:', indexes.map(idx => idx.name));
    }
  } catch (error) {
    console.log('❌ Pinecone connection failed:');
    console.log('Error:', error.message);
  }
}

testPinecone();
