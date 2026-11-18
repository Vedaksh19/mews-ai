"""
Data Generation Module for MEWS AI (Market Manipulation Early Warning System).
Course: 21CSC307P Machine Learning for Data Analytics, Team 09.

Generates synthetic daily trading datasets simulating pump-and-dump market manipulation
episodes with realistic market micro-structure signals, right-skewed volumes, and injected missingness.
"""
from pathlib import Path
from typing import List, Optional
import numpy as np
import pandas as pd

SECTORS: List[str] = ['Auto', 'Banking', 'Energy', 'FMCG', 'IT', 'Metals', 'Pharma']


def make_dataset(
    n_stocks: int = 200,
    n_days: int = 250,
    seed: int = 42,
    output_path: Optional[str] = None
) -> pd.DataFrame:
    """
    Generate synthetic daily trading data for n_stocks over n_days.
    
    The generative process models:
    - 60% small-cap stocks, 40% large-cap stocks.
    - Small caps have a higher probability of manipulation episodes (small cap rate ~3%, large cap ~0.5%).
    - Manipulation episode consists of a 15-day build-up (ramp from 0 to 1) followed by a 5-day dump.
    - Key signals: volume ratio, delivery percentage, order book imbalance, sentiment score, social buzz.
    - Right-skewed social mentions and volume metrics.
    - Missing value injection (~4% delivery, ~6% order book imbalance, ~8% sentiment).
    
    Parameters
    ----------
    n_stocks : int, default=200
        Number of distinct stocks to simulate.
    n_days : int, default=250
        Number of trading days per stock.
    seed : int, default=42
        Random seed for reproducibility.
    output_path : str, optional
        File path to save CSV output. If None, uses 'data/mews_dataset_v2.csv'.
        
    Returns
    -------
    pd.DataFrame
        DataFrame with shape (n_stocks * n_days, 17) containing identifiers, features, and targets.
    """
    rng = np.random.default_rng(seed)
    
    n_small = int(n_stocks * 0.6)
    cap_classes = ['small'] * n_small + ['large'] * (n_stocks - n_small)
    rng.shuffle(cap_classes)
    
    stock_sectors = [SECTORS[i % len(SECTORS)] for i in range(n_stocks)]
    rng.shuffle(stock_sectors)
    
    base_prices = rng.uniform(60.0, 420.0, size=n_stocks)
    
    records = []
    
    for s_idx in range(n_stocks):
        stock_id = f"STK{s_idx + 1:03d}"
        cap = cap_classes[s_idx]
        sector = stock_sectors[s_idx]
        base_price = base_prices[s_idx]
        
        if cap == 'small':
            # Small caps: more episodes, lower base liquidity
            n_ep = rng.choice([0, 1, 2], p=[0.53, 0.41, 0.06])
            base_vol = rng.lognormal(9.6, 0.4)
            base_ts = rng.normal(800.0, 150.0)
            past_flags = rng.choice([0, 1, 2, 3], p=[0.70, 0.20, 0.07, 0.03])
        else:
            # Large caps: rarely manipulated, higher base liquidity
            n_ep = rng.choice([0, 1, 2], p=[0.92, 0.08, 0.00])
            base_vol = rng.lognormal(12.5, 0.4)
            base_ts = rng.normal(2500.0, 400.0)
            past_flags = rng.choice([0, 1, 2, 3], p=[0.91, 0.07, 0.015, 0.005])
            
        episode_spans = []
        if n_ep > 0:
            possible_starts = list(range(25, n_days - 25))
            rng.shuffle(possible_starts)
            for st in possible_starts:
                if all(abs(st - est) >= 25 for est in episode_spans):
                    episode_spans.append(st)
                    if len(episode_spans) == n_ep:
                        break
        episode_spans.sort()
        
        curr_price = base_price
        
        for d in range(n_days):
            ramp = 0.0
            crash = 0.0
            is_manip = 0
            
            for ep_start in episode_spans:
                if ep_start <= d < ep_start + 15:
                    ramp = (d - ep_start + 1) / 15.0
                    is_manip = 1
                    break
                elif ep_start + 15 <= d < ep_start + 20:
                    crash_day = d - (ep_start + 15)
                    crash = (5.0 - crash_day) / 5.0
                    break
                    
            if ramp > 0:
                ret = rng.normal(0.018 * (1.0 + ramp), 0.012)
            elif crash > 0:
                ret = -rng.uniform(0.05, 0.09)
            else:
                ret = rng.normal(0.0002, 0.012)
            curr_price = max(5.0, curr_price * (1.0 + ret))
            
            # Volume multiplier per slides
            vm = rng.lognormal(0.0, 0.25) * (1.0 + 3.5 * ramp)
            if crash > 0:
                vm *= (1.0 + 1.2 * crash)
            volume = base_vol * vm
            
            # Volume ratio 20d
            vr_noise = rng.lognormal(0.0, 0.18)
            if ramp > 0:
                vr = (1.0 + 3.5 * ramp) * vr_noise * 0.98
            elif crash > 0:
                vr = (1.0 + 1.2 * crash) * vr_noise
            else:
                vr = 1.05 * vr_noise
            if rng.random() < 0.005:
                vr *= rng.uniform(2.0, 4.0)
                
            volatility = np.clip(
                rng.normal(0.012, 0.003) + 0.016 * ramp + 0.022 * crash,
                0.002,
                0.15
            )
            
            # Delivery %
            deliv = float(np.clip(rng.normal(52.0, 9.0) - 22.0 * ramp, 5.0, 95.0))
            
            # Order book imbalance
            obi = float(np.clip(rng.normal(0.0, 0.15) + 0.45 * ramp, -0.95, 0.95))
            
            # Sentiment score
            sent = float(np.clip(rng.normal(0.05, 0.25) + 0.5 * ramp, -0.98, 0.98))
            
            # Social mentions (right-skewed)
            base_m = rng.lognormal(1.6, 0.95)
            m_val = base_m * (1.0 + 5.0 * (ramp ** 1.8))
            if rng.random() < 0.012:
                m_val *= rng.uniform(4.0, 9.0)
            social_mentions = float(m_val)
            
            avg_ts = float(max(50.0, base_ts * (1.0 + 0.35 * ramp + rng.normal(0.0, 0.08))))
            
            # Risk score
            raw_risk = 100.0 * ramp + 60.0 * crash + rng.normal(0.0, 6.0)
            risk_score = float(np.clip(raw_risk, 0.0, 100.0))
            
            records.append({
                'stock': stock_id,
                'day': int(d),
                'market_cap_class': cap,
                'sector': sector,
                'close_price': round(float(curr_price), 2),
                'volume': round(float(volume), 1),
                'volume_ratio_20d': round(float(vr), 4),
                'volatility': round(float(volatility), 5),
                'delivery_pct': round(deliv, 2),
                'order_book_imbalance': round(obi, 4),
                'sentiment_score': round(sent, 4),
                'social_mentions': round(social_mentions, 1),
                'avg_trade_size': round(avg_ts, 1),
                'past_manipulation_flags': int(past_flags),
                'risk_score': round(risk_score, 2),
                'manipulation_label': int(is_manip)
            })
            
    df = pd.DataFrame(records)
    # Insert Unnamed: 0 to match slide 4/5 17-column structure
    df.insert(0, 'Unnamed: 0', range(len(df)))
    
    # Missing value injection
    n_total = len(df)
    miss_rng = np.random.default_rng(seed + 1000)
    deliv_idx = miss_rng.choice(n_total, size=int(n_total * 0.0396), replace=False)
    df.loc[deliv_idx, 'delivery_pct'] = np.nan
    obi_idx = miss_rng.choice(n_total, size=int(n_total * 0.0600), replace=False)
    df.loc[obi_idx, 'order_book_imbalance'] = np.nan
    sent_idx = miss_rng.choice(n_total, size=int(n_total * 0.0815), replace=False)
    df.loc[sent_idx, 'sentiment_score'] = np.nan
    
    # Save CSV
    if output_path is None:
        output_path = str(Path(__file__).resolve().parent.parent / 'data' / 'mews_dataset_v2.csv')
    
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Dataset successfully saved to {output_path} with shape {df.shape}")
    
    return df


if __name__ == '__main__':
    df = make_dataset(200, 250, 42)
    print("Class breakdown:\n", df['manipulation_label'].value_counts(normalize=True))
