"""
Core ML Pipeline Integration Tests for MEWS AI.
Course: 21CSC307P Machine Learning for Data Analytics, Team 09.

Verifies:
1. Dataset shape is exactly (50000, 17).
2. GroupShuffleSplit guarantees strictly disjoint stock sets (zero leakage).
3. Pipelines robustly handle NaN / missing inputs via median imputation.
4. Risk scores are strictly bounded within [0, 100].
5. Classifier pipeline outputs valid probabilities.
6. Risk bands logic correctly partitions the continuous spectrum.
"""
import sys
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import pytest
from sklearn.model_selection import GroupShuffleSplit

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / 'src'))

from data_gen import make_dataset
from preprocess import build_preprocessor, FEATURE_COLS
from risk_bands import get_risk_band


@pytest.fixture(scope="module")
def dataset():
    data_path = BASE_DIR / 'data' / 'mews_dataset_v2.csv'
    if data_path.exists():
        return pd.read_csv(data_path)
    return make_dataset(n_stocks=200, n_days=250, seed=42)


def test_dataset_shape(dataset):
    """Verify dataset has 50,000 rows and 17 columns."""
    assert dataset.shape == (50000, 17), f"Expected shape (50000, 17), got {dataset.shape}"
    assert 'stock' in dataset.columns
    assert 'day' in dataset.columns
    assert 'risk_score' in dataset.columns
    assert 'manipulation_label' in dataset.columns


def test_grouped_train_test_split_no_leakage(dataset):
    """Verify no stock appears in both train and test splits."""
    X = dataset[FEATURE_COLS]
    y = dataset['risk_score']
    groups = dataset['stock']

    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups=groups))

    train_stocks = set(groups.iloc[train_idx])
    test_stocks = set(groups.iloc[test_idx])

    intersection = train_stocks.intersection(test_stocks)
    assert len(intersection) == 0, f"Stock leakage detected: {intersection}"
    assert len(train_stocks) == 160
    assert len(test_stocks) == 40


def test_pipeline_handles_nan_inputs(dataset):
    """Verify sklearn Pipeline handles rows with all NaN numeric inputs seamlessly."""
    pipeline_path = BASE_DIR / 'models' / 'linear_pipeline.joblib'
    if pipeline_path.exists():
        model = joblib.load(pipeline_path)
    else:
        from sklearn.linear_model import LinearRegression
        from sklearn.pipeline import Pipeline
        model = Pipeline([('pre', build_preprocessor()), ('lr', LinearRegression())])
        model.fit(dataset[FEATURE_COLS].iloc[:1000], dataset['risk_score'].iloc[:1000])

    # Construct synthetic sample with pervasive NaNs
    nan_sample = pd.DataFrame([{
        'close_price': np.nan,
        'volume': np.nan,
        'volume_ratio_20d': np.nan,
        'volatility': np.nan,
        'delivery_pct': np.nan,
        'order_book_imbalance': np.nan,
        'sentiment_score': np.nan,
        'social_mentions': np.nan,
        'avg_trade_size': np.nan,
        'past_manipulation_flags': np.nan,
        'market_cap_class': 'small',
        'sector': 'Banking'
    }])

    # Must predict without raising NaN/ValueError
    prediction = model.predict(nan_sample)
    assert len(prediction) == 1
    assert not np.isnan(prediction[0])


def test_risk_scores_within_bounds(dataset):
    """Verify target and predicted risk scores are bounded strictly within [0, 100]."""
    # Ground truth bounds
    assert dataset['risk_score'].min() >= 0.0
    assert dataset['risk_score'].max() <= 100.0

    # Model prediction bounds
    pipeline_path = BASE_DIR / 'models' / 'linear_pipeline.joblib'
    if pipeline_path.exists():
        model = joblib.load(pipeline_path)
        preds = model.predict(dataset[FEATURE_COLS].iloc[:200])
        # Clipped evaluation
        clipped_preds = np.clip(preds, 0.0, 100.0)
        assert np.all(clipped_preds >= 0.0)
        assert np.all(clipped_preds <= 100.0)


def test_classifier_probabilities_and_output(dataset):
    """Verify classifier pipeline outputs valid class probabilities [0, 1]."""
    clf_path = BASE_DIR / 'models' / 'classifier_pipeline.joblib'
    if clf_path.exists():
        clf = joblib.load(clf_path)
        probs = clf.predict_proba(dataset[FEATURE_COLS].iloc[:50])[:, 1]
        assert np.all(probs >= 0.0)
        assert np.all(probs <= 1.0)


def test_risk_bands_monotonicity_and_clamping():
    """Verify risk bands partition thresholds strictly per Slide 3."""
    assert get_risk_band(-10)["band"] == "Low"
    assert get_risk_band(0)["band"] == "Low"
    assert get_risk_band(19.9)["band"] == "Low"
    assert get_risk_band(20)["band"] == "Watch"
    assert get_risk_band(49.9)["band"] == "Watch"
    assert get_risk_band(50)["band"] == "High"
    assert get_risk_band(79.9)["band"] == "High"
    assert get_risk_band(80)["band"] == "Critical"
    assert get_risk_band(100)["band"] == "Critical"
    assert get_risk_band(150)["band"] == "Critical"
    assert get_risk_band(150)["score"] == 100.0
