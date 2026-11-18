"""
Bias-Variance Trade-off and Regularization Analysis Module for MEWS AI.
Course: 21CSC307P Machine Learning for Data Analytics, Team 09.

Investigates:
1. Underfitting vs Overfitting across Polynomial degrees (1, 2, 3) on 400-row sample.
2. Bootstrap decomposition of Bias^2 and Variance across 40 resamples.
3. Ridge L2 Regularization alpha sweep np.logspace(-2, 4, 30) to mitigate variance.
"""
from pathlib import Path
import json
from typing import Dict, Any, Optional
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler

from preprocess import build_preprocessor, FEATURE_COLS


def run_bias_variance_analysis(
    data_path: Optional[str] = None,
    reports_dir: Optional[str] = None,
    seed: int = 42
) -> Dict[str, Any]:
    """
    Run polynomial comparison, bootstrap bias-variance decomposition, and Ridge regularization sweep.
    """
    base_dir = Path(__file__).resolve().parent.parent
    if data_path is None:
        data_path = str(base_dir / 'data' / 'mews_dataset_v2.csv')
    if reports_dir is None:
        reports_dir = str(base_dir / 'reports')
        
    rep_dir = Path(reports_dir)
    fig_dir = rep_dir / 'figures'
    fig_dir.mkdir(parents=True, exist_ok=True)
    
    df = pd.read_csv(data_path)
    X = df[FEATURE_COLS]
    y = df['risk_score']
    groups = df['stock']
    
    # Standard group split
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=seed)
    train_idx, test_idx = next(gss.split(X, y, groups=groups))
    
    X_train_full, y_train_full = X.iloc[train_idx], y.iloc[train_idx]
    X_test_full, y_test_full = X.iloc[test_idx], y.iloc[test_idx]
    
    # 400-row subsample from training set to simulate data-constrained regimes
    rng = np.random.default_rng(seed)
    sub_idx = rng.choice(len(X_train_full), size=400, replace=False)
    Xs = X_train_full.iloc[sub_idx].copy()
    ys = y_train_full.iloc[sub_idx].copy()
    
    # Fixed test sample (e.g. 1000 rows from unseen test stocks)
    test_sub_idx = rng.choice(len(X_test_full), size=1000, replace=False)
    X_test_sub = X_test_full.iloc[test_sub_idx].copy()
    y_test_sub = y_test_full.iloc[test_sub_idx].copy()
    
    # ---------------- 1. POLYNOMIAL COMPARISON (400 rows) ----------------
    results_poly = {}
    
    # Model A: 1-Feature (volume_ratio_20d only)
    pre_1f = build_preprocessor()
    m_1f = Pipeline([
        ('pre', pre_1f),
        ('lr', LinearRegression())
    ])
    # Fit only with 1 numeric feature by slicing preprocessed data or pipeline
    X_s_trans = pre_1f.fit_transform(Xs)
    X_te_trans = pre_1f.transform(X_test_sub)
    # volume_ratio_20d is index 1 in PROCESSED_NUMERIC_COLS
    lr_1f = LinearRegression().fit(X_s_trans[:, [1]], ys)
    train_rmse_1f = float(np.sqrt(mean_squared_error(ys, lr_1f.predict(X_s_trans[:, [1]]))))
    test_rmse_1f = float(np.sqrt(mean_squared_error(y_test_sub, lr_1f.predict(X_te_trans[:, [1]]))))
    results_poly['1 feature'] = {'train': train_rmse_1f, 'test': test_rmse_1f}
    
    # Degrees 1, 2, 3
    for deg in (1, 2, 3):
        # To avoid combinatorial explosion in degree 3 with 17 features, we use top 4 features
        # or full features with degree 1 & 2, and top 5 features for degree 3
        if deg <= 2:
            poly = PolynomialFeatures(degree=deg, include_bias=False)
            X_s_poly = poly.fit_transform(X_s_trans)
            X_te_poly = poly.transform(X_te_trans)
        else:
            # Degree 3 on top 5 signals (volume_ratio_20d, volatility, delivery, sentiment, mentions)
            poly = PolynomialFeatures(degree=deg, include_bias=False)
            top5_idx = [1, 2, 3, 5, 9]
            X_s_poly = poly.fit_transform(X_s_trans[:, top5_idx])
            X_te_poly = poly.transform(X_te_trans[:, top5_idx])
            
        scaler = StandardScaler()
        X_s_scaled = scaler.fit_transform(X_s_poly)
        X_te_scaled = scaler.transform(X_te_poly)
        
        lr = LinearRegression().fit(X_s_scaled, ys)
        tr_rmse = float(np.sqrt(mean_squared_error(ys, lr.predict(X_s_scaled))))
        te_rmse = float(np.sqrt(mean_squared_error(y_test_sub, lr.predict(X_te_scaled))))
        results_poly[f"Degree {deg}"] = {'train': tr_rmse, 'test': te_rmse}
        
    print("Polynomial Comparison (400 rows):")
    for k, v in results_poly.items():
        print(f"  {k:12s} | Train RMSE: {v['train']:.2f} | Test RMSE: {v['test']:.2f}")
        
    # Fig: Underfitting vs Overfitting (log scale bar chart)
    models_labels = list(results_poly.keys())
    train_rmses = [results_poly[m]['train'] for m in models_labels]
    test_rmses = [results_poly[m]['test'] for m in models_labels]
    
    x_indices = np.arange(len(models_labels))
    width = 0.35
    
    plt.figure(figsize=(9, 5.5))
    plt.bar(x_indices - width/2, train_rmses, width, label='Train RMSE', color='#457b9d')
    plt.bar(x_indices + width/2, test_rmses, width, label='Test RMSE', color='#e76f51')
    plt.yscale('log')
    plt.xticks(x_indices, [f"{m}\n({'underfit' if '1 feature' in m else 'good fit' if '1' in m else 'overfit'})" for m in models_labels], fontsize=10)
    plt.ylabel('RMSE (log scale)', fontsize=11)
    plt.title('Underfitting vs Good Fit vs Overfitting (400-row Sample)', fontsize=13, weight='bold')
    plt.legend(frameon=True)
    plt.grid(True, linestyle='--', alpha=0.5, axis='y')
    plt.tight_layout()
    underfit_fig = fig_dir / 'fig_underfit_overfit.png'
    plt.savefig(underfit_fig, dpi=150)
    plt.close()
    print(f"Saved {underfit_fig}")
    
    # ---------------- 2. BOOTSTRAP BIAS-VARIANCE DECOMPOSITION ----------------
    # 40 bootstrap fits on 400 rows
    n_bootstraps = 40
    # Fixed test set for bias-variance evaluation
    Xfix_raw = X_test_sub.iloc[:300]
    yfix = y_test_sub.iloc[:300].values
    
    pre_boot = build_preprocessor()
    pre_boot.fit(X_train_full)
    Xfix_trans = pre_boot.transform(Xfix_raw)
    
    bv_results = {}
    for deg in (1, 2, 3):
        preds = []
        if deg <= 2:
            poly_bv = PolynomialFeatures(degree=deg, include_bias=False)
            Xfix_poly = poly_bv.fit_transform(Xfix_trans)
        else:
            poly_bv = PolynomialFeatures(degree=deg, include_bias=False)
            top5_idx = [1, 2, 3, 5, 9]
            Xfix_poly = poly_bv.fit_transform(Xfix_trans[:, top5_idx])
            
        for _ in range(n_bootstraps):
            b_idx = rng.choice(len(X_train_full), size=400, replace=False)
            Xb = pre_boot.transform(X_train_full.iloc[b_idx])
            yb = y_train_full.iloc[b_idx].values
            
            if deg <= 2:
                Xb_poly = poly_bv.transform(Xb)
            else:
                Xb_poly = poly_bv.transform(Xb[:, top5_idx])
                
            sc_b = StandardScaler()
            Xb_sc = sc_b.fit_transform(Xb_poly)
            Xfix_sc = sc_b.transform(Xfix_poly)
            
            m = LinearRegression().fit(Xb_sc, yb)
            preds.append(m.predict(Xfix_sc))
            
        P = np.array(preds)  # shape (40, 300)
        bias2 = float(np.mean((P.mean(axis=0) - yfix) ** 2))
        variance = float(np.mean(P.var(axis=0)))
        total_err = bias2 + variance
        bv_results[f"Degree {deg}"] = {
            'bias_squared': bias2,
            'variance': variance,
            'total_error': total_err
        }
        
    print("Bias-Variance Decomposition (40 bootstrap resamples):")
    for k, v in bv_results.items():
        print(f"  {k:10s} | Bias^2: {v['bias_squared']:.2f} | Variance: {v['variance']:.2f} | Total: {v['total_error']:.2f}")
        
    # Fig: Bias-Variance Trade-off Stacked Bar Chart
    plt.figure(figsize=(7, 5))
    deg_keys = list(bv_results.keys())
    b_vals = [bv_results[k]['bias_squared'] for k in deg_keys]
    v_vals = [bv_results[k]['variance'] for k in deg_keys]
    
    plt.bar(deg_keys, b_vals, label='Bias²', color='#2a9d8f', width=0.45)
    plt.bar(deg_keys, v_vals, bottom=b_vals, label='Variance', color='#e76f51', width=0.45)
    plt.ylabel('Error Value', fontsize=11)
    plt.title('Bias–Variance Trade-off Across Polynomial Complexities', fontsize=13, weight='bold')
    plt.legend(frameon=True)
    plt.grid(True, linestyle='--', alpha=0.5, axis='y')
    plt.tight_layout()
    bv_fig = fig_dir / 'fig_bias_variance.png'
    plt.savefig(bv_fig, dpi=150)
    plt.close()
    print(f"Saved {bv_fig}")
    
    # ---------------- 3. RIDGE REGULARIZATION SWEEP ----------------
    alphas = np.logspace(-2, 4, 30)
    poly_deg2 = PolynomialFeatures(degree=2, include_bias=False)
    X_s_poly2 = poly_deg2.fit_transform(X_s_trans)
    X_te_poly2 = poly_deg2.transform(X_te_trans)
    
    sc_ridge = StandardScaler()
    X_s_poly2_sc = sc_ridge.fit_transform(X_s_poly2)
    X_te_poly2_sc = sc_ridge.transform(X_te_poly2)
    
    ridge_test_rmses = []
    ridge_train_rmses = []
    for a in alphas:
        r_model = Ridge(alpha=a, random_state=seed)
        r_model.fit(X_s_poly2_sc, ys)
        tr_r = float(np.sqrt(mean_squared_error(ys, r_model.predict(X_s_poly2_sc))))
        te_r = float(np.sqrt(mean_squared_error(y_test_sub, r_model.predict(X_te_poly2_sc))))
        ridge_train_rmses.append(tr_r)
        ridge_test_rmses.append(te_r)
        
    best_idx = int(np.argmin(ridge_test_rmses))
    best_alpha = float(alphas[best_idx])
    min_test_rmse = float(ridge_test_rmses[best_idx])
    baseline_degree2_rmse = float(ridge_test_rmses[0])
    
    print(f"Ridge Regularization: Baseline RMSE = {baseline_degree2_rmse:.2f} -> Best RMSE = {min_test_rmse:.2f} at alpha = {best_alpha:.2f}")
    
    # Fig: Ridge Alpha Sweep
    plt.figure(figsize=(8, 5))
    plt.plot(alphas, ridge_test_rmses, color='#e63946', lw=2, label='Test RMSE')
    plt.plot(alphas, ridge_train_rmses, color='#457b9d', lw=1.5, linestyle='--', label='Train RMSE')
    plt.axvline(best_alpha, color='#2a9d8f', linestyle=':', lw=1.8, label=f'Best alpha ({best_alpha:.1f})')
    plt.scatter([best_alpha], [min_test_rmse], color='#2a9d8f', s=60, zorder=5)
    plt.xscale('log')
    plt.xlabel('Regularization Strength alpha (log scale)', fontsize=11)
    plt.ylabel('RMSE', fontsize=11)
    plt.title('Ridge Regularization on Degree-2 Polynomial Features', fontsize=13, weight='bold')
    plt.legend(frameon=True)
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.tight_layout()
    ridge_fig = fig_dir / 'fig_ridge_alpha.png'
    plt.savefig(ridge_fig, dpi=150)
    plt.close()
    print(f"Saved {ridge_fig}")
    
    results = {
        'polynomial_comparison': results_poly,
        'bias_variance_decomposition': bv_results,
        'ridge_regularization': {
            'best_alpha': best_alpha,
            'min_test_rmse': min_test_rmse,
            'baseline_rmse': baseline_degree2_rmse,
            'alphas': alphas.tolist(),
            'test_rmses': ridge_test_rmses,
            'train_rmses': ridge_train_rmses
        }
    }
    
    return results


if __name__ == '__main__':
    run_bias_variance_analysis()
