"""
Classifier Training and Model Comparison Module for MEWS AI.
Course: 21CSC307P Machine Learning for Data Analytics, Team 09.
"""
import os
os.environ["LOKY_MAX_CPU_COUNT"] = "1"

from pathlib import Path
import json
from typing import Dict, Any, Tuple, Optional
import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import (
    average_precision_score,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score
)
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import Pipeline as SkPipeline
from sklearn.tree import DecisionTreeClassifier

from preprocess import build_preprocessor, get_feature_names, FEATURE_COLS


def train_and_compare_classifiers(
    data_path: Optional[str] = None,
    output_model_path: Optional[str] = None,
    config_path: Optional[str] = None,
    reports_dir: Optional[str] = None,
    seed: int = 42
) -> Dict[str, Any]:
    """
    Train and evaluate classification models on manipulation_label using 5-Fold GroupKFold.
    """
    base_dir = Path(__file__).resolve().parent.parent
    if data_path is None:
        data_path = str(base_dir / 'data' / 'mews_dataset_v2.csv')
    if output_model_path is None:
        output_model_path = str(base_dir / 'models' / 'classifier_pipeline.joblib')
    if config_path is None:
        config_path = str(base_dir / 'models' / 'config.json')
    if reports_dir is None:
        reports_dir = str(base_dir / 'reports')
        
    rep_dir = Path(reports_dir)
    fig_dir = rep_dir / 'figures'
    fig_dir.mkdir(parents=True, exist_ok=True)
    Path(output_model_path).parent.mkdir(parents=True, exist_ok=True)
    
    df = pd.read_csv(data_path)
    X = df[FEATURE_COLS]
    y = df['manipulation_label'].values
    groups = df['stock'].values
    
    gkf = GroupKFold(n_splits=5)
    
    # Model definitions
    # Note: imblearn Pipeline disallows nested Pipelines as intermediate steps,
    # so we unpack the steps from build_preprocessor().
    def create_pre_steps():
        p = build_preprocessor()
        return list(p.steps)

    model_factories = {
        'Decision Tree': lambda: SkPipeline(
            create_pre_steps() + [
                ('clf', DecisionTreeClassifier(class_weight='balanced', max_depth=8, random_state=seed))
            ]
        ),
        'Random Forest (Balanced)': lambda: SkPipeline(
            create_pre_steps() + [
                ('clf', RandomForestClassifier(n_estimators=50, class_weight='balanced', max_depth=10, random_state=seed, n_jobs=1))
            ]
        ),
        'SMOTE + Random Forest': lambda: ImbPipeline(
            create_pre_steps() + [
                ('smote', SMOTE(random_state=seed)),
                ('clf', RandomForestClassifier(n_estimators=50, max_depth=10, random_state=seed, n_jobs=1))
            ]
        ),
        'Isolation Forest': lambda: SkPipeline(
            create_pre_steps() + [
                ('clf', IsolationForest(contamination=0.022, random_state=seed, n_jobs=1))
            ]
        )
    }
    
    comparison_results = {}
    oof_predictions = {name: np.zeros(len(df)) for name in model_factories}
    
    print("Evaluating models with 5-Fold GroupKFold (grouped by stock)...")
    
    for name, factory in model_factories.items():
        precisions = []
        recalls = []
        f1s = []
        pr_aucs = []
        
        for fold, (train_idx, val_idx) in enumerate(gkf.split(X, y, groups=groups)):
            X_tr, y_tr = X.iloc[train_idx], y[train_idx]
            X_val, y_val = X.iloc[val_idx], y[val_idx]
            
            model = factory()
            model.fit(X_tr, y_tr)
            
            if name == 'Isolation Forest':
                # IsolationForest: decision_function lower for anomalies
                # Invert decision function so higher score = higher anomaly likelihood
                iso = model.named_steps['clf']
                X_val_trans = model.named_steps['log_engineer'].transform(X_val)
                X_val_trans = model.named_steps['col_transform'].transform(X_val_trans)
                scores = -iso.decision_function(X_val_trans)
                # Min-max scale to [0, 1] for probability equivalent
                s_min, s_max = scores.min(), scores.max()
                scores_norm = (scores - s_min) / (s_max - s_min + 1e-8)
                preds = (scores_norm >= 0.70).astype(int)
                probs = scores_norm
            else:
                probs = model.predict_proba(X_val)[:, 1]
                preds = model.predict(X_val)
                
            oof_predictions[name][val_idx] = probs
            
            p = precision_score(y_val, preds, zero_division=0)
            r = recall_score(y_val, preds, zero_division=0)
            f = f1_score(y_val, preds, zero_division=0)
            prauc = average_precision_score(y_val, probs)
            
            precisions.append(p)
            recalls.append(r)
            f1s.append(f)
            pr_aucs.append(prauc)
            
        comparison_results[name] = {
            'precision': float(np.mean(precisions)),
            'precision_std': float(np.std(precisions)),
            'recall': float(np.mean(recalls)),
            'recall_std': float(np.std(recalls)),
            'f1': float(np.mean(f1s)),
            'f1_std': float(np.std(f1s)),
            'pr_auc': float(np.mean(pr_aucs)),
            'pr_auc_std': float(np.std(pr_aucs))
        }
        print(f"  {name:25s} | Prec: {np.mean(precisions):.3f} | Rec: {np.mean(recalls):.3f} | F1: {np.mean(f1s):.3f} | PR-AUC: {np.mean(pr_aucs):.3f}")
        
    # ------------------ PRECISION-RECALL CURVES ------------------
    plt.figure(figsize=(8, 6))
    colors = {
        'Decision Tree': '#457b9d',
        'Random Forest (Balanced)': '#2a9d8f',
        'SMOTE + Random Forest': '#e76f51',
        'Isolation Forest': '#6c757d'
    }
    
    for name in model_factories:
        p_curve, r_curve, _ = precision_recall_curve(y, oof_predictions[name])
        prauc_val = comparison_results[name]['pr_auc']
        plt.plot(r_curve, p_curve, color=colors[name], lw=2, label=f"{name} (PR-AUC = {prauc_val:.3f})")
        
    plt.axhline(np.mean(y), color='gray', linestyle=':', label=f'No Skill Baseline ({np.mean(y):.3f})')
    plt.xlabel('Recall', fontsize=11)
    plt.ylabel('Precision', fontsize=11)
    plt.title('Precision-Recall Curves (5-Fold Grouped Out-of-Fold)', fontsize=13, weight='bold')
    plt.legend(frameon=True, loc='best')
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.tight_layout()
    pr_fig = fig_dir / 'fig_pr_curves.png'
    plt.savefig(pr_fig, dpi=150)
    plt.close()
    print(f"Saved {pr_fig}")
    
    # ------------------ BEST MODEL & OPTIMAL THRESHOLD ------------------
    # Select best model based on PR-AUC and F1
    best_model_name = 'Random Forest (Balanced)'
    if comparison_results['SMOTE + Random Forest']['f1'] > comparison_results['Random Forest (Balanced)']['f1']:
        best_model_name = 'SMOTE + Random Forest'
        
    best_probs = oof_predictions[best_model_name]
    p_arr, r_arr, thresh_arr = precision_recall_curve(y, best_probs)
    # Calculate F1 for all thresholds (avoiding div by zero)
    f1_scores = np.where((p_arr[:-1] + r_arr[:-1]) > 0, 2 * (p_arr[:-1] * r_arr[:-1]) / (p_arr[:-1] + r_arr[:-1]), 0)
    best_thresh_idx = int(np.argmax(f1_scores))
    optimal_threshold = float(thresh_arr[best_thresh_idx])
    optimal_f1 = float(f1_scores[best_thresh_idx])
    optimal_p = float(p_arr[best_thresh_idx])
    optimal_r = float(r_arr[best_thresh_idx])
    
    print(f"Best Model: {best_model_name}")
    print(f"Optimal Alert Threshold: {optimal_threshold:.4f} (Precision: {optimal_p:.3f}, Recall: {optimal_r:.3f}, F1: {optimal_f1:.3f})")
    
    # Fit best model on entire dataset
    print(f"Fitting final {best_model_name} on entire dataset...")
    final_pipeline = model_factories[best_model_name]()
    final_pipeline.fit(X, y)
    
    # Feature importances
    feat_names = get_feature_names(final_pipeline)
    clf_step = final_pipeline.named_steps['clf']
    importances = pd.Series(clf_step.feature_importances_, index=feat_names).sort_values(ascending=True)
    
    # Figure: Feature Importances
    plt.figure(figsize=(9, 6))
    plt.barh(importances.index, importances.values, color='#2a9d8f', height=0.65)
    plt.title(f"Feature Importances ({best_model_name})", fontsize=13, weight='bold')
    plt.xlabel("Mean Impurity Reduction (Gini)", fontsize=11)
    plt.grid(True, linestyle='--', alpha=0.5, axis='x')
    plt.tight_layout()
    fi_fig = fig_dir / 'fig_feature_importances.png'
    plt.savefig(fi_fig, dpi=150)
    plt.close()
    print(f"Saved {fi_fig}")
    
    # Save best model pipeline
    joblib.dump(final_pipeline, output_model_path)
    print(f"Saved best classifier pipeline to {output_model_path}")
    
    # Save config.json
    config_data = {
        'best_model': best_model_name,
        'alert_threshold': optimal_threshold,
        'threshold_metrics': {
            'precision': optimal_p,
            'recall': optimal_r,
            'f1': optimal_f1
        },
        'comparison_results': comparison_results,
        'top_features': importances.sort_values(ascending=False).to_dict()
    }
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config_data, f, indent=2)
    print(f"Saved model config to {config_path}")
    
    return config_data


if __name__ == '__main__':
    train_and_compare_classifiers()
