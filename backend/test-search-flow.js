// Test the exact search flow to identify the issue
// Run this with: node test-search-flow.js

const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

async function testSearchFlow() {
  console.log('🔍 Testing exact search flow...\n');
  
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
    
    // Simulate the exact search flow from the service
    console.log('\n📋 Step 1: Simulating search flow for "react developer"...');
    
    // Step 1: Extract skills from query
    const query = 'react developer';
    const q = query.toLowerCase();
    
    // This is the exact skill catalog from the service
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
    
    // Step 2: Check if we have skill terms
    const hasSkillTerms = extractedSkillIds.length > 0;
    console.log(`   Has skill terms: ${hasSkillTerms}`);
    
    // Step 3: Get CVs from Pinecone (simulate the query)
    console.log('\n🔍 Step 2: Querying Pinecone...');
    
    // Use a dummy vector since we can't generate real embeddings here
    const dummyVector = new Array(3072).fill(0.1);
    
    const searchResponse = await index.query({
      vector: dummyVector,
      topK: 100, // Same as the service
      includeMetadata: true,
    });
    
    let results = searchResponse.matches || [];
    console.log(`   Pinecone returned ${results.length} results before filtering`);
    
    // Step 4: Apply skill filtering (exact logic from service)
    if (hasSkillTerms) {
      console.log('\n🔧 Step 3: Applying skill filtering...');
      console.log(`   Starting with ${results.length} results`);
      
      const filteredResults = results.filter(match => {
        const skillsMeta = match.metadata?.skills;
        const skillsNorm = match.metadata?.skillsNormalized;
        const fullText = match.metadata?.fullText;
        const skillsArray = Array.isArray(skillsMeta) ? skillsMeta : [];
        const normArray = Array.isArray(skillsNorm) ? skillsNorm : [];
        const skillsLower = skillsArray.map(s => (typeof s === 'string' ? s.toLowerCase() : ''));
        const fullTextLower = typeof fullText === 'string' ? fullText.toLowerCase() : '';
        
        // Check if ANY of the extracted skills are present (case-insensitive)
        const skillMatch = extractedSkillIds.some(skillId => {
          const s = skillId.toLowerCase();
          
          // Check normalized skills array
          if (normArray.includes(s)) {
            console.log(`     ✅ Skill "${s}" matched in normalized skills array`);
            return true;
          }
          
          // Check original skills array (case-insensitive)
          if (skillsLower.includes(s)) {
            console.log(`     ✅ Skill "${s}" matched in original skills array`);
            return true;
          }
          
          // Check full text (case-insensitive)
          if (fullTextLower.includes(s)) {
            console.log(`     ✅ Skill "${s}" matched in full text`);
            return true;
          }
          
          // Check skill variants (case-insensitive)
          const skillVariants = getSkillVariants(s);
          if (skillVariants.some(v => fullTextLower.includes(v.toLowerCase()))) {
            console.log(`     ✅ Skill "${s}" matched via skill variants`);
            return true;
          }
          
          // Additional check: if the skill is a single word, check if it appears as a standalone word in text
          if (s.length > 2 && !s.includes(' ')) {
            const wordBoundaryRegex = new RegExp(`\\b${s}\\b`, 'i');
            if (wordBoundaryRegex.test(fullTextLower)) {
              console.log(`     ✅ Skill "${s}" matched via word boundary regex`);
              return true;
            }
          }
          
          console.log(`     ❌ Skill "${s}" did not match`);
          return false;
        });
        
        if (!skillMatch) {
          console.log(`   ❌ CV ${match.metadata?.filename || match.id} filtered out - no skills matched`);
        } else {
          console.log(`   ✅ CV ${match.metadata?.filename || match.id} passed skill filter`);
        }
        
        return skillMatch;
      });
      
      console.log(`   After skill filtering: ${filteredResults.length} results`);
      results = filteredResults;
    }
    
    // Step 5: Apply similarity threshold
    console.log('\n🔍 Step 4: Applying similarity threshold...');
    const similarityThreshold = hasSkillTerms ? 0.01 : 0.3;
    console.log(`   Threshold: ${similarityThreshold}`);
    
    const thresholdResults = results.filter(match => {
      const passes = typeof match.score === 'number' ? match.score >= similarityThreshold : true;
      if (!passes) {
        console.log(`   ❌ CV ${match.metadata?.filename || match.id} filtered out - score ${match.score} < ${similarityThreshold}`);
      } else {
        console.log(`   ✅ CV ${match.metadata?.filename || match.id} passed threshold - score ${match.score}`);
      }
      return passes;
    });
    
    console.log(`   After similarity threshold: ${thresholdResults.length} results`);
    
    // Step 6: Final results
    console.log('\n🎯 Final Results:');
    if (thresholdResults.length > 0) {
      thresholdResults.forEach((result, index) => {
        const metadata = result.metadata || {};
        console.log(`   ${index + 1}. ${metadata.filename || 'unknown'} (Score: ${result.score})`);
      });
    } else {
      console.log('   ❌ No results found!');
    }
    
    console.log('\n🎉 Search flow testing completed!');
    
  } catch (error) {
    console.log('❌ Testing failed:');
    console.log('Error:', error.message);
  }
}

// Simplified skill variants function for testing
function getSkillVariants(skillId) {
  const catalog = {
    react: ['react', 'reactjs', 'react.js', 'react native', 'React', 'ReactJS', 'React.js', 'React Native'],
    javascript: ['javascript', 'js', 'ecmascript', 'JavaScript', 'JS', 'ECMAScript'],
    python: ['python', 'py', 'Python', 'PY']
  };
  return catalog[skillId] || [skillId];
}

testSearchFlow(); 