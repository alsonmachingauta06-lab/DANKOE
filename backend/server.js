const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "https://dankoe-a4ea6.web.app"
}));

app.use(express.json());

const conversations = new Map();

const SYSTEM_PROMPT = `
You are Dankoe AI, a highly capable personal AI assistant.

Your personality:
- Friendly, natural, confident and intelligent.
- Speak like a helpful human assistant, not like a robotic AI.
- Be concise when the question is simple and detailed when the question requires it.
- Understand context and follow-up questions.
- If you are unsure about something, say so instead of inventing facts.
- Explain technical topics in beginner-friendly language when appropriate.
- Never claim you performed an action that you did not actually perform.
`;

app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Dankoe AI"
  });
});

app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message;
    const sessionId = req.body.sessionId;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        error: "Session ID is required"
      });
    }

    if (!conversations.has(sessionId)) {
      conversations.set(sessionId, []);
    }

    const history = conversations.get(sessionId);

    history.push({
      role: "user",
      content: message.trim()
    });

    const recentHistory = history.slice(-20);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://dankoe-a4ea6.web.app",
          "X-Title": "Dankoe AI"
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT
            },
            ...recentHistory
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      history.pop();

      return res.status(response.status).json({
        error: "AI request failed"
      });
    }

    const answer =
      data.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    history.push({
      role: "assistant",
      content: answer
    });

    res.json({ answer });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Server error"
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Dankoe AI backend running on port ${PORT}`);
});
