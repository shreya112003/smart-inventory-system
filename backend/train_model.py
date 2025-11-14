# backend/train_model.py
import pandas as pd
import numpy as np
from pathlib import Path
import joblib
import json
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).parent
DATA_PATH = ROOT.parent / 'data' / 'sales_data.csv'
MODEL_DIR = ROOT.parent / 'model'
MODEL_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = MODEL_DIR / 'model.pkl'
META_PATH = MODEL_DIR / 'metadata.json'

def create_features(df):
    df['week'] = df['date'].dt.isocalendar().week
    df['prev_qty'] = df.groupby('product_id')['quantity_sold'].shift(1).fillna(0)
    df['ma_2'] = df.groupby('product_id')['quantity_sold'].rolling(2, min_periods=1).mean().reset_index(level=0, drop=True)
    df['ma_3'] = df.groupby('product_id')['quantity_sold'].rolling(3, min_periods=1).mean().reset_index(level=0, drop=True)
    df = df.fillna(0)
    return df

def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"{DATA_PATH} not found. Place sales_data.csv in data/")

    df = pd.read_csv(DATA_PATH)
    df['date'] = pd.to_datetime(df['date'])
    if 'product_id' not in df.columns:
        df['product_id'] = 1
    # weekly aggregate per product (works for single-product dataset too)
    weekly = df.set_index('date').resample('W').sum().reset_index()
    if 'product_id' not in weekly.columns or weekly['product_id'].isnull().all():
        weekly['product_id'] = df['product_id'].iloc[0]
    weekly = weekly.sort_values('date')
    weekly = create_features(weekly)
    weekly['target'] = weekly['quantity_sold'].shift(-1).fillna(weekly['quantity_sold'].iloc[-1])
    features = ['prev_qty', 'ma_2', 'ma_3']
    X = weekly[features].values
    y = weekly['target'].values
    if len(X) < 5:
        # fallback simple predictor
        class SimpleModel:
            def predict(self, X_in):
                return np.array([float(x[0] * 1.02) for x in X_in])
        model = SimpleModel()
    else:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        model = GradientBoostingRegressor(n_estimators=50, random_state=42)
        model.fit(X_train, y_train)
    joblib.dump(model, MODEL_PATH)
    meta = {"features": features, "trained_on": str(pd.Timestamp.now())}
    with open(META_PATH, 'w') as f:
        json.dump(meta, f, indent=2)
    print("Model trained and saved to", MODEL_PATH)

if __name__ == "__main__":
    main()
