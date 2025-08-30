// Test case-insensitive search functionality
// Run this with: node test-case-insensitive.js

const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

async function testCaseInsensitiveSearch() {
  console.log('🔍 Testing case-insensitive search...\n');
  
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
    
    // Test queries with different cases
    const testQueries = [
      'react developer',
      'React developer',
      'REACT DEVELOPER',
      'javascript developer',
      'JavaScript developer',
      'JAVASCRIPT DEVELOPER',
      'python engineer',
      'Python engineer',
      'PYTHON ENGINEER'
    ];
    
    for (const query of testQueries) {
      console.log(`\n🔍 Testing query: "${query}"`);
      
      try {
        // Generate a simple dummy embedding for testing
        const dummyVector = new Array(3072).fill(0.1);
        
        const response = await index.query({
          vector: dummyVector,
          topK: 10,
          includeMetadata: true,
        });
        
        const results = response.matches || [];
        console.log(`   Found ${results.length} results`);
        
        // Check for React-related results
        let reactResults = 0;
        let javascriptResults = 0;
        let pythonResults = 0;
        
        for (const match of results) {
          const metadata = match.metadata || {};
          const fullText = metadata.fullText || '';
          const skills = metadata.skills || [];
          const skillsNormalized = metadata.skillsNormalized || [];
          
          const textLower = fullText.toLowerCase();
          const skillsLower = skills.map(s => s.toLowerCase());
          const skillsNormLower = skillsNormalized.map(s => s.toLowerCase());
          
          // Check for React
          if (textLower.includes('react') || 
              skillsLower.includes('react') || 
              skillsNormLower.includes('react')) {
            reactResults++;
          }
          
          // Check for JavaScript
          if (textLower.includes('javascript') || 
              skillsLower.includes('javascript') || 
              skillsNormLower.includes('javascript')) {
            javascriptResults++;
          }
          
          // Check for Python
          if (textLower.includes('python') || 
              skillsLower.includes('python') || 
              skillsNormLower.includes('python')) {
            pythonResults++;
          }
        }
        
        console.log(`   📊 Skill breakdown:`);
        console.log(`      React: ${reactResults} CVs`);
        console.log(`      JavaScript: ${javascriptResults} CVs`);
        console.log(`      Python: ${pythonResults} CVs`);
        
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
    
    console.log(`\n🎉 Case-insensitive search testing completed!`);
    
  } catch (error) {
    console.log('❌ Case-insensitive search testing failed:');
    console.log('Error:', error.message);
  }
}

testCaseInsensitiveSearch(); 