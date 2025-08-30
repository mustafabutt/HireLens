// Test the actual search service to see what's happening
// Run this with: node test-actual-search.js

const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

async function testActualSearch() {
  console.log('🔍 Testing actual search service...\n');
  
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
    
    // Test 1: Check the actual CV data structure
    console.log('\n📋 Step 1: Examining CV data structure...');
    const dummyVector = new Array(3072).fill(0.1);
    
    const allResults = await index.query({
      vector: dummyVector,
      topK: 10,
      includeMetadata: true,
    });
    
    if (allResults.matches.length > 0) {
      const cv = allResults.matches[0];
      const metadata = cv.metadata || {};
      
      console.log(`CV ID: ${cv.id}`);
      console.log(`Filename: ${metadata.filename}`);
      console.log(`Skills: ${JSON.stringify(metadata.skills)}`);
      console.log(`Skills Normalized: ${JSON.stringify(metadata.skillsNormalized)}`);
      console.log(`Full Text (first 200 chars): ${(metadata.fullText || '').substring(0, 200)}...`);
      
      // Test 2: Simulate the skill extraction logic
      console.log('\n🔧 Step 2: Simulating skill extraction...');
      const testQuery = 'react developer';
      console.log(`Query: "${testQuery}"`);
      
      // This is the exact logic from the service
      const q = testQuery.toLowerCase();
      const skillCatalog = {
        react: ['react', 'reactjs', 'react.js', 'react native', 'React', 'ReactJS', 'React.js', 'React Native'],
        javascript: ['javascript', 'js', 'ecmascript', 'JavaScript', 'JS', 'ECMAScript'],
        python: ['python', 'py', 'Python', 'PY']
      };
      
      const extractedSkillIds = [];
      for (const [canonical, variants] of Object.entries(skillCatalog)) {
        if (variants.some(v => q.includes(v.toLowerCase()))) {
          extractedSkillIds.push(canonical.toLowerCase());
          console.log(`   Extracted skill: ${canonical} (variants: ${variants.join(', ')})`);
        }
      }
      
      console.log(`   Final extracted skills: ${extractedSkillIds.join(', ')}`);
      
      // Test 3: Simulate the skill matching logic
      console.log('\n🔍 Step 3: Simulating skill matching...');
      
      const skillsMeta = metadata.skills || [];
      const skillsNorm = metadata.skillsNormalized || [];
      const fullText = metadata.fullText || '';
      
      const skillsArray = Array.isArray(skillsMeta) ? skillsMeta : [];
      const normArray = Array.isArray(skillsNorm) ? skillsNorm : [];
      const skillsLower = skillsArray.map(s => (typeof s === 'string' ? s.toLowerCase() : ''));
      const fullTextLower = typeof fullText === 'string' ? fullText.toLowerCase() : '';
      
      console.log(`   CV Skills: ${JSON.stringify(skillsArray)}`);
      console.log(`   CV Skills Lower: ${JSON.stringify(skillsLower)}`);
      console.log(`   CV Skills Normalized: ${JSON.stringify(normArray)}`);
      console.log(`   Full Text contains "react": ${fullTextLower.includes('react')}`);
      
      // Test each extracted skill
      for (const skillId of extractedSkillIds) {
        console.log(`\n   Testing skill: "${skillId}"`);
        const s = skillId.toLowerCase();
        
        // Check normalized skills array
        const inNormArray = normArray.includes(s);
        console.log(`     In normalized skills: ${inNormArray}`);
        
        // Check original skills array (case-insensitive)
        const inSkillsLower = skillsLower.includes(s);
        console.log(`     In skills (lowercase): ${inSkillsLower}`);
        
        // Check full text (case-insensitive)
        const inFullText = fullTextLower.includes(s);
        console.log(`     In full text: ${inFullText}`);
        
        // Check if any match
        const hasMatch = inNormArray || inSkillsLower || inFullText;
        console.log(`     Has match: ${hasMatch}`);
      }
      
      // Test 4: Check if the issue is with the word boundary
      console.log('\n🔍 Step 4: Testing word boundary matching...');
      
      for (const skillId of extractedSkillIds) {
        const s = skillId.toLowerCase();
        if (s.length > 2 && !s.includes(' ')) {
          const wordBoundaryRegex = new RegExp(`\\b${s}\\b`, 'i');
          const matchesWordBoundary = wordBoundaryRegex.test(fullTextLower);
          console.log(`   Skill "${s}" matches word boundary: ${matchesWordBoundary}`);
          
          // Show context around the match
          const matchIndex = fullTextLower.indexOf(s);
          if (matchIndex !== -1) {
            const context = fullTextLower.substring(Math.max(0, matchIndex - 20), matchIndex + s.length + 20);
            console.log(`   Context: "...${context}..."`);
          }
        }
      }
      
    } else {
      console.log('❌ No CVs found in the index');
    }
    
    console.log('\n🎉 Testing completed!');
    
  } catch (error) {
    console.log('❌ Testing failed:');
    console.log('Error:', error.message);
  }
}

testActualSearch(); 