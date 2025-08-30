// Debug React search functionality
// Run this with: node debug-react-search.js

const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

async function debugReactSearch() {
  console.log('🔍 Debugging React search functionality...\n');
  
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
    
    // Test 1: Check what's in the index
    console.log('\n📋 Step 1: Checking index contents...');
    const stats = await index.describeIndexStats();
    console.log(`Total vectors in index: ${stats.totalRecordCount || 0}`);
    
    // Test 2: Search with dummy vector to see all results
    console.log('\n🔍 Step 2: Searching with dummy vector...');
    const dummyVector = new Array(3072).fill(0.1);
    
    const allResults = await index.query({
      vector: dummyVector,
      topK: 20,
      includeMetadata: true,
    });
    
    console.log(`Found ${allResults.matches.length} total results`);
    
    // Test 3: Analyze React-related content
    console.log('\n📊 Step 3: Analyzing React-related content...');
    let reactCvs = [];
    let javascriptCvs = [];
    let totalCvs = 0;
    
    for (const match of allResults.matches) {
      totalCvs++;
      const metadata = match.metadata || {};
      const fullText = metadata.fullText || '';
      const skills = metadata.skills || [];
      const skillsNormalized = metadata.skillsNormalized || [];
      const filename = metadata.filename || 'unknown';
      
      const textLower = fullText.toLowerCase();
      const skillsLower = skills.map(s => s.toLowerCase());
      const skillsNormLower = skillsNormalized.map(s => s.toLowerCase());
      
      // Check for React mentions
      if (textLower.includes('react') || 
          skillsLower.includes('react') || 
          skillsNormLower.includes('react')) {
        reactCvs.push({
          id: match.id,
          filename,
          score: match.score,
          hasReactInText: textLower.includes('react'),
          hasReactInSkills: skillsLower.includes('react'),
          hasReactInNormalized: skillsNormLower.includes('react'),
          skills: skills,
          skillsNormalized: skillsNormalized
        });
      }
      
      // Check for JavaScript mentions
      if (textLower.includes('javascript') || 
          skillsLower.includes('javascript') || 
          skillsNormLower.includes('javascript')) {
        javascriptCvs.push({
          id: match.id,
          filename,
          score: match.score,
          hasJSInText: textLower.includes('javascript'),
          hasJSInSkills: skillsLower.includes('javascript'),
          hasJSInNormalized: skillsNormLower.includes('javascript')
        });
      }
    }
    
    console.log(`📊 Analysis Results:`);
    console.log(`   Total CVs analyzed: ${totalCvs}`);
    console.log(`   CVs with React: ${reactCvs.length}`);
    console.log(`   CVs with JavaScript: ${javascriptCvs.length}`);
    
    // Show React CVs details
    if (reactCvs.length > 0) {
      console.log(`\n📁 React CVs found:`);
      reactCvs.forEach((cv, index) => {
        console.log(`   ${index + 1}. ${cv.filename} (ID: ${cv.id})`);
        console.log(`      Score: ${cv.score}`);
        console.log(`      React in text: ${cv.hasReactInText}`);
        console.log(`      React in skills: ${cv.hasReactInSkills}`);
        console.log(`      React in normalized: ${cv.hasReactInNormalized}`);
        console.log(`      Skills: ${JSON.stringify(cv.skills)}`);
        console.log(`      Normalized skills: ${JSON.stringify(cv.skillsNormalized)}`);
      });
    } else {
      console.log(`\n❌ No React CVs found in the index!`);
    }
    
    // Test 4: Try specific React queries
    console.log('\n🔍 Step 4: Testing specific React queries...');
    const testQueries = [
      'react',
      'React',
      'REACT',
      'react developer',
      'React developer',
      'javascript',
      'JavaScript'
    ];
    
    for (const query of testQueries) {
      console.log(`\n   Testing query: "${query}"`);
      
      try {
        // For now, use dummy vector since we're debugging the search logic
        const response = await index.query({
          vector: dummyVector,
          topK: 10,
          includeMetadata: true,
        });
        
        const results = response.matches || [];
        console.log(`      Found ${results.length} results`);
        
        // Check if any results contain the query term
        let containsQuery = 0;
        for (const match of results) {
          const metadata = match.metadata || {};
          const fullText = metadata.fullText || '';
          const skills = metadata.skills || [];
          const skillsNormalized = metadata.skillsNormalized || [];
          
          const textLower = fullText.toLowerCase();
          const skillsLower = skills.map(s => s.toLowerCase());
          const skillsNormLower = skillsNormalized.map(s => s.toLowerCase());
          const queryLower = query.toLowerCase();
          
          if (textLower.includes(queryLower) || 
              skillsLower.includes(queryLower) || 
              skillsNormLower.includes(queryLower)) {
            containsQuery++;
          }
        }
        
        console.log(`      Results containing "${query}": ${containsQuery}`);
        
      } catch (error) {
        console.log(`      ❌ Query failed: ${error.message}`);
      }
    }
    
    // Test 5: Check if the issue is with skill extraction
    console.log('\n🔧 Step 5: Testing skill extraction logic...');
    
    // Simulate the skill extraction logic
    const testQuery = 'react developer';
    console.log(`   Testing skill extraction for: "${testQuery}"`);
    
    // This is a simplified version of the skill extraction logic
    const q = testQuery.toLowerCase();
    const skillCatalog = {
      react: ['react', 'reactjs', 'react.js', 'react native'],
      javascript: ['javascript', 'js', 'ecmascript'],
      python: ['python', 'py']
    };
    
    const foundSkills = [];
    for (const [canonical, variants] of Object.entries(skillCatalog)) {
      if (variants.some(v => q.includes(v))) {
        foundSkills.push(canonical);
        console.log(`      Found skill: ${canonical} (variants: ${variants.join(', ')})`);
      }
    }
    
    console.log(`   Extracted skills: ${foundSkills.join(', ')}`);
    
    console.log('\n🎉 Debugging completed!');
    console.log('\n💡 Next steps:');
    if (reactCvs.length === 0) {
      console.log('   1. No React CVs found - check if CVs were properly indexed');
      console.log('   2. Verify the CV processing pipeline');
    } else {
      console.log('   1. React CVs exist but search is failing');
      console.log('   2. Check the skill extraction and matching logic');
      console.log('   3. Verify the search filters are not too restrictive');
    }
    
  } catch (error) {
    console.log('❌ Debugging failed:');
    console.log('Error:', error.message);
  }
}

debugReactSearch(); 