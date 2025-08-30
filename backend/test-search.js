// Test search functionality to verify no duplicates
// Run this with: node test-search.js

const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

async function testSearch() {
  console.log('🔍 Testing search functionality...\n');
  
  // Check environment variables
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
    console.log('❌ Missing required environment variables. Please check your .env file.');
    return;
  }
  
  try {
    console.log('🔌 Initializing Pinecone client...');
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME);
    
    // Test queries
    const testQueries = [
      'javascript developer',
      'python engineer',
      'react developer',
      'software engineer',
      'web developer'
    ];
    
    for (const query of testQueries) {
      console.log(`\n🔍 Testing query: "${query}"`);
      
      try {
        // Generate a simple dummy embedding for testing
        const dummyVector = new Array(3072).fill(0.1);
        
        const response = await index.query({
          vector: dummyVector,
          topK: 20,
          includeMetadata: true,
        });
        
        const results = response.matches || [];
        console.log(`   Found ${results.length} results`);
        
        // Check for duplicates
        const seenIds = new Set();
        const seenContentHashes = new Set();
        let duplicateIds = 0;
        let duplicateContent = 0;
        
        for (const match of results) {
          // Check for duplicate IDs
          if (seenIds.has(match.id)) {
            duplicateIds++;
          } else {
            seenIds.add(match.id);
          }
          
          // Check for duplicate content
          const metadata = match.metadata || {};
          const filename = metadata.filename || 'unknown';
          const fullText = metadata.fullText || '';
          const contentHash = `${filename.toLowerCase()}_${fullText.substring(0, 100).toLowerCase()}`;
          
          if (seenContentHashes.has(contentHash)) {
            duplicateContent++;
          } else {
            seenContentHashes.add(contentHash);
          }
        }
        
        if (duplicateIds > 0) {
          console.log(`   ❌ Found ${duplicateIds} duplicate IDs`);
        } else {
          console.log(`   ✅ No duplicate IDs found`);
        }
        
        if (duplicateContent > 0) {
          console.log(`   ❌ Found ${duplicateContent} duplicate content`);
        } else {
          console.log(`   ✅ No duplicate content found`);
        }
        
        // Show first few results
        if (results.length > 0) {
          console.log(`   📋 First 3 results:`);
          results.slice(0, 3).forEach((result, index) => {
            const metadata = result.metadata || {};
            console.log(`      ${index + 1}. ${metadata.filename || 'unknown'} (ID: ${result.id}, Score: ${result.score})`);
          });
        }
        
      } catch (error) {
        console.log(`   ❌ Query failed: ${error.message}`);
      }
      
      // Small delay between queries
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n🎉 Search testing completed!`);
    
  } catch (error) {
    console.log('❌ Search testing failed:');
    console.log('Error:', error.message);
  }
}

testSearch(); 