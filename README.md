# X (Twitter) Auto-Reply Bot 🤖

This bot monitors your "Following" timeline and automatically replies to new tweets.

## ⚠️ CRITICAL WARNINGS (must read)

1. **API Tier Requirement**:
   - The **Free** Twitter API tier does NOT allow reading the home timeline.
   - You need at least the **Basic** tier ($100/mo) to read timelines via API.
   - If you are on the **Free** tier, this bot will *fail* to read tweets.

2. **Ban Risk**:
   - Auto-replying to *every* tweet is considered SPAM.
   - X (Twitter) will likely suspend your account if you reply too frequently or with the same text.
   - **Recommendation**: Only reply to specific keywords or limit the frequency.

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Credentials**:
   - Rename `.env.example` to `.env`.
   - Fill in your API keys from the [X Developer Portal](https://developer.x.com).
   - You need **User Context** tokens (Access Token & Secret) with strictly `read` and `write` permissions.

3. **Run the Bot**:
   ```bash
   node bot.js
   ```

## Configuration

Edit `config.js` to change:
- **Keywords**: Only reply if tweet contains these words (leave empty for all).
- **Reply Templates**: List of replies to rotate through.
- **Check Interval**: How often to check for new tweets (default: 60 seconds).
