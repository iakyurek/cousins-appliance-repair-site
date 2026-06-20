import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend/.env for local testing. On Render, environment variables are set in the dashboard.
dotenv.config({ path: path.join(__dirname, ".env") });
const app = express();
const PORT = process.env.PORT || 3001;
const INTENT_API_URL = process.env.INTENT_API_URL || "http://127.0.0.1:5001/predict";
const INTENT_CONFIDENCE_THRESHOLD = Number(process.env.INTENT_CONFIDENCE_THRESHOLD || 0.28);

app.use(cors({
  origin: [
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "null"
  ]
}));
app.use(express.json({ limit: "1mb" }));

const siteRoot = path.join(__dirname, "..");

const legacyRedirects = {
  "/index.html": "/",
  "/services.html": "/Services",
  "/blog.html": "/Cousins-Blog",
  "/blog-washer-not-draining.html": "/Cousins-Blog/Washer-Not-Draining",
  "/blog-refrigerator-repair-signs.html": "/Cousins-Blog/Refrigerator-Repair-Signs",
  "/blog-dryer-not-heating.html": "/Cousins-Blog/Dryer-Not-Heating",
  "/blog-dishwasher-not-cleaning.html": "/Cousins-Blog/Oven-Glass-Cleaning",
  "/blog-prepare-repair-visit.html": "/Cousins-Blog/Prepare-Repair-Visit",
  "/blog-dryer-lint-buildup.html": "/Cousins-Blog/Dryer-Lint-Buildup",
  "/blog-dryer-belt-replacement.html": "/Cousins-Blog/Dryer-Belt-Replacement",
  "/blog-dishwasher-valve-issues.html": "/Cousins-Blog/Dishwasher-Valve-Issues"
};

app.use((req, res, next) => {
  if (req.method === "GET" && legacyRedirects[req.path]) {
    return res.redirect(301, legacyRedirects[req.path]);
  }
  next();
});

const prettyRoutes = {
  "/Services": "services.html",
  "/Services/": "services.html",
  "/Cousins-Blog": "blog.html",
  "/Cousins-Blog/": "blog.html",
  "/Cousins-Blog/Washer-Not-Draining": "blog-washer-not-draining.html",
  "/Cousins-Blog/Refrigerator-Repair-Signs": "blog-refrigerator-repair-signs.html",
  "/Cousins-Blog/Dryer-Not-Heating": "blog-dryer-not-heating.html",
  "/Cousins-Blog/Oven-Glass-Cleaning": "blog-dishwasher-not-cleaning.html",
  "/Cousins-Blog/Prepare-Repair-Visit": "blog-prepare-repair-visit.html",
  "/Cousins-Blog/Dryer-Lint-Buildup": "blog-dryer-lint-buildup.html",
  "/Cousins-Blog/Dryer-Belt-Replacement": "blog-dryer-belt-replacement.html",
  "/Cousins-Blog/Dishwasher-Valve-Issues": "blog-dishwasher-valve-issues.html",
  "/About-Us": "index.html",
  "/Past-Work": "index.html",
  "/Reviews": "index.html",
  "/Contact": "index.html"
};

Object.entries(prettyRoutes).forEach(([route, file]) => {
  app.get(route, (_req, res) => res.sendFile(path.join(siteRoot, file)));
});

// Serve the static website from the project root when the backend runs.
app.use(express.static(siteRoot));

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const INTENT_DESCRIPTIONS = {
  booking_request: "Customer wants to schedule or check appointment availability.",
  pricing_question: "Customer is asking about price, estimate, quote, diagnostic fee, or cost.",
  washer_drain_issue: "Customer likely has a washer draining or standing-water problem.",
  washer_leak_issue: "Customer likely has a washer leaking or water-on-floor problem.",
  dryer_no_heat: "Customer likely has a dryer no-heat or long-dry-time problem.",
  dryer_noise_issue: "Customer likely has a dryer noise, squeak, belt, or drum problem.",
  refrigerator_not_cooling: "Customer likely has a refrigerator or freezer cooling problem.",
  refrigerator_leak_issue: "Customer likely has a refrigerator leak, ice maker leak, or clogged drain issue.",
  dishwasher_not_cleaning: "Customer likely has a dishwasher cleaning, spray arm, or detergent issue.",
  dishwasher_drain_issue: "Customer likely has a dishwasher draining or standing-water problem.",
  oven_stove_heating_issue: "Customer likely has an oven, stove, range, burner, ignition, or heating issue.",
  safety_emergency: "Customer may have a gas, smoke, spark, flooding, or electrical safety concern.",
  service_area_question: "Customer is asking where Cousins is located, based, or whether Cousins serves their city or ZIP code.",
  business_info_question: "Customer is asking about the founder, owner, technician licensing, certification, qualifications, or business credentials.",
  general_question: "General question or unclear repair inquiry."
};

const INTENT_TO_ACTION = {
  booking_request: "booking",
  pricing_question: "booking",
  washer_drain_issue: "booking",
  washer_leak_issue: "booking",
  dryer_no_heat: "booking",
  dryer_noise_issue: "booking",
  refrigerator_not_cooling: "booking",
  refrigerator_leak_issue: "booking",
  dishwasher_not_cleaning: "booking",
  dishwasher_drain_issue: "booking",
  oven_stove_heating_issue: "booking",
  safety_emergency: "call",
  service_area_question: null,
  business_info_question: null,
  general_question: null
};

const systemInstructions = `
You are CousinsCare, a warm and professional AI customer support assistant for Cousins Appliance Repair.

Business facts:
- Business name: Cousins Appliance Repair.
- Phone: (414) 405-7621.
- Cousins Appliance Repair is a mobile appliance repair service based in Wisconsin. Main service area: the Greater Milwaukee Area.
- Service area examples include Milwaukee, Greenfield, Mequon, Franklin, Oak Creek, Grafton, Port Washington, Cedarburg, Wauwatosa, West Allis, Brookfield, Shorewood, Whitefish Bay, Glendale, and nearby communities depending on availability.
- Services: washer repair, dryer repair including gas and electric, refrigerator repair, dishwasher repair, oven repair, and stove/range repair.
- Metin is the founder. The technicians are certified and licensed.
- Customers can book through the Setmore booking popup on the website. Because booking volume can get high, explain that a technician will call or reach out after booking to confirm details, understand the issue, and make sure the visit is set up correctly.

AI workflow:
- A local scikit-learn NLP model may classify the customer's message before you answer.
- Use the predicted intent only as decision support, not as an absolute truth.
- If the predicted intent conflicts with the user's wording, trust the user's wording.
- Use the intent to route customers toward booking, calling, pricing details, or general repair guidance.

Pricing rules:
- Only mention the $95 diagnostic/service visit fee if the customer asks about price, cost, fee, estimate, quote, or how much.
- Explain it gently: "There is a $95 diagnostic/service visit fee, and that fee is applied toward the repair if you move forward. Final pricing depends on the appliance, issue, parts, and labor."
- Do not make up exact repair prices.

Safety rules:
- For gas smell, smoke, sparks, burning smell, flooding, electrical hazards, or anything dangerous, tell the customer to stop using the appliance and call/text the business or a qualified professional immediately.
- Do not give step-by-step instructions for unsafe electrical or gas repairs.

Conversation style:
- Keep answers short, helpful, and natural.
- Do not use markdown syntax. Do not use asterisks, bold, italic, headings, bullet formatting, or links written in markdown. Plain text only.
- Sound genuine and warm, not robotic.
- Answer basic troubleshooting questions at a high level.
- If the issue is specific, give a general explanation and encourage booking or calling.
- Do not guarantee same-day service. Say it may be available depending on the schedule.
`;

function ruleBasedIntent(message = "") {
  const m = message.toLowerCase();
  if (/(gas smell|smell gas|smoke|sparks|burning smell|fire|flood|flooding|electrical hazard|popping outlet)/.test(m)) return "safety_emergency";
  if (/(price|pricing|cost|fee|charge|estimate|quote|how much|diagnostic)/.test(m)) return "pricing_question";
  if (/(book|appointment|schedule|setmore|calendar|time slot|availability)/.test(m)) return "booking_request";
  if (/(founder|founded|owner|owns|started|runs the company|who runs|who is metin|metin|licensed|licenced|certified|certification|insured|qualified|qualifications|credentials|trained technicians|technicians licensed|techs licensed|repair people trained)/.test(m)) return "business_info_question";
  if (/(service area|areas do you cover|what areas|where are you located|where are you based|where.*located|where.*business|your address|business address|are you located|located in|based in|near me|what city|what cities|area|serve|cover|coverage|location|located|milwaukee|greenfield|mequon|franklin|oak creek|grafton|port washington|cedarburg|wauwatosa|west allis|brookfield|shorewood|whitefish bay|glendale|zip)/.test(m)) return "service_area_question";
  if (/(washer|washing machine)/.test(m) && /(drain|empty|standing water|pump|clog)/.test(m)) return "washer_drain_issue";
  if (/(washer|washing machine)/.test(m) && /(leak|puddle|drip|water on floor)/.test(m)) return "washer_leak_issue";
  if (/(dryer)/.test(m) && /(not heating|no heat|cold air|takes forever|not dry|wet clothes|long drying)/.test(m)) return "dryer_no_heat";
  if (/(dryer)/.test(m) && /(noise|squeak|squeal|grind|thump|rattle|belt|drum)/.test(m)) return "dryer_noise_issue";
  if (/(fridge|refrigerator|freezer)/.test(m) && /(not cooling|warm|not cold|spoiling|melting|temperature)/.test(m)) return "refrigerator_not_cooling";
  if (/(fridge|refrigerator|freezer|ice maker)/.test(m) && /(leak|water|drip|puddle|ice buildup|drain)/.test(m)) return "refrigerator_leak_issue";
  if (/(dishwasher)/.test(m) && /(not clean|dirty|soap|detergent|spray|residue|cloudy)/.test(m)) return "dishwasher_not_cleaning";
  if (/(dishwasher)/.test(m) && /(drain|standing water|clog|water at the bottom|backs up)/.test(m)) return "dishwasher_drain_issue";
  if (/(oven|stove|range|burner)/.test(m) && /(not heat|not heating|ignite|igniter|light|temperature|preheat)/.test(m)) return "oven_stove_heating_issue";
  return null;
}

function actionForIntent(intent) {
  return INTENT_TO_ACTION[intent] ?? null;
}

function detectAction(message = "", intent = null) {
  if (intent && actionForIntent(intent)) return actionForIntent(intent);
  const m = message.toLowerCase();
  if (/(book|appointment|schedule|setmore|calendar|time slot|availability)/.test(m)) return "booking";
  if (/(call|phone|text|number|urgent|emergency|gas smell|smoke|sparks|flood|burning smell)/.test(m)) return "call";
  if (/(price|pricing|cost|fee|charge|estimate|quote|how much|diagnostic)/.test(m)) return "booking";
  return null;
}

async function classifyIntent(message = "") {
  const ruleIntent = ruleBasedIntent(message);

  try {
    const response = await fetch(INTENT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(1500)
    });

    if (!response.ok) throw new Error(`Intent API returned ${response.status}`);
    const prediction = await response.json();
    const mlIntent = prediction.intent || null;
    const confidence = Number(prediction.confidence || 0);

    // Safety and obvious business-routing cases should never be weakened by a low-confidence model prediction.
    const finalIntent = ruleIntent || (confidence >= INTENT_CONFIDENCE_THRESHOLD ? mlIntent : "general_question");

    return {
      intent: finalIntent,
      confidence,
      modelIntent: mlIntent,
      description: INTENT_DESCRIPTIONS[finalIntent] || prediction.description || "Predicted customer intent.",
      probabilities: prediction.probabilities || {},
      source: ruleIntent ? "rules+sklearn" : "sklearn"
    };
  } catch (error) {
    return {
      intent: ruleIntent || "general_question",
      confidence: ruleIntent ? 1 : 0,
      modelIntent: null,
      description: INTENT_DESCRIPTIONS[ruleIntent || "general_question"],
      probabilities: {},
      source: "rules-fallback"
    };
  }
}

function replyForIntent(intent) {
  switch (intent) {
    case "pricing_question":
      return "There is a $95 diagnostic/service visit fee, and that fee is applied toward the repair if you move forward. The final quote depends on the appliance, issue, parts, and labor. Booking a visit is the best way to get an accurate answer.";
    case "booking_request":
      return "You can book through the Setmore calendar on this website. Choose your service, pick a time, and leave notes about the appliance issue. Because booking volume can get high, a technician will call or reach out after booking to confirm the details, understand the issue, and make sure the visit is set up correctly.";
    case "safety_emergency":
      return "For safety, stop using the appliance right away. If there is gas smell, smoke, sparks, flooding, or an electrical hazard, call/text Cousins Appliance Repair or a qualified professional immediately before using it again.";
    case "washer_drain_issue":
      return "This sounds like a washer draining issue. Common causes include a clogged drain hose, pump issue, or filter blockage. A technician can inspect it and confirm the repair. Booking a visit is the best next step.";
    case "washer_leak_issue":
      return "This sounds like a washer leak issue. It could be related to the hose, door seal, drain, or internal connection. Stop using it if water is spreading, then book a diagnostic visit.";
    case "dryer_no_heat":
      return "This sounds like a dryer heating issue. It could involve airflow, lint buildup, a heating element, igniter, fuse, or gas/electric component. A technician can diagnose it safely and explain the repair options.";
    case "dryer_noise_issue":
      return "This sounds like a dryer noise issue. Squeaking, grinding, or thumping can come from the belt, rollers, drum, or motor area. A technician can inspect it before it causes more damage.";
    case "refrigerator_not_cooling":
      return "This sounds like a refrigerator cooling issue. It may involve airflow, coils, fans, thermostat, compressor, or refrigerant-related components. Book a diagnostic visit so a technician can check it properly.";
    case "refrigerator_leak_issue":
      return "This sounds like a refrigerator leak issue. It can come from a clogged drain line, ice maker, water line, or condensation problem. A technician can inspect the source and recommend the repair.";
    case "dishwasher_not_cleaning":
      return "This sounds like a dishwasher cleaning issue. Common causes include a clogged filter, spray arm problem, water flow issue, or detergent cup issue. A diagnostic visit can confirm the cause.";
    case "dishwasher_drain_issue":
      return "This sounds like a dishwasher draining issue. Standing water can come from a clogged drain hose, pump issue, filter blockage, or sink/disposal connection. A technician can diagnose it and repair it.";
    case "oven_stove_heating_issue":
      return "This sounds like an oven or stove heating issue. Gas and electric models can involve igniters, burners, switches, sensors, or heating elements. For safety, avoid DIY gas or electrical repairs and book a technician.";
    case "service_area_question":
      return "Cousins Appliance Repair serves the Greater Milwaukee Area, including Milwaukee, Greenfield, Mequon, Franklin, Oak Creek, Grafton, Port Washington, Cedarburg, Wauwatosa, West Allis, Brookfield, Shorewood, Whitefish Bay, Glendale, and nearby communities depending on availability.";
    case "business_info_question":
      return "Cousins Appliance Repair was founded by Metin. The technicians are certified and licensed. For specific licensing, insurance, or appointment details, call/text (414) 405-7621 or include your question when booking.";
    default:
      return "I can help with washer, dryer, refrigerator, oven, stove, and dishwasher repair questions. Tell me what appliance is having trouble and what it is doing, or book a visit for a technician to diagnose it.";
  }
}

function fallbackReply(message = "", intentPrediction = null) {
  const intent = intentPrediction?.intent || ruleBasedIntent(message) || "general_question";
  return {
    reply: replyForIntent(intent),
    action: detectAction(message, intent),
    intent,
    intentConfidence: intentPrediction?.confidence ?? 0,
    intentSource: intentPrediction?.source || "fallback"
  };
}

app.get("/api/intent-health", async (_req, res) => {
  try {
    const response = await fetch(INTENT_API_URL.replace(/\/predict$/, "/health"), {
      signal: AbortSignal.timeout(1500)
    });
    const data = await response.json();
    return res.json({ ok: true, intentApiUrl: INTENT_API_URL, ...data });
  } catch (error) {
    return res.status(200).json({
      ok: false,
      intentApiUrl: INTENT_API_URL,
      message: "ML intent API is not running. Rule-based chatbot fallback is still available."
    });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body?.message;
    if (!userMessage || typeof userMessage !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }

    const intentPrediction = await classifyIntent(userMessage);

    if (!client) {
      const fallback = fallbackReply(userMessage, intentPrediction);
      return res.json({ ...fallback, source: "fallback-no-api-key" });
    }

    const intentContext = `
Local ML classifier result:
- Intent: ${intentPrediction.intent}
- Confidence: ${intentPrediction.confidence}
- Description: ${intentPrediction.description}
- Source: ${intentPrediction.source}
Use this as routing context, but trust the customer's actual wording first.

Customer message:
${userMessage}
`;

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      instructions: systemInstructions,
      input: intentContext,
      max_output_tokens: 220
    });

    const reply = response.output_text?.trim() || fallbackReply(userMessage, intentPrediction).reply;
    return res.json({
      reply,
      action: detectAction(userMessage, intentPrediction.intent),
      intent: intentPrediction.intent,
      intentConfidence: intentPrediction.confidence,
      intentSource: intentPrediction.source,
      source: "openai+sklearn"
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    const fallback = fallbackReply(req.body?.message || "");
    return res.status(200).json({ ...fallback, source: "fallback-error" });
  }
});

app.listen(PORT, () => {
  console.log(`Cousins Appliance Repair site running at http://localhost:${PORT}`);
  console.log("Chatbot backend endpoint: /api/chat");
  console.log(`ML intent classifier endpoint: ${INTENT_API_URL}`);
});
