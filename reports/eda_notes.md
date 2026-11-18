# MEWS AI - Exploratory Data Analysis Takeaways

## 1. Dataset Dimensions & Integrity
- **Total Records:** 50,000 trading rows across 200 stocks and 250 days.
- **Class Balance:** Normal trading days: 98.02%, Manipulation days: 1.98%.
- **Missing Value Breakdown:**
  - `delivery_pct`: 3.96% missing.
  - `order_book_imbalance`: 6.00% missing.
  - `sentiment_score`: 8.15% missing.
  - *Treatment:* Requires median imputation inside the cross-validation pipeline to prevent data leakage. Complete deletion would discard up to 18% of observations.

## 2. Market Cap Manipulation Disparity
- **Small-Cap Manipulation Rate:** 3.10%
- **Large-Cap Manipulation Rate:** 0.30%
- *Takeaway:* Operators target low-liquidity small-cap stocks where thin order books enable artificial price inflation with relatively lower capital requirements.

## 3. Statistical Testing: Welch's t-Test
- **Null Hypothesis ($H_0$):** Mean `volume_ratio_20d` on manipulation days equals normal days.
- **Sample Means:** Manipulation days $\bar{X}_1 = 2.88$ vs Normal days $\bar{X}_0 = 1.08$.
- **Result:** $t = 46.81, p = 2.62e-253$
- *Decision:* Reject $H_0$ at $\alpha = 0.001$. The volume expansion during pump-and-dump episodes is statistically distinct from organic trading noise.

## 4. Key Signal Separability
- **Volume Surge:** `volume_ratio_20d` and `social_mentions` correlate strongly with `risk_score` ($r \approx 0.67$ and $r \approx 0.19$).
- **Delivery Decay:** Delivery percentage drops significantly during manipulation (median ~35% vs ~52%), reflecting speculative churning rather than genuine custody transfers.
- **Order Flow & Sentiment:** Positive order book imbalance and inflated sentiment reflect artificial buy-side pressure and synchronized promotional campaigns.
