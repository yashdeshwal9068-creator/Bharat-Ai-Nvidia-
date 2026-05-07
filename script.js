// ====== CONFIG ======
const GROQ_API_KEY = "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";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Bharat AI personality
const SYSTEM_PROMPT = `You are Bharat AI 🇮🇳, a friendly, intelligent, and culturally-aware AI assistant proudly created for users from India and around the world.

Personality:
- Warm, respectful, and helpful
- Knowledgeable about Indian culture, history, festivals, languages, and traditions
- Fluent in English, Hindi, Hinglish, and other Indian languages — reply in the language the user uses
- Concise but thorough; use formatting (bold, lists, code blocks) when helpful
- Use occasional Indian context, examples, or emojis when natural

Always be honest, accurate, and never harmful.`;

// ====== ELEMENTS ======
const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const newChatBtn = document.getElementById("newChatBtn");
const modelSelect = document.getElementById("modelSelect");

// Conversation history
let conversationHistory = [];

// ====== AUTO-RESIZE TEXTAREA ======
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 150) + "px";
});

// Enter to send, Shift+Enter for new line
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

// ====== SUGGESTION BUTTONS ======
document.querySelectorAll(".suggestion").forEach((btn) => {
  btn.addEventListener("click", () => {
    const small = btn.querySelector("small");
    userInput.value = small ? small.textContent : btn.textContent;
    chatForm.requestSubmit();
  });
});

// ====== CLEAR / NEW CHAT ======
function resetChat() {
  conversationHistory = [];
  chatWindow.innerHTML = `
    <div class="welcome">
      <div class="welcome-icon">🙏</div>
      <h2>Namaste! Welcome to <span class="gradient-text">Bharat AI</span></h2>
      <p>Your intelligent assistant powered by Groq's lightning-fast inference. Ask me anything in any language!</p>
    </div>`;
}

clearBtn.addEventListener("click", () => {
  if (confirm("Clear all messages?")) resetChat();
});

newChatBtn.addEventListener("click", resetChat);

// ====== ADD MESSAGE TO UI ======
function addMessage(text, sender) {
  const welcome = chatWindow.querySelector(".welcome");
  if (welcome) welcome.remove();

  const msg = document.createElement("div");
  msg.classList.add("message", sender);

  const avatar = document.createElement("div");
  avatar.classList.add("avatar");
  avatar.textContent = sender === "user" ? "👤" : "🇮🇳";

  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  bubble.innerHTML = formatText(text);

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return bubble;
}

// Markdown-lite formatter
function formatText(text) {
  // Escape HTML first
  let safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks ```code```
  safe = safe.replace(/```([\s\S]*?)```/g, (m, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code `code`
  safe = safe.replace(/`([^`\n]+)`/g, "<code>$1</code>");

  // Bold **text**
  safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic *text*
  safe = safe.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

  // Line breaks
  safe = safe.replace(/\n/g, "<br>");

  return safe;
}

// ====== TYPING INDICATOR ======
function showTyping() {
  const msg = document.createElement("div");
  msg.classList.add("message", "bot");
  msg.id = "typingIndicator";
  msg.innerHTML = `
    <div class="avatar">🇮🇳</div>
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

// ====== CALL GROQ API ======
async function callGroq(userMessage) {
  conversationHistory.push({ role: "user", content: userMessage });

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationHistory,
  ];

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: modelSelect.value,
      messages: messages,
      temperature: 0.8,
      max_tokens: 2048,
      top_p: 0.95,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

  conversationHistory.push({ role: "assistant", content: reply });
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
    const reply = await callGroq(message);
    removeTyping();
    addMessage(reply, "bot");
  } catch (err) {
    removeTyping();
    addMessage(`⚠️ **Error:** ${err.message}\n\nIf you see a CORS error, please open this file via a local server (see README).`, "bot");
    console.error(err);
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
});

// Focus input on load
userInput.focus();
