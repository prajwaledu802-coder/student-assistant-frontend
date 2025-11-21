// public/assets/js/qr.js
import { auth, logMessage } from "./firebase.js";
import { callGemini } from "./gemini.js";

const resultArea = document.getElementById("qrResult");
const askBtn = document.getElementById("qrAskAiBtn");
const aiOutput = document.getElementById("qrAiOutput");

let currentUser = null;
auth && auth.onAuthStateChanged((u) => (currentUser = u));

if (window.Html5Qrcode) {
  const qrRegionId = "qr-reader";
  const qr = new Html5Qrcode(qrRegionId);

  const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  qr.start(
    { facingMode: "environment" },
    config,
    (decodedText) => {
      resultArea.value = decodedText;
    },
    () => {}
  ).catch((err) => {
    console.error("QR start error:", err);
  });
} else {
  console.warn("Html5Qrcode not loaded");
}

askBtn.addEventListener("click", async () => {
  const text = resultArea.value.trim();
  if (!text) return;

  aiOutput.textContent = "Thinking with Gemini…";

  try {
    const reply = await callGemini(
      "The following text was scanned from a QR / barcode. " +
        "Explain what it is and, if it is a topic or URL, create a study summary:\n\n" +
        text
    );
    aiOutput.textContent = reply;
    logMessage(currentUser, "user", "[QR ask AI]");
    logMessage(currentUser, "ai", reply);
  } catch (err) {
    console.error(err);
    aiOutput.textContent = "Failed to contact AI.";
  }
});
