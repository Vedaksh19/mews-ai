.PHONY: train api web test all

# End-to-end ML Pipeline (Stages 1 to 6)
train:
	python run_all.py

# Launch FastAPI Backend Server
api:
	python -m uvicorn backend.main:app --reload --port 8000

# Launch Vite Frontend Dev Server
web:
	cd frontend && npm run dev

# Run pytest on pipeline and backend endpoints
test:
	python -m pytest tests/ backend/tests/ -v

# Run entire train + test workflow
all: train test
