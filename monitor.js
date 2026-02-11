require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');
const config = require('./config');

// Check for missing keys
if (!process.env.API_KEY || !process.env.ACCESS_TOKEN) {
    console.error("❌ Credentials missing! Please fill in .env file.");
    process.exit(1);
}

// Initialize client with user context (REQUIRED for home timeline)
const client = new TwitterApi({
    appKey: process.env.API_KEY,
    appSecret: process.env.ACCESS_TOKEN ? process.env.API_SECRET : process.env.API_SECRET, // Quick fix logic
    // Wait, the correct config is:
    // appKey, appSecret, accessToken, accessSecret.
    // The previous file had:
    // appKey: process.env.API_KEY
    // appSecret: process.env.API_SECRET
    // accessToken: process.env.ACCESS_TOKEN
    // accessSecret: process.env.ACCESS_SECRET
    // Let's stick to that.
    appKey: process.env.API_KEY,
    appSecret: process.env.API_SECRET,
    accessToken: process.env.ACCESS_TOKEN,
    accessSecret: process.env.ACCESS_SECRET,
});

// Avoid accidentally replying to self
let myUserId = null;
let lastTweetId = null;

// Keywords to filter (from .env)
const KEYWORDS = process.env.FILTER_KEYWORDS 
    ? process.env.FILTER_KEYWORDS.split(',').map(k => k.trim().toLowerCase()) 
    : [];

async function getMyUserId() {
    try {
        const user = await client.v2.me();
        myUserId = user.data.id;
        console.log(`✅ Logged in as: @${user.data.username} (ID: ${myUserId})`);
    } catch (e) {
        console.error("❌ Login Failed:", e.message);
        if (e.code === 403) {
            console.error("\n⚠️  API ERROR: 403 Forbidden");
            console.error("   This usually means your API keys don't have permission OR your tier is too low.");
            console.error("   The Free tier CANNOT read timelines. You need Basic ($100/mo).");
        }
        process.exit(1);
    }
}

async function checkTimeline() {
    try {
        console.log(`\n⏳ Checking following timeline... [${new Date().toLocaleTimeString()}]`);

        // Fetch home timeline (tweets from people you follow)
        // Adjust max_results as needed (minimum usually 5 or 10)
        // Exclude retweets and replies to keep it clean
        const homeTimeline = await client.v2.homeTimeline({ 
            max_results: 10,
            exclude: ['retweets', 'replies'] 
        });

        // Loop through tweets (older first, so we reply in order if needed)
        // But usually we just grab the newest ones.
        // The API returns newest first.
        const tweets = homeTimeline.tweets; // This is an array of TweetV2

        if (!tweets || tweets.length === 0) {
            console.log("   No tweets found.");
            return;
        }

        const newestTweet = tweets[0];

        // If it's the first run, just set the ID and don't reply to avoid spamming old stuff
        if (!lastTweetId) {
            lastTweetId = newestTweet.id;
            console.log(`   First run. Tracking from ID: ${lastTweetId}`);
            return;
        }

        // Only process tweets newer than last seen
        const newTweets = tweets.filter(t => t.id > lastTweetId);

        if (newTweets.length === 0) {
            console.log("   No new tweets since last check.");
            return;
        }

        console.log(`   Found ${newTweets.length} new tweet(s)!`);

        // Update last seen ID immediately
        lastTweetId = newestTweet.id;

        // Process each new tweet (up to MAX_REPLIES_PER_CYCLE)
        let replyCount = 0;
        for (const tweet of newTweets) {
            if (replyCount >= config.MAX_REPLIES_PER_CYCLE) {
                console.log("   Hit max replies per cycle, stopping for now.");
                break;
            }

            // 1. Skip if it's our own tweet
            if (tweet.author_id === myUserId) continue;

            // 2. Keyword Filter
            const textLower = tweet.text.toLowerCase();
            const hasKeyword = KEYWORDS.length === 0 || KEYWORDS.some(k => textLower.includes(k));

            if (!hasKeyword) {
                if (config.DEBUG_MODE) console.log(`   Skipping tweet (no keyword match): "${tweet.text.substring(0, 30)}..."`);
                continue;
            }

            // 3. Select Reply
            const replyText = config.REPLIES[Math.floor(Math.random() * config.REPLIES.length)];

            // 4. Send Reply
            try {
                // Rate limit safety: Pause slightly
                await new Promise(r => setTimeout(r, 2000)); 

                // Note: v2.reply is actually strictly typed in Typescript but in JS handles nicely.
                // However, correct generic reply function for v2:
                await client.v2.reply(replyText, tweet.id);
                console.log(`✅ Replied to tweet ${tweet.id}: "${replyText}"`);
                replyCount++;
                
            } catch (err) {
                console.error(`❌ Failed to reply to ${tweet.id}:`, err.message);
                if (err.code === 403) {
                     console.error("   (Perhaps trying to reply to a protected tweet or banned?)");
                }
            }
        }

    } catch (e) {
        console.error("❌ Error fetching timeline:", e.message);
        if(e.code === 429) {
            console.error("⚠️ Rate Limit Exceeded. Waiting longer...");
        }
    }
}

// Main function
(async () => {
    await getMyUserId();
    
    // Check every X seconds
    setInterval(checkTimeline, config.CHECK_INTERVAL_SECONDS * 1000); 

    // Initial check
    checkTimeline();
})();
