// assets/js/gemini.js
// Connect frontend → backend safely

const API_BASE = "https://student-assistant-backend-dqzq.onrender.com";

export async function callGemini(prompt) {
  try {
    const res = await fetch(`${API_BASE}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    if (!res.ok) {
      console.error("Backend returned error:", await res.text());
      throw new Error("Gemini backend error");
    }

    const data = await res.json();
    return data.reply;
  } catch (err) {
    console.error("callGemini error", err);
    throw err;
  }
}

