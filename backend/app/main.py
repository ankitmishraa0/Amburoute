"""
AmbuRoute FastAPI Application Main Entry Point
AI-Powered Smart Ambulance Routing & Emergency Response Platform
"""
import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from app.routers import dispatch, triage, hospitals, signals, handoff, users, auth
from app.services.simulation_engine import simulation_engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start live simulation async loop
    sim_task = asyncio.create_task(simulation_engine.run_simulation_loop())
    yield
    # Shutdown: Cancel background task
    sim_task.cancel()
    try:
        await sim_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="AmbuRoute Emergency AI Platform API",
    description="Smart Ambulance Routing, V2I Traffic Signal Preemption, ML Triage & ER Handoff API",
    version="2.0.0",
    lifespan=lifespan
)


# Security Headers & HTTPS Enforcement Middleware
@app.middleware("http")
async def security_headers_and_https_middleware(request: Request, call_next):
    # 1. Optional Force HTTPS Redirection (e.g., in production or staging)
    force_https = os.getenv("FORCE_HTTPS", "false").lower() in ("true", "1", "yes")
    proto = request.headers.get("X-Forwarded-Proto", request.url.scheme)
    if force_https and proto != "https":
        url = request.url.replace(scheme="https")
        return RedirectResponse(url=str(url), status_code=301)

    # 2. Process Request
    response: Response = await call_next(request)

    # 3. Add Comprehensive Security Headers (CSP, HSTS, X-Frame-Options, etc.)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(self), camera=(), microphone=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com data:; "
        "img-src 'self' data: https: blob:; "
        "connect-src 'self' ws: wss: http: https:;"
    )

    return response


# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Retry-After", "X-Requires-Captcha"]
)

# Include Routers
app.include_router(dispatch.router)
app.include_router(triage.router)
app.include_router(hospitals.router)
app.include_router(signals.router)
app.include_router(handoff.router)
app.include_router(users.router)
app.include_router(auth.router)


@app.get("/")
def root():
    return {
        "platform": "AmbuRoute AI Emergency Mission Control",
        "status": "online",
        "version": "2.0.0",
        "docs_url": "/docs",
        "websocket_url": "/ws/telemetry"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "active_scenario": simulation_engine.active_scenario_key,
        "is_running": simulation_engine.is_running,
        "connected_clients": len(simulation_engine.connected_websockets)
    }
