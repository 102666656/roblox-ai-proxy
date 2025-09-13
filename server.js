require('dotenv').config();
const express = require("express");
const fetch = require("node-fetch"); // v2 for CommonJS
const app = express();

const PORT = process.env.PORT || 8080;
const AIML_API_KEY = process.env.AIML_API_KEY;

app.use(express.json());

// POST /npc-chat
app.post("/npc-chat", async (req, res) => {
    const { message, sessionid } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required." });
    }

    try {
        const AIML_ENDPOINT = "https://api.aimlapi.com/v1/gpt-4o/chat"; // Correct endpoint

        const apiResponse = await fetch(AIML_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${AIML_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
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
            data.output?.[0]?.content || // in case the API returns an array of outputs
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
