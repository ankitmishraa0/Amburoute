"""
Traffic-Signal Pre-Coordination (Green Wave) Router for AmbuRoute
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.models.schemas import IntersectionSignal
from app.services.simulation_engine import simulation_engine

router = APIRouter(prefix="/api/signals", tags=["Traffic-Signal Pre-Coordination"])


@router.get("/corridor", response_model=List[IntersectionSignal])
def get_corridor_signals():
    """Returns the sequential signal intersections along the active ambulance route."""
    return simulation_engine.active_signals


@router.post("/override/{signal_id}")
def manual_signal_override(signal_id: str):
    """Manually forces an intersection into Green Wave priority clearance."""
    for sig in simulation_engine.active_signals:
        if sig.id == signal_id:
            sig.state = "green_wave"
            sig.preemption_active = True
            sig.prep_countdown_sec = 0
            return {
                "status": "success",
                "message": f"Manual Green Wave preemption forced for {sig.name}",
                "signal": sig
            }
    raise HTTPException(status_code=404, detail=f"Intersection signal '{signal_id}' not found")
