// API KEY
const GOOGLE_API_KEY = 'AIzaSyDHq7QJIROeH2ZphtL07WQKLWK2Z9ELmZU';

// GET ELEMENTS FROM THE PAGE
const searchBtn = document.getElementById('searchBtn');
const cityInput = document.getElementById('cityInput');
const resultsGrid = document.getElementById('resultsGrid');

let map;
let service;

// THIS RUNS AUTOMATICALLY WHEN GOOGLE MAPS LOADS
function initMap() {
  console.log('Google Maps loaded successfully!');
  const mapDiv = document.getElementById('map');
  map = new google.maps.Map(mapDiv, {
    center: { lat: 34.0522, lng: -118.2437 },
    zoom: 12
  });
  service = new google.maps.places.PlacesService(map);

  // WIRE UP SEARCH BUTTON AFTER MAP IS READY
  searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();

    if (!city) {
      cityInput.style.border = '2px solid red';
      cityInput.placeholder = 'Please enter a city first!';
      return;
    }

    cityInput.style.border = 'none';
    cityInput.placeholder = 'Enter a city, e.g. Los Angeles...';

    resultsGrid.innerHTML = `
      <div class="loading-msg">
        Searching for courts in <strong>${city}</strong>...
      </div>
    `;

    geocodeCity(city);
  });
}

// STEP 1 — GEOCODE CITY TO LAT/LNG
function geocodeCity(city) {
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ address: city }, (results, status) => {
    console.log('Geocode status:', status);
    if (status !== 'OK' || !results[0]) {
      showError('City not found. Please try another city.');
      return;
    }

    const location = results[0].geometry.location;
    console.log(`Found ${city} at: ${location.lat()}, ${location.lng()}`);
    searchCourts(location, city);
  });
}

// STEP 2 — SEARCH FOR TENNIS COURTS
function searchCourts(location, city) {
  const request = {
    location: location,
    radius: 5000,
    keyword: 'tennis court'
  };

  service.nearbySearch(request, (results, status) => {
    console.log('Places status:', status);
    if (status !== google.maps.places.PlacesServiceStatus.OK || !results.length) {
      showError(`No tennis courts found near ${city}. Try a bigger city.`);
      return;
    }

    console.log(`Found ${results.length} courts!`);
    displayCourts(results);
  });

}

// STEP 3 — DISPLAY COURT CARDS
function displayCourts(courts) {
  resultsGrid.innerHTML = '';

  courts.forEach(court => {
    const reviewCount = court.user_ratings_total || 0;
    const isOpen = court.opening_hours?.open_now;
    const openBadge = isOpen
      ? `<span class="badge-open">Open Now</span>`
      : `<span class="badge-closed">Closed</span>`;

    const photo = court.photos
      ? court.photos[0].getUrl({ maxWidth: 400 })
      : 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400';

    const stars = getStars(court.rating);

    const card = `
      <div class="court-card">
        <div class="card-image">
          <img src="${photo}" alt="${court.name}"/>
          <span class="badge-free">Public</span>
        </div>
        <div class="card-body">
          <h3 class="court-name">${court.name}</h3>
          <p class="court-address">${court.vicinity}</p>
          <div class="card-row">
            <div class="stars">${stars}</div>
            <span class="rating-count">(${reviewCount} reviews)</span>
          </div>
          <div class="card-row">
            ${openBadge}
            <span class="surface-tag">Tennis Court</span>
          </div>
        </div>
      </div>
    `;

    resultsGrid.innerHTML += card;
  });
}

// GENERATE STAR RATING
function getStars(rating) {
  if (!rating) return '☆☆☆☆☆';
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

// SHOW ERROR MESSAGE
function showError(message) {
  resultsGrid.innerHTML = `
    <div class="error-msg">${message}</div>
  `;
}