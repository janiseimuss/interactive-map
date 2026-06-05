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

function createIcon(colorClass) {
  return L.divIcon({
    className: '',
    html: `<div class="custom-marker ${colorClass}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}

function clearLeafletMarkers() {
  leafletMarkers.forEach(marker => map.removeLayer(marker));
  leafletMarkers = [];
}

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderMarkers() {
  clearLeafletMarkers();

  markersData.forEach((point, index) => {
    const icon = createIcon(point.icon || 'marker-red');

    const marker = L.marker([point.y, point.x], { icon }).addTo(map);

    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      openEditMarkerForm(index);
    });

    leafletMarkers.push(marker);
  });
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
        Krāsa:
        <select id="marker-icon">
          <option value="marker-red">Sarkans</option>
          <option value="marker-blue">Zils</option>
          <option value="marker-green">Zaļš</option>
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
      const icon = document.getElementById('marker-icon').value;

      if (!title) {
        alert('Lūdzu ievadi nosaukumu.');
        return;
      }

      const newMarker = {
        x: Math.round(latlng.lng),
        y: Math.round(latlng.lat),
        title,
        description,
        icon
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
        Krāsa:
        <select id="edit-marker-icon">
          <option value="marker-red" ${point.icon === 'marker-red' ? 'selected' : ''}>Sarkans</option>
          <option value="marker-blue" ${point.icon === 'marker-blue' ? 'selected' : ''}>Zils</option>
          <option value="marker-green" ${point.icon === 'marker-green' ? 'selected' : ''}>Zaļš</option>
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
        const icon = document.getElementById('edit-marker-icon').value;

        if (!title) {
          alert('Lūdzu ievadi nosaukumu.');
          return;
        }

        markersData[index] = {
          ...markersData[index],
          title,
          description,
          icon
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

fetch('data/markers.json')
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
