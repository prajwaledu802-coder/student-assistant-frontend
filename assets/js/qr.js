// public/assets/js/qr.js
import { auth, logMessage } from "./firebase.js";
import { callGemini } from "./gemini.js";

const resultArea = document.getElementById("qrResult");
const askBtn = document.getElementById("qrAskAiBtn");
const aiOutput = document.getElementById("qrAiOutput");

let currentUser = null;
if (auth) {
  auth.onAuthStateChanged((u) => (currentUser = u));
}

// =========================
// QR SCANNER INITIALIZATION
// =========================
if (window.Html5Qrcode) {
  const scannerRegion = "qr-reader";
  const scanner = new Html5Qrcode(scannerRegion);

  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0,
  };

  scanner
    .start(
      { facingMode: "environment" }, // rear camera
      config,
      (decodedText) => {
        resultArea.value = decodedText;
      },
      () => {}
    )
    .catch((err) => {
      console.error("QR start error:", err);
      resultArea.value = "Unable to access camera. Please allow camera permissions.";
    });
} else {
  console.warn("Html5Qrcode not loaded.");
  if (resultArea) {
    resultArea.value =
      "QR Scanner library not loaded. Please check script URL.";
  }
}

// =========================
// BUTTON – ASK AI ABOUT QR
// =========================
askBtn?.addEventListener("click", async () => {
  const text = resultArea?.value?.trim();
  if (!text) {
    aiOutput.textContent = "Please scan a QR code first.";
    return;
  }

  aiOutput.textContent = "⏳ Analyzing QR using Student Assistant AI…";

  const prompt = `
You are Student Assistant AI.
A QR code was scanned. Interpret the contents below:

"${text}"

If it is:
- A URL → describe the site, purpose, and what the student can learn.
- Study notes → summarise them with headings.
- A topic → explain the topic clearly with examples.
- Random text → interpret meaning and possible usage.
  `.trim();

  try {
    const reply = await callGemini(prompt);

    aiOutput.textContent = reply;

    // save to Firebase history
    logMessage(currentUser, "user", "[QR Scan AI Request]");
    logMessage(currentUser, "ai", reply);
  } catch (err) {
    console.error(err);
    aiOutput.textContent =
      "❌ AI could not process the QR. Please try again.";
  }
});
