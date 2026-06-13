"""
Train a local scikit-learn NLP intent classifier for CousinsCare.

This prototype uses labeled customer-service messages to predict what a visitor
is asking for, such as booking, pricing, dryer no heat, refrigerator not cooling,
or safety emergency. The Node.js chatbot backend can call the FastAPI service in
intent_api.py and use this prediction before sending a response.
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "intent_training_data.csv"
MODEL_DIR = BASE_DIR / "model"
MODEL_PATH = MODEL_DIR / "cousins_intent_model.joblib"
METRICS_PATH = MODEL_DIR / "metrics.json"


def load_data() -> pd.DataFrame:
    data = pd.read_csv(DATA_PATH)
    data["text"] = data["text"].astype(str).str.strip()
    data["label"] = data["label"].astype(str).str.strip()
    data = data[(data["text"] != "") & (data["label"] != "")]
    return data


def train() -> None:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    data = load_data()

    x_train, x_test, y_train, y_test = train_test_split(
        data["text"],
        data["label"],
        test_size=0.25,
        random_state=42,
        stratify=data["label"],
    )

    model = Pipeline(
        steps=[
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    analyzer="word",
                    ngram_range=(1, 3),
                    min_df=1,
                    sublinear_tf=True,
                ),
            ),
            (
                "classifier",
                LogisticRegression(
                    max_iter=2500,
                    class_weight="balanced",
                    solver="lbfgs",
                    C=4.0,
                    random_state=42,
                ),
            ),
        ]
    )

    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    accuracy = accuracy_score(y_test, predictions)
    report = classification_report(y_test, predictions, output_dict=True, zero_division=0)
    labels = sorted(data["label"].unique())
    matrix = confusion_matrix(y_test, predictions, labels=labels).tolist()

    metadata = {
        "model_type": "scikit-learn Pipeline: TF-IDF + Logistic Regression",
        "dataset_rows": int(len(data)),
        "labels": labels,
        "train_rows": int(len(x_train)),
        "test_rows": int(len(x_test)),
        "accuracy": round(float(accuracy), 4),
        "classification_report": report,
        "confusion_matrix_labels": labels,
        "confusion_matrix": matrix,
    }

    joblib.dump(model, MODEL_PATH)
    METRICS_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print(f"Saved model to: {MODEL_PATH}")
    print(f"Saved metrics to: {METRICS_PATH}")
    print(f"Accuracy: {accuracy:.2%}")
    print("Labels:")
    for label in labels:
        print(f"- {label}")


if __name__ == "__main__":
    train()
