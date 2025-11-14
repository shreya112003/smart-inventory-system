from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
import joblib
import numpy as np
from datetime import datetime, timedelta

# Base paths
ROOT_DIR = Path(__file__).parent
DATA_PATH = ROOT_DIR.parent / "data" / "sales_data.csv"
MODEL_PATH = ROOT_DIR.parent / "model" / "model.pkl"

# Create the main app
app = FastAPI(title="Inventory Forecast API")

# Router
api_router = APIRouter(prefix="/api")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------
# Dummy Products (Neutral)
# ------------------------------
PRODUCTS = [
    {"product_id": 101, "product_name": "Laptop Pro 14"},
    {"product_id": 102, "product_name": "Smartphone X5"},
    {"product_id": 103, "product_name": "Noise Cancelling Headphones"},
    {"product_id": 104, "product_name": "Wireless Keyboard"},
]

# ------------------------------
# Dummy Historical Sales Data
# ------------------------------
DUMMY_SALES = {
    101: [120, 115, 130, 140, 138, 150, 145, 142, 155, 160, 158, 170],
    102: [210, 205, 200, 220, 215, 225, 230, 240, 250, 245, 255, 260],
    103: [80, 90, 85, 88, 92, 95, 100, 98, 105, 110, 108, 115],
    104: [150, 148, 152, 155, 160, 162, 170, 168, 175, 180, 185, 190],
}

# ------------------------------
# Models
# ------------------------------
class PredictionRequest(BaseModel):
    product_id: int
    weeks: int = 4

class PredictionResponse(BaseModel):
    product_id: int
    product_name: str
    predictions: List[Dict[str, Any]]
    total_predicted_demand: float
    average_predicted_demand: float
    max_predicted_demand: float


# ------------------------------
# Helper Function
# ------------------------------
def generate_forecast(values: List[int], weeks: int):
    """Simple moving average forecast (dummy model)."""
    avg = np.mean(values[-4:])
    preds = []

    for i in range(1, weeks + 1):
        variation = np.random.randint(-10, 11)
        preds.append({
            "week": f"Week {i}",
            "predicted_quantity": max(1, int(avg + variation)),
        })

    total = sum(p["predicted_quantity"] for p in preds)
    max_val = max(p["predicted_quantity"] for p in preds)
    avg_val = total / len(preds)

    return preds, total, avg_val, max_val


# ------------------------------
# Routes
# ------------------------------

@api_router.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": True}


@api_router.get("/products")
def get_products():
    return PRODUCTS


@api_router.get("/historical/{product_id}")
def get_historical(product_id: int):
    if product_id not in DUMMY_SALES:
        raise HTTPException(status_code=404, detail="Product not found")

    sales = DUMMY_SALES[product_id]
    today = datetime.today()

    history = []
    for i, qty in enumerate(sales):
        date = today - timedelta(weeks=len(sales) - i)
        history.append({"date": date.strftime("%Y-%m-%d"), "quantity_sold": qty})

    return history


@api_router.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):

    # Validate product
    product = next((p for p in PRODUCTS if p["product_id"] == request.product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    history = DUMMY_SALES[request.product_id]

    preds, total, avg, max_val = generate_forecast(history, request.weeks)

    return PredictionResponse(
        product_id=request.product_id,
        product_name=product["product_name"],
        predictions=preds,
        total_predicted_demand=total,
        average_predicted_demand=avg,
        max_predicted_demand=max_val,
    )


# Mount API
app.include_router(api_router)

