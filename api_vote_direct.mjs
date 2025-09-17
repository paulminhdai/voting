import fetch from 'node-fetch';

// Configuration
const POLL_ID = '68c3a490b684950062d0a412';
const API_URL = `https://vote.easypolls.net/api/vote/${POLL_ID}`;
const POLL_PAGE_URL = `https://vote.easypolls.net/${POLL_ID}`;

// User agents for rotation
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0'
];

// Function to get voting session data (key and choice mapping)
async function getVotingSession(userAgent) {
  try {
    console.log('🔍 Fetching voting session data...');
    
    const response = await fetch(POLL_PAGE_URL, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract the voting key from the HTML (it's usually in a script tag or data attribute)
    // Look for patterns like: key:"otk8vybr" or data-key="otk8vybr"
    const keyMatch = html.match(/key["\s]*:["\s]*["']([^"']+)["']/i) || 
                     html.match(/data-key["\s]*=["\s]*["']([^"']+)["']/i) ||
                     html.match(/"key"["\s]*:["\s]*["']([^"']+)["']/i);
    
    if (!keyMatch) {
      console.log('⚠️ Could not find voting key in HTML, using fallback');
      // Try to extract from any script containing key pattern
      const scriptMatch = html.match(/<script[^>]*>.*?key.*?["']([a-zA-Z0-9]+)["'].*?<\/script>/is);
      if (scriptMatch) {
        return { key: scriptMatch[1], cookies: response.headers.get('set-cookie') };
      }
      return { key: null, cookies: response.headers.get('set-cookie') };
    }

    const key = keyMatch[1];
    console.log(`✅ Found voting key: ${key}`);
    
    // Extract cookies from response
    const cookies = response.headers.get('set-cookie');
    
    return { key, cookies };
    
  } catch (error) {
    console.error('❌ Error fetching session:', error.message);
    return { key: null, cookies: null };
  }
}

// Function to find the choice ID for SBD25
function findChoiceId(html) {
  // Look for SBD25 NGUYỄN LÊ ANH KHOA in the HTML and find its associated value
  // This is a bit tricky as we need to parse the HTML structure
  
  // Try different patterns to find the choice ID
  const patterns = [
    /value["\s]*=["\s]*["'](\d+)["'][^>]*>.*?SBD25.*?NGUYỄN LÊ ANH KHOA/is,
    /SBD25.*?NGUYỄN LÊ ANH KHOA[^>]*value["\s]*=["\s]*["'](\d+)["']/is,
    /<input[^>]*value["\s]*=["\s]*["'](\d+)["'][^>]*>.*?SBD25.*?NGUYỄN LÊ ANH KHOA/is
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      console.log(`✅ Found choice ID for SBD25: ${match[1]}`);
      return parseInt(match[1]);
    }
  }
  
  console.log('⚠️ Could not find choice ID, using fallback value 3');
  return 3; // Fallback based on your network data
}

// Function to submit vote
async function submitVote(key, choiceId, userAgent, cookies) {
  try {
    const payload = {
      choices: [choiceId],
      ticket: "",
      key: key
    };

    console.log(`📤 Submitting vote with payload:`, payload);

    const headers = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'en-US,en;q=0.9',
      'Connection': 'keep-alive',
      'Content-Type': 'application/json',
      'Origin': 'https://vote.easypolls.net',
      'Referer': POLL_PAGE_URL,
      'Sec-Ch-Ua': '"Chromium";v="120", "Not-A?Brand";v="24", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': userAgent
    };

    // Add cookies if available
    if (cookies) {
      headers['Cookie'] = cookies;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log(`📥 Response status: ${response.status}`);
    console.log(`📥 Response body: ${responseText}`);

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}`, body: responseText };
    }

    try {
      const data = JSON.parse(responseText);
      
      // Check for success indicators - revoteDate presence means vote was actually registered
      if (data.code === 0 && data.revoteDate) {
        return { success: true, data: data };
      } else if (data.code === 0 && !data.revoteDate) {
        return { success: false, error: 'Vote rejected (no revoteDate - likely duplicate/blocked)', data: data };
      } else {
        return { success: false, error: 'Vote not accepted', data: data };
      }
    } catch (parseError) {
      // If response is not JSON, check if it's a success page
      if (response.status === 200) {
        return { success: true, data: { raw: responseText } };
      }
      return { success: false, error: 'Invalid response format', body: responseText };
    }

  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Random delay function
const randomDelay = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
};

// Main voting function
async function performVote(attemptNumber) {
  console.log(`\n=== Vote Attempt ${attemptNumber} ===`);
  
  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  console.log(`🌐 Using User Agent: ${userAgent.substring(0, 60)}...`);
  
  // Get session data
  const session = await getVotingSession(userAgent);
  
  if (!session.key) {
    console.log('❌ Failed to get voting key, trying with fallback');
    // Try with a known key pattern or generate one
    session.key = 'otk8vybr'; // Fallback from your network data
  }
  
  // Add delay to simulate human behavior
  const delay = randomDelay(1, 3);
  console.log(`⏳ Waiting ${delay/1000} seconds before voting...`);
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Submit vote (using choice ID 3 for SBD25 based on your network data)
  const result = await submitVote(session.key, 3, userAgent, session.cookies);
  
  if (result.success) {
    console.log('🎉 Vote submitted and registered successfully!');
    console.log('📊 Response data:', result.data);
    if (result.data.revoteDate) {
      const revoteTime = new Date(result.data.revoteDate).toLocaleString();
      console.log(`⏰ Next vote allowed at: ${revoteTime}`);
    }
    return true;
  } else {
    if (result.error.includes('no revoteDate')) {
      console.log('⚠️ Vote was sent but NOT registered (likely blocked/duplicate)');
    } else {
      console.log('❌ Vote failed:', result.error);
    }
    if (result.data) console.log('📊 Response data:', result.data);
    if (result.body) console.log('📄 Response body:', result.body);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Direct API Voting Script');
  console.log(`🎯 Target: SBD25 NGUYỄN LÊ ANH KHOA`);
  console.log(`🔗 Poll URL: ${POLL_PAGE_URL}`);
  console.log(`🔗 API URL: ${API_URL}\n`);
  
  let successfulVotes = 0;
  const totalAttempts = 40;
  
  for (let i = 1; i <= totalAttempts; i++) {
    try {
      const success = await performVote(i);
      if (success) {
        successfulVotes++;
      }
      
      // Random delay between votes (5-15 seconds)
      if (i < totalAttempts) {
        const delay = randomDelay(5, 15);
        console.log(`⏳ Waiting ${delay/1000} seconds before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
    } catch (error) {
      console.error(`❌ Unexpected error in attempt ${i}:`, error.message);
    }
  }
  
  console.log(`\n=== Final Results ===`);
  console.log(`📊 Total attempts: ${totalAttempts}`);
  console.log(`✅ Successful votes (with revoteDate): ${successfulVotes}`);
  console.log(`📈 Success rate: ${(successfulVotes/totalAttempts*100).toFixed(1)}%`);
  
  if (successfulVotes === 0) {
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. ⚠️ If you see responses with {code: 0} but no revoteDate:');
    console.log('   - The voting system is blocking duplicate votes from your IP');
    console.log('   - Try using a VPN or different network connection');
    console.log('   - Wait longer between attempts (try hours instead of minutes)');
    console.log('2. The voting system may be using IP-based rate limiting');
    console.log('3. The voting key extraction might need adjustment');
    console.log('4. The choice ID for SBD25 might be different than expected');
    console.log('5. Try running the script with much longer delays between attempts');
  } else if (successfulVotes < totalAttempts / 2) {
    console.log('\n⚠️ Low success rate detected:');
    console.log('- Some votes are being blocked (responses without revoteDate)');
    console.log('- Consider increasing delays between votes');
    console.log('- The voting system may have anti-spam measures in place');
  }
}

// Run the script
main().catch(console.error);
