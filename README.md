# EasyPolls Voting Automation

A Node.js script to automate voting on EasyPolls for contestant **SBD25 NGUYỄN LÊ ANH KHOA**.

## 🎯 Target Poll

- **Poll URL**: https://vote.easypolls.net/68c3a490b684950062d0a412
- **Target Contestant**: SBD25 NGUYỄN LÊ ANH KHOA
- **Poll Question**: "Bình chọn thí sinh được yêu thích nhất?" (Vote for the most beloved contestant?)

## 🚀 Features

- **Direct API Integration**: Bypasses browser automation for faster, more reliable voting
- **Smart Session Management**: Automatically extracts voting keys and session data
- **Anti-Detection Measures**: 
  - User agent rotation
  - Random delays between votes
  - Human-like behavior simulation
- **Comprehensive Logging**: Detailed progress tracking and success statistics
- **Error Handling**: Robust error handling with fallback mechanisms

## 📋 Prerequisites

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- Internet connection

## 🔧 Installation

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd vote
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## 🎮 Usage

### Method 1: Using npm scripts (Recommended)

```bash
# Run the direct API voting script
npm run vote
```

### Method 2: Direct execution

```bash
# Run the API script directly
node api_vote_direct.mjs
```

## 📊 Expected Output

The script will show detailed progress for each voting attempt:

```
🚀 Starting Direct API Voting Script
🎯 Target: SBD25 NGUYỄN LÊ ANH KHOA
🔗 Poll URL: https://vote.easypolls.net/68c3a490b684950062d0a412
🔗 API URL: https://vote.easypolls.net/api/vote/68c3a490b684950062d0a412

=== Vote Attempt 1 ===
🌐 Using User Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...
🔍 Fetching voting session data...
✅ Found voting key: otk8vybr
⏳ Waiting 2 seconds before voting...
📤 Submitting vote with payload: {"choices":[3],"ticket":"","key":"otk8vybr"}
📥 Response status: 200
📥 Response body: {"code":0,"revoteDate":2073345655572}
🎉 Vote submitted successfully!
⏳ Waiting 8 seconds before next attempt...

=== Final Results ===
📊 Total attempts: 10
✅ Successful votes: 8
📈 Success rate: 80.0%
```

## 🔍 How It Works

1. **Session Extraction**: The script first visits the poll page to extract the current voting key and session data
2. **Choice Mapping**: Automatically finds the choice ID for SBD25 NGUYỄN LÊ ANH KHOA
3. **API Voting**: Sends direct POST requests to the voting API endpoint
4. **Response Validation**: Checks response codes and data to confirm successful votes
5. **Rate Limiting**: Uses random delays (5-15 seconds) between votes to avoid detection

## 📁 Project Structure

```
vote/
├── api_vote_direct.mjs    # Main voting script (direct API calls)
├── package.json           # Node.js dependencies and scripts
├── README.md             # This file
└── .gitignore           # Git ignore rules
```

## ⚙️ Configuration

You can modify the script behavior by editing `api_vote_direct.mjs`:

- **Number of votes**: Change `totalAttempts = 10` to your desired number
- **Delay between votes**: Modify `randomDelay(5, 15)` values (in seconds)
- **Target contestant**: Update the choice ID or search pattern
- **User agents**: Add/remove user agents from the `userAgents` array

## 🛠️ Troubleshooting

### Common Issues:

1. **No votes registered**:
   - The voting system may use IP-based rate limiting
   - Try running with longer delays between attempts
   - Check if the poll is still active

2. **"Voting key not found" errors**:
   - The poll page structure may have changed
   - The script will use a fallback key, but it might not work

3. **HTTP errors**:
   - Check your internet connection
   - Verify the poll URL is still valid
   - The poll may have ended or been disabled

### Debug Mode:

For more detailed debugging, check the console output. The script provides comprehensive logging for each step.

## ⚠️ Legal and Ethical Considerations

- This script is for educational purposes and testing API functionality
- Ensure you comply with the website's Terms of Service
- Use responsibly and avoid overwhelming the server with too many requests
- Consider the fairness implications of automated voting

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## 📄 License

This project is for educational purposes. Use at your own discretion and responsibility.

---

**Note**: This script was created based on network analysis of the EasyPolls voting system. If the system changes, the script may need updates.
