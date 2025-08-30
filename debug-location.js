// Debug script to test location filtering logic
const testLocationLogic = () => {
  console.log('Testing location filtering logic...\n');

  // Simulate the location filtering logic from the backend
  const finalLocation = 'Sialkot';
  const finalLocationNormalized = 'sialkot';
  
  console.log(`Query location: "${finalLocation}"`);
  console.log(`Normalized location: "${finalLocationNormalized}"`);
  
  // Test CV data
  const testCv = {
    id: 'test-1',
    metadata: {
      filename: 'Resume.pdf',
      location: 'Sialkot Pakistan',
      fullText: 'Some text about Sialkot Pakistan'
    }
  };
  
  console.log(`\nTest CV location: "${testCv.metadata.location}"`);
  
  // Apply the location filtering logic
  const loc = testCv.metadata.location;
  const fullText = testCv.metadata.fullText;
  const locLower = typeof loc === 'string' ? loc.toLowerCase() : '';
  const fullTextLower = typeof fullText === 'string' ? fullText.toLowerCase() : '';
  const qLoc = finalLocation.toLowerCase();
  const qLocNorm = finalLocationNormalized.toLowerCase();
  
  console.log(`\nLowercase values:`);
  console.log(`  CV location: "${locLower}"`);
  console.log(`  Query location: "${qLoc}"`);
  console.log(`  Query normalized: "${qLocNorm}"`);
  
  // Test each strategy
  let hasLocation = false;
  
  // Strategy 1: exact match in location field (case-insensitive)
  if (locLower === qLoc) {
    hasLocation = true;
    console.log(`✅ Strategy 1: Exact location match: "${loc}" = "${finalLocation}"`);
  } else {
    console.log(`❌ Strategy 1: No exact match`);
  }
  
  // Strategy 2: query location contained in stored location
  if (locLower.includes(qLoc)) {
    hasLocation = true;
    console.log(`✅ Strategy 2: Location contains query: "${loc}" contains "${finalLocation}"`);
  } else {
    console.log(`❌ Strategy 2: Location doesn't contain query`);
  }
  
  // Strategy 3: stored location contains query location
  if (qLoc.includes(locLower) && locLower.length > 3) {
    hasLocation = true;
    console.log(`✅ Strategy 3: Query contains location: "${finalLocation}" contains "${loc}"`);
  } else {
    console.log(`❌ Strategy 3: Query doesn't contain location`);
  }
  
  // Strategy 4: normalized location matching
  if (finalLocationNormalized && locLower.includes(qLocNorm)) {
    hasLocation = true;
    console.log(`✅ Strategy 4: Normalized location match: "${loc}" contains "${finalLocationNormalized}"`);
  } else {
    console.log(`❌ Strategy 4: No normalized match`);
  }
  
  // Strategy 5: check if location appears in full text
  if (fullTextLower.includes(qLoc)) {
    hasLocation = true;
    console.log(`✅ Strategy 5: Location found in full text: "${finalLocation}"`);
  } else {
    console.log(`❌ Strategy 5: Location not found in full text`);
  }
  
  console.log(`\nFinal result: ${hasLocation ? 'MATCH' : 'NO MATCH'}`);
  
  // Test with different locations
  console.log('\n' + '='.repeat(50));
  console.log('Testing with different locations:');
  
  const testLocations = ['Karachi', 'Karāchi', 'Sialkot', 'Pakistan'];
  
  testLocations.forEach(testLoc => {
    const testLocLower = testLoc.toLowerCase();
    const testLocNorm = testLoc.toLowerCase(); // Simplified normalization
    
    let match = false;
    
    // Test if testLoc is contained in CV location
    if (locLower.includes(testLocLower)) {
      match = true;
    }
    
    console.log(`  "${testLoc}" in "${loc}": ${match ? '✅' : '❌'}`);
  });
};

// Run the test
testLocationLogic(); 