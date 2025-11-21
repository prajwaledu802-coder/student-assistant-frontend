// frontend/assets/js/gemini.js
// Frontend no longer contains any Gemini API key.
// It only calls your secure backend API.

const API_BASE_URL = "http://localhost:8000"; 
// When deployed, change to: "https://YOUR-BACKEND.onrender.com"

export async function callGemini(prompt) {
  const res = await fetch(`${API_BASE_URL}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    console.error("Backend AI error:", await res.text());
    throw new Error("Backend AI error");
  }

  const data = await res.json();
  return data.reply;
}
