require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');
const puppeteer = require('puppeteer');
const config = require('./config');

// === IMPORTANT SAFETY ===
// 1. Logs in via Browser (Read Timeline = Free)
// 2. Replies via API (Write Tweet = Free within limits)

// Check for missing keys
if (!process.env.API_KEY || !process.env.ACCESS_TOKEN) {
    console.error("❌ ERROR: API Keys are missing!");
    console.error("👉 Step 1: Rename '.env.example' to '.env'");
    console.error("👉 Step 2: Open '.env' and paste your keys from developer.x.com");
    process.exit(1);
}

// Initialize simple API client for write-only operations
const client = new TwitterApi({
    appKey: process.env.API_KEY,
    appSecret: process.env.API_SECRET,
    accessToken: process.env.ACCESS_TOKEN,
    accessSecret: process.env.ACCESS_SECRET,
});

// State to avoid duplicate replies
const seenTweetIds = new Set();
let myUsername = null;

// Helper: Sleep
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Helper to find local Chrome
function getChromePath() {
    const fs = require('fs');
    const paths = [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe"
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

async function startMonitoring() {
    console.log("\n🚀 STARTING HYBRID BOT (Puppeteer Read + API Write)");
    console.log("---------------------------------------------------");
    console.log("👉 A Chrome window will open.");
    console.log("👉 Please LOGIN to X manually in that window.");
    console.log("👉 Once logged in, go to your HOME timeline.");
    console.log("---------------------------------------------------");

    const executablePath = getChromePath();
    if (executablePath) {
        console.log(`✅ Found local Chrome at: ${executablePath}`);
    } else {
        console.log("ℹ️  Local Chrome not found, trying Puppeteer bundled version...");
    }

    // Connect to already running Chrome (Started by start_real_chrome.bat)
    console.log("👉 Connecting to YOUR Real Chrome...");
    
    let browser;
    try {
        browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        console.log("✅ Connected successfully!");
    } catch (e) {
        console.error("❌ FAILED TO CONNECT TO CHROME. Did you run 'start_real_chrome.bat'?");
        console.error(e.message);
        process.exit(1);
    }

    // Get the active page (don't open a new one if possible)
    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();
    
    // Attempt to go to login page
    try {
        await page.goto('https://x.com/i/flow/login', { waitUntil: 'networkidle2', timeout: 60000 });
    } catch (e) {
        console.log("⚠️ Could not load login page (timeout). Just use the browser manually.");
    }

    // Try to get our username via API (to filter self-replies)
    try {
        const me = await client.v2.me();
        myUsername = me.data.username;
        console.log(`✅ API Authenticated as: @${myUsername}`);
    } catch (e) {
        console.log("⚠️ API Auth Check Failed (Maybe keys are wrong?). Bot will still try to run.");
    }

    // Keyword filter setup
    const keywords = process.env.FILTER_KEYWORDS 
            ? process.env.FILTER_KEYWORDS.split(',').map(k => k.trim().toLowerCase()) 
            : [];
    console.log(`🔎 Filtering for keywords: ${keywords.length > 0 ? keywords.join(", ") : "ALL (No filter)"}`);


    // --- MAIN LOOP ---
    // We check every X seconds
    setInterval(async () => {
        try {
            // Check if we are on a timeline page (look for tweet articles)
            const tweetElements = await page.$$('article[data-testid="tweet"]');
            
            if (tweetElements.length === 0) {
                console.log("waiting for tweets... (Please ensure you are on Home or a Profile page)");
                return;
            }

            // Scrape data from page
            const visibleTweets = await page.evaluate(() => {
                const articles = document.querySelectorAll('article[data-testid="tweet"]');
                const data = [];
                
                articles.forEach(article => {
                    try {
                        // User Handle (@username)
                        const userLinkInfo = article.querySelector('div[data-testid="User-Name"] a');
                        const userHandle = userLinkInfo ? userLinkInfo.href.split('/').pop() : "unknown";

                        // Tweet Text
                        const textEl = article.querySelector('div[data-testid="tweetText"]');
                        const text = textEl ? textEl.innerText : "";

                        // Tweet ID (from timestamp link)
                        const timeEl = article.querySelector('time');
                        const linkEl = timeEl ? timeEl.closest('a') : null;
                        const href = linkEl ? linkEl.href : ""; 
                        // href usually: https://x.com/username/status/123456789
                        const idMatch = href.match(/status\/(\d+)/);
                        const id = idMatch ? idMatch[1] : null;

                        if (id && text) {
                            data.push({ id, userHandle, text });
                        }
                    } catch (err) { }
                });
                return data;
            });

            // Process new tweets
            let newFound = 0;
            for (const t of visibleTweets) {
                if (seenTweetIds.has(t.id)) continue;
                
                seenTweetIds.add(t.id);
                // Keep memory clean
                if (seenTweetIds.size > 2000) {
                    const first = seenTweetIds.values().next().value;
                    seenTweetIds.delete(first);
                }

                newFound++;

                // 1. Skip self
                // Just in case we didn't get API username, try to guess or skip
                if (myUsername && t.userHandle.toLowerCase() === myUsername.toLowerCase()) continue;

                // 2. Keyword Check
                const textLower = t.text.toLowerCase();
                const hasKeyword = keywords.length === 0 || keywords.some(k => textLower.includes(k));

                if (!hasKeyword) {
                    if (config.DEBUG_MODE) console.log(`   Skipped (No keyword): ${t.userHandle}: "${t.text.substring(0, 30)}..."`);
                    continue;
                }

                // 3. REPLY MATCH
                console.log(`🎯 MATCH FOUND! Tweet ${t.id} by @${t.userHandle}`);
                console.log(`   Text: "${t.text.substring(0, 50)}..."`);

                // Send Reply via API
                const replyText = config.REPLIES[Math.floor(Math.random() * config.REPLIES.length)];
                
                try {
                    // Safety pause
                    await sleep(2000 + Math.random() * 3000); 
                    
                    await client.v2.reply(replyText, t.id);
                    console.log(`   ✅ REPLIED: "${replyText}"`);
                } catch (apiErr) {
                    console.error(`   ❌ API REPLY FAILED: ${apiErr.message}`);
                    if (apiErr.code === 403) {
                         console.error("      (Your API keys might be Read-Only or invalid)");
                    }
                }
            }

            if (newFound > 0) {
                console.log(`Checked ${visibleTweets.length} visible tweets. ${newFound} were new.`);
            }

            // Optional: Scroll down a bit to see more?
            // Automated scrolling can be flagged. Safer to just let user scroll OR scroll very slowly.
            // Let's do a tiny scroll.
            // await page.evaluate(() => window.scrollBy(0, 300));

        } catch (err) {
            console.error("Monitor loop error:", err);
        }

    }, config.CHECK_INTERVAL_SECONDS * 1000);
}

startMonitoring();
