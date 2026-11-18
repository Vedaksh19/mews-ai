# Windows PowerShell Helper for MEWS AI
param (
    [string]$Action = "train"
)

switch ($Action) {
    "train" {
        python run_all.py
    }
    "api" {
        python -m uvicorn backend.main:app --reload --port 8000
    }
    "web" {
        cd frontend
        npm run dev
    }
    "test" {
        python -m pytest tests/ backend/tests/ -v
    }
    Default {
        Write-Host "Usage: .\run.ps1 [train|api|web|test]"
    }
}
