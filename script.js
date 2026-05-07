// ====== CONFIG ======
const API_KEY = "AIzaSyAADdknTINXqIMmNYpMmmOMktCLhHkLObQ";
const MODEL = "gemini-2.0-flash"; // Fast and free tier model
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// ====== ELEMENTS ======
const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");

// Conversation history (for context)
let conversationHistory = [];

// System persona for Bharat AI
const SYSTEM_PROMPT = `You are Bharat AI, a friendly, knowledgeable, and culturally-aware AI assistant created to help users from India and around the world. You can converse in English, Hindi, Hinglish, and other Indian languages. You are respectful, helpful, and concise. When relevant, you can include Indian cultural context. Your creator is the user who built this app using Google's Gemini API.`;

// ====== AUTO-RESIZE TEXTAREA ======
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + "px";
});

// Send on Enter (Shift+Enter = new line)
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

// ====== SUGGESTION BUTTONS ======
document.querySelectorAll(".suggestion").forEach((btn) => {
  btn.addEventListener("click", () => {
    userInput.value = btn.textContent;
    chatForm.requestSubmit();
  });
});

// ====== CLEAR CHAT ======
clearBtn.addEventListener("click", () => {
  if (confirm("Clear all messages?")) {
    conversationHistory = [];
    chatWindow.innerHTML = `
      <div class="welcome">
        <h2>Namaste! 🙏</h2>
        <p>I'm <strong>Bharat AI</strong>, powered by Google Gemini. Ask me anything!</p>
      </div>`;
  }
});

// ====== ADD MESSAGE TO UI ======
function addMessage(text, sender) {
  // Remove welcome screen on first message
  const welcome = chatWindow.querySelector(".welcome");
  if (welcome) welcome.remove();

  const msg = document.createElement("div");
  msg.classList.add("message", sender);

  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  // Basic markdown: **bold** and line breaks
  bubble.innerHTML = formatText(text);

  msg.appendChild(bubble);
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return bubble;
}

function formatText(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}

// ====== TYPING INDICATOR ======
function showTyping() {
  const msg = document.createElement("div");
  msg.classList.add("message", "bot");
  msg.id = "typingIndicator";
  msg.innerHTML = `
    <div class="bubble">
      <div class="typing"><span></span><span></span><span></span></div>
    </div>`;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById("typingIndicator");
  if (t) t.remove();
}

// ====== CALL GEMINI API ======
async function callGemini(userMessage) {
  // Add user message to history
  conversationHistory.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  const requestBody = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: conversationHistory,
    generationConfig: {
      temperature: 0.8,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const reply =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Sorry, I couldn't generate a response.";

  // Save bot reply to history
  conversationHistory.push({
    role: "model",
    parts: [{ text: reply }],
  });

  return reply;
}

// ====== HANDLE FORM SUBMIT ======
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  userInput.value = "";
  userInput.style.height = "auto";
  sendBtn.disabled = true;

  showTyping();

  try {
    const reply = await callGemini(message);
    removeTyping();
    addMessage(reply, "bot");
  } catch (err) {
    removeTyping();
    addMessage(`⚠️ Error: ${err.message}`, "bot");
    console.error(err);
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
});

// Focus input on load
userInput.focus();
