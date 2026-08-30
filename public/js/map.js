const lat = listingGeometry[1];
const lng = listingGeometry[0];
const map = L.map('map').setView([lat, lng], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const marker = L.marker([lat, lng]).addTo(map);

marker.bindPopup(`<h4>${listingLocation}</h4><p>Exact location provided after booking.</p>`).openPopup();