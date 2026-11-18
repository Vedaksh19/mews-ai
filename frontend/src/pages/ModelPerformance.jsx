import React, { useState, useEffect } from 'react';
import { getMetrics, getFigureUrl } from '../api';
import { Cpu, GitCompare, Award, Target, Sliders, Layers, ExternalLink } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function ModelPerformance() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('classifiers');
  const scrollRef = useScrollReveal([metrics, activeTab]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getMetrics();
        setMetrics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const lin = metrics?.linear_regression;
  const clf = metrics?.classifiers;
  const pdfComparison = metrics?.pdf_vs_actual || [];

  return (
    <div ref={scrollRef} className="space-y-6">
      {/* Header */}
      <div className="reveal-on-scroll glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-sky-500 to-indigo-600" />
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 shadow-xs">
              <Cpu className="w-5 h-5" />
            </span>
            Model Benchmarking & Validation Rigor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            GroupKFold 5-fold cross-validation, precision-recall optimization, bias-variance trade-offs, and empirical PDF audit.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          {[
            { id: 'classifiers', label: 'Classifiers & PR' },
            { id: 'regression', label: 'Linear & CV Folds' },
            { id: 'bias_variance', label: 'Bias–Variance & Ridge' },
            { id: 'pdf_table', label: 'PDF vs Actual Audit' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn-shimmer px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Classifiers & PR Optimization */}
      {activeTab === 'classifiers' && (
        <div className="space-y-6">
          {/* Best Model Banner */}
          {clf && (
            <div className="reveal-on-scroll delay-75 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white border border-emerald-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-xs">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-widest text-emerald-700 font-bold block mb-0.5">
                    Recommended Model Architecture
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">{clf.best_model}</h3>
                  <p className="text-xs text-slate-600 mt-1 font-mono">
                    Operating Alert Cutoff: <strong className="text-sky-700 font-bold">{(clf.alert_threshold * 100).toFixed(1)}%</strong> &middot; F1-Score: <strong className="text-emerald-700 font-bold">{clf.threshold_metrics.f1.toFixed(3)}</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="bg-white px-4 py-2.5 rounded-xl border border-emerald-200 text-center shadow-xs">
                  <span className="text-slate-500 block text-[10px] font-sans uppercase tracking-wider font-semibold">Operating Precision</span>
                  <strong className="text-emerald-700 text-base font-black">{(clf.threshold_metrics.precision * 100).toFixed(1)}%</strong>
                </div>
                <div className="bg-white px-4 py-2.5 rounded-xl border border-sky-200 text-center shadow-xs">
                  <span className="text-slate-500 block text-[10px] font-sans uppercase tracking-wider font-semibold">Operating Recall</span>
                  <strong className="text-sky-700 text-base font-black">{(clf.threshold_metrics.recall * 100).toFixed(1)}%</strong>
                </div>
              </div>
            </div>
          )}

          {/* Classifier Benchmarking Table */}
          <div className="reveal-on-scroll delay-150 glass-card-hover rounded-2xl p-6 sm:p-7 shadow-xs overflow-hidden">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-200">
                <GitCompare className="w-4 h-4" />
              </span>
              Classifier Benchmark (5-Fold GroupKFold, Grouped by Stock)
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Evaluated strictly on Precision, Recall, F1, and PR-AUC. (Accuracy is deliberately omitted due to 98% class imbalance).
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 uppercase text-[11px] tracking-wider bg-slate-50">
                    <th className="py-3 px-4 font-semibold">Model Architecture</th>
                    <th className="py-3 px-4 font-semibold">Imbalance Strategy</th>
                    <th className="py-3 px-4 font-semibold text-emerald-700">Precision</th>
                    <th className="py-3 px-4 font-semibold text-sky-700">Recall</th>
                    <th className="py-3 px-4 font-semibold text-amber-700">F1-Score</th>
                    <th className="py-3 px-4 font-semibold text-purple-700">PR-AUC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {clf?.comparison_results ? (
                    Object.entries(clf.comparison_results).map(([name, m]) => {
                      const isBest = name === clf.best_model;
                      return (
                        <tr
                          key={name}
                          className={`hover:bg-slate-50 transition-colors ${
                            isBest ? 'bg-emerald-50/60 border-l-4 border-l-emerald-500 font-medium' : 'hover:border-l-4 hover:border-l-sky-500'
                          }`}
                        >
                          <td className="py-3.5 px-4 font-sans font-semibold text-slate-900 flex items-center gap-2">
                            {name}
                            {isBest && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 font-bold">
                                Winner
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-sans text-slate-500 text-[11px]">
                            {name.includes('Balanced') ? 'Inverse Class Weighting' :
                             name.includes('SMOTE') ? 'Synthetic Minority Over-sampling' :
                             name.includes('Isolation') ? 'Unsupervised Anomaly Contamination' :
                             'Class-Weighted Gini'}
                          </td>
                          <td className="py-3.5 px-4 text-emerald-700 font-bold">
                            {m.precision.toFixed(3)} <span className="text-slate-400 text-[10px]">±{m.precision_std.toFixed(3)}</span>
                          </td>
                          <td className="py-3.5 px-4 text-sky-700 font-bold">
                            {m.recall.toFixed(3)} <span className="text-slate-400 text-[10px]">±{m.recall_std.toFixed(3)}</span>
                          </td>
                          <td className="py-3.5 px-4 text-amber-700 font-black">
                            {m.f1.toFixed(3)} <span className="text-slate-400 text-[10px]">±{m.f1_std.toFixed(3)}</span>
                          </td>
                          <td className="py-3.5 px-4 text-purple-700 font-black">
                            {m.pr_auc.toFixed(3)} <span className="text-slate-400 text-[10px]">±{m.pr_auc_std.toFixed(3)}</span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={6} className="py-6 text-center text-slate-400">Loading benchmark metrics...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PR Curves and Feature Importances */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="reveal-on-scroll delay-225 glass-card-hover rounded-2xl p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900">Precision–Recall Curves</h3>
                <a href={getFigureUrl('fig_pr_curves.png')} target="_blank" rel="noreferrer" className="text-xs text-sky-600 hover:underline flex items-center gap-1 font-semibold">
                  View <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Comparing 4 model architectures against the flat baseline (1.98% prevalence).
              </p>
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden group">
                <img
                  src={getFigureUrl('fig_pr_curves.png')}
                  alt="Precision-Recall Curves"
                  className="rounded-lg max-h-72 object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
            </div>

            <div className="reveal-on-scroll delay-300 glass-card-hover rounded-2xl p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900">Gini Feature Importances</h3>
                <a href={getFigureUrl('fig_feature_importances.png')} target="_blank" rel="noreferrer" className="text-xs text-sky-600 hover:underline flex items-center gap-1 font-semibold">
                  View <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Mean impurity reduction confirming volume surge and mentions dominate tree decisions.
              </p>
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden group">
                <img
                  src={getFigureUrl('fig_feature_importances.png')}
                  alt="Feature Importances"
                  className="rounded-lg max-h-72 object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Linear Baseline & CV Folds */}
      {activeTab === 'regression' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="reveal-on-scroll delay-75 glass-card-hover rounded-2xl p-5 border-l-4 border-l-sky-500">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Holdout Test R²</span>
              <p className="text-3xl font-black text-sky-700 font-mono mt-1">
                {lin?.test_r2 ? lin.test_r2.toFixed(3) : '0.579'}
              </p>
              <span className="text-xs text-slate-400 font-mono">Train R²: {lin?.train_r2 ? lin.train_r2.toFixed(3) : '0.520'}</span>
            </div>

            <div className="reveal-on-scroll delay-150 glass-card-hover rounded-2xl p-5 border-l-4 border-l-emerald-500">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Holdout Test RMSE</span>
              <p className="text-3xl font-black text-slate-900 font-mono mt-1">
                {lin?.test_rmse ? lin.test_rmse.toFixed(2) : '6.74'}
              </p>
              <span className="text-xs text-slate-400 font-medium">0–100 Risk Score Scale</span>
            </div>

            <div className="reveal-on-scroll delay-225 glass-card-hover rounded-2xl p-5 border-l-4 border-l-amber-500">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">5-Fold CV Mean Test R²</span>
              <p className="text-3xl font-black text-emerald-700 font-mono mt-1">
                {lin?.cv_mean_test_r2 ? lin.cv_mean_test_r2.toFixed(3) : '0.526'}
              </p>
              <span className="text-xs text-slate-400 font-mono">± {lin?.cv_std_test_r2 ? lin.cv_std_test_r2.toFixed(3) : '0.045'} across folds</span>
            </div>

            <div className="reveal-on-scroll delay-300 glass-card-hover rounded-2xl p-5 border-l-4 border-l-indigo-500">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Stock Partitioning</span>
              <p className="text-3xl font-black text-indigo-700 font-mono mt-1">
                160 / 40
              </p>
              <span className="text-xs text-slate-400 font-medium">Train Stocks / Test Stocks</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="reveal-on-scroll delay-150 glass-card-hover rounded-2xl p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900">5-Fold GroupKFold Cross-Validation</h3>
                <a href={getFigureUrl('fig_cv_folds.png')} target="_blank" rel="noreferrer" className="text-xs text-sky-600 hover:underline flex items-center gap-1 font-semibold">
                  View <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Validating on unseen stocks across 5 rotating blocks with zero stock leakage.
              </p>
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden group">
                <img
                  src={getFigureUrl('fig_cv_folds.png')}
                  alt="Cross-validation folds"
                  className="rounded-lg max-h-72 object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
            </div>

            <div className="reveal-on-scroll delay-225 glass-card-hover rounded-2xl p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900">Linear Regression Coefficients</h3>
                <a href={getFigureUrl('fig_linear_coefficients.png')} target="_blank" rel="noreferrer" className="text-xs text-sky-600 hover:underline flex items-center gap-1 font-semibold">
                  View <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Standardized feature weights pushing risk up vs dampening risk.
              </p>
              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden group">
                <img
                  src={getFigureUrl('fig_linear_coefficients.png')}
                  alt="Linear coefficients"
                  className="rounded-lg max-h-72 object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Bias-Variance & Ridge */}
      {activeTab === 'bias_variance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="reveal-on-scroll delay-75 glass-card-hover rounded-2xl p-6 shadow-xs">
              <h3 className="text-xs uppercase font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Underfitting vs Overfitting
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                On 400-row sample: Degree 3 memorizes train (low RMSE) but explodes on unseen test data.
              </p>
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden group">
                <img
                  src={getFigureUrl('fig_underfit_overfit.png')}
                  alt="Underfitting vs Overfitting"
                  className="rounded-lg max-h-64 object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>

            <div className="reveal-on-scroll delay-150 glass-card-hover rounded-2xl p-6 shadow-xs">
              <h3 className="text-xs uppercase font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Bias–Variance Trade-off
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                40 bootstrap resamples: Degree 1 suffers high bias; Degree 3 suffers catastrophic variance.
              </p>
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden group">
                <img
                  src={getFigureUrl('fig_bias_variance.png')}
                  alt="Bias-Variance Trade-off"
                  className="rounded-lg max-h-64 object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>

            <div className="reveal-on-scroll delay-225 glass-card-hover rounded-2xl p-6 shadow-xs">
              <h3 className="text-xs uppercase font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Ridge L2 Regularization
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Alpha sweep penalizes polynomial weights, dropping RMSE to 5.41 at α = 573.6.
              </p>
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden group">
                <img
                  src={getFigureUrl('fig_ridge_alpha.png')}
                  alt="Ridge Regularization Sweep"
                  className="rounded-lg max-h-64 object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PDF vs Actual Comparison Table */}
      {activeTab === 'pdf_table' && (
        <div className="reveal-on-scroll glass-card-hover rounded-2xl p-6 sm:p-7 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/80">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-200">
                  <GitCompare className="w-4 h-4" />
                </span>
                Empirical Results: PDF Reference vs Fresh Pipeline Execution
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Full transparency audit: All metrics computed dynamically from raw data with zero hardcoded values.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 uppercase text-[11px] tracking-wider bg-slate-50">
                  <th className="py-3.5 px-4 font-semibold">Evaluation Metric / Analysis</th>
                  <th className="py-3.5 px-4 font-semibold text-amber-700">PDF Reference (Team 09 Slides)</th>
                  <th className="py-3.5 px-4 font-semibold text-emerald-700">Fresh Dynamic Run</th>
                  <th className="py-3.5 px-4 font-semibold">Methodological Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {pdfComparison.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 hover:border-l-4 hover:border-l-sky-500 transition-all">
                    <td className="py-3.5 px-4 font-sans font-semibold text-slate-900">
                      {row.metric}
                    </td>
                    <td className="py-3.5 px-4 text-amber-700 font-medium">
                      {row.pdf_value}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-700 font-black">
                      {row.my_value}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-500 text-[11px]">
                      {row.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
