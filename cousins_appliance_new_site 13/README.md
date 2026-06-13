# Cousins Appliance Repair Website

A responsive HTML/CSS/JavaScript website with a Node.js/Express chatbot backend, OpenAI API integration, Setmore booking flow, blog pages, repair gallery, and a new local scikit-learn machine learning intent classifier.

## What is included

- Modern responsive home page
- Detailed services page
- Setmore booking popup/modal
- Mobile call/book/chat buttons
- CousinsCare chatbot UI
- OpenAI backend endpoint at `/api/chat`
- Local fallback chatbot answers if no OpenAI key is added yet
- Gallery with compressed repair photos and captions
- Review/testimonial section
- Compact `Cousins Blog` page with five square preview cards
- 5 detailed blog article pages
- Python/scikit-learn NLP intent classifier for chatbot routing
- FastAPI ML prediction endpoint at `http://127.0.0.1:5001/predict`

## How to view the website without the AI backend

1. Unzip the folder.
2. Open `index.html` in your browser.
3. The site will work, including the design, booking popup, service pages, and fallback chatbot.

## How to run the full AI + ML chatbot locally

This project now has two backend services:

1. A Python scikit-learn ML intent API on port `5001`
2. A Node.js/OpenAI chatbot backend on port `3001`

Run them in two separate terminals.

### Terminal 1: Start the scikit-learn ML intent API

From the project root:

```bash
cd ml_intent
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python train_intent_model.py
python intent_api.py
```

On Windows PowerShell:

```powershell
cd ml_intent
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python train_intent_model.py
python intent_api.py
```

The ML API runs at:

```txt
http://127.0.0.1:5001
```

You can test it with:

```bash
curl -X POST http://127.0.0.1:5001/predict \
  -H "Content-Type: application/json" \
  -d '{"message":"My dryer spins but it is not heating"}'
```

### Terminal 2: Start the Node/OpenAI chatbot backend

From the project root:

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and paste your OpenAI API key:

```env
OPENAI_API_KEY=your_real_key_here
OPENAI_MODEL=gpt-5.4-mini
PORT=3001
INTENT_API_URL=http://127.0.0.1:5001/predict
INTENT_CONFIDENCE_THRESHOLD=0.28
```

Then start the backend:

```bash
npm start
```

Open this in your browser:

```txt
http://localhost:3001
```

The chatbot backend will now use this flow:

```txt
Customer message -> scikit-learn intent classifier -> Node backend -> OpenAI/fallback response -> website chatbot
```

If the ML API is not running, the chatbot still works using rule-based fallback logic.

## Where to add the real Setmore link

Open `script.js` and replace:

```js
const SETMORE_BOOKING_URL = "https://cousinsappliancerepairs.setmore.com";
```

with the real Setmore booking link.

## What the machine learning model does

The model in `ml_intent` is a supervised NLP classifier trained on labeled appliance-repair customer messages.

It predicts intents such as:

- `booking_request`
- `pricing_question`
- `washer_drain_issue`
- `washer_leak_issue`
- `dryer_no_heat`
- `dryer_noise_issue`
- `refrigerator_not_cooling`
- `refrigerator_leak_issue`
- `dishwasher_not_cleaning`
- `dishwasher_drain_issue`
- `oven_stove_heating_issue`
- `safety_emergency`
- `service_area_question`
- `general_question`

The training workflow uses:

- Python
- pandas
- scikit-learn
- TF-IDF vectorization
- Logistic Regression
- train/test split
- accuracy score
- classification report
- confusion matrix
- joblib model saving
- FastAPI for model serving

The training data is stored in:

```txt
ml_intent/data/intent_training_data.csv
```

The trained model and evaluation file are stored in:

```txt
ml_intent/model/cousins_intent_model.joblib
ml_intent/model/metrics.json
```

## Blog update

This version includes a compact `Cousins Blog` page with five square preview cards. Each card links to its own article page:

- `blog-washer-not-draining.html`
- `blog-refrigerator-repair-signs.html`
- `blog-dryer-not-heating.html`
- `blog-dishwasher-not-cleaning.html`
- `blog-prepare-repair-visit.html`

The chatbot strips Markdown characters like `**`, `*`, `_`, backticks, headings, and markdown links before showing messages to customers.

## Resume bullet ideas

- Built a hybrid AI chatbot combining the OpenAI API with a custom scikit-learn NLP intent classifier trained on labeled appliance-repair customer messages.
- Used Python, pandas, scikit-learn, TF-IDF vectorization, Logistic Regression, train/test split, accuracy scoring, classification reporting, and joblib model serialization to build a supervised machine learning prototype.
- Exposed the trained ML model through a FastAPI prediction endpoint and integrated it with a Node.js/Express chatbot backend to classify customer intent before generating support responses.
- Implemented routing logic for booking requests, pricing questions, appliance-specific issues, service-area questions, and safety-emergency scenarios.
- Designed and developed a responsive appliance repair website using HTML, CSS, and JavaScript with service pages, customer booking flow, mobile-first navigation, blog content, and repair gallery.
- Integrated a Setmore appointment booking popup to let customers schedule appliance repair visits without leaving the website.
- Built a Node.js/Express backend connected to the OpenAI API for an AI customer support chatbot that answers service, pricing, troubleshooting, and booking questions.
- Implemented fallback chatbot workflows to keep customer support available even if the OpenAI API or ML intent API is offline.

## Important notes

- Do not put your OpenAI API key in `script.js`, `index.html`, or any frontend file.
- Only store the OpenAI key in `backend/.env`.
- The `$95 diagnostic/service visit fee` is only surfaced in the chatbot when users ask about pricing.
- The ML model is a portfolio/prototype classifier trained on sample labeled messages. Add real customer messages over time to improve accuracy and reliability.


## v10 Chatbot Fallback Notes

The chatbot now handles business-information questions in both the backend fallback and the frontend local fallback, including:

- Are your technicians licensed?
- Are your technicians certified?
- Who is the founder?
- Who owns Cousins Appliance Repair?

Flow:

1. The website sends the visitor message to the Node/Express backend.
2. The backend asks the local scikit-learn FastAPI model for an intent prediction.
3. If `OPENAI_API_KEY` is set in `backend/.env`, OpenAI writes the final answer using the business facts and scikit-learn intent as context.
4. If the OpenAI API key is missing, invalid, or the backend has an error, the chatbot uses the safer hard-coded fallback replies.
5. If the Node backend is not running at all, the browser uses the frontend local fallback in `script.js`.

For OpenAI answers, create `backend/.env` from `.env.example` and add your key. Make sure `OPENAI_MODEL` is a valid model for your OpenAI account.

## Google Reviews widget area

The homepage now includes a themed Google Reviews section. The live third-party widget code should be pasted inside the `google-reviews-widget` block in `index.html`:

```html
<div class="google-reviews-widget" aria-label="Google Reviews widget area">
  <!-- Paste your third-party Google Reviews widget code here. -->
</div>
```

Use the widget embed code from whichever Google Reviews tool the business chooses, such as Elfsight, SociableKIT, or Common Ninja. The surrounding styling already matches the black/red Cousins Appliance Repair theme.
