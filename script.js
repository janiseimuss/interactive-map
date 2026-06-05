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

fetch(`data/markers.json?v=${Date.now()}`)
  .then(response => response.json())
  .then(points => {
    points.forEach(point => {
      const symbolType = point.symbolType || 'tele2-bs';
      const icon = createSymbolIcon(symbolType);

      L.marker([point.y, point.x], { icon })
        .addTo(map)
        .bindPopup(`
          <b>${point.title}</b><br>
          ${point.description}
        `);
    });
  })
  .catch(error => {
    console.error('Kļūda ielādējot punktus:', error);
  });
