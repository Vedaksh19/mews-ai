"""
Linear Regression Baseline Training Module for MEWS AI.
Course: 21CSC307P Machine Learning for Data Analytics, Team 09.

Trains a Linear Regression baseline on risk_score using grouped train/test split,
runs 5-fold GroupKFold cross-validation, generates diagnostic figures, and
exports models/linear_pipeline.joblib.
"""
from pathlib import Path
import json
from typing import Dict, Any, Optional
import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupKFold, GroupShuffleSplit, cross_validate
from sklearn.pipeline import Pipeline

from preprocess import build_preprocessor, get_feature_names, CATEGORICAL_COLS, RAW_NUMERIC_COLS, LOG_COLS

FEATURE_COLS = RAW_NUMERIC_COLS + LOG_COLS + CATEGORICAL_COLS


def train_linear_model(
    data_path: Optional[str] = None,
    output_model_path: Optional[str] = None,
    reports_dir: Optional[str] = None
) -> Dict[str, Any]:
    """
    Train Linear Regression baseline, evaluate, and produce CV diagnostics.
    """
    base_dir = Path(__file__).resolve().parent.parent
    if data_path is None:
        data_path = str(base_dir / 'data' / 'mews_dataset_v2.csv')
    if output_model_path is None:
        output_model_path = str(base_dir / 'models' / 'linear_pipeline.joblib')
    if reports_dir is None:
        reports_dir = str(base_dir / 'reports')
        
    rep_dir = Path(reports_dir)
    fig_dir = rep_dir / 'figures'
    fig_dir.mkdir(parents=True, exist_ok=True)
    Path(output_model_path).parent.mkdir(parents=True, exist_ok=True)
    
    df = pd.read_csv(data_path)
    print(f"Loaded {len(df):,} rows from {data_path}")
    
    X = df[FEATURE_COLS]
    y = df['risk_score']
    groups = df['stock']
    
    # GroupShuffleSplit (80% train / 20% test, grouped by stock)
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups=groups))
    
    X_train, y_train = X.iloc[train_idx], y.iloc[train_idx]
    X_test, y_test = X.iloc[test_idx], y.iloc[test_idx]
    
    train_stocks = set(groups.iloc[train_idx])
    test_stocks = set(groups.iloc[test_idx])
    assert len(train_stocks.intersection(test_stocks)) == 0, "Data leakage detected: stock in both train and test!"
    
    print(f"Train split: {len(X_train)} rows across {len(train_stocks)} stocks")
    print(f"Test split:  {len(X_test)} rows across {len(test_stocks)} stocks")
    
    # Build complete end-to-end pipeline
    preprocessor = build_preprocessor()
    linear_pipeline = Pipeline([
        ('pre', preprocessor),
        ('lr', LinearRegression())
    ])
    
    # Fit pipeline
    linear_pipeline.fit(X_train, y_train)
    
    # Evaluate on Train and Test
    y_pred_train = linear_pipeline.predict(X_train)
    y_pred_test = linear_pipeline.predict(X_test)
    
    train_r2 = float(r2_score(y_train, y_pred_train))
    test_r2 = float(r2_score(y_test, y_pred_test))
    
    train_rmse = float(np.sqrt(mean_squared_error(y_train, y_pred_train)))
    test_rmse = float(np.sqrt(mean_squared_error(y_test, y_pred_test)))
    
    train_mae = float(mean_absolute_error(y_train, y_pred_train))
    test_mae = float(mean_absolute_error(y_test, y_pred_test))
    
    print(f"Train R2: {train_r2:.4f} | Test R2: {test_r2:.4f}")
    print(f"Train RMSE: {train_rmse:.4f} | Test RMSE: {test_rmse:.4f}")
    print(f"Train MAE: {train_mae:.4f} | Test MAE: {test_mae:.4f}")
    
    # 5-fold GroupKFold Cross-Validation
    gkf = GroupKFold(n_splits=5)
    cv_res = cross_validate(
        linear_pipeline,
        X,
        y,
        groups=groups,
        cv=gkf,
        scoring=('r2', 'neg_root_mean_squared_error'),
        return_train_score=True,
        n_jobs=1
    )
    
    fold_test_r2 = cv_res['test_r2'].tolist()
    fold_train_r2 = cv_res['train_r2'].tolist()
    fold_test_rmse = (-cv_res['test_neg_root_mean_squared_error']).tolist()
    
    mean_test_r2 = float(np.mean(fold_test_r2))
    std_test_r2 = float(np.std(fold_test_r2))
    mean_train_r2 = float(np.mean(fold_train_r2))
    mean_test_rmse = float(np.mean(fold_test_rmse))
    
    print(f"5-Fold CV Mean Test R2: {mean_test_r2:.4f} +/- {std_test_r2:.4f}")
    print(f"5-Fold CV Mean Train R2: {mean_train_r2:.4f}")
    print(f"5-Fold CV Mean RMSE: {mean_test_rmse:.4f}")
    
    # Feature coefficients
    lr_model = linear_pipeline.named_steps['lr']
    feature_names = get_feature_names(linear_pipeline.named_steps['pre'])
    coefs = pd.Series(lr_model.coef_, index=feature_names).sort_values()
    
    # Figure: Coefficient Bar Chart
    plt.figure(figsize=(9, 6))
    colors = ['#e76f51' if v < 0 else '#2a9d8f' for v in coefs.values]
    bars = plt.barh(coefs.index, coefs.values, color=colors, edgecolor='none', height=0.65)
    plt.axvline(0, color='gray', linestyle='-', linewidth=0.8)
    plt.title("Linear Regression Coefficients (Standardized)", fontsize=13, weight='bold')
    plt.xlabel("Coefficient Value", fontsize=11)
    plt.grid(True, linestyle='--', alpha=0.5, axis='x')
    plt.tight_layout()
    coef_fig_path = fig_dir / 'fig_linear_coefficients.png'
    plt.savefig(coef_fig_path, dpi=150)
    plt.close()
    print(f"Saved {coef_fig_path}")
    
    # Figure: 5-Fold GroupKFold CV Performance (matching slide 16)
    plt.figure(figsize=(8, 5))
    fold_labels = [f"Fold {i+1}" for i in range(5)]
    bars = plt.bar(fold_labels, fold_test_r2, color='#1d3557', width=0.5)
    plt.axhline(mean_test_r2, color='#e63946', linestyle='--', label=f'Mean R² ({mean_test_r2:.3f})')
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width() / 2.0, height + 0.015, f'{height:.2f}', ha='center', va='bottom', fontsize=10, weight='bold')
    plt.ylim(0, 0.85)
    plt.title("5-Fold GroupKFold Cross-Validation: Test R² per Fold", fontsize=13, weight='bold')
    plt.xlabel("Validation Fold", fontsize=11)
    plt.ylabel("Test R²", fontsize=11)
    plt.legend(frameon=True)
    plt.grid(True, linestyle='--', alpha=0.5, axis='y')
    plt.tight_layout()
    cv_fig_path = fig_dir / 'fig_cv_folds.png'
    plt.savefig(cv_fig_path, dpi=150)
    plt.close()
    print(f"Saved {cv_fig_path}")
    
    # Save trained linear pipeline
    joblib.dump(linear_pipeline, output_model_path)
    print(f"Saved linear pipeline to {output_model_path}")
    
    metrics = {
        'train_stocks': len(train_stocks),
        'test_stocks': len(test_stocks),
        'train_rows': len(X_train),
        'test_rows': len(X_test),
        'train_r2': train_r2,
        'test_r2': test_r2,
        'train_rmse': train_rmse,
        'test_rmse': test_rmse,
        'train_mae': train_mae,
        'test_mae': test_mae,
        'cv_folds_test_r2': fold_test_r2,
        'cv_folds_train_r2': fold_train_r2,
        'cv_folds_test_rmse': fold_test_rmse,
        'cv_mean_test_r2': mean_test_r2,
        'cv_std_test_r2': std_test_r2,
        'cv_mean_train_r2': mean_train_r2,
        'cv_mean_test_rmse': mean_test_rmse,
        'coefficients': coefs.to_dict(),
        'feature_names': feature_names
    }
    
    return metrics


if __name__ == '__main__':
    train_linear_model()
