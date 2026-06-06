.PHONY: install up down build logs ps backend frontend seed migrate clean

install:      ## One-shot installer (generates .env, builds, starts, waits for health)
	@bash install.sh

up:           ## Build & start the full stack
	docker compose up -d --build

down:         ## Stop the stack
	docker compose down

build:        ## Build images
	docker compose build

logs:         ## Tail logs
	docker compose logs -f

ps:           ## Show running services
	docker compose ps

backend:      ## Run backend locally (needs MySQL + venv)
	cd backend && uvicorn app.main:app --reload --port 8000

frontend:     ## Run frontend dev server
	cd frontend && npm run dev

seed:         ## Import seed data into the running MySQL container
	docker compose exec -T mysql mysql -ustoragehub -pstoragehub storagehub < database/seeds/seed.sql

migrate:      ## Run alembic migrations inside backend container
	docker compose exec backend alembic upgrade head

clean:        ## Stop and remove volumes (DESTROYS DATA)
	docker compose down -v
