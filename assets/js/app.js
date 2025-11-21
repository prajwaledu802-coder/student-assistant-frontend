// public/assets/js/app.js
import { callGemini } from "./gemini.js";
import { auth, logMessage } from "./firebase.js";

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

// FIXED: Proper null check for auth (prevents "auth.onAuthStateChanged is not a function")
if (auth && typeof auth.onAuthStateChanged === "function") {
  auth.onAuthStateChanged((u) => (currentUser = u));
}

// Message bubbles - unchanged
function addMessage(text, type = "user") {
  if (!chatMessages) return;
  const wrapper = document.createElement("div");
  wrapper.className = "chat " + (type === "user" ? "chat-end" : "chat-start");
  wrapper.innerHTML = `
    <div class="chat-bubble ${
      type === "user" ? "chat-bubble-primary" : "chat-bubble-secondary"
    } whitespace-pre-wrap text-xs sm:text-sm">
      <span class="font-semibold">${
        type === "user" ? "You" : "Student Assistant AI"
      }:</span><br/>${text}
    </div>
  `;
  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // FIXED: Only speak if toggle exists and is checked
  if (type === "ai" && speakToggle?.checked) {
    speakText(text);
  }
}

// System message - unchanged
function addSystemMessage(text) {
  if (!chatMessages) return;
  const el = document.createElement("div");
  el.className = "text-[11px] opacity-70 text-center italic mt-1 mb-2";
  el.innerHTML = text;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Voice output - unchanged
function speakText(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g, ""));
  utterance.rate = 1.02;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

// Handle SEND - unchanged except tiny safety
async function handleSend() {
  if (!chatInput || !sendBtn) return;
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = "";
  addMessage(text, "user");
  logMessage(currentUser, "user", text);

  sendBtn.classList.add("loading");
  sendBtn.disabled = true;

  const prompt = `You are Student Assistant AI, a college exam helper.
Give clear, structured answers with headings, bullet points, formulas, examples.
User: ${text}`;

  try {
    const reply = await callGemini(prompt);
    addMessage(reply, "ai");
    logMessage(currentUser, "ai", reply);

    if (/plan|schedule|timetable|time table/i.test(text)) {
      if (planOutput) planOutput.textContent = reply;
    } else if (summaryOutput) {
      summaryOutput.textContent = reply;
    }
  } catch (err) {
    console.error(err);
    addSystemMessage("AI Error — Backend unavailable or API key issue.");
  } finally {
    sendBtn.classList.remove("loading");
    sendBtn.disabled = false;
  }
}

// Chat send - unchanged
if (sendBtn && chatInput) {
  sendBtn.addEventListener("click", handleSend);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });
}

// Quick templates - unchanged
quickButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    chatInput.value = btn.dataset.template + "\n\n";
    chatInput.focus();
  });
});

// File summary - FIXED: Added proper safety checks
if (summariseFileBtn && fileInput && summaryOutput) {
  summariseFileBtn.addEventListener("click", async () => {
    const file = fileInput.files?.[0];
    if (!file) {
      summaryOutput.textContent = "Select a .txt file first.";
      return;
    }
    if (!file.name.endsWith(".txt")) {
      summaryOutput.textContent = "Only .txt files supported.";
      return;
    }

    summaryOutput.textContent = "Summarising…";
    try {
      const content = await file.text();
      const reply = await callGemini(`
Summarise the following notes into bullet points, definitions, formulas:
${content}
`);
      summaryOutput.textContent = reply;
      addMessage("Notes summarised!", "ai");
      logMessage(currentUser, "ai", reply);
    } catch (err) {
      console.error(err);
      summaryOutput.textContent = "Failed to summarise notes.";
    }
  });
}

// Voice input - FIXED: Proper browser check + small safety
let recognition = null;
let isListening = false;

if (voiceMicBtn && voiceStatus) {
  if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN"; // Better for Indian accent

    recognition.onstart = () => {
      isListening = true;
      voiceStatus.textContent = "Listening…";
      voiceMicBtn.classList.add("btn-active");
    };
    recognition.onend = () => {
      isListening = false;
      voiceStatus.textContent = "Mic off";
      voiceMicBtn.classList.remove("btn-active");
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      chatInput.value = transcript;
      chatInput.focus();
    };
    recognition.onerror = () => {
      voiceStatus.textContent = "Error – try again";
    };
  } else {
    voiceStatus.textContent = "Voice not supported";
    voiceMicBtn.disabled = true;
  }

  voiceMicBtn.addEventListener("click", () => {
    if (!recognition) return;
    isListening ? recognition.stop() : recognition.start();
  });
}
