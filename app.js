// ⚡ Pegá acá tu API key de openchargemap.org (My Account > API Keys)
const OCM_KEY = "dfe1f85d-4bce-4799-80d6-0db0328d22e6";

// Bounding box de Argentina continental + Tierra del Fuego (con margen)
const AR_BOUNDS = L.latLngBounds([-58.0, -76.0], [-20.5, -52.0]);

const map = L.map('map', {
  zoomControl: false,
  minZoom: 4,
  maxBounds: AR_BOUNDS.pad(0.2),
  maxBoundsViscosity: 0.9
});
L.control.zoom({ position: 'bottomright' }).addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap &copy; CARTO',
  subdomains: 'abcd',
  maxZoom: 19,
  noWrap: true
}).addTo(map);

// El contenedor recién tiene tamaño real después del primer frame pintado;
// si fitBounds corre antes, Leaflet calcula mal el zoom (bug: mapa mundial).
requestAnimationFrame(() => {
  map.invalidateSize();
  map.fitBounds(AR_BOUNDS, { animate: false });
});

const chargeIcon = L.divIcon({
  className: 'charge-marker',
  html: '<div style="width:9px;height:9px;border-radius:50%;background:#C8FF4D;border:1.5px solid #0B1614;"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const clusters = L.markerClusterGroup({
  maxClusterRadius: 45,
  iconCreateFunction: cluster => L.divIcon({
    html: `<div style="background:#16241F;border:1.5px solid #3A554D;color:#C8FF4D;
      width:34px;height:34px;border-radius:8px;display:flex;align-items:center;
      justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:12px;
      font-weight:500;">
      ${cluster.getChildCount()}</div>`,
    className: '', iconSize: [34, 34]
  })
});
map.addLayer(clusters);

let allPOIs = [];       // datos crudos de la API
let markerIndex = [];   // { poi, marker, powerBand, operator, province }

// Provincias argentinas con centroide aproximado — se usa para clasificar
// cada punto por coordenadas en lugar de confiar en el texto libre que
// carga la comunidad en OpenChargeMap (inconsistente: localidades, barrios, etc).
const PROVINCES = [
  { name: 'Buenos Aires', lat: -36.7, lng: -60.0 },
  { name: 'CABA', lat: -34.61, lng: -58.42 },
  { name: 'Catamarca', lat: -28.47, lng: -66.78 },
  { name: 'Chaco', lat: -26.9, lng: -60.5 },
  { name: 'Chubut', lat: -43.3, lng: -68.5 },
  { name: 'Córdoba', lat: -31.6, lng: -64.3 },
  { name: 'Corrientes', lat: -28.7, lng: -58.3 },
  { name: 'Entre Ríos', lat: -32.0, lng: -59.3 },
  { name: 'Formosa', lat: -24.8, lng: -60.5 },
  { name: 'Jujuy', lat: -23.6, lng: -65.4 },
  { name: 'La Pampa', lat: -37.0, lng: -65.8 },
  { name: 'La Rioja', lat: -29.8, lng: -67.3 },
  { name: 'Mendoza', lat: -34.6, lng: -68.5 },
  { name: 'Misiones', lat: -27.1, lng: -54.9 },
  { name: 'Neuquén', lat: -38.5, lng: -70.0 },
  { name: 'Río Negro', lat: -40.6, lng: -67.0 },
  { name: 'Salta', lat: -24.8, lng: -65.4 },
  { name: 'San Juan', lat: -31.5, lng: -68.7 },
  { name: 'San Luis', lat: -33.5, lng: -66.3 },
  { name: 'Santa Cruz', lat: -49.5, lng: -70.0 },
  { name: 'Santa Fe', lat: -31.6, lng: -60.9 },
  { name: 'Santiago del Estero', lat: -27.8, lng: -63.8 },
  { name: 'Tierra del Fuego', lat: -54.3, lng: -67.8 },
  { name: 'Tucumán', lat: -26.9, lng: -65.3 }
];

// Distancia aprox. en km entre dos coordenadas (Haversine)
function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Devuelve { name, distance } de la provincia más cercana al punto
function nearestProvince(lat, lng) {
  let best = null, bestDist = Infinity;
  for (const p of PROVINCES) {
    const d = distKm(lat, lng, p.lat, p.lng);
    if (d < bestDist) { bestDist = d; best = p.name; }
  }
  return { name: best, distance: bestDist };
}

function powerBand(maxKW) {
  if (!maxKW) return 'slow';
  if (maxKW >= 100) return 'ultra';
  if (maxKW >= 22) return 'fast';
  return 'slow';
}

function buildPopup(poi) {
  const a = poi.AddressInfo || {};
  const conectores = (poi.Connections || [])
    .map(c => `${c.ConnectionType?.Title || 'Conector'}${c.PowerKW ? ' · ' + c.PowerKW + 'kW' : ''}`)
    .join('<br>');
  return `
    <div class="poi-title">${a.Title || 'Punto de carga'}</div>
    <div class="poi-row"><span>Dirección:</span> ${a.AddressLine1 || 'N/D'}, ${a.Town || ''}</div>
    <div class="poi-row"><span>Operador:</span> ${poi.OperatorInfo?.Title || 'N/D'}</div>
    <div class="poi-row"><span>Conectores:</span><br>${conectores || 'N/D'}</div>
  `;
}

function renderMarkers() {
  clusters.clearLayers();
  const activePower = [...document.querySelectorAll('.f-power:checked')].map(el => el.value);
  const operator = document.getElementById('f-operator').value;
  const province = document.getElementById('f-province').value;
  const search = document.getElementById('f-search').value.trim().toLowerCase();

  let visible = 0, kwSum = 0;
  const provincesSeen = new Set();

  markerIndex.forEach(item => {
    const matchPower = activePower.includes(item.powerBand);
    const matchOperator = !operator || item.operator === operator;
    const matchProvince = !province || item.province === province;
    const matchSearch = !search || item.searchBlob.includes(search);

    if (matchPower && matchOperator && matchProvince && matchSearch) {
      clusters.addLayer(item.marker);
      visible++;
      kwSum += item.maxKW || 0;
      if (item.province) provincesSeen.add(item.province);
    }
  });

  document.getElementById('stat-count').textContent = visible.toLocaleString('es-AR');
  document.getElementById('stat-kw').textContent = Math.round(kwSum).toLocaleString('es-AR');
  document.getElementById('stat-prov').textContent = provincesSeen.size;
}

function populateSelect(id, values) {
  const select = document.getElementById(id);
  [...values].sort().forEach(v => {
    const opt = document.createElement('option');
    opt.value = v; opt.textContent = v;
    select.appendChild(opt);
  });
}

async function cargarCargadores() {
  const url = `https://api.openchargemap.io/v3/poi/?output=json&countrycode=AR&maxresults=4000&compact=true&verbose=false&key=${OCM_KEY}`;
  const res = await fetch(url);
  allPOIs = await res.json();

  const operators = new Set();
  const provinces = new Set();

  allPOIs.forEach(poi => {
    const a = poi.AddressInfo;
    if (!a?.Latitude || !a?.Longitude) return;

    // Descarta países que no son Argentina (dato mal cargado por la comunidad)
    if (a.Country?.ISOCode && a.Country.ISOCode !== 'AR') return;

    const { name: province, distance } = nearestProvince(a.Latitude, a.Longitude);
    // Si está a más de 250km de cualquier centroide provincial, es ruido (ej. Uruguay)
    if (distance > 250) return;

    const maxKW = Math.max(0, ...(poi.Connections || []).map(c => c.PowerKW || 0));
    const operator = poi.OperatorInfo?.Title || 'Sin operador';
    const marker = L.marker([a.Latitude, a.Longitude], { icon: chargeIcon });
    marker.bindPopup(buildPopup(poi));

    operators.add(operator);
    provinces.add(province);

    markerIndex.push({
      poi, marker, maxKW,
      powerBand: powerBand(maxKW),
      operator, province,
      searchBlob: `${a.AddressLine1 || ''} ${a.Town || ''} ${province}`.toLowerCase()
    });
  });

  populateSelect('f-operator', operators);
  populateSelect('f-province', provinces);
  renderMarkers();
  document.getElementById('loading').classList.add('hidden');
}

// listeners
document.querySelectorAll('.f-power').forEach(el => el.addEventListener('change', renderMarkers));
document.getElementById('f-operator').addEventListener('change', renderMarkers);
document.getElementById('f-province').addEventListener('change', renderMarkers);
document.getElementById('f-search').addEventListener('input', renderMarkers);
document.getElementById('f-reset').addEventListener('click', () => {
  document.querySelectorAll('.f-power').forEach(el => el.checked = true);
  document.getElementById('f-operator').value = '';
  document.getElementById('f-province').value = '';
  document.getElementById('f-search').value = '';
  renderMarkers();
});
document.getElementById('panel-toggle').addEventListener('click', () => {
  document.getElementById('panel').classList.add('open');
  document.getElementById('scrim').classList.add('open');
});
document.getElementById('panel-close').addEventListener('click', closePanel);
document.getElementById('scrim').addEventListener('click', closePanel);
function closePanel() {
  document.getElementById('panel').classList.remove('open');
  document.getElementById('scrim').classList.remove('open');
}

cargarCargadores().catch(err => {
  document.getElementById('loading').textContent = 'error al cargar datos — revisá tu API key';
  console.error(err);
});
