import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Hospital, 
  Radio, 
  Navigation, 
  AlertTriangle, 
  Layers, 
  ChevronDown, 
  Check,
  LocateFixed,
  Search,
  MapPin,
  Compass
} from 'lucide-react';
import { FREE_MAP_LAYERS, getFreeMapLayerById } from '@/config/mapConfig';
import { 
  GORAKHPUR_HOSPITALS, 
  generateHospitalsForCoordinates, 
  generateRouteAndSignals 
} from '@/services/locationHospitals';

// Indian City Presets with Gorakhpur first
export const CITY_PRESETS = [
  { name: 'Gorakhpur, UP', lat: 26.7606, lng: 83.3732, label: 'AIIMS & BRD Medical' },
  { name: 'Delhi NCR', lat: 28.6139, lng: 77.2090, label: 'AIIMS & Connaught Place' },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, label: 'KEM Hospital & BKC' },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, label: 'Manipal & Indiranagar' },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462, label: 'SGPGI & Hazratganj' },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, label: 'SSKM & Park Street' },
  { name: 'San Francisco', lat: 37.7850, lng: -122.4080, label: 'Metro Downtown' }
];

// Clean CAD DivIcons
const createAmbulanceIcon = (heading = 0, siren = true, speed = 50) => {
  return L.divIcon({
    className: 'custom-ambulance-marker',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div style="position: relative; width: 28px; height: 28px; background: #DC2626; border: 2px solid #FFFFFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); box-shadow: 0 2px 6px rgba(0,0,0,0.3); z-index: 10;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2">
            <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
          </svg>
        </div>
        <div style="position: absolute; bottom: -14px; white-space: nowrap; background: #0F172A; border: 1px solid #334155; padding: 1px 4px; border-radius: 3px; font-size: 9px; font-family: monospace; font-weight: 600; color: #F8FAFC;">
          ${speed} km/h
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

const createHospitalIcon = (name, isTarget = false) => {
  return L.divIcon({
    className: 'custom-hospital-marker',
    html: `
      <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 26px; height: 26px; background: ${isTarget ? '#0F172A' : '#FFFFFF'}; border: 2px solid ${isTarget ? '#DC2626' : '#64748B'}; border-radius: 4px; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 4px rgba(0,0,0,0.15); color: ${isTarget ? '#DC2626' : '#0F172A'}; font-weight: 700; font-size: 13px; font-family: sans-serif;">
          H
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const createSignalIcon = (state, seq) => {
  let color = '#DC2626';
  if (state === 'green_wave') {
    color = '#059669';
  } else if (state === 'amber_prep') {
    color = '#D97706';
  } else if (state === 'cleared') {
    color = '#047857';
  }

  return L.divIcon({
    className: 'custom-signal-marker',
    html: `
      <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 20px; height: 20px; background: ${color}; border: 1.5px solid #FFFFFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 10px; font-family: monospace; font-weight: 700; box-shadow: 0 1px 4px rgba(0,0,0,0.2);">
          ${seq}
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const createIncidentIcon = () => {
  return L.divIcon({
    className: 'custom-incident-marker',
    html: `
      <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 24px; height: 24px; background: #DC2626; border: 2px solid #FFFFFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: 700; font-size: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
          !
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'custom-user-pin',
    html: `
      <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 18px; height: 18px; background: #2563EB; border: 2.5px solid #FFFFFF; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
          <div style="width: 4px; height: 4px; background: #FFFFFF; border-radius: 50%;"></div>
        </div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
};

export default function LiveMap({ telemetry, hospitals = [], onLocationRelocated, onSelectHospital }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  
  // Layer groups / markers refs
  const ambMarkerRef = useRef(null);
  const incMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const signalsLayerRef = useRef(null);
  const hospitalsLayerRef = useRef(null);
  const routePolylineCoreRef = useRef(null);

  const [selectedLayerId, setSelectedLayerId] = useState('osm_standard');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  
  // Local Search & Geolocation State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locatingStatus, setLocatingStatus] = useState('');

  const amb = telemetry?.ambulance;
  const inc = telemetry?.incident;
  const signals = telemetry?.signals ?? [];
  const routeCoords = (telemetry?.route_coords ?? []).map(pt => [pt.lat, pt.lng]);
  const defaultCenter = amb?.coordinates ? [amb.coordinates.lat, amb.coordinates.lng] : [26.7606, 83.3732];
  const targetHospId = amb?.target_hospital_id;
  const trafficJam = telemetry?.traffic_jam_injected;
  
  const currentLayer = getFreeMapLayerById(selectedLayerId);

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 14,
      zoomControl: true
    });

    tileLayerRef.current = L.tileLayer(currentLayer.url, {
      attribution: currentLayer.attribution,
      maxZoom: currentLayer.maxZoom
    }).addTo(map);

    signalsLayerRef.current = L.layerGroup().addTo(map);
    hospitalsLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    const timer = setTimeout(handleResize, 300);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Handle Tile Layer changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(currentLayer.url);
  }, [selectedLayerId]);

  // 3. Update Ambulance Marker & Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (amb?.coordinates) {
      const latlng = [amb.coordinates.lat, amb.coordinates.lng];
      const icon = createAmbulanceIcon(amb.heading, amb.siren_active, amb.speed_kmh);
      if (!ambMarkerRef.current) {
        ambMarkerRef.current = L.marker(latlng, { icon }).addTo(map);
        ambMarkerRef.current.bindPopup(`
          <div class="text-xs space-y-1 p-1 font-sans">
            <div class="font-bold text-red-600">${amb.callsign}</div>
            <div class="text-slate-600">Status: <span class="font-mono uppercase font-semibold text-slate-900">${amb.status}</span></div>
            <div class="text-slate-600">Velocity: <span class="font-mono font-semibold text-slate-900">${amb.speed_kmh} km/h</span></div>
            <div class="text-slate-600">Target ETA: <span class="font-mono font-semibold text-slate-900">${Math.round(amb.eta_seconds / 60)} min</span></div>
          </div>
        `);
      } else {
        ambMarkerRef.current.setLatLng(latlng);
        ambMarkerRef.current.setIcon(icon);
      }
    }

    if (inc?.coordinates) {
      const incLatLng = [inc.coordinates.lat, inc.coordinates.lng];
      if (!incMarkerRef.current) {
        incMarkerRef.current = L.marker(incLatLng, { icon: createIncidentIcon() }).addTo(map);
        incMarkerRef.current.bindPopup(`
          <div class="text-xs space-y-1 p-1 font-sans">
            <div class="font-semibold text-red-600 uppercase font-mono text-[10px]">Incident Scene</div>
            <div class="text-slate-900 font-semibold">${inc.title}</div>
            <div class="text-slate-500 text-[11px]">${inc.address}</div>
          </div>
        `);
      } else {
        incMarkerRef.current.setLatLng(incLatLng);
      }
    }

    // Clean CAD Route Polyline
    if (routeCoords.length > 1) {
      const coreColor = trafficJam ? '#DC2626' : '#2563EB';

      if (!routePolylineCoreRef.current) {
        routePolylineCoreRef.current = L.polyline(routeCoords, {
          color: coreColor,
          weight: 4,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);
      } else {
        routePolylineCoreRef.current.setLatLngs(routeCoords);
        routePolylineCoreRef.current.setStyle({ color: coreColor });
      }
    }
  }, [telemetry]);

  // 4. Update Signals Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !signalsLayerRef.current) return;
    signalsLayerRef.current.clearLayers();

    signals.forEach((s) => {
      const icon = createSignalIcon(s.state, s.sequence_order);
      const m = L.marker([s.coordinates.lat, s.coordinates.lng], { icon });
      m.bindPopup(`
        <div class="text-xs space-y-1 p-1 font-sans">
          <div class="font-semibold text-slate-900">${s.name}</div>
          <div class="text-slate-600">State: <span class="font-semibold font-mono text-emerald-600">${s.state}</span></div>
          <div class="text-slate-600">Distance: <span class="font-mono text-slate-900">${s.distance_to_ambulance_m}m</span></div>
          <div class="text-slate-600">Countdown: <span class="font-mono font-semibold text-slate-900">${s.prep_countdown_sec}s</span></div>
        </div>
      `);
      signalsLayerRef.current.addLayer(m);
    });
  }, [signals]);

  // 5. Update Hospitals Layer
  useEffect(() => {
    window.amburouteRouteTo = (hospId) => {
      if (onSelectHospital) {
        onSelectHospital(hospId);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.closePopup();
      }
    };

    hospitals.forEach((h) => {
      const isTarget = h.id === targetHospId;
      const icon = createHospitalIcon(h.name, isTarget);
      const m = L.marker([h.coordinates.lat, h.coordinates.lng], { icon });
      m.bindPopup(`
        <div class="text-xs space-y-1.5 p-1 min-w-[200px] font-sans">
          <div class="font-semibold text-slate-900 leading-tight">${h.name}</div>
          <div class="text-slate-500 font-mono text-[10px]">${h.trauma_level}</div>
          <div class="text-slate-600 text-[11px]">ICU Capacity: <span class="font-mono font-semibold text-slate-900">${h.icu_beds_available}</span> / ${h.icu_beds_total}</div>
          <div class="text-slate-600 text-[11px]">Travel Time: <span class="font-mono font-semibold text-slate-900">${h.travel_time_min} min</span> (${h.travel_distance_km} km)</div>
          <div class="text-slate-700 text-[11px] font-mono">Allocation Score: ${h.composite_score}%</div>
          <div class="pt-1.5 border-t border-slate-200">
            ${isTarget ? `
              <div class="py-1 px-2 rounded bg-slate-100 text-slate-700 text-center font-medium text-xs font-mono">
                Active Destination
              </div>
            ` : `
              <button
                onclick="window.amburouteRouteTo('${h.id}')"
                class="w-full py-1 px-2.5 rounded bg-slate-900 text-white font-medium text-xs text-center hover:bg-slate-800 transition-colors"
              >
                Route to Hospital
              </button>
            `}
          </div>
        </div>
      `);
      hospitalsLayerRef.current.addLayer(m);
    });
  }, [hospitals, targetHospId]);

  const applyRelocation = (lat, lng, label) => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([lat, lng], 14, { duration: 1.2 });
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker([lat, lng], { icon: createUserLocationIcon() }).addTo(map);
      } else {
        userMarkerRef.current.setLatLng([lat, lng]);
      }
    }

    const localHospitals = (Math.abs(lat - 26.76) < 0.2 && Math.abs(lng - 83.37) < 0.2)
      ? GORAKHPUR_HOSPITALS
      : generateHospitalsForCoordinates(lat, lng, label);

    const targetHosp = localHospitals[0];
    const { waypoints, signals: localSignals } = generateRouteAndSignals(lat, lng, targetHosp);

    if (onLocationRelocated) {
      onLocationRelocated({
        center: { lat, lng },
        cityName: label,
        hospitals: localHospitals,
        waypoints,
        signals: localSignals,
        targetHospitalId: targetHosp.id
      });
    }
  };

  const handleGetMyGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocatingStatus('Acquiring device GPS...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocatingStatus('GPS coordinates loaded.');
        applyRelocation(lat, lng, 'My Location');
        setTimeout(() => setLocatingStatus(''), 2000);
      },
      (error) => {
        console.error('Error fetching GPS location:', error);
        setLocatingStatus('GPS permission denied. Using Gorakhpur default.');
        applyRelocation(26.7606, 83.3732, 'Gorakhpur, UP');
        setTimeout(() => setLocatingStatus(''), 2500);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearchLocation = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const cityName = item.display_name.split(',')[0];
    setSearchResults([]);
    setSearchQuery(cityName);
    applyRelocation(lat, lng, cityName);
  };

  const handleSelectCityPreset = (city) => {
    applyRelocation(city.lat, city.lng, city.name);
  };

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col bg-slate-100 dark:bg-slate-950">
      
      {/* Top Docked Control Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left: Search Bar & GPS Button */}
        <div className="flex items-center space-x-2 pointer-events-auto max-w-sm w-full">
          <form onSubmit={handleSearchLocation} className="relative flex-1">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dispatch territory..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-sm"
              />
              {isSearching && (
                <div className="absolute right-2.5 w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>

            {/* Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg p-1 z-20 space-y-0.5 max-h-52 overflow-y-auto">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left p-1.5 rounded text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-start space-x-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="truncate">{item.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Device GPS Button */}
          <button
            type="button"
            onClick={handleGetMyGPSLocation}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm whitespace-nowrap"
            title="Locate device coordinates"
          >
            <LocateFixed className="w-3.5 h-3.5" />
            <span>GPS</span>
          </button>
        </div>

        {/* Right: Map Layer Switcher */}
        <div className="relative pointer-events-auto">
          <button
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs px-2.5 py-1.5 rounded-md flex items-center space-x-1.5 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentLayer.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isLayerMenuOpen && (
            <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg p-1 space-y-0.5 z-20">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-100 dark:border-slate-800">
                Tile Providers
              </div>
              {FREE_MAP_LAYERS.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => {
                    setSelectedLayerId(layer.id);
                    setIsLayerMenuOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                    selectedLayerId === layer.id
                      ? 'bg-slate-100 dark:bg-slate-800 font-medium text-slate-900 dark:text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{layer.name}</span>
                  {selectedLayerId === layer.id && <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white" />}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Bottom Quick-Jump Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center space-x-1 overflow-x-auto p-1 rounded-md bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-sm pointer-events-auto max-w-full scrollbar-none">
          <span className="text-[10px] font-mono text-slate-400 uppercase px-1.5 whitespace-nowrap">
            Territory:
          </span>
          {CITY_PRESETS.map((city, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectCityPreset(city)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors whitespace-nowrap ${
                idx === 0 
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white font-medium'
                  : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      {/* Status Badges */}
      {trafficJam && (
        <div className="absolute top-14 left-1/2 transform -translate-x-1/2 z-10 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-mono font-medium px-3 py-1 rounded border border-slate-800 dark:border-slate-200 shadow-md flex items-center space-x-1.5 pointer-events-none">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
          <span>Detour Active (Congestion Bypass)</span>
        </div>
      )}

      {locatingStatus && (
        <div className="absolute top-14 left-1/2 transform -translate-x-1/2 z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono px-3 py-1 rounded shadow-md pointer-events-none">
          {locatingStatus}
        </div>
      )}

      {/* Leaflet Map DOM Container */}
      <div 
        ref={mapContainerRef} 
        style={{ width: '100%', height: '100%', minHeight: '520px' }} 
        className="w-full h-full flex-1 z-0"
      />
    </div>
  );
}
