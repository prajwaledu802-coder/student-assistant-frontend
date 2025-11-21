// public/assets/js/app.js
import { auth, logMessage } from "./firebase.js";
import { callGemini } from "./gemini.js";

const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const quickButtons = document.querySelectorAll("[data-template]");
const fileInput = document.getElementById("fileInput");
const summariseFileBtn = document.getElementById("summariseFileBtn");
const planOutput = document.getElementById("planOutput");
const summaryOutput = document.getElementById("summaryOutput");
const voiceMicBtn = document.getElementById("voiceMicBtn");
const voiceStatus = document.getElementById("voiceStatus");
const speakToggle = document.getElementById("speakToggle");

let currentUser = null;

// Watch login/logout state
if (auth) {
  auth.onAuthStateChanged((u) => {
    currentUser = u;
  });
}

// Add message bubbles to chat UI
function addMessage(text, type = "user") {
  if (!chatMessages) return;

  const wrapper = document.createElement("div");
  wrapper.className = "chat " + (type === "user" ? "chat-end" : "chat-start");

  wrapper.innerHTML = `
    <div class="chat-bubble ${type === "user" ? "chat-bubble-primary" : "chat-bubble-secondary"}
      whitespace-pre-wrap text-xs sm:text-sm">
      <span class="font-semibold">${type === "user" ? "You" : "Student Assistant AI"}:</span><br/>${text}
    </div>
  `;

  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  if (type === "ai" && speakToggle && speakToggle.checked) {
    speakText(text);
  }
}

// System messages (errors, etc.)
function addSystemMessage(text) {
  if (!chatMessages) return;
  const el = document.createElement("div");
  el.className = "text-[11px] opacity-70 text-center italic mt-1 mb-2";
  el.innerHTML = text;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Voice output (Text-to-Speech)
function speakText(text) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g, ""));
  utterance.rate = 1.02;
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
}

// Send message to AI
async function handleSend() {
  if (!chatInput || !sendBtn) return;

  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";

  addMessage(text, "user");
  logMessage(currentUser, "user", text);

  sendBtn.classList.add("loading");
  sendBtn.disabled = true;

  const prompt = `
You are Student Assistant AI, a college exam helper.
Give clear, structured answers with headings, bullet points, definitions, formulas, and examples.
Help the user understand concepts easily.

User: ${text}
  `;

  try {
    const reply = await callGemini(prompt);

    addMessage(reply, "ai");
    logMessage(currentUser, "ai", reply);

    // Auto-fill outputs
    if (/plan|schedule|timetable|time table/i.test(text)) {
      if (planOutput) planOutput.textContent = reply;
    } else if (summaryOutput) {
      summaryOutput.textContent = reply;
    }
  } catch (err) {
    console.error(err);
    addSystemMessage("❌ AI Error — Backend unavailable or API key issue.");
  } finally {
    sendBtn.classList.remove("loading");
    sendBtn.disabled = false;
  }
}

// Send button + Enter key support
if (sendBtn && chatInput) {
  sendBtn.addEventListener("click", handleSend);

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });
}

// Quick template buttons
quickButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!chatInput) return;
    chatInput.value = btn.dataset.template + "\n\n";
    chatInput.focus();
  });
});

// Summarise TXT files
if (summariseFileBtn && fileInput && summaryOutput) {
  summariseFileBtn.addEventListener("click", async () => {
    const file = fileInput.files?.[0];

    if (!file) {
      summaryOutput.textContent = "📄 Please select a .txt file first.";
      return;
    }

    if (!file.name.endsWith(".txt")) {
      summaryOutput.textContent = "⚠️ Only .txt files supported.";
      return;
    }

    const content = await file.text();
    summaryOutput.textContent = "⏳ Summarising your notes…";

    try {
      const reply = await callGemini(`
Summarise the following notes into clear bullet points, definitions, formulas, and key points.

${content}
      `);

      summaryOutput.textContent = reply;
      addMessage("📘 I summarised your notes — check the output!", "ai");
      logMessage(currentUser, "ai", reply);
    } catch {
      summaryOutput.textContent = "❌ Failed to summarise notes.";
    }
  });
}

// Voice input (Speech-to-Text)
let recognition = null;
let isListening = false;

if (voiceMicBtn && voiceStatus) {
  if ("webkitSpeechRecognition" in window) {
    const SR = window.webkitSpeechRecognition;

    recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      isListening = true;
      voiceStatus.textContent = "🎤 Listening… Ask your question.";
      voiceMicBtn.classList.add("btn-active");
    };

    recognition.onend = () => {
      isListening = false;
      voiceStatus.textContent = "⛔ Listening stopped.";
      voiceMicBtn.classList.remove("btn-active");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (chatInput) chatInput.value = transcript;
    };
  } else {
    voiceStatus.textContent = "❌ Voice input not supported. Use Google Chrome.";
    voiceMicBtn.disabled = true;
  }

  voiceMicBtn.addEventListener("click", () => {
    if (!recognition) return;
    isListening ? recognition.stop() : recognition.start();
  });
}
