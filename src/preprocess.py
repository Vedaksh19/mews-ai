"""
Preprocessing module for MEWS AI.
Course: 21CSC307P Machine Learning for Data Analytics, Team 09.

Constructs sklearn-compatible ColumnTransformers and Pipelines with:
- Log1p transformation for volume and social_mentions
- Median imputation and StandardScaler for numeric features
- OneHotEncoder(drop='first', handle_unknown='ignore', sparse_output=False) for categoricals
"""
from typing import List, Tuple
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

RAW_NUMERIC_COLS: List[str] = [
    'close_price', 'volume_ratio_20d', 'volatility', 'delivery_pct',
    'order_book_imbalance', 'sentiment_score', 'avg_trade_size', 'past_manipulation_flags'
]

LOG_COLS: List[str] = ['volume', 'social_mentions']

CATEGORICAL_COLS: List[str] = ['market_cap_class', 'sector']

PROCESSED_NUMERIC_COLS: List[str] = [
    'close_price', 'volume_ratio_20d', 'volatility', 'delivery_pct',
    'order_book_imbalance', 'sentiment_score', 'avg_trade_size',
    'past_manipulation_flags', 'log_volume', 'log_mentions'
]

FEATURE_COLS: List[str] = RAW_NUMERIC_COLS + LOG_COLS + CATEGORICAL_COLS


class LogFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Applies np.log1p to volume and social_mentions, creating log_volume and log_mentions,
    and drops the raw columns. Preserves all other columns.
    """
    def __init__(self):
        pass

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        if not isinstance(X, pd.DataFrame):
            # If passed as dict or 2D array, convert to DataFrame
            X = pd.DataFrame(X)
        X_out = X.copy()
        
        # log_volume
        if 'volume' in X_out.columns:
            vol_val = pd.to_numeric(X_out['volume'], errors='coerce').fillna(0.0)
            X_out['log_volume'] = np.log1p(np.maximum(0.0, vol_val))
            X_out = X_out.drop(columns=['volume'])
        elif 'log_volume' not in X_out.columns:
            X_out['log_volume'] = 0.0
            
        # log_mentions
        if 'social_mentions' in X_out.columns:
            m_val = pd.to_numeric(X_out['social_mentions'], errors='coerce').fillna(0.0)
            X_out['log_mentions'] = np.log1p(np.maximum(0.0, m_val))
            X_out = X_out.drop(columns=['social_mentions'])
        elif 'log_mentions' not in X_out.columns:
            X_out['log_mentions'] = 0.0

        return X_out


def build_preprocessor() -> Pipeline:
    """
    Create the complete feature preprocessing Pipeline.
    
    Returns
    -------
    Pipeline
        Sklearn pipeline that transforms raw input DataFrame into scaled/encoded matrix.
    """
    numeric_pipe = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    cat_pipe = Pipeline([
        ('encoder', OneHotEncoder(drop='first', handle_unknown='ignore', sparse_output=False))
    ])
    
    col_transformer = ColumnTransformer(
        transformers=[
            ('num', numeric_pipe, PROCESSED_NUMERIC_COLS),
            ('cat', cat_pipe, CATEGORICAL_COLS)
        ],
        remainder='drop'
    )
    
    full_preprocessor = Pipeline([
        ('log_engineer', LogFeatureEngineer()),
        ('col_transform', col_transformer)
    ])
    
    return full_preprocessor


def get_feature_names(preprocessor: Pipeline) -> List[str]:
    """
    Extract human-readable feature names after one-hot encoding and scaling.
    """
    col_trans = preprocessor.named_steps['col_transform']
    cat_encoder = col_trans.named_transformers_['cat'].named_steps['encoder']
    cat_feature_names = cat_encoder.get_feature_names_out(CATEGORICAL_COLS).tolist()
    return PROCESSED_NUMERIC_COLS + cat_feature_names
