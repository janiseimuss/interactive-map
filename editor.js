const imageWidth = 2732;
const imageHeight = 1526;

const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -2,
  maxZoom: 2
});

const bounds = [[0, 0], [imageHeight, imageWidth]];
L.imageOverlay('assets/map.jpg', bounds).addTo(map);
map.fitBounds(bounds);

let markersData = [];
let leafletMarkers = [];
let currentPopup = null;

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getSymbolHtml(symbolType) {
  switch (symbolType) {
    case 'tele2-bs':
      return '<div class="symbol-circle-yellow"></div>';
    case 'tele2-hub':
      return '<div class="symbol-circle-purple"></div>';
    case 'lvrtc-access':
      return '<div class="symbol-triangle-bluegray"></div>';
    case 'tet-pm':
      return '<div class="symbol-triangle-red"></div>';
    default:
      return '<div class="symbol-circle-yellow"></div>';
  }
}

function createSymbolIcon(symbolType) {
  const isTriangle = symbolType === 'lvrtc-access' || symbolType === 'tet-pm';

  return L.divIcon({
    className: '',
    html: getSymbolHtml(symbolType),
    iconSize: isTriangle ? [22, 20] : [12, 12],
    iconAnchor: isTriangle ? [11, 18] : [6, 6],
    popupAnchor: [0, -10]
  });
}

function clearLeafletMarkers() {
  leafletMarkers.forEach(marker => map.removeLayer(marker));
  leafletMarkers = [];
}

function renderMarkers() {
  clearLeafletMarkers();

  markersData.forEach((point, index) => {
    const symbolType = point.symbolType || 'tele2-bs';
    const icon = createSymbolIcon(symbolType);

    const marker = L.marker([point.y, point.x], { icon }).addTo(map);

    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      openEditMarkerForm(index);
    });

    leafletMarkers.push(marker);
  });
}

function getSymbolOptions(selectedValue = 'tele2-bs') {
  return `
    <option value="tele2-bs" ${selectedValue === 'tele2-bs' ? 'selected' : ''}>Dzeltens aplis — Tele2 BS</option>
    <option value="tele2-hub" ${selectedValue === 'tele2-hub' ? 'selected' : ''}>Violets aplis — Tele2 HUB</option>
    <option value="lvrtc-access" ${selectedValue === 'lvrtc-access' ? 'selected' : ''}>Pelēki zils trijstūris — LVRTC maģistrālais piekļuves punkts</option>
    <option value="tet-pm" ${selectedValue === 'tet-pm' ? 'selected' : ''}>Sarkans trijstūris — Tet PM</option>
  `;
}

function openAddMarkerForm(latlng) {
  if (currentPopup) {
    map.closePopup(currentPopup);
  }

  const popupContent = `
    <div class="editor-form">
      <label>
        Nosaukums:
        <input type="text" id="marker-title" />
      </label>

      <label>
        Apraksts:
        <textarea id="marker-description"></textarea>
      </label>

      <label>
        Simbols:
        <select id="marker-symbol-type">
          ${getSymbolOptions('tele2-bs')}
        </select>
      </label>

      <button id="save-marker-btn">Saglabāt punktu</button>
    </div>
  `;

  currentPopup = L.popup()
    .setLatLng(latlng)
    .setContent(popupContent)
    .openOn(map);

  setTimeout(() => {
    const saveBtn = document.getElementById('save-marker-btn');
    if (!saveBtn) return;

    saveBtn.addEventListener('click', () => {
      const title = document.getElementById('marker-title').value.trim();
      const description = document.getElementById('marker-description').value.trim();
      const symbolType = document.getElementById('marker-symbol-type').value;

      if (!title) {
        alert('Lūdzu ievadi nosaukumu.');
        return;
      }

      const newMarker = {
        x: Math.round(latlng.lng),
        y: Math.round(latlng.lat),
        title,
        description,
        symbolType
      };

      markersData.push(newMarker);
      renderMarkers();
      map.closePopup(currentPopup);
      currentPopup = null;
    });
  }, 50);
}

function openEditMarkerForm(index) {
  const point = markersData[index];
  if (!point) return;

  if (currentPopup) {
    map.closePopup(currentPopup);
  }

  const symbolType = point.symbolType || 'tele2-bs';

  const popupContent = `
    <div class="editor-form">
      <label>
        Nosaukums:
        <input type="text" id="edit-marker-title" value="${escapeHtml(point.title)}" />
      </label>

      <label>
        Apraksts:
        <textarea id="edit-marker-description">${escapeHtml(point.description)}</textarea>
      </label>

      <label>
        Simbols:
        <select id="edit-marker-symbol-type">
          ${getSymbolOptions(symbolType)}
        </select>
      </label>

      <button id="update-marker-btn">Saglabāt izmaiņas</button>
      <button id="delete-marker-btn" style="background:#d62828;">Dzēst punktu</button>
    </div>
  `;

  currentPopup = L.popup()
    .setLatLng([point.y, point.x])
    .setContent(popupContent)
    .openOn(map);

  setTimeout(() => {
    const updateBtn = document.getElementById('update-marker-btn');
    const deleteBtn = document.getElementById('delete-marker-btn');

    if (updateBtn) {
      updateBtn.addEventListener('click', () => {
        const title = document.getElementById('edit-marker-title').value.trim();
        const description = document.getElementById('edit-marker-description').value.trim();
        const symbolType = document.getElementById('edit-marker-symbol-type').value;

        if (!title) {
          alert('Lūdzu ievadi nosaukumu.');
          return;
        }

        markersData[index] = {
          ...markersData[index],
          title,
          description,
          symbolType
        };

        renderMarkers();
        map.closePopup(currentPopup);
        currentPopup = null;
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        const confirmed = confirm('Vai tiešām dzēst šo punktu?');
        if (!confirmed) return;

        markersData.splice(index, 1);
        renderMarkers();
        map.closePopup(currentPopup);
        currentPopup = null;
      });
    }
  }, 50);
}

fetch(`data/markers.json?v=${Date.now()}`)
  .then(response => response.json())
  .then(points => {
    markersData = points;
    renderMarkers();
  })
  .catch(error => {
    console.error('Kļūda ielādējot punktus:', error);
  });

map.on('click', (e) => {
  openAddMarkerForm(e.latlng);
});

document.getElementById('export-json-btn').addEventListener('click', () => {
  const dataStr = JSON.stringify(markersData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'markers.json';
  a.click();

  URL.revokeObjectURL(url);
});
