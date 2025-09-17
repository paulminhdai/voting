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

// Function to get voting session data with fresh incognito-like session
async function getVotingSession(userAgent, attemptNumber) {
  try {
    console.log(`🔍 Creating fresh session ${attemptNumber} (mimicking incognito mode)...`);
    
    // Create completely fresh headers for each attempt (like incognito)
    const freshHeaders = {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Chromium";v="120", "Not-A?Brand";v="24", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Connection': 'keep-alive',
      // Force no cookies (fresh incognito session)
      'Cookie': ''
    };
    
    console.log('🌐 Fetching poll page with fresh headers (no cookies)...');
    
    const response = await fetch(POLL_PAGE_URL, {
      method: 'GET',
      headers: freshHeaders,
      // Disable any automatic cookie handling
      credentials: 'omit'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract the voting key from the HTML
    console.log('🔑 Extracting fresh voting key...');
    const keyPatterns = [
      { name: 'key:', pattern: /key["\s]*:["\s]*["']([^"']+)["']/i },
      { name: '"key":', pattern: /"key"["\s]*:["\s]*["']([^"']+)["']/i },
      { name: 'data-key=', pattern: /data-key["\s]*=["\s]*["']([^"']+)["']/i },
      { name: 'window.key', pattern: /window\.key["\s]*=["\s]*["']([^"']+)["']/i },
      { name: 'var key', pattern: /var\s+key["\s]*=["\s]*["']([^"']+)["']/i },
      { name: 'let key', pattern: /let\s+key["\s]*=["\s]*["']([^"']+)["']/i },
      { name: 'const key', pattern: /const\s+key["\s]*=["\s]*["']([^"']+)["']/i }
    ];
    
    let key = null;
    for (const { name, pattern } of keyPatterns) {
      const match = html.match(pattern);
      if (match) {
        key = match[1];
        console.log(`✅ Found key using pattern '${name}': ${key}`);
        break;
      } else {
        console.log(`❌ No match for pattern '${name}'`);
      }
    }
    
    if (!key) {
      console.log('⚠️ Could not find voting key in HTML, extracting from scripts...');
      // More aggressive extraction from script tags
      const scripts = html.match(/<script[^>]*>(.*?)<\/script>/gis) || [];
      for (const script of scripts) {
        const keyMatch = script.match(/["']([a-zA-Z0-9]{8,})["']/g);
        if (keyMatch) {
          // Find the most likely key (8+ alphanumeric characters)
          const candidates = keyMatch.map(m => m.replace(/['"]/g, ''))
                                    .filter(k => k.length >= 8 && /^[a-zA-Z0-9]+$/.test(k));
          if (candidates.length > 0) {
            key = candidates[0]; // Take the first candidate
            console.log(`🔍 Extracted potential key from script: ${key}`);
            break;
          }
        }
      }
    }

    if (key) {
      console.log(`✅ Found fresh voting key: ${key}`);
    } else {
      console.log('⚠️ No voting key found, will use fallback');
    }
    
    // Get fresh cookies from this session
    const setCookieHeader = response.headers.get('set-cookie');
    const freshCookies = setCookieHeader ? setCookieHeader.split(',').map(c => c.split(';')[0]).join('; ') : '';
    
    if (freshCookies) {
      console.log(`🍪 Fresh session cookies obtained: ${freshCookies.substring(0, 50)}...`);
    }
    
    return { 
      key: key || null, 
      cookies: freshCookies,
      userAgent: userAgent,
      sessionId: `session_${attemptNumber}_${Date.now()}`
    };
    
  } catch (error) {
    console.error('❌ Error creating fresh session:', error.message);
    return { key: null, cookies: null, userAgent: userAgent };
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

// Function to submit vote with fresh incognito-like session
async function submitVote(key, choiceId, sessionData) {
  try {
    const payload = {
      choices: [choiceId],
      ticket: "",
      key: key
    };

    console.log(`📤 Submitting vote with fresh session payload:`, payload);
    console.log(`🔐 Session ID: ${sessionData.sessionId}`);

    // Create fresh headers for each vote (like opening new incognito window)
    const freshVoteHeaders = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Content-Type': 'application/json',
      'Origin': 'https://vote.easypolls.net',
      'Pragma': 'no-cache',
      'Referer': POLL_PAGE_URL,
      'Sec-Ch-Ua': '"Chromium";v="120", "Not-A?Brand";v="24", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': sessionData.userAgent
    };

    // Only use cookies from this fresh session (like incognito)
    if (sessionData.cookies && sessionData.cookies.trim()) {
      freshVoteHeaders['Cookie'] = sessionData.cookies;
      console.log(`🍪 Using fresh session cookies: ${sessionData.cookies.substring(0, 50)}...`);
    } else {
      console.log(`🚫 No cookies (fresh incognito-like session)`);
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: freshVoteHeaders,
      body: JSON.stringify(payload),
      // Ensure no persistent connection/session data
      credentials: 'include' // Use cookies only from this specific session
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

// Main voting function - mimics opening fresh incognito window each time
async function performVote(attemptNumber) {
  console.log(`\n=== Vote Attempt ${attemptNumber} (Fresh Incognito Session) ===`);
  
  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  console.log(`🌐 Using User Agent: ${userAgent.substring(0, 60)}...`);
  
  // Create completely fresh session (like opening new incognito window)
  const sessionData = await getVotingSession(userAgent, attemptNumber);
  
  if (!sessionData.key) {
    console.log('❌ Failed to get voting key - this will likely cause vote rejection');
    console.log('🚨 CRITICAL: No voting key found. Vote will probably fail.');
    return false; // Don't attempt vote without proper key
  }
  
  // Add delay to simulate human behavior (like manually opening incognito)
  const delay = randomDelay(2, 5);
  console.log(`⏳ Waiting ${delay/1000} seconds before voting (simulating human behavior)...`);
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Submit vote using the fresh session data (using choice ID 3 for SBD25)
  const result = await submitVote(sessionData.key, 3, sessionData);
  
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
      console.log('💡 This suggests the voting system detected this as a duplicate vote');
    } else {
      console.log('❌ Vote failed:', result.error);
    }
    if (result.data) console.log('📊 Response data:', result.data);
    if (result.body) console.log('📄 Response body:', result.body);
    return false;
  }
  
  // Clean up session (like closing incognito window)
  console.log(`🗑️ Cleaning up session ${sessionData.sessionId}`);
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
      
      // Random delay between fresh incognito sessions (10-30 seconds)
      if (i < totalAttempts) {
        const delay = randomDelay(10, 30);
        console.log(`⏳ Waiting ${delay/1000} seconds before opening next fresh incognito session...`);
        console.log(`💭 (Simulating: close incognito → wait → open new incognito → vote)`);
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
