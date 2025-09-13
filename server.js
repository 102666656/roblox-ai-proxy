require('dotenv').config();
const express = require("express");
const fetch = require("node-fetch");
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
        // Call AIMLAPI.com endpoint
        const apiResponse = await fetch("https://api.aimlapi.com/v1/chat", {
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
        console.log("AIML API response:", data); // Log the full API response

        // AIMLAPI returns the reply in `response` field
        const reply = data.response || "Sorry, I can't respond right now.";

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
