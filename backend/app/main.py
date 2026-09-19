"""
AmbuRoute FastAPI Application Main Entry Point
AI-Powered Smart Ambulance Routing & Emergency Response Platform
"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import dispatch, triage, hospitals, signals, handoff
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

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(dispatch.router)
app.include_router(triage.router)
app.include_router(hospitals.router)
app.include_router(signals.router)
app.include_router(handoff.router)


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
