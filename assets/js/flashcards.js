// public/assets/js/flashcards.js
import { auth, logMessage } from "./firebase.js";
import { callGemini } from "./gemini.js";

const input = document.getElementById("flashInput");
const btn = document.getElementById("flashGenerateBtn");
const container = document.getElementById("flashcardsContainer");

let currentUser = null;
if (auth) {
  auth.onAuthStateChanged((u) => (currentUser = u));
}

// Render cards with clean, premium UI
function renderFlashcards(cards) {
  container.innerHTML = "";

  cards.forEach((card, idx) => {
    const [q, a] = card;

    const div = document.createElement("div");
    div.className =
      "glass-panel rounded-2xl p-4 text-sm flex flex-col justify-between shadow-xl border border-white/10";

    div.innerHTML = `
      <div>
        <div class="text-xs opacity-60 mb-1">Card ${idx + 1}</div>
        <div class="font-semibold mb-2 text-primary">Q: ${q}</div>
        <div class="text-xs opacity-90 leading-relaxed">A: ${a}</div>
      </div>
    `;

    container.appendChild(div);
  });
}

// MAIN BUTTON EVENT HANDLER
btn.addEventListener("click", async () => {
  const text = input.value.trim();
  if (!text) {
    container.innerHTML = `<div class="text-sm opacity-80">Please enter a topic or notes first.</div>`;
    return;
  }

  // Loading state
  container.innerHTML = `
    <div class="text-sm opacity-80 animate-pulse">
      Generating flashcards with Student Assistant AI…
    </div>
  `;

  const prompt = `
You are a professional exam flashcard generator AI.
Create EXACTLY 12 flashcards.

Return format (VERY IMPORTANT!):
Q: <question>
A: <answer>

Generate based on the topic below:
"${text}"
  `.trim();

  try {
    const reply = await callGemini(prompt);

    // Log & history save
    logMessage(currentUser, "user", "[Flashcards Request]");
    logMessage(currentUser, "ai", reply);

    // --- Parsing logic (Improved & more accurate) ---
    const lines = reply
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const cards = [];
    let q = null;

    for (const line of lines) {
      if (/^Q[:\-]/i.test(line)) {
        q = line.replace(/^Q[:\-]\s*/i, "").trim();
      } else if (/^A[:\-]/i.test(line) && q) {
        const a = line.replace(/^A[:\-]\s*/i, "").trim();
        cards.push([q, a]);
        q = null;
      }
    }

    // --- Final display ---
    if (!cards.length) {
      container.innerHTML = `
        <div class="text-sm opacity-80">
          ❌ Could not automatically parse flashcards.<br/><br/>
          <strong>Raw AI Output:</strong><br/>
          <pre class="text-xs mt-2 whitespace-pre-wrap">${reply}</pre>
        </div>
      `;
      return;
    }

    renderFlashcards(cards);

  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div class="text-sm text-red-400">
        ❌ Flashcard generation failed. Check your backend connection.
      </div>`;
  }
});

