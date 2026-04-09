// API KEY
const GOOGLE_API_KEY = 'AIzaSyDHq7QJIROeH2ZphtL07WQKLWK2Z9ELmZU';

// GET ELEMENTS FROM THE PAGE
const searchBtn = document.getElementById('searchBtn');
const cityInput = document.getElementById('cityInput');
const resultsGrid = document.getElementById('resultsGrid');

// WHEN SEARCH BUTTON IS CLICKED
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();

  // IF INPUT IS EMPTY SHOW ERROR
  if (!city) {
    cityInput.style.border = '2px solid red';
    cityInput.placeholder = 'Please enter a city first!';
    return;
  }

  // RESET INPUT STYLE
  cityInput.style.border = 'none';
  cityInput.placeholder = 'Enter a city, e.g. Los Angeles...';

  // SHOW LOADING STATE
  resultsGrid.innerHTML = `
    <div class="loading-msg">
      Searching for courts in <strong>${city}</strong>...
    </div>
  `;

  // STEP 1 — CONVERT CITY NAME TO LAT/LNG
  geocodeCity(city);
});

// GEOCODE FUNCTION — TURNS CITY NAME INTO LAT/LNG
async function geocodeCity(city) {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${GOOGLE_API_KEY}`
    );
    const data = await response.json();

    if (data.status !== 'OK') {
      showError('City not found. Please try another city.');
      return;
    }

    const lat = data.results[0].geometry.location.lat;
    const lng = data.results[0].geometry.location.lng;

    console.log(`Found ${city} at: ${lat}, ${lng}`);

    // STEP 2 — SEARCH FOR TENNIS COURTS NEAR THAT LOCATION
    searchCourts(lat, lng, city);

  } catch (error) {
    showError('Something went wrong. Please try again.');
  }
}

// SEARCH COURTS FUNCTION
async function searchCourts(lat, lng, city) {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=tennis_court&key=${GOOGLE_API_KEY}`
    );
    const data = await response.json();

    if (data.results.length === 0) {
      showError(`No tennis courts found near ${city}. Try a bigger city.`);
      return;
    }

    console.log(`Found ${data.results.length} courts!`);
    displayCourts(data.results);

  } catch (error) {
    showError('Something went wrong. Please try again.');
  }
}

// DISPLAY COURTS FUNCTION
function displayCourts(courts) {
  resultsGrid.innerHTML = '';

  courts.forEach(court => {
    const rating = court.rating || 'N/A';
    const reviewCount = court.user_ratings_total || 0;
    const isOpen = court.opening_hours?.open_now;
    const openBadge = isOpen
      ? `<span class="badge-open">Open Now</span>`
      : `<span class="badge-closed">Closed</span>`;

    const photo = court.photos
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${court.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
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