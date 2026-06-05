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

function createIcon(colorClass) {
  return L.divIcon({
    className: '',
    html: `<div class="custom-marker ${colorClass}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}

fetch(`data/markers.json?v=${Date.now()}`)
  .then(response => response.json())
  .then(points => {
    points.forEach(point => {
      const icon = createIcon(point.icon || 'marker-red');

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
