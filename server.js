require('dotenv').config();
const express = require("express");
const fetch = require("node-fetch");
const app = express();

const PORT = process.env.PORT || 8080;
const AIML_API_KEY = process.env.AIML_API_KEY;

app.use(express.json());

app.post("/npc-chat", async (req, res) => {
    const { message, sessionid } = req.body;

    if (!message) return res.status(400).json({ error: "Message is required." });

    try {
        const AIML_ENDPOINT = "https://api.aimlapi.com/v1/gpt-4o/chat";

        const apiResponse = await fetch(AIML_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${AIML_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                sessionid: sessionid || "default-session",
                messages: [
                    { role: "user", content: message }
                ]
            })
        });

        const data = await apiResponse.json();
        console.log("Full AIML API response:", JSON.stringify(data, null, 2));

        // Extract the reply (adjust to API response structure)
        const reply = data.reply ||
                      data.responses?.[0] ||
                      data.response ||
                      data.output?.[0]?.content ||
                      (data.choices?.[0]?.message?.content) || // in case it uses OpenAI-like structure
                      "Sorry, I can't respond right now.";

        res.json({ reply });

    } catch (err) {
        console.error("Error contacting AIML API:", err);
        res.status(500).json({ reply: "Error contacting AIML API.", error: err.toString() });
    }
});

app.all("*", (req, res) => res.status(404).send(`Route not found: ${req.originalUrl}`));

app.listen(PORT, () => console.log(`✅ AIML Proxy running on port ${PORT}`));
