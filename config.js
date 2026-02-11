module.exports = {
    // How often to check for new tweets (in seconds)
    CHECK_INTERVAL_SECONDS: 90,

    // Your replies. The bot picks one randomly.
    REPLIES: [
        "Interesting perspective! 🤔",
        "Great point! 👍",
        "Totally agree.",
        "Nice share! 🔥",
        "This is insightful.",
        "Keeping this in mind.",
        "Valid point.",
        "Thanks for sharing!",
    ],

    // If true, logs more details
    DEBUG_MODE: true,

    // Safety: Max replies per check cycle to avoid spamming 
    MAX_REPLIES_PER_CYCLE: 5
};
