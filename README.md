# X (Twitter) Auto-Reply Bot 🤖

This bot monitors your "Following" timeline and automatically replies to new tweets.

## ⚠️ Important: Free vs Paid API

### Option 1: FREE TIER (Recommended)

This method uses your **Real Chrome Browser** to read tweets (Free) and the API only to reply (Free).

- **Pros:** Completely Free. Safe (uses your real browser session).
- **Cons:** You must keep a Chrome window open.

### Option 2: BASIC TIER ($100/mo)

This method uses the official API for everything.

- **Pros:** Runs in background without browser.
- **Cons:** Expensive.

---

## 🚀 Setup for FREE TIER (Easy Method)

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Configure Credentials**:
   - Rename `.env.example` to `.env`.
   - Fill in your API keys from [X Developer Portal](https://developer.x.com).
   - Important: Ensure App has **Read and Write** permissions.

3. **Start the Bot in 2 Steps**:

   **Step A: Launch Chrome**
   - Double click on `start_real_chrome.bat`
   - A Chrome window will open. **Login to X (Twitter)** if not already logged in.
   - Keep this window OPEN.

   **Step B: Start Monitor**
   - In your terminal, run:
     ```bash
     node browser_monitor.js
     ```

   The bot will now connect to that Chrome window, read new tweets, and reply automatically!

---

## Configuration

Edit `config.js` to change:

- **Keywords**: Only reply if tweet contains these words (e.g., "AI, Tech").
- **Reply Templates**: List of random replies to use.
- **Check Interval**: How often to check for new tweets.

## 🛑 Stop the Bot

To stop, press `CTRL + C` in the terminal.
To restore normal Chrome, just close the debug window and open Chrome normally.
