"""
End-to-End ML Pipeline Orchestrator for MEWS AI.
Course: 21CSC307P Machine Learning for Data Analytics, Team 09.

Executes all pipeline stages deterministically (seed=42):
1. Synthetic Data Generation -> data/mews_dataset_v2.csv
2. Exploratory Data Analysis & Welch's t-test -> reports/figures/, reports/eda_summary.json
3. Linear Regression Baseline & 5-Fold GroupKFold CV -> models/linear_pipeline.joblib
4. Underfitting/Overfitting & Bias-Variance Analysis -> reports/figures/
5. Classifier Comparison (DT, RF Balanced, SMOTE+RF, IsoForest) -> models/classifier_pipeline.joblib
6. Metrics Aggregation & PDF Comparison -> reports/metrics.json
"""
import sys
import time
from pathlib import Path

# Add src to sys.path
PROJECT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_DIR / 'src'))

from data_gen import make_dataset
from eda import run_eda
from train_linear import train_linear_model
from bias_variance import run_bias_variance_analysis
from train_classifiers import train_and_compare_classifiers
from compile_metrics import compile_all_metrics


def main():
    print("=" * 70)
    print("MEWS AI - Market Manipulation Early Warning System")
    print("Full End-to-End Pipeline Execution")
    print("Team 09 (Tirth Shah, Vedaksh Bhandari, Prajit P)")
    print("=" * 70)

    start_time = time.time()

    # Stage 1: Data Generation
    print("\n[Stage 1/6] Generating Synthetic Trading Dataset (50,000 rows, seed=42)...")
    df = make_dataset(n_stocks=200, n_days=250, seed=42)
    print(f"-> Generated {df.shape[0]} rows x {df.shape[1]} columns.")

    # Stage 2: EDA & Statistical Testing
    print("\n[Stage 2/6] Running Exploratory Data Analysis & Welch's t-Test...")
    eda_summary = run_eda()
    print("-> Generated Fig 0-3 and exported reports/eda_summary.json.")

    # Stage 3: Linear Regression Baseline & CV
    print("\n[Stage 3/6] Fitting Linear Regression Baseline & 5-Fold GroupKFold CV...")
    lin_metrics = train_linear_model()
    print(f"-> Test R²: {lin_metrics['test_r2']:.4f} | Mean CV R²: {lin_metrics['cv_mean_test_r2']:.4f}")

    # Stage 4: Bias-Variance & Regularization
    print("\n[Stage 4/6] Conducting Underfitting/Overfitting & Bias-Variance Analysis...")
    bv_metrics = run_bias_variance_analysis()
    print(f"-> Ridge Best Alpha: {bv_metrics['ridge_regularization']['best_alpha']:.2f}")

    # Stage 5: Classification Extension
    print("\n[Stage 5/6] Training & Comparing Classifiers (DT, RF, SMOTE+RF, IsolationForest)...")
    clf_metrics = train_and_compare_classifiers()
    print(f"-> Winning Model: {clf_metrics['best_model']} (Threshold: {clf_metrics['alert_threshold']:.4f})")

    # Stage 6: Metrics Compilation
    print("\n[Stage 6/6] Compiling Global Metrics and PDF Comparison Table...")
    metrics = compile_all_metrics()
    print("-> Successfully updated reports/metrics.json.")

    elapsed = time.time() - start_time
    print("\n" + "=" * 70)
    print(f"MEWS AI Pipeline Completed Successfully in {elapsed:.2f} seconds!")
    print("=" * 70)


if __name__ == '__main__':
    main()
