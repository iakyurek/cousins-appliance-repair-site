"""
FastAPI prediction service for the Cousins Appliance Repair ML intent model.

Run with:
  python train_intent_model.py
  python intent_api.py

The Node.js backend calls POST /predict with {"message": "..."}.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "cousins_intent_model.joblib"
METRICS_PATH = BASE_DIR / "model" / "metrics.json"

INTENT_DESCRIPTIONS = {
    "booking_request": "Customer wants to schedule or check appointment availability.",
    "pricing_question": "Customer is asking about price, estimate, quote, diagnostic fee, or cost.",
    "washer_drain_issue": "Customer likely has a washer draining or standing-water problem.",
    "washer_leak_issue": "Customer likely has a washer leaking or water-on-floor problem.",
    "dryer_no_heat": "Customer likely has a dryer no-heat or long-dry-time problem.",
    "dryer_noise_issue": "Customer likely has a dryer noise, squeak, belt, or drum problem.",
    "refrigerator_not_cooling": "Customer likely has a refrigerator or freezer cooling problem.",
    "refrigerator_leak_issue": "Customer likely has a refrigerator leak, ice maker leak, or clogged drain issue.",
    "dishwasher_not_cleaning": "Customer likely has a dishwasher cleaning, spray arm, or detergent issue.",
    "dishwasher_drain_issue": "Customer likely has a dishwasher draining or standing-water problem.",
    "oven_stove_heating_issue": "Customer likely has an oven, stove, range, burner, ignition, or heating issue.",
    "safety_emergency": "Customer may have a gas, smoke, spark, flooding, or electrical safety concern.",
    "service_area_question": "Customer is asking where Cousins is located, based, or whether Cousins serves their city or ZIP code.",
    "business_info_question": "Customer is asking about the founder, owner, technician licensing, certification, qualifications, or business credentials.",
    "general_question": "General question or unclear repair inquiry.",
}

app = FastAPI(
    title="Cousins Appliance Repair Intent Classifier",
    description="Local scikit-learn NLP model for chatbot intent classification.",
    version="1.0.0",
)


class PredictionRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)


class PredictionResponse(BaseModel):
    intent: str
    confidence: float
    description: str
    probabilities: dict[str, float]
    model: str


def load_model() -> Any:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model file not found at {MODEL_PATH}. Run python train_intent_model.py first."
        )
    return joblib.load(MODEL_PATH)


MODEL = load_model()


def get_metrics() -> dict[str, Any]:
    if METRICS_PATH.exists():
        return json.loads(METRICS_PATH.read_text(encoding="utf-8"))
    return {}


@app.get("/health")
def health() -> dict[str, Any]:
    metrics = get_metrics()
    return {
        "status": "ok",
        "model_loaded": True,
        "model_type": metrics.get("model_type", "scikit-learn Pipeline"),
        "accuracy": metrics.get("accuracy"),
        "labels": metrics.get("labels", sorted(INTENT_DESCRIPTIONS)),
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest) -> PredictionResponse:
    message = payload.message.strip()
    labels = list(MODEL.classes_)
    probabilities = MODEL.predict_proba([message])[0]
    probability_by_label = {
        label: round(float(prob), 4) for label, prob in zip(labels, probabilities)
    }
    predicted_label = labels[int(probabilities.argmax())]
    confidence = round(float(max(probabilities)), 4)

    return PredictionResponse(
        intent=predicted_label,
        confidence=confidence,
        description=INTENT_DESCRIPTIONS.get(predicted_label, "Predicted customer intent."),
        probabilities=dict(
            sorted(probability_by_label.items(), key=lambda item: item[1], reverse=True)[:5]
        ),
        model="scikit-learn TF-IDF + Logistic Regression",
    )


if __name__ == "__main__":
    uvicorn.run("intent_api:app", host="127.0.0.1", port=5001, reload=False)
