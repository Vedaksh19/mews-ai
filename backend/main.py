"""
MEWS AI - FastAPI Backend Service.
Course: 21CSC307P Machine Learning for Data Analytics, Team 09.
"""
import os
import sys
from pathlib import Path

# Ensure src is in sys.path immediately for unpickling custom pipeline transformers
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / 'src'))
sys.path.insert(0, str(BASE_DIR))

os.environ["LOKY_MAX_CPU_COUNT"] = "1"

from contextlib import asynccontextmanager
import json
from typing import Dict, Any, List, Optional
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, field_validator

# Paths
DATA_PATH = BASE_DIR / 'data' / 'mews_dataset_v2.csv'
MODELS_DIR = BASE_DIR / 'models'
REPORTS_DIR = BASE_DIR / 'reports'
FIGURES_DIR = REPORTS_DIR / 'figures'

# Global State for pre-loaded models and datasets
APP_STATE: Dict[str, Any] = {}

VALID_SECTORS = {'Auto', 'Banking', 'Energy', 'FMCG', 'IT', 'Metals', 'Pharma'}
VALID_CAPS = {'small', 'large'}

# Import risk bands mapping
from risk_bands import get_risk_band
from preprocess import FEATURE_COLS, get_feature_names


class PredictRequest(BaseModel):
    """Payload for real-time market manipulation risk scoring."""
    volume_ratio_20d: Optional[float] = Field(None, ge=0.0, le=50.0, description="20-day rolling volume ratio")
    volatility: Optional[float] = Field(None, ge=0.0, le=1.0, description="Historical price volatility")
    delivery_pct: Optional[float] = Field(None, ge=0.0, le=100.0, description="Delivery quantity percentage")
    order_book_imbalance: Optional[float] = Field(None, ge=-1.0, le=1.0, description="Order book bid-ask imbalance ratio")
    sentiment_score: Optional[float] = Field(None, ge=-1.0, le=1.0, description="Sentiment polarity score (-1 to 1)")
    social_mentions: Optional[float] = Field(None, ge=0.0, le=100000.0, description="Raw social buzz and mention volume")
    volume: Optional[float] = Field(None, ge=0.0, le=1e9, description="Daily traded share volume")
    close_price: Optional[float] = Field(None, ge=0.1, le=100000.0, description="Closing share price in INR")
    avg_trade_size: Optional[float] = Field(None, ge=1.0, le=1e7, description="Average order execution trade size")
    past_manipulation_flags: Optional[int] = Field(None, ge=0, le=10, description="Historical SEBI / exchange surveillance flags")
    market_cap_class: str = Field("small", description="'small' or 'large'")
    sector: str = Field("Banking", description="Sector name")

    @field_validator('market_cap_class')
    @classmethod
    def validate_cap(cls, v: str) -> str:
        v_clean = v.strip().lower()
        if v_clean not in VALID_CAPS:
            raise ValueError(f"market_cap_class must be one of {VALID_CAPS}")
        return v_clean

    @field_validator('sector')
    @classmethod
    def validate_sector(cls, v: str) -> str:
        sector_map = {s.lower(): s for s in VALID_SECTORS}
        v_clean = v.strip().lower()
        if v_clean not in sector_map:
            raise ValueError(f"sector must be one of {VALID_SECTORS}")
        return sector_map[v_clean]


class FeatureContribution(BaseModel):
    feature: str
    feature_value: Optional[float]
    coefficient: float
    direction: str
    impact_score: float


class PredictResponse(BaseModel):
    risk_score: float
    band: str
    level: str
    action: str
    color: str
    severity: int
    manipulation_probability: float
    alert: bool
    alert_threshold: float
    top_contributions: List[FeatureContribution]


class StockSummary(BaseModel):
    stock_id: str
    market_cap_class: str
    sector: str
    total_days: int
    episode_count: int
    manipulation_days: int


class StockTimeseriesDay(BaseModel):
    day: int
    close_price: float
    volume_ratio_20d: float
    actual_risk_score: float
    predicted_risk_score: float
    manipulation_label: int
    manipulation_probability: float
    alert: bool


def init_app_state():
    """Load models, datasets, and configurations once at service startup."""
    print("Loading MEWS AI models and datasets into memory...")
    
    # 1. Linear Pipeline
    lin_path = MODELS_DIR / 'linear_pipeline.joblib'
    if lin_path.exists():
        APP_STATE['linear_model'] = joblib.load(lin_path)
    else:
        APP_STATE['linear_model'] = None
        
    # 2. Classifier Pipeline
    clf_path = MODELS_DIR / 'classifier_pipeline.joblib'
    if clf_path.exists():
        APP_STATE['classifier_model'] = joblib.load(clf_path)
    else:
        APP_STATE['classifier_model'] = None
        
    # 3. Model Config & Alert Threshold
    cfg_path = MODELS_DIR / 'config.json'
    if cfg_path.exists():
        with open(cfg_path, 'r', encoding='utf-8') as f:
            APP_STATE['config'] = json.load(f)
    else:
        APP_STATE['config'] = {'alert_threshold': 0.70}
        
    # 4. Dataset
    if DATA_PATH.exists():
        df = pd.read_csv(DATA_PATH)
        APP_STATE['dataset'] = df
        
        # Precompute stock summaries
        stocks_info = []
        for stock_id, g in df.groupby('stock'):
            is_manip = g['manipulation_label'].values
            episodes = int(np.sum((is_manip[1:] == 1) & (is_manip[:-1] == 0)) + (1 if is_manip[0] == 1 else 0))
            stocks_info.append({
                'stock_id': stock_id,
                'market_cap_class': str(g['market_cap_class'].iloc[0]),
                'sector': str(g['sector'].iloc[0]),
                'total_days': int(len(g)),
                'episode_count': episodes,
                'manipulation_days': int(g['manipulation_label'].sum())
            })
        APP_STATE['stocks_summary'] = sorted(stocks_info, key=lambda x: x['stock_id'])
    else:
        APP_STATE['dataset'] = None
        APP_STATE['stocks_summary'] = []
        
    print("MEWS AI Backend initialization complete.")


# Initialize state immediately
init_app_state()


app = FastAPI(
    title="MEWS AI API",
    description="Market Manipulation Early Warning System API (21CSC307P, Team 09)",
    version="2.0.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", summary="Service Health Check")
def get_health() -> Dict[str, str]:
    """Check health and confirm models are loaded."""
    return {
        "status": "ok",
        "service": "MEWS AI - Market Manipulation Early Warning System",
        "models_loaded": str(APP_STATE.get('linear_model') is not None and APP_STATE.get('classifier_model') is not None)
    }


@app.post("/api/predict", response_model=PredictResponse, summary="Real-time Risk Scoring")
def predict_risk(payload: PredictRequest) -> PredictResponse:
    """
    Score market manipulation risk using pre-trained Linear Regression and Classifier pipelines.
    Supports missing numeric values (handled seamlessly via median imputation in the pipeline).
    """
    lin_model = APP_STATE.get('linear_model')
    clf_model = APP_STATE.get('classifier_model')
    cfg = APP_STATE.get('config', {})
    alert_thresh = float(cfg.get('alert_threshold', 0.70))
    
    if lin_model is None or clf_model is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="ML models are not loaded.")
        
    # Build input DataFrame
    input_dict = {
        'close_price': payload.close_price,
        'volume': payload.volume,
        'volume_ratio_20d': payload.volume_ratio_20d,
        'volatility': payload.volatility,
        'delivery_pct': payload.delivery_pct,
        'order_book_imbalance': payload.order_book_imbalance,
        'sentiment_score': payload.sentiment_score,
        'social_mentions': payload.social_mentions,
        'avg_trade_size': payload.avg_trade_size,
        'past_manipulation_flags': payload.past_manipulation_flags,
        'market_cap_class': payload.market_cap_class,
        'sector': payload.sector
    }
    input_df = pd.DataFrame([input_dict])
    
    # 1. Predict continuous risk_score from linear pipeline
    raw_risk = float(lin_model.predict(input_df)[0])
    risk_info = get_risk_band(raw_risk)
    
    # 2. Predict manipulation probability from classifier pipeline
    if hasattr(clf_model, 'predict_proba'):
        prob_manip = float(clf_model.predict_proba(input_df)[0, 1])
    else:
        # Fallback for IsolationForest or single-output
        prob_manip = float(min(1.0, max(0.0, raw_risk / 100.0)))
        
    # Determine alert status
    is_alert = (prob_manip >= alert_thresh) or (risk_info['score'] >= 50.0)
    
    # 3. Compute feature contributions from linear model coefficients
    lr_estimator = lin_model.named_steps['lr']
    pre_step = lin_model.named_steps['pre']
    feat_names = get_feature_names(pre_step)
    
    # Transform input row to get scaled representation
    transformed_row = pre_step.transform(input_df)[0]
    coefficients = lr_estimator.coef_
    
    contributions: List[FeatureContribution] = []
    for f_name, f_scaled_val, coef in zip(feat_names, transformed_row, coefficients):
        impact = float(f_scaled_val * coef)
        direction = "increases_risk" if impact > 0 else "decreases_risk"
        
        # Get raw feature value for display
        raw_val = input_dict.get(f_name)
        if raw_val is None and f_name == 'log_volume' and payload.volume is not None:
            raw_val = payload.volume
        elif raw_val is None and f_name == 'log_mentions' and payload.social_mentions is not None:
            raw_val = payload.social_mentions
            
        contributions.append(FeatureContribution(
            feature=f_name,
            feature_value=float(raw_val) if raw_val is not None and not np.isnan(raw_val) else None,
            coefficient=round(float(coef), 4),
            direction=direction,
            impact_score=round(impact, 4)
        ))
        
    # Sort contributions by absolute impact descending
    contributions.sort(key=lambda x: abs(x.impact_score), reverse=True)
    
    return PredictResponse(
        risk_score=risk_info['score'],
        band=risk_info['band'],
        level=risk_info['level'],
        action=risk_info['action'],
        color=risk_info['color'],
        severity=risk_info['severity'],
        manipulation_probability=round(prob_manip, 4),
        alert=bool(is_alert),
        alert_threshold=round(alert_thresh, 4),
        top_contributions=contributions[:8]
    )


@app.get("/api/stocks", response_model=List[StockSummary], summary="List Stocks")
def list_stocks() -> List[StockSummary]:
    """Return all 200 stocks with market cap, sector, and historical episode counts."""
    summaries = APP_STATE.get('stocks_summary', [])
    if not summaries:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stock data not found.")
    return [StockSummary(**s) for s in summaries]


@app.get("/api/stocks/{stock_id}/timeseries", response_model=List[StockTimeseriesDay], summary="Stock Timeseries Telemetry")
def get_stock_timeseries(stock_id: str) -> List[StockTimeseriesDay]:
    """Retrieve daily time-series telemetry, actual risk, predicted risk, and alert zones for a stock."""
    df = APP_STATE.get('dataset')
    lin_model = APP_STATE.get('linear_model')
    clf_model = APP_STATE.get('classifier_model')
    cfg = APP_STATE.get('config', {})
    alert_thresh = float(cfg.get('alert_threshold', 0.70))
    
    if df is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not available.")
        
    stock_df = df[df['stock'] == stock_id.upper().strip()].sort_values('day').copy()
    if len(stock_df) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Stock ID '{stock_id}' not found.")
        
    # Generate model predictions for the stock's full timeseries
    X_stock = stock_df[FEATURE_COLS]
    if lin_model is not None:
        pred_risks = np.clip(lin_model.predict(X_stock), 0.0, 100.0)
    else:
        pred_risks = stock_df['risk_score'].values
        
    if clf_model is not None and hasattr(clf_model, 'predict_proba'):
        pred_probs = clf_model.predict_proba(X_stock)[:, 1]
    else:
        pred_probs = pred_risks / 100.0
        
    results = []
    for idx, (_, row) in enumerate(stock_df.iterrows()):
        prob = float(pred_probs[idx])
        pred_r = float(pred_risks[idx])
        is_alert = (prob >= alert_thresh) or (pred_r >= 50.0)
        
        results.append(StockTimeseriesDay(
            day=int(row['day']),
            close_price=float(row['close_price']),
            volume_ratio_20d=float(row['volume_ratio_20d']),
            actual_risk_score=float(row['risk_score']),
            predicted_risk_score=round(pred_r, 2),
            manipulation_label=int(row['manipulation_label']),
            manipulation_probability=round(prob, 4),
            alert=bool(is_alert)
        ))
        
    return results


@app.get("/api/metrics", summary="Get Model Metrics")
def get_metrics() -> Dict[str, Any]:
    """Retrieve full metrics JSON containing regression, classification, CV folds, and PDF comparisons."""
    metrics_file = REPORTS_DIR / 'metrics.json'
    if not metrics_file.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="metrics.json not found.")
    with open(metrics_file, 'r', encoding='utf-8') as f:
        return json.load(f)


@app.get("/api/eda", summary="Get EDA Summary")
def get_eda_summary() -> Dict[str, Any]:
    """Retrieve complete exploratory data analysis statistics and Welch t-test results."""
    eda_file = REPORTS_DIR / 'eda_summary.json'
    if not eda_file.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="eda_summary.json not found.")
    with open(eda_file, 'r', encoding='utf-8') as f:
        return json.load(f)


@app.get("/api/figures/{name}", summary="Serve Artifact Figures")
def get_figure(name: str):
    """Serve generated diagnostic PNG plots from reports/figures/."""
    safe_name = Path(name).name
    if not safe_name.endswith('.png'):
        safe_name = f"{safe_name}.png"
        
    fig_file = FIGURES_DIR / safe_name
    if not fig_file.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Figure '{safe_name}' not found.")
    return FileResponse(fig_file, media_type="image/png")
