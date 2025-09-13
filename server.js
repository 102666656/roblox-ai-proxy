require('dotenv').config();
const express = require("express");
const fetch = require("node-fetch"); // v2 for CommonJS
const app = express();

const PORT = process.env.PORT || 8080;
const AIML_API_KEY = process.env.AIML_API_KEY;

// Parse JSON
app.use(express.json());

// POST /npc-chat
app.post("/npc-chat", async (req, res) => {
    const { message, sessionid } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required." });
    }

    try {
        // TODO: Replace with your correct AIML API chat endpoint from dashboard
        const AIML_ENDPOINT = "https://api.aimlapi.com/YOUR_CORRECT_CHAT_ENDPOINT";

        const apiResponse = await fetch(AIML_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${AIML_API_KEY}`
            },
            body: JSON.stringify({
                message: message,
                sessionid: sessionid || "default-session"
            })
        });

        const data = await apiResponse.json();
        console.log("Full AIML API response:", JSON.stringify(data, null, 2));

        // Flexible reply extraction
        const reply =
            data.reply ||
            data.responses?.[0] ||
            data.response ||
            "Sorry, I can't respond right now.";

        res.json({ reply });

    } catch (err) {
        console.error("Error contacting AIML API:", err);
        res.status(500).json({ reply: "Error contacting AIML API.", error: err.toString() });
    }
});

// Catch-all route
app.all("*", (req, res) => {
    res.status(404).send(`Route not found: ${req.originalUrl}`);
});

// Start server
app.listen(PORT, () => console.log(`✅ AIML Proxy running on port ${PORT}`));
