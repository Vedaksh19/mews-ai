"""
Comprehensive Test Suite for MEWS AI FastAPI Endpoints.
Course: 21CSC307P Machine Learning for Data Analytics, Team 09.

Tests all endpoints, schema validations, error codes (404, 422), and
explicitly tests missing numeric value imputation handling.
"""
import os
os.environ["LOKY_MAX_CPU_COUNT"] = "1"

import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Add backend and src to path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR.parent / 'src'))
sys.path.insert(0, str(BACKEND_DIR))

from main import app

client = TestClient(app)


def test_health_check():
    """Verify /api/health returns 200 and operational status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "MEWS AI" in data["service"]


def test_predict_full_payload():
    """Verify /api/predict with complete normal inputs."""
    payload = {
        "volume_ratio_20d": 1.05,
        "volatility": 0.015,
        "delivery_pct": 55.0,
        "order_book_imbalance": 0.02,
        "sentiment_score": 0.05,
        "social_mentions": 15.0,
        "volume": 25000.0,
        "close_price": 150.0,
        "avg_trade_size": 850.0,
        "past_manipulation_flags": 0,
        "market_cap_class": "small",
        "sector": "Banking"
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert 0.0 <= data["risk_score"] <= 100.0
    assert data["band"] in ["Low", "Watch", "High", "Critical"]
    assert data["action"] in ["None", "Monitor", "Alert", "Escalate"]
    assert 0.0 <= data["manipulation_probability"] <= 1.0
    assert isinstance(data["alert"], bool)
    assert len(data["top_contributions"]) > 0


def test_predict_manipulation_pump_day():
    """Verify /api/predict correctly flags elevated risk on a pump build-up day."""
    payload = {
        "volume_ratio_20d": 3.8,
        "volatility": 0.045,
        "delivery_pct": 28.0,
        "order_book_imbalance": 0.45,
        "sentiment_score": 0.65,
        "social_mentions": 350.0,
        "volume": 120000.0,
        "close_price": 280.0,
        "avg_trade_size": 1800.0,
        "past_manipulation_flags": 2,
        "market_cap_class": "small",
        "sector": "IT"
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_score"] > 25.0
    assert data["band"] in ["Watch", "High", "Critical"]
    assert data["severity"] >= 2


def test_predict_missing_values_imputation():
    """Verify /api/predict handles missing numeric fields seamlessly via median imputer."""
    payload = {
        "volume_ratio_20d": None,
        "volatility": 0.02,
        "delivery_pct": None,
        "order_book_imbalance": None,
        "sentiment_score": None,
        "social_mentions": None,
        "volume": None,
        "close_price": 100.0,
        "avg_trade_size": None,
        "past_manipulation_flags": None,
        "market_cap_class": "large",
        "sector": "Energy"
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert 0.0 <= data["risk_score"] <= 100.0
    assert data["band"] in ["Low", "Watch", "High", "Critical"]


def test_predict_invalid_sector():
    """Verify 422 Unprocessable Entity when invalid sector is passed."""
    payload = {
        "market_cap_class": "small",
        "sector": "InvalidSectorName"
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 422


def test_predict_invalid_market_cap():
    """Verify 422 Unprocessable Entity when invalid market cap class is passed."""
    payload = {
        "market_cap_class": "mega_cap",
        "sector": "Banking"
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 422


def test_list_stocks():
    """Verify /api/stocks returns list of stocks with expected attributes."""
    response = client.get("/api/stocks")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 200
    first = data[0]
    assert "stock_id" in first
    assert "market_cap_class" in first
    assert "sector" in first
    assert "episode_count" in first


def test_stock_timeseries_valid():
    """Verify /api/stocks/{stock_id}/timeseries returns 250 daily rows."""
    response = client.get("/api/stocks/STK001/timeseries")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 250
    first_day = data[0]
    assert first_day["day"] == 0
    assert "close_price" in first_day
    assert "actual_risk_score" in first_day
    assert "predicted_risk_score" in first_day


def test_stock_timeseries_not_found():
    """Verify 404 for invalid stock ID."""
    response = client.get("/api/stocks/NON_EXISTENT_STK/timeseries")
    assert response.status_code == 404


def test_metrics_endpoint():
    """Verify /api/metrics returns full evaluation metrics."""
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "linear_regression" in data
    assert "classifiers" in data
    assert "pdf_vs_actual" in data


def test_eda_endpoint():
    """Verify /api/eda returns descriptive statistics and Welch test."""
    response = client.get("/api/eda")
    assert response.status_code == 200
    data = response.json()
    assert data["total_rows"] == 50000
    assert "welch_t_test" in data


def test_figures_endpoint_valid():
    """Verify /api/figures serves PNG images."""
    response = client.get("/api/figures/fig1_distributions.png")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"


def test_figures_endpoint_not_found():
    """Verify 404 for missing figure."""
    response = client.get("/api/figures/non_existent_figure_xyz.png")
    assert response.status_code == 404


if __name__ == '__main__':
    print("Testing health...")
    test_health_check()
    print("Testing predict full...")
    test_predict_full_payload()
    print("Testing predict pump...")
    test_predict_manipulation_pump_day()
    print("Testing missing values...")
    test_predict_missing_values_imputation()
    print("Testing invalid sector...")
    test_predict_invalid_sector()
    print("Testing invalid cap...")
    test_predict_invalid_market_cap()
    print("Testing list stocks...")
    test_list_stocks()
    print("Testing timeseries valid...")
    test_stock_timeseries_valid()
    print("Testing timeseries not found...")
    test_stock_timeseries_not_found()
    print("Testing metrics...")
    test_metrics_endpoint()
    print("Testing eda...")
    test_eda_endpoint()
    print("Testing figures valid...")
    test_figures_endpoint_valid()
    print("Testing figures not found...")
    test_figures_endpoint_not_found()
    print("ALL API TESTS PASSED!")
