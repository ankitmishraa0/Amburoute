"""
Hospital Recommendation and Capacity Matrix Service for AmbuRoute
"""
import math
from typing import List, Dict, Any, Optional
from app.models.schemas import (
    Hospital,
    HospitalRadarMetrics,
    HospitalRecommendationRequest,
    Coordinates,
    PatientVitals
)

# Reference Base Urban Center (Center coordinates ~ downtown metro)
DEFAULT_HOSPITALS_DATA = [
    {
        "id": "hosp-metro-trauma",
        "name": "Metro General Health & Trauma Center",
        "short_name": "Metro Trauma Level 1",
        "coordinates": {"lat": 37.7885, "lng": -122.4072},
        "address": "450 Medical Plaza Blvd, Downtown Core",
        "trauma_level": "Level 1 Trauma",
        "icu_beds_total": 48,
        "icu_beds_available": 7,
        "cath_lab_ready": True,
        "stroke_center": True,
        "burn_unit": True,
        "pediatric_er": True,
        "avg_er_wait_min": 14,
        "contact_phone": "+1 (555) 019-4821"
    },
    {
        "id": "hosp-apex-heart",
        "name": "Apex Heart, Vascular & Cardiac Pavilion",
        "short_name": "Apex Cardiac Center",
        "coordinates": {"lat": 37.7798, "lng": -122.4184},
        "address": "820 Cardiovascular Way, Midtown",
        "trauma_level": "Level 2 Trauma",
        "icu_beds_total": 32,
        "icu_beds_available": 11,
        "cath_lab_ready": True,
        "stroke_center": True,
        "burn_unit": False,
        "pediatric_er": False,
        "avg_er_wait_min": 6,
        "contact_phone": "+1 (555) 019-9304"
    },
    {
        "id": "hosp-st-jude",
        "name": "St. Jude Memorial Academic Medical Center",
        "short_name": "St. Jude Academic",
        "coordinates": {"lat": 37.7692, "lng": -122.4468},
        "address": "1200 Hillside Ave, Westside Heights",
        "trauma_level": "Level 1 Trauma",
        "icu_beds_total": 60,
        "icu_beds_available": 14,
        "cath_lab_ready": True,
        "stroke_center": True,
        "burn_unit": True,
        "pediatric_er": True,
        "avg_er_wait_min": 22,
        "contact_phone": "+1 (555) 019-3382"
    },
    {
        "id": "hosp-mercy-community",
        "name": "Mercy Community Urgent & Emergency Hospital",
        "short_name": "Mercy Community ER",
        "coordinates": {"lat": 37.7960, "lng": -122.3995},
        "address": "210 Waterfront Quay, North Bay",
        "trauma_level": "Community ER",
        "icu_beds_total": 18,
        "icu_beds_available": 3,
        "cath_lab_ready": False,
        "stroke_center": False,
        "burn_unit": False,
        "pediatric_er": False,
        "avg_er_wait_min": 8,
        "contact_phone": "+1 (555) 019-7719"
    },
    {
        "id": "hosp-childrens-pacific",
        "name": "Pacific Children's Specialized Emergency Center",
        "short_name": "Pacific Pediatric Trauma",
        "coordinates": {"lat": 37.7635, "lng": -122.4240},
        "address": "900 Mission Bay Blvd, Southside",
        "trauma_level": "Level 1 Pediatric Trauma",
        "icu_beds_total": 36,
        "icu_beds_available": 9,
        "cath_lab_ready": True,
        "stroke_center": True,
        "burn_unit": True,
        "pediatric_er": True,
        "avg_er_wait_min": 10,
        "contact_phone": "+1 (555) 019-1100"
    }
]


def calculate_haversine_distance(coord1: Coordinates, coord2: Coordinates) -> float:
    """Calculates geodesic distance in kilometers between two coordinates."""
    R = 6371.0  # Earth's radius in km
    lat1, lon1 = math.radians(coord1.lat), math.radians(coord1.lng)
    lat2, lon2 = math.radians(coord2.lat), math.radians(coord2.lng)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class HospitalService:
    def __init__(self):
        self.hospitals = list(DEFAULT_HOSPITALS_DATA)

    def get_all_hospitals(self) -> List[Dict[str, Any]]:
        return self.hospitals

    def get_hospital_by_id(self, hospital_id: str) -> Optional[Dict[str, Any]]:
        for h in self.hospitals:
            if h["id"] == hospital_id:
                return h
        return None

    def rank_hospitals_for_patient(
        self,
        patient_coords: Coordinates,
        vitals: PatientVitals,
        severity: str = "critical",
        primary_condition: Optional[str] = None
    ) -> List[Hospital]:
        """
        Ranks hospitals using Multi-Criteria Decision Matrix (MCDM).
        Evaluates:
        - Transit Time & Distance (Weight: 35%)
        - Specialized Facility Match: Cath Lab / Stroke / Pediatric (Weight: 30%)
        - ICU & Resus Bay Capacity (Weight: 20%)
        - ER Queue Latency (Weight: 15%)
        """
        results: List[Hospital] = []
        is_pediatric = vitals.age < 18
        symptom_str = " ".join(vitals.symptoms).lower()
        is_cardiac = "chest pain" in symptom_str or "jaw" in symptom_str or "diaphoresis" in symptom_str
        is_stroke = "droop" in symptom_str or "hemiparesis" in symptom_str or vitals.gcs_score < 13
        is_poly_trauma = "trauma" in symptom_str or "mva" in symptom_str or "hemorrhage" in symptom_str

        # City speed assumption: ~38 km/h with siren preemption
        avg_speed_kmh = 42.0

        for raw_hosp in self.hospitals:
            h_coords = Coordinates(lat=raw_hosp["coordinates"]["lat"], lng=raw_hosp["coordinates"]["lng"])
            dist_km = calculate_haversine_distance(patient_coords, h_coords)
            # Add city street circuity factor (1.35x)
            street_dist_km = round(dist_km * 1.35, 2)
            travel_time_min = round((street_dist_km / avg_speed_kmh) * 60, 1)

            # 1. Travel Score (Max score for < 3 min, scales down)
            travel_score = max(0.0, min(100.0, 100.0 - (travel_time_min * 4.5)))

            # 2. Trauma & Specialty Readiness Score
            readiness_score = 50.0
            reasons = []

            if "Level 1" in raw_hosp["trauma_level"]:
                readiness_score += 35.0
                reasons.append("Level 1 Comprehensive Trauma Bay on standby")
            elif "Level 2" in raw_hosp["trauma_level"]:
                readiness_score += 20.0
                reasons.append("Level 2 Trauma Center")

            if is_cardiac:
                if raw_hosp["cath_lab_ready"]:
                    readiness_score += 20.0
                    reasons.append("Active 24/7 STEMI Cath Lab with interventional cardiology")
                else:
                    readiness_score -= 30.0

            if is_stroke:
                if raw_hosp["stroke_center"]:
                    readiness_score += 20.0
                    reasons.append("Certified Comprehensive Stroke Center (tPA & thrombectomy)")
                else:
                    readiness_score -= 25.0

            if is_pediatric:
                if raw_hosp["pediatric_er"]:
                    readiness_score += 35.0
                    reasons.append("Specialized Pediatric Emergency Dept on-site")
                else:
                    readiness_score -= 35.0

            if is_poly_trauma and raw_hosp["burn_unit"]:
                readiness_score += 15.0
                reasons.append("Regional Burn & Trauma Resuscitation Suite")

            readiness_score = max(10.0, min(100.0, readiness_score))

            # 3. Bed Availability Score
            avail_icu = raw_hosp["icu_beds_available"]
            total_icu = raw_hosp["icu_beds_total"]
            icu_ratio = avail_icu / max(1, total_icu)
            bed_score = max(10.0, min(100.0, (icu_ratio * 120.0) + (avail_icu * 4.0)))

            if avail_icu >= 8:
                reasons.append(f"High ICU Bed Capacity ({avail_icu} open beds)")
            elif avail_icu <= 2:
                reasons.append(f"Limited ICU Capacity ({avail_icu} beds remaining)")

            # 4. Specialist Coverage Score
            specialist_score = 90.0 if raw_hosp["cath_lab_ready"] and raw_hosp["stroke_center"] else 60.0

            # 5. Queue Efficiency Score
            wait_min = raw_hosp["avg_er_wait_min"]
            queue_score = max(10.0, min(100.0, 100.0 - (wait_min * 2.5)))
            if wait_min < 10:
                reasons.append(f"Zero ER triage congestion ({wait_min}m queue)")

            # Composite weighted calculation
            composite = (
                travel_score * 0.35 +
                readiness_score * 0.30 +
                bed_score * 0.20 +
                queue_score * 0.15
            )
            composite_int = int(round(max(20.0, min(99.0, composite))))

            radar = HospitalRadarMetrics(
                travel_time_score=round(travel_score, 1),
                trauma_readiness=round(readiness_score, 1),
                bed_availability=round(bed_score, 1),
                specialist_coverage=round(specialist_score, 1),
                queue_efficiency=round(queue_score, 1)
            )

            results.append(Hospital(
                id=raw_hosp["id"],
                name=raw_hosp["name"],
                short_name=raw_hosp["short_name"],
                coordinates=Coordinates(**raw_hosp["coordinates"]),
                address=raw_hosp["address"],
                trauma_level=raw_hosp["trauma_level"],
                icu_beds_total=raw_hosp["icu_beds_total"],
                icu_beds_available=raw_hosp["icu_beds_available"],
                cath_lab_ready=raw_hosp["cath_lab_ready"],
                stroke_center=raw_hosp["stroke_center"],
                burn_unit=raw_hosp["burn_unit"],
                pediatric_er=raw_hosp["pediatric_er"],
                avg_er_wait_min=raw_hosp["avg_er_wait_min"],
                travel_distance_km=street_dist_km,
                travel_time_min=travel_time_min,
                composite_score=composite_int,
                match_reasons=reasons[:4],
                radar_metrics=radar,
                contact_phone=raw_hosp["contact_phone"]
            ))

        # Sort by composite score descending
        results.sort(key=lambda h: h.composite_score, reverse=True)
        return results


# Global instance
hospital_service = HospitalService()
