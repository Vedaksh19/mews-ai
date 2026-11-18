"""
Risk Band Classification Module for MEWS AI.
Course: 21CSC307P Machine Learning for Data Analytics, Team 09.

Defines the single source of truth for mapping a 0-100 Manipulation Risk Score
into standardized surveillance bands, operational actions, and color codes per Slide 3.
"""
from typing import Dict, Any


def get_risk_band(score: float) -> Dict[str, Any]:
    """
    Map a numeric risk score (0-100) to its corresponding operational surveillance band.

    Bands specification (Slide 3):
    - 0 to 20:   Low: normal trading (Action: None)
    - 20 to 50:  Watch: early signs (Action: Monitor)
    - 50 to 80:  High: likely build-up (Action: Alert)
    - 80 to 100: Critical: dump near (Action: Escalate)

    Parameters
    ----------
    score : float
        Numeric risk score, will be clipped to [0, 100].

    Returns
    -------
    dict
        {
            "score": float (clipped),
            "band": str ("Low" | "Watch" | "High" | "Critical"),
            "level": str (Full descriptive label),
            "action": str ("None" | "Monitor" | "Alert" | "Escalate"),
            "color": str (Hex color code),
            "severity": int (1 to 4)
        }
    """
    clamped = max(0.0, min(100.0, float(score)))

    if clamped < 20.0:
        return {
            "score": round(clamped, 2),
            "band": "Low",
            "level": "Low: normal trading",
            "action": "None",
            "color": "#10b981",  # Emerald Green
            "severity": 1
        }
    elif clamped < 50.0:
        return {
            "score": round(clamped, 2),
            "band": "Watch",
            "level": "Watch: early signs",
            "action": "Monitor",
            "color": "#f59e0b",  # Amber
            "severity": 2
        }
    elif clamped < 80.0:
        return {
            "score": round(clamped, 2),
            "band": "High",
            "level": "High: likely build-up",
            "action": "Alert",
            "color": "#f97316",  # Orange
            "severity": 3
        }
    else:
        return {
            "score": round(clamped, 2),
            "band": "Critical",
            "level": "Critical: dump near",
            "action": "Escalate",
            "color": "#ef4444",  # Red
            "severity": 4
        }
