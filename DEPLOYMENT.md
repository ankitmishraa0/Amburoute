# AmbuRoute Deployment & Operations Guide

This guide covers everything you need to run AmbuRoute locally and deploy it to cloud environments (Docker, Render, Vercel, Railway, AWS, or DigitalOcean).

---

## 💻 1. Quick Local Execution

### Method A: One-Click Windows Launcher (Easiest)
Navigate to the project root and double-click:
```
run_amburoute.bat
```
*This launches both the FastAPI backend and React frontend dev server and automatically opens your default browser.*

---

### Method B: Manual Terminal Launch

#### Step 1: Start Backend (Terminal 1)
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- **Backend API**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Live Telemetry WebSocket**: `ws://127.0.0.1:8000/ws/telemetry`

#### Step 2: Start Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
- **Frontend Mission Control**: `http://127.0.0.1:5173`

---

## 🐳 2. Containerized Deployment (Docker & Docker Compose)

AmbuRoute includes production-ready Dockerfiles for both services and a `docker-compose.yml` orchestrator with Nginx reverse proxying.

### Run with Docker Compose:
```bash
# In the amburoute root folder:
docker compose up --build -d
```
- **Frontend (Nginx)**: `http://localhost` (Port 80)
- **Backend (FastAPI)**: `http://localhost:8000` (Port 8000)

### Stop Containers:
```bash
docker compose down
```

---

## ☁️ 3. Cloud Deployment Options

### Option A: Free / Low-Cost Cloud Setup (Render + Vercel)

#### 1. Backend on **Render.com** (or Railway.app):
1. Push your repository to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) $\to$ **New Web Service**.
3. Connect your repo and set:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Copy the assigned URL (e.g. `https://amburoute-api.onrender.com`).

#### 2. Frontend on **Vercel.com** (or Netlify):
1. In `frontend/vite.config.js` or `.env`, configure the production API target.
2. Go to [Vercel Dashboard](https://vercel.com/) $\to$ **Add New Project**.
3. Select `frontend` as Root Directory $\to$ Framework **Vite** $\to$ Click **Deploy**.

---

### Option B: Single Ubuntu Server / VM (AWS EC2 / DigitalOcean / GCP)

1. **Provision Ubuntu 22.04 LTS instance**.
2. **Install Docker & Git**:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose git
   ```
3. **Clone & Launch**:
   ```bash
   git clone <your-repo-url> amburoute
   cd amburoute
   sudo docker-compose up -d --build
   ```
4. **Attach SSL Certificate (Certbot)**:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## 🧪 4. Running Automated Tests
```bash
cd backend
python -m pytest tests/
```
All unit and integration tests validate the Scikit-Learn triage model, hospital ranking matrix, signal corridor, and handoff APIs.
