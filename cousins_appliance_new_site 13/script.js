// Cousins Appliance Repair website interactions
// Replace this with the real client Setmore booking page when you have it.
const SETMORE_BOOKING_URL = "https://cousinsappliancerepairs.setmore.com";

// Chatbot API endpoint.
// Local testing uses the Node backend on localhost:3001.
// When hosted on Render, the same domain serves /api/chat.
const AI_BACKEND_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3001/api/chat"
    : "/api/chat";
const PHONE_DISPLAY = "(414) 405-7621";
const PHONE_TEL = "+14144057621";

const bookingModal = document.getElementById("bookingModal");
const setmoreFrame = document.getElementById("setmoreFrame");
const bookingBackupLink = document.getElementById("bookingBackupLink");
const chatLauncher = document.getElementById("chatLauncher");
const chatPanel = document.getElementById("chatPanel");
const chatClose = document.getElementById("chatClose");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


function cleanChatText(text = "") {
  return String(text)
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, ""))
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/[•]{2,}/g, "•")
    .replace(/[\*_`~]/g, "")
    .trim();
}

function scrollToSection(targetId) {
  const target = document.querySelector(targetId);
  if (!target) return false;

  const headerOffset = document.querySelector(".site-header")?.offsetHeight || 0;
  const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset - 14;

  window.scrollTo({
    top: Math.max(targetTop, 0),
    behavior: "smooth"
  });

  return true;
}

function openBooking() {
  if (!bookingModal) return;
  setmoreFrame.src = SETMORE_BOOKING_URL;
  bookingBackupLink.href = SETMORE_BOOKING_URL;
  bookingModal.classList.add("open");
  bookingModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeBooking() {
  if (!bookingModal) return;
  bookingModal.classList.remove("open");
  bookingModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function openChat(prefill = "") {
  if (!chatPanel) return;
  chatPanel.classList.add("open");
  chatPanel.setAttribute("aria-hidden", "false");
  chatInput?.focus();
  if (prefill && chatInput) {
    chatInput.value = prefill;
  }
}

function closeChat() {
  if (!chatPanel) return;
  chatPanel.classList.remove("open");
  chatPanel.setAttribute("aria-hidden", "true");
}

function addMessage(text, sender = "bot", action = null) {
  const msg = document.createElement("div");
  msg.className = `message ${sender === "user" ? "user-message" : "bot-message"}`;
  msg.textContent = cleanChatText(text);

  if (sender === "bot" && action === "booking") {
    const btn = document.createElement("button");
    btn.className = "chat-action-button";
    btn.type = "button";
    btn.textContent = "Open booking calendar";
    btn.addEventListener("click", openBooking);
    msg.appendChild(document.createElement("br"));
    msg.appendChild(btn);
  }

  if (sender === "bot" && action === "call") {
    const link = document.createElement("a");
    link.className = "chat-action-button";
    link.href = `tel:${PHONE_TEL}`;
    link.textContent = `Call ${PHONE_DISPLAY}`;
    msg.appendChild(document.createElement("br"));
    msg.appendChild(link);
  }

  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return msg;
}

function addTypingMessage() {
  const msg = document.createElement("div");
  msg.className = "message bot-message typing-message";
  msg.setAttribute("aria-label", "CousinsCare is typing");

  for (let i = 0; i < 3; i += 1) {
    const dot = document.createElement("span");
    dot.className = "typing-dot";
    msg.appendChild(dot);
  }

  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return msg;
}

function detectAction(message) {
  const m = message.toLowerCase();
  if (/(book|appointment|schedule|setmore|calendar|time slot|availability)/.test(m)) return "booking";
  if (/(call|phone|text|number|urgent|emergency|gas smell|smoke|sparks|flood|burning smell)/.test(m)) return "call";
  return null;
}



function initializeCarousels() {
  document.querySelectorAll(".carousel-shell").forEach((shell) => {
    const viewport = shell.querySelector(".carousel-track");
    const prev = shell.querySelector(".carousel-prev");
    const next = shell.querySelector(".carousel-next");
    if (!viewport || !prev || !next) return;

    const getStep = () => {
      const card = viewport.querySelector(".carousel-card");
      if (!card) return viewport.clientWidth;
      const gap = parseFloat(getComputedStyle(viewport).columnGap || getComputedStyle(viewport).gap || "18") || 18;
      return card.getBoundingClientRect().width + gap;
    };

    prev.addEventListener("click", () => {
      viewport.scrollBy({ left: -getStep(), behavior: "smooth" });
    });

    next.addEventListener("click", () => {
      viewport.scrollBy({ left: getStep(), behavior: "smooth" });
    });
  });
}

function scrollForPrettyPath() {
  const routeTargets = {
    "/About-Us": "#about",
    "/Past-Work": "#work",
    "/Reviews": "#reviews",
    "/Contact": "#contact"
  };
  const targetId = routeTargets[window.location.pathname];
  if (targetId) {
    setTimeout(() => scrollToSection(targetId), 150);
  }
}

function localFallbackResponse(message) {
  const m = message.toLowerCase();
  const action = detectAction(message);

  if (/(price|pricing|cost|fee|charge|estimate|diagnostic|quote|how much)/.test(m)) {
    return {
      reply: "We charge a $95 diagnostic/service visit fee, and that fee is applied toward the repair if you move forward. The final quote depends on the appliance, the issue, parts, and labor. The best next step is to book a visit so a technician can diagnose it properly.",
      action: "booking"
    };
  }

  if (/(book|appointment|schedule|setmore|calendar|time slot)/.test(m)) {
    return {
      reply: "Absolutely. You can book directly through our Setmore calendar. Choose the service, pick a time, and leave notes about the appliance problem. Because booking volume can get high, a technician will call or reach out after booking to confirm the details and make sure we understand the issue before the visit.",
      action: "booking"
    };
  }

  if (/(gas smell|smoke|sparks|burning smell|fire|flood|electrical)/.test(m)) {
    return {
      reply: "For safety, stop using the appliance right away. If there is gas smell, smoke, sparks, flooding, or an electrical hazard, contact a professional immediately and call/text the business before continuing to use it.",
      action: "call"
    };
  }

  if (/(washer|washing machine|leak|spin|drain)/.test(m)) {
    return {
      reply: "We repair washers with leaking, draining, shaking, no-start, door lock, pump, and spin-cycle issues. A technician can inspect the washer and explain the repair options after diagnosis.",
      action: "booking"
    };
  }

  if (/(dryer|not heating|lint|belt|drying)/.test(m)) {
    return {
      reply: "We repair gas and electric dryers. No heat, long drying times, loud noises, belts, lint buildup, and airflow problems are all common issues we can inspect.",
      action: "booking"
    };
  }

  if (/(fridge|refrigerator|freezer|cooling|ice|water dispenser)/.test(m)) {
    return {
      reply: "We repair refrigerators with cooling issues, leaks, loud fans, frost buildup, door seal problems, and water dispenser concerns. For an accurate answer, book a diagnosis or call with the model number and symptoms.",
      action: "booking"
    };
  }

  if (/(dishwasher|dishes|not draining|soap|suds)/.test(m)) {
    return {
      reply: "We repair dishwashers that leak, do not drain, leave dishes dirty, or have filter, hose, float switch, or spray arm issues. A visit will help confirm the exact cause.",
      action: "booking"
    };
  }

  if (/(oven|stove|range|burner|ignite|igniter|heating)/.test(m)) {
    return {
      reply: "We repair ovens, stoves, and ranges with heating, ignition, burner, display, switch, and wiring concerns. Gas and electric models can both be inspected.",
      action: "booking"
    };
  }


  if (/(founder|founded|owner|owns|started|metin|licensed|licenced|certified|certification|insured|qualified|credentials|technicians licensed|techs licensed)/.test(m)) {
    return {
      reply: "Cousins Appliance Repair was founded by Metin. The technicians are certified and licensed. For specific licensing, insurance, or appointment details, call/text (414) 405-7621 or include your question when booking.",
      action: null
    };
  }

  if (/(area|serve|location|located|milwaukee|greenfield|mequon|franklin|oak creek|grafton|port washington|cedarburg|wauwatosa|west allis|brookfield|shorewood|whitefish bay|glendale|address|near me|what city|what cities|service area|cover)/.test(m)) {
    return {
      reply: "Cousins Appliance Repair serves the Greater Milwaukee Area, including Milwaukee, Greenfield, Mequon, Franklin, Oak Creek, Grafton, Port Washington, Cedarburg, Wauwatosa, West Allis, Brookfield, Shorewood, Whitefish Bay, Glendale, and nearby communities depending on availability.",
      action: null
    };
  }

  return {
    reply: "I can help with questions about washer, dryer, refrigerator, oven, stove, and dishwasher repair. For a specific issue, tell me the appliance type and what it is doing, or book a visit so a technician can take a look.",
    action: null
  };
}

async function getAIResponse(userMessage) {
  try {
    const response = await fetch(AI_BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage })
    });

    if (!response.ok) throw new Error("Backend unavailable");
    const data = await response.json();
    return {
      reply: data.reply || localFallbackResponse(userMessage).reply,
      action: data.action || detectAction(userMessage)
    };
  } catch (error) {
    console.warn("Using fallback chatbot response:", error.message);
    return localFallbackResponse(userMessage);
  }
}

async function handleChatSubmit(event) {
  event?.preventDefault();
  const value = chatInput.value.trim();
  if (!value) return;

  addMessage(value, "user");
  chatInput.value = "";

  const typing = addTypingMessage();
  const [{ reply, action }] = await Promise.all([
    getAIResponse(value),
    wait(1250)
  ]);

  typing.remove();
  addMessage(reply, "bot", action);
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    if (!targetId || targetId === "#") return;

    if (scrollToSection(targetId)) {
      event.preventDefault();
      mobileNav?.classList.remove("open");
      menuToggle?.setAttribute("aria-expanded", "false");
    }
  });
});

document.querySelectorAll(".open-booking").forEach((button) => {
  button.addEventListener("click", openBooking);
});

document.querySelectorAll(".close-booking").forEach((button) => {
  button.addEventListener("click", closeBooking);
});

document.querySelectorAll(".open-chat").forEach((button) => {
  button.addEventListener("click", () => openChat(button.dataset.message || ""));
});

chatLauncher?.addEventListener("click", () => openChat());
chatClose?.addEventListener("click", closeChat);
chatForm?.addEventListener("submit", handleChatSubmit);

document.querySelectorAll(".quick-prompts button").forEach((button) => {
  button.addEventListener("click", () => {
    openChat(button.dataset.prompt || "");
    if (chatInput) chatInput.value = button.dataset.prompt || "";
    handleChatSubmit();
  });
});

menuToggle?.addEventListener("click", () => {
  const isOpen = mobileNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

mobileNav?.querySelectorAll("a, button").forEach((item) => {
  item.addEventListener("click", () => {
    mobileNav.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeBooking();
    closeChat();
  }
});


initializeCarousels();
scrollForPrettyPath();
