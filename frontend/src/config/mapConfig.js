/**
 * 100% Free Open Map Providers for AmbuRoute (Red & White Theme)
 * Default: Clean Crisp Streets (OpenStreetMap / Esri Streets)
 */

export const FREE_MAP_LAYERS = [
  {
    id: 'osm_standard',
    name: 'Clean Street Map (OpenStreetMap)',
    icon: '🗺️',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  },
  {
    id: 'esri_streets',
    name: 'Urban Transit Navigation',
    icon: '🏙️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri Street Map',
    maxZoom: 18
  },
  {
    id: 'esri_satellite',
    name: 'Satellite Photorealistic HD',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; Earthstar Geographics',
    maxZoom: 19
  },
  {
    id: 'esri_dark_gray',
    name: 'Night Canvas Dark',
    icon: '🌃',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; OpenStreetMap contributors',
    maxZoom: 18
  }
];

export function getFreeMapLayerById(id) {
  return FREE_MAP_LAYERS.find(l => l.id === id) || FREE_MAP_LAYERS[0];
}
