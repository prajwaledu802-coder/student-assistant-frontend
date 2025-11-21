// public/assets/js/flashcards.js
import { auth, logMessage } from "./firebase.js";
import { callGemini } from "./gemini.js";

const input = document.getElementById("flashInput");
const btn = document.getElementById("flashGenerateBtn");
const container = document.getElementById("flashcardsContainer");

let currentUser = null;
auth && auth.onAuthStateChanged((u) => (currentUser = u));

function renderFlashcards(cards) {
  container.innerHTML = "";
  cards.forEach((card, idx) => {
    const [q, a] = card;
    const div = document.createElement("div");
    div.className =
      "glass-panel rounded-2xl p-4 text-sm flex flex-col justify-between";
    div.innerHTML = `
      <div>
        <div class="text-xs opacity-60 mb-1">Card ${idx + 1}</div>
        <div class="font-semibold mb-2">Q: ${q}</div>
        <div class="text-xs opacity-80">A: ${a}</div>
      </div>
    `;
    container.appendChild(div);
  });
}

btn.addEventListener("click", async () => {
  const text = input.value.trim();
  if (!text) return;

  container.innerHTML = `<div class="text-sm opacity-80">Generating flashcards with Gemini…</div>`;
  const prompt =
    "You are an exam flashcard generator. Based on the following notes or topic, " +
    "create 12 concise flashcards. Return them as lines with 'Q:' and 'A:' pairs.\n\n" +
    text;

  try {
    const reply = await callGemini(prompt);
    logMessage(currentUser, "user", "[Flashcards request]");
    logMessage(currentUser, "ai", reply);

    const lines = reply.split("\n").map((l) => l.trim()).filter(Boolean);
    const cards = [];
    let currentQ = "";
    lines.forEach((line) => {
      if (/^Q[:\-]/i.test(line)) {
        currentQ = line.replace(/^Q[:\-]\s*/i, "");
      } else if (/^A[:\-]/i.test(line) && currentQ) {
        const a = line.replace(/^A[:\-]\s*/i, "");
        cards.push([currentQ, a]);
        currentQ = "";
      }
    });

    if (!cards.length) {
      container.innerHTML =
        '<div class="text-sm opacity-80">Could not parse flashcards properly. Here is raw output:<br/><br/>' +
        reply +
        "</div>";
    } else {
      renderFlashcards(cards);
    }
  } catch (err) {
    console.error(err);
    container.innerHTML =
      '<div class="text-sm text-red-400">Failed to generate flashcards.</div>';
  }
});
