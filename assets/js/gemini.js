const API_BASE = "https://student-assistant-backend-dqzq.onrender.com";

export async function callGemini(prompt) {
  const res = await fetch(`${API_BASE}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  if (!res.ok) {
    console.error("Backend API error:", await res.text());
    throw new Error("Backend AI error");
  }

  const data = await res.json();
  return data.reply;
}
