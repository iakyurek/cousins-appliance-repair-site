# CousinsCare scikit-learn Intent Classifier

This folder adds a real machine learning component to the Cousins Appliance Repair project.

It trains a supervised NLP intent classifier using:

- Python
- pandas
- scikit-learn
- TF-IDF vectorization
- Logistic Regression
- train/test split
- accuracy and classification report
- FastAPI prediction endpoint

The model predicts what a customer is asking about, such as booking, pricing, washer draining, dryer no heat, refrigerator not cooling, dishwasher issues, service area questions, and safety emergencies.

## 1. Install Python dependencies

From the project root:

```bash
cd ml_intent
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

On Windows PowerShell:

```powershell
cd ml_intent
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 2. Train or retrain the model

```bash
python train_intent_model.py
```

This creates:

- `model/cousins_intent_model.joblib`
- `model/metrics.json`

## 3. Start the ML API

```bash
python intent_api.py
```

The ML API runs at:

```txt
http://127.0.0.1:5001
```

Test it:

```bash
curl -X POST http://127.0.0.1:5001/predict \
  -H "Content-Type: application/json" \
  -d '{"message":"My dryer spins but it is not heating"}'
```

## 4. Run the Node/OpenAI chatbot backend

In a second terminal:

```bash
cd backend
npm install
npm start
```

The Node backend automatically calls the ML API at:

```txt
http://127.0.0.1:5001/predict
```

You can change this in `backend/.env`:

```env
INTENT_API_URL=http://127.0.0.1:5001/predict
```

## Resume-ready project description

Built a hybrid AI chatbot combining the OpenAI API with a custom scikit-learn NLP intent classifier trained on labeled appliance-repair customer messages. Used TF-IDF vectorization, Logistic Regression, train/test split, model evaluation metrics, and a FastAPI prediction endpoint to classify customer intent and route users to booking, pricing, troubleshooting, service-area, or safety-emergency workflows.
