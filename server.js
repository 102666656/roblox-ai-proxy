import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// load your AIML API key
const AIML_API_KEY = process.env.AIML_API_KEY;

if (!AIML_API_KEY) {
  console.error("❌ AIML_API_KEY is not set in environment variables");
  process.exit(1);
}

// health check
app.get("/", (req, res) => {
  res.send("✅ Proxy server is running. POST to /npc-chat with JSON { message, sessionid }.");
});

// npc-chat route
app.post("/npc-chat", async (req, res) => {
  const { message, sessionid } = req.body;

  if (!message) {
    return res.status(400).json({ reply: "No message provided." });
  }

  try {
    const apiResponse = await fetch("https://api.aimlapi.com/v1/gpt-4o/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AIML_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "user", content: message }
        ],
        sessionid: sessionid || "default-session"
      })
    });

    const data = await apiResponse.json();
    console.log("📩 AIML API response:", JSON.stringify(data, null, 2));

    // extract reply safely
    const reply =
      data.reply ||
      data.response ||
      data.responses?.[0] ||
      data.output?.[0]?.content ||
      (data.choices?.[0]?.message?.content) ||
      "Sorry, I can't respond right now.";

    res.json({ reply });
  } catch (err) {
    console.error("❌ Exception contacting AIML API:", err);
    res.status(500).json({ reply: "Error contacting AIML API.", error: err.message });
  }
});

// run server on Railway
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
});
