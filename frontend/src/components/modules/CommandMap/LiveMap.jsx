import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Hospital, 
  Radio, 
  Siren, 
  Navigation, 
  AlertTriangle, 
  Layers, 
  ChevronDown, 
  Check,
  LocateFixed,
  Search,
  MapPin,
  Sparkles,
  Compass
} from 'lucide-react';
import { FREE_MAP_LAYERS, getFreeMapLayerById } from '@/config/mapConfig';
import { soundFx } from '@/services/sound';
import { 
  GORAKHPUR_HOSPITALS, 
  generateHospitalsForCoordinates, 
  generateRouteAndSignals 
} from '@/services/locationHospitals';

// Popular Indian City Presets with Gorakhpur first
export const CITY_PRESETS = [
  { name: '📍 Gorakhpur, UP', lat: 26.7606, lng: 83.3732, label: 'AIIMS & BRD Medical' },
  { name: '📍 Delhi NCR', lat: 28.6139, lng: 77.2090, label: 'AIIMS & Connaught Place' },
  { name: '📍 Mumbai', lat: 19.0760, lng: 72.8777, label: 'KEM Hospital & BKC' },
  { name: '📍 Bengaluru', lat: 12.9716, lng: 77.5946, label: 'Manipal & Indiranagar' },
  { name: '📍 Lucknow', lat: 26.8467, lng: 80.9462, label: 'SGPGI & Hazratganj' },
  { name: '📍 Kolkata', lat: 22.5726, lng: 88.3639, label: 'SSKM & Park Street' },
  { name: '📍 San Francisco', lat: 37.7850, lng: -122.4080, label: 'Metro Downtown' }
];

// Custom DivIcons styled for Red & White Theme
const createAmbulanceIcon = (heading = 0, siren = true, speed = 50) => {
  return L.divIcon({
    className: 'custom-ambulance-marker',
    html: `
      <div style="position: relative; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center;">
        ${siren ? '<div class="animate-radar-pulse" style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(225, 29, 72, 0.35); border: 2px solid #E11D48;"></div>' : ''}
        <div style="position: relative; width: 34px; height: 34px; background: #FFFFFF; border: 2.5px solid #E11D48; border-radius: 50%; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); box-shadow: 0 4px 14px rgba(225, 29, 72, 0.4); z-index: 10;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#E11D48" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
          </svg>
        </div>
        <div style="position: absolute; bottom: -18px; white-space: nowrap; background: #FFFFFF; border: 1.5px solid #E11D48; padding: 1px 6px; border-radius: 6px; font-size: 10px; font-family: monospace; font-weight: 900; color: #E11D48; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
          ${speed} KM/H
        </div>
      </div>
    `,
    iconSize: [46, 46],
    iconAnchor: [23, 23]
  });
};

const createHospitalIcon = (name, isTarget = false) => {
  return L.divIcon({
    className: 'custom-hospital-marker',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 32px; height: 32px; background: ${isTarget ? '#E11D48' : '#FFFFFF'}; border: 2px solid ${isTarget ? '#FFFFFF' : '#E11D48'}; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: ${isTarget ? '0 4px 16px rgba(225,29,72,0.5)' : '0 2px 8px rgba(0,0,0,0.15)'}; color: ${isTarget ? '#FFFFFF' : '#E11D48'}; font-weight: 900; font-size: 15px;">
          H
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

const createSignalIcon = (state, seq) => {
  let color = '#E11D48';
  let pulse = false;
  if (state === 'green_wave') {
    color = '#10B981';
    pulse = true;
  } else if (state === 'amber_prep') {
    color = '#F59E0B';
    pulse = true;
  } else if (state === 'cleared') {
    color = '#059669';
  }

  return L.divIcon({
    className: 'custom-signal-marker',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        ${pulse ? `<div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: ${color}33; border: 1.5px solid ${color};" class="animate-ping"></div>` : ''}
        <div style="width: 22px; height: 22px; background: #FFFFFF; border: 2px solid ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${color}; font-size: 11px; font-weight: 900; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
          ${seq}
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

const createIncidentIcon = () => {
  return L.divIcon({
    className: 'custom-incident-marker',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div class="animate-radar-pulse" style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(225, 29, 72, 0.4); border: 2px solid #E11D48;"></div>
        <div style="width: 28px; height: 28px; background: #E11D48; border: 2px solid #FFFFFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: 900; font-size: 14px; box-shadow: 0 4px 14px rgba(225,29,72,0.4);">
          !
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'custom-user-pin',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div class="animate-ping" style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background: rgba(37, 99, 235, 0.4);"></div>
        <div style="width: 22px; height: 22px; background: #2563EB; border: 3px solid #FFFFFF; border-radius: 50%; box-shadow: 0 4px 14px rgba(37,99,235,0.4); display: flex; align-items: center; justify-content: center;">
          <div style="width: 6px; height: 6px; background: #FFFFFF; border-radius: 50%;"></div>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
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
  const routePolylineGlowRef = useRef(null);
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

  // 3. Update Ambulance Marker & Route Polyline smoothly
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (amb?.coordinates) {
      const latlng = [amb.coordinates.lat, amb.coordinates.lng];
      const icon = createAmbulanceIcon(amb.heading, amb.siren_active, amb.speed_kmh);
      if (!ambMarkerRef.current) {
        ambMarkerRef.current = L.marker(latlng, { icon }).addTo(map);
        ambMarkerRef.current.bindPopup(`
          <div class="text-xs space-y-1 p-1">
            <div class="font-black text-rose-600 text-sm">${amb.callsign}</div>
            <div class="text-slate-600">Status: <span class="text-slate-900 font-mono font-bold uppercase">${amb.status}</span></div>
            <div class="text-slate-600">Speed: <span class="text-rose-600 font-mono font-bold">${amb.speed_kmh} km/h</span></div>
            <div class="text-slate-600">ETA: <span class="text-amber-600 font-mono font-bold">${Math.round(amb.eta_seconds / 60)} min</span></div>
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
          <div class="text-xs space-y-1 p-1">
            <div class="font-bold text-rose-600 uppercase tracking-wide">Emergency Scene</div>
            <div class="text-slate-900 font-bold">${inc.title}</div>
            <div class="text-slate-600 text-[11px]">${inc.address}</div>
          </div>
        `);
      } else {
        incMarkerRef.current.setLatLng(incLatLng);
      }
    }

    // Red & White Route Polyline (Vibrant Crimson with Red Glow)
    if (routeCoords.length > 1) {
      const glowColor = trafficJam ? '#F43F5E' : '#FDA4AF';
      const coreColor = trafficJam ? '#E11D48' : '#BE123C';

      if (!routePolylineGlowRef.current) {
        routePolylineGlowRef.current = L.polyline(routeCoords, {
          color: glowColor,
          weight: 8,
          opacity: 0.6,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        routePolylineCoreRef.current = L.polyline(routeCoords, {
          color: coreColor,
          weight: 4,
          opacity: 0.95,
          dashArray: '1, 10',
          lineCap: 'round'
        }).addTo(map);
      } else {
        routePolylineGlowRef.current.setLatLngs(routeCoords);
        routePolylineGlowRef.current.setStyle({ color: glowColor });
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
        <div class="text-xs space-y-1 p-1">
          <div class="font-bold text-slate-900">${s.name}</div>
          <div class="text-slate-600">State: <span class="font-bold uppercase font-mono text-emerald-600">${s.state}</span></div>
          <div class="text-slate-600">Distance: <span class="text-slate-900 font-mono">${s.distance_to_ambulance_m}m</span></div>
          <div class="text-slate-600">Prep Window: <span class="text-amber-600 font-mono font-bold">${s.prep_countdown_sec}s</span></div>
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
        <div class="text-xs space-y-1.5 p-1 min-w-[210px]">
          <div class="font-black text-slate-900 text-sm leading-tight">${h.name}</div>
          <div class="text-rose-600 font-mono font-bold text-[11px]">${h.trauma_level}</div>
          <div class="text-slate-600 text-xs">ICU Beds Open: <span class="text-emerald-600 font-bold">${h.icu_beds_available}</span> / ${h.icu_beds_total}</div>
          <div class="text-slate-600 text-xs">Transit Time: <span class="text-amber-600 font-bold">${h.travel_time_min} Mins</span> (${h.travel_distance_km} km)</div>
          <div class="text-rose-600 text-[11px] font-bold">Match Score: ${h.composite_score}%</div>
          <div class="pt-2 border-t border-slate-200">
            ${isTarget ? `
              <div class="py-1 px-2 rounded-lg bg-emerald-100 text-emerald-800 text-center font-bold text-xs">
                ✅ Currently Active Destination
              </div>
            ` : `
              <button
                onclick="window.amburouteRouteTo('${h.id}')"
                class="w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-xs text-center shadow-xs cursor-pointer transition-all"
              >
                👉 Route Ambulance Here
              </button>
            `}
          </div>
        </div>
      `);
      hospitalsLayerRef.current.addLayer(m);
    });
  }, [hospitals, targetHospId]);

  // Apply location shift to map and parents
  const applyRelocation = (lat, lng, label) => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([lat, lng], 14, { duration: 1.5 });
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

  // 6. User Location GPS handler
  const handleGetMyGPSLocation = () => {
    soundFx.playGreenWavePing();
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocatingStatus('Locating device GPS...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocatingStatus('GPS Found! Local hospitals loaded.');
        soundFx.playReroute();
        applyRelocation(lat, lng, 'My Device Location');
        setTimeout(() => setLocatingStatus(''), 2500);
      },
      (error) => {
        console.error('Error fetching GPS location:', error);
        setLocatingStatus('GPS denied: loading Gorakhpur defaults.');
        applyRelocation(26.7606, 83.3732, 'Gorakhpur, UP');
        setTimeout(() => setLocatingStatus(''), 3000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 7. Search location
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
    soundFx.playClick();
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const cityName = item.display_name.split(',')[0];
    setSearchResults([]);
    setSearchQuery(cityName);
    applyRelocation(lat, lng, cityName);
  };

  const handleSelectCityPreset = (city) => {
    soundFx.playClick();
    applyRelocation(city.lat, city.lng, city.name.replace('📍 ', ''));
  };

  return (
    <div className="relative w-full h-full min-h-[540px] rounded-2xl overflow-hidden border border-slate-200 shadow-xs flex flex-col bg-slate-50">
      
      {/* Top Docked Control Toolbar - Red & White Theme */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left: Search Bar & GPS Button */}
        <div className="flex items-center space-x-2 pointer-events-auto max-w-md w-full">
          <form onSubmit={handleSearchLocation} className="relative flex-1">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any area or city (e.g. Gorakhpur, Andheri)..."
                className="w-full bg-white/95 backdrop-blur-md border border-slate-300 hover:border-rose-400 focus:border-rose-600 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none shadow-md transition-colors"
              />
              {isSearching && (
                <div className="absolute right-2.5 w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>

            {/* Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-20 space-y-1 backdrop-blur-xl max-h-56 overflow-y-auto">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left p-2 rounded-lg text-xs font-mono text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer flex items-start space-x-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
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
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold shadow-md shadow-rose-600/25 transition-all cursor-pointer whitespace-nowrap"
            title="Locate user device GPS & load local hospitals"
          >
            <LocateFixed className="w-4 h-4 animate-pulse" />
            <span className="hidden sm:inline">My Device GPS</span>
            <span className="sm:hidden">GPS</span>
          </button>
        </div>

        {/* Right: Map Layer Switcher */}
        <div className="relative pointer-events-auto">
          <button
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            className="bg-white/95 hover:bg-slate-50 backdrop-blur-md border border-slate-300 text-slate-800 text-xs font-mono px-3 py-2 rounded-xl flex items-center space-x-2 shadow-md transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-rose-600" />
            <span className="font-bold">{currentLayer.icon} {currentLayer.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {isLayerMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 space-y-1 z-20 backdrop-blur-xl">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider px-2 py-1 border-b border-slate-100 flex items-center justify-between">
                <span>Free Vector & Satellite Maps:</span>
              </div>
              {FREE_MAP_LAYERS.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedLayerId(layer.id);
                    setIsLayerMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-colors cursor-pointer ${
                    selectedLayerId === layer.id
                      ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{layer.icon}</span>
                    <span className="truncate max-w-[170px]">{layer.name}</span>
                  </div>
                  {selectedLayerId === layer.id && <Check className="w-3.5 h-3.5 text-rose-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Bottom Quick-Jump Bar (Gorakhpur at Index 0) */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center space-x-1.5 overflow-x-auto p-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg pointer-events-auto max-w-full scrollbar-none">
          <span className="text-[10px] font-mono text-slate-500 uppercase px-1.5 flex items-center space-x-1 whitespace-nowrap">
            <Compass className="w-3 h-3 text-rose-600" />
            <span>Quick Jump:</span>
          </span>
          {CITY_PRESETS.map((city, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectCityPreset(city)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors whitespace-nowrap cursor-pointer ${
                idx === 0 
                  ? 'bg-rose-600 text-white border-rose-700 font-bold shadow-xs'
                  : 'bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-slate-700 border-slate-200'
              }`}
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      {/* Status Badges */}
      {trafficJam && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10 bg-rose-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-rose-600/40 flex items-center space-x-2 pointer-events-none animate-bounce">
          <AlertTriangle className="w-4 h-4 text-amber-300" />
          <span>ARTERIAL DETOUR ACTIVE (+0.0035 LAT BYPASS)</span>
        </div>
      )}

      {locatingStatus && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10 bg-white border border-rose-200 text-rose-700 text-xs font-mono font-bold px-4 py-1.5 rounded-full shadow-lg pointer-events-none">
          {locatingStatus}
        </div>
      )}

      {/* Leaflet Map DOM Container */}
      <div 
        ref={mapContainerRef} 
        style={{ width: '100%', height: '100%', minHeight: '540px' }} 
        className="w-full h-full flex-1 z-0"
      />
    </div>
  );
}
