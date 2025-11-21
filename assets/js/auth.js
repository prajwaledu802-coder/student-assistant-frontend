// public/assets/js/auth.js
import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const page = window.location.pathname.split("/").pop();

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");
const signupBtn = document.getElementById("signupBtn");
const signupError = document.getElementById("signupError");

const logoutBtn = document.getElementById("logoutBtn");
const profileEmail = document.getElementById("profileEmail");
const userEmailSpan = document.getElementById("userEmail");

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    loginError.textContent = "";
    try {
      await signInWithEmailAndPassword(
        auth,
        loginEmail.value.trim(),
        loginPassword.value.trim()
      );
      window.location.href = "index.html";
    } catch (err) {
      loginError.textContent = err.message;
    }
  });
}

if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    signupError.textContent = "";
    try {
      await createUserWithEmailAndPassword(
        auth,
        signupEmail.value.trim(),
        signupPassword.value.trim()
      );
      window.location.href = "index.html";
    } catch (err) {
      signupError.textContent = err.message;
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}

onAuthStateChanged(auth, (user) => {
  const authPages = ["login.html", "signup.html", ""];

  if (!user && !authPages.includes(page)) {
    window.location.href = "login.html";
    return;
  }

  if (user && authPages.includes(page)) {
    window.location.href = "index.html";
    return;
  }

  if (profileEmail && user) profileEmail.textContent = user.email;
  if (userEmailSpan && user) {
    userEmailSpan.textContent = user.email;
    userEmailSpan.classList.remove("hidden");
  }
});
