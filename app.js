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

const scameIcon = L.divIcon({
  className: 'charge-marker',
  html: '<div style="width:9px;height:9px;border-radius:50%;background:#FF8452;border:1.5px solid #0B1614;"></div>',
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

// Red de carga Scame — no está en OpenChargeMap, se carga como capa fija
// (fuente: mapa oficial de Scame E-Mobility Argentina, emobility.ar)
const SCAME_POINTS = [
  { name: 'Andreani Norlog', lat: -34.429595, lng: -58.681922, address: 'Av. Presidente Perón 4749, Benavidez,  Buenos Aires' },
  { name: 'BP Salta', lat: -24.820692, lng: -65.414879, address: 'Av. Monseñor Tavella 2830, Salta, Salta' },
  { name: 'BP Yerba Buena', lat: -26.811798, lng: -65.303159, address: 'Av. Aconquija 2214, T4107 Yerba Buena, Tucumán' },
  { name: 'Camino de los Remeros', lat: -34.427903, lng: -58.611508, address: '' },
  { name: 'Centro Comercial Gomez Pardo', lat: -26.80027, lng: -65.295064, address: 'Av. Juan Domingo Perón 1850, Yerba Buena, Tucumán' },
  { name: 'City Center', lat: -33.010004, lng: -60.662604, address: 'Av. Battle y Ordóñez y Bv. Oroño, Rosario, Santa Fe' },
  { name: 'Comodoro Conocimiento', lat: -45.82964, lng: -67.466778, address: 'G. E. Hudson 54, Comodoro Rivadavia, Chubut' },
  { name: 'Contelec', lat: -38.721856, lng: -62.294243, address: 'Don Bosco 1055, Bahía Blanca, Buenos Aires' },
  { name: 'Cooperativa Eléctrica Gualeguaychú', lat: -33.017246, lng: -58.524113, address: 'Constitución y Goldaracena, Gualeguaychu, Entre Rios' },
  { name: 'Cruzzolin', lat: -34.635029, lng: -58.758476, address: 'Acc. Oeste Km 34, Moreno, Buenos Aires' },
  { name: 'Dygelec', lat: -32.410184, lng: -63.261697, address: 'Blvd. Colón 18, Villa María, Córdoba' },
  { name: 'Electricidad Alsina', lat: -34.664746, lng: -58.366344, address: 'Av. Manuel Belgrano 746, Avellaneda, Buenos Aires' },
  { name: 'Electricidad Maza', lat: -32.88855, lng: -68.834663, address: 'Lavalle 266, Mendoza, Mendoza' },
  { name: 'Electricidad Solari', lat: -34.896714, lng: -57.940922, address: 'Av. 122 Nº 580, Ensenada, Buenos Aires' },
  { name: 'Electro 2001', lat: -34.634641, lng: -58.54271, address: 'Av. Gaona 3995, Ciudadela, Buenos Aires' },
  { name: 'Electro Dos', lat: -34.585634, lng: -58.536114, address: 'H. Yrigoyen 4286, San Martín, Buenos Aires' },
  { name: 'Electro Lujan', lat: -34.562292, lng: -59.11258, address: 'Almte. Brown 574, Luján, Buenos Aires' },
  { name: 'Electropuerto', lat: -38.050608, lng: -57.54399, address: 'Av. Prefectura Naval Argentina 150, Mar del Plata, Buenos Aires' },
  { name: 'EPEC', lat: -31.407375, lng: -64.185471, address: 'Blvd. Mitre 343, X5022 Córdoba' },
  { name: 'EPEC Marcos Juarez', lat: -32.697719, lng: -62.100125, address: 'Jujuy 198, Marcos Juárez, Córdoba' },
  { name: 'Equipel', lat: -38.953539, lng: -68.02692, address: 'Félix San Martín 2322, Neuquén' },
  { name: 'FG Industrial', lat: -35.656299, lng: -63.747378, address: 'Calle 17 1526 Gral. Pico, La Pampa' },
  { name: 'Greco', lat: -34.547811, lng: -58.554294, address: 'Lavalle 2600, Villa Ballester, Buenos Aires' },
  { name: 'Harmonie Chateau', lat: -31.389007, lng: -64.259642, address: 'Calandria 151, Córdoba' },
  { name: 'Madero Harbour', lat: -34.619237, lng: -58.360883, address: 'Lola Mora 450' },
  { name: 'Matelec', lat: -37.323698, lng: -59.134605, address: 'Alem 725, Tandil, Buenos Aires' },
  { name: 'Melecsur', lat: -42.768284, lng: -65.037964, address: 'Belgrano 379, Puerto Madryn, Chubut' },
  { name: 'Neuquén', lat: -38.9766, lng: -68.0474, address: 'Isla 132, paseo de la costa.' },
  { name: 'Nissan Neostar', lat: -32.937203, lng: -60.655117, address: 'Catamarca 2440, S2000 Rosario, Santa Fe' },
  { name: 'Nuevo Sur', lat: -45.892923, lng: -67.537107, address: 'Av. Hipólito Yrigoyen 4075, Comodoro Rivadavia' },
  { name: 'Park 10', lat: -34.485872, lng: -58.593863, address: 'Dr. René Favaloro 3331, Victoria, San Fernando, Buenos Aires' },
  { name: 'Parque Mitre', lat: -32.921378, lng: -68.84042, address: 'Abierto 24hs' },
  { name: 'Pastorutti', lat: -36.631156, lng: -64.301896, address: 'Av. Circunvalación Sgo. Marzo Sur 455, Santa Rosa, La Pampa' },
  { name: 'Pelba Pilar', lat: -34.45135, lng: -58.923395, address: 'Panamericana Km 55, Del Viso, Provincia de Buenos Aires' },
  { name: 'Pem', lat: -34.848111, lng: -58.398142, address: 'Av. Hipólito Yrigoyen 16720, Burzaco, Provincia de Buenos Aires' },
  { name: 'Ruta 7, Peaje Desaguadero', lat: -33.411913, lng: -67.123216, address: 'AU de las Serranías Puntanas, San Luis' },
  { name: 'Ruta 7, Peaje La Cumbre', lat: -33.359117, lng: -66.066639, address: 'AU de las Serranías Puntanas, San Luis' },
  { name: 'Ruta 7, Peaje Justo Daract', lat: -33.852114, lng: -65.150805, address: 'AU de las Serranías Puntanas, San Luis' },
  { name: 'Shopping Plaza San Lorenzo', lat: -24.743585, lng: -65.484718, address: 'Avenida San Martín 866, San Lorenzo, Salta' },
  { name: 'Shopping Tierra Chica', lat: -32.922573, lng: -60.802688, address: 'Cordoba 972, Funes, Santa Fe' },
  { name: 'Sierra Electricidad', lat: -34.624642, lng: -68.339005, address: 'Av. Domingo Faustino Sarmiento 450, San Rafael, Mendoza' },
  { name: 'Tamex 2', lat: -35.44018, lng: -60.900682, address: 'Compaire 2163, 9 de Julio, Buenos Aires' },
  { name: 'Terrazas del Portezuelo', lat: -33.301617, lng: -66.293639, address: 'RN7 Km 783, San Luis' },
  { name: 'Tifón Water Planet', lat: -32.837668, lng: -60.698418, address: 'Julio Argentino Roca 650, Granadero Baigorria, Santa Fe' },
  { name: 'Vanluz', lat: -34.400044, lng: -58.736768, address: 'Del Trabajo 1294, Garin, Buenos Aires' },
  { name: 'YPF Dolores', lat: -36.257473, lng: -57.709485, address: 'Ruta Nacional Nº 2, KM 202, Dolores, Bs As' },
  { name: 'YPF Lucam Cordoba', lat: -31.376421, lng: -64.126494, address: '' },
  { name: 'YPF Vensim Cordoba', lat: -31.376876, lng: -64.128582, address: '' },
  { name: 'YPF Punto Panorámico Cordoba', lat: -31.385874, lng: -64.279314, address: 'Av. Ejército Argentino km 6.5, Córdoba' },
  { name: 'YPF Rio Segundo Ascendente', lat: -31.652528, lng: -63.854472, address: '' },
  { name: 'YPF Rio Segundo Descendente', lat: -31.652694, lng: -63.857028, address: '' },
  { name: 'Grupo Cala S.A', lat: -34.632145, lng: -58.661291, address: 'Horarios de 8:30 a 17:00 L a V y Sábados de 9:00 a 13:00' },
  { name: 'JOMA electricidad', lat: -34.854976, lng: -58.50364, address: '' },
  { name: 'Punto 54', lat: -38.037677, lng: -57.587768, address: '' },
  { name: 'Richetta Schneider', lat: -31.434234, lng: -64.13242, address: '' },
  { name: 'Transelec SRL Mat. Electricos', lat: -32.987605, lng: -60.740391, address: '' },
  { name: 'Serra Electricidad', lat: -32.900212, lng: -60.910248, address: '' },
  { name: 'BP Soluciones Eléctricas Confiables', lat: -26.811788, lng: -65.303154, address: '' },
  { name: 'Ciardi Hnos', lat: -37.975707, lng: -57.592112, address: '' },
  { name: 'Parque Industrial Roldán', lat: -32.855692, lng: -60.884438, address: 'Roldán, Santa Fe' },
  { name: 'Paseo La Plaza', lat: -34.60439, lng: -58.39019, address: '' },
  { name: 'Serra electricidad Srl', lat: -32.9186, lng: -60.813611, address: 'Lunes a viernes 8 30 a 17 30. Sábados 8 30 a 12 30' },
  { name: 'Villa Maria Epec', lat: -32.410083, lng: -63.244028, address: 'Cargador de continua hasta 25 kW' },
  { name: 'Centro logístico ALKO', lat: -34.538643, lng: -58.520743, address: '' },
  { name: 'Oficinas Centrales AKLO', lat: -34.542468, lng: -58.529111, address: '' },
  { name: 'Equipel', lat: -38.953526, lng: -68.026833, address: '' },
  { name: 'Nuevo Sur SA', lat: -38.910266, lng: -68.095282, address: '' },
  { name: 'Serra Electricidad', lat: -32.959344, lng: -60.642121, address: '' },
  { name: 'Transelec SRL - Sucursal Pergamino', lat: -33.888714, lng: -60.572753, address: '' },
  { name: 'Ciardi Hnos. | Suc. Balcarce', lat: -37.850185, lng: -58.250486, address: '' },
  { name: 'Ciardi Hnos. | Suc. La Costa', lat: -37.141856, lng: -56.914397, address: '' },
  { name: 'Magnani Soluciones Eléctricas Sustentables', lat: -32.920641, lng: -60.717221, address: '' },
  { name: 'Fegime Latam SA', lat: -34.497121, lng: -58.54514, address: '' },
  { name: 'Trielec S.A.', lat: -31.563529, lng: -68.514742, address: '' },
  { name: 'Pelba - Sucursal Escobar', lat: -34.329189, lng: -58.763693, address: '' }
];

// Alias de texto para detectar la provincia real cuando la dirección la
// menciona explícitamente — más confiable que el centroide más cercano,
// que puede fallar cerca de límites provinciales.
const PROVINCE_ALIASES = [
  ['CABA', ['CABA', 'Capital Federal', 'Ciudad Autónoma de Buenos Aires', 'Ciudad de Buenos Aires']],
  ['Tierra del Fuego', ['Tierra del Fuego']],
  ['Santiago del Estero', ['Santiago del Estero']],
  ['Entre Ríos', ['Entre Ríos', 'Entre Rios']],
  ['Río Negro', ['Río Negro', 'Rio Negro']],
  ['La Pampa', ['La Pampa']],
  ['La Rioja', ['La Rioja']],
  ['San Juan', ['San Juan']],
  ['San Luis', ['San Luis']],
  ['Santa Cruz', ['Santa Cruz']],
  ['Santa Fe', ['Santa Fe']],
  ['Buenos Aires', ['Buenos Aires', 'Bs. As.', 'Bs As']],
  ['Catamarca', ['Catamarca']],
  ['Chaco', ['Chaco']],
  ['Chubut', ['Chubut']],
  ['Córdoba', ['Córdoba', 'Cordoba']],
  ['Corrientes', ['Corrientes']],
  ['Formosa', ['Formosa']],
  ['Jujuy', ['Jujuy']],
  ['Mendoza', ['Mendoza']],
  ['Misiones', ['Misiones']],
  ['Neuquén', ['Neuquén', 'Neuquen']],
  ['Salta', ['Salta']],
  ['Tucumán', ['Tucumán', 'Tucuman']]
];

function provinceFromText(text) {
  if (!text) return null;
  for (const [canonical, aliases] of PROVINCE_ALIASES) {
    if (aliases.some(a => text.toLowerCase().includes(a.toLowerCase()))) return canonical;
  }
  return null;
}

// Estima potencia a partir del texto de dirección (ej. "hasta 25 kW");
// si no hay dato, se asume el estándar Scame Tipo 2 AC de 22kW.
function powerFromText(text) {
  const m = text?.match(/(\d+)\s*kw/i);
  return m ? parseInt(m[1], 10) : 22;
}

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

    const { name: byCoords, distance } = nearestProvince(a.Latitude, a.Longitude);
    // Si está a más de 250km de cualquier centroide provincial, es ruido (ej. Uruguay)
    if (distance > 250) return;
    const province = provinceFromText(`${a.StateOrProvince || ''} ${a.Town || ''} ${a.AddressLine1 || ''}`) || byCoords;

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
  cargarScame(operators, provinces);
  renderMarkers();
  document.getElementById('loading').classList.add('hidden');
}

function cargarScame(operators, provinces) {
  SCAME_POINTS.forEach(p => {
    const byText = provinceFromText(p.address) || provinceFromText(p.name);
    const byCoords = nearestProvince(p.lat, p.lng);
    if (!byText && byCoords.distance > 250) return;
    const province = byText || byCoords.name;

    const kw = powerFromText(p.address);
    const connector = /continua|\bdc\b/i.test(p.address) ? 'DC rápido' : 'Tipo 2 (AC)';

    const marker = L.marker([p.lat, p.lng], { icon: scameIcon });
    marker.bindPopup(`
      <div class="poi-title">${p.name}</div>
      <div class="poi-row"><span>Dirección:</span> ${p.address || 'N/D'}</div>
      <div class="poi-row"><span>Operador:</span> Scame</div>
      <div class="poi-row"><span>Conectores:</span><br>${connector} · ${kw}kW · acceso público gratuito</div>
    `);

    operators.add('Scame');
    provinces.add(province);
    populateSelectOption('f-operator', 'Scame');
    populateSelectOption('f-province', province);

    markerIndex.push({
      marker, maxKW: kw,
      powerBand: powerBand(kw),
      operator: 'Scame', province,
      searchBlob: `${p.name} ${p.address} ${province}`.toLowerCase()
    });
  });
}

function populateSelectOption(id, value) {
  const select = document.getElementById(id);
  if ([...select.options].some(o => o.value === value)) return;
  const opts = [...select.options].slice(1); // sin "Todos"/"Todas"
  const opt = document.createElement('option');
  opt.value = value; opt.textContent = value;
  opts.push(opt);
  opts.sort((a, b) => a.value.localeCompare(b.value, 'es'));
  select.innerHTML = '';
  select.appendChild(new Option(id === 'f-operator' ? 'Todos' : 'Todas', ''));
  opts.forEach(o => select.appendChild(o));
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
