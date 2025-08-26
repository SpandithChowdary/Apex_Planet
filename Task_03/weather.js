
const API_KEY = "65bc6363ece6db83d1ed883533d6167c";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// DOM Elements
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const errorMessage = document.getElementById("errorMessage");
const homeLink = document.getElementById("homeLink");
const forecastLink = document.getElementById("forecastLink");
const mapLink = document.getElementById("mapLink");
const currentWeatherSection = document.getElementById("currentWeatherSection");
const hourlyForecastSection = document.getElementById("hourlyForecastSection");
const dailyForecastSection = document.getElementById("dailyForecastSection");
const mapSection = document.getElementById("mapSection");

// State
let weatherChart = null;
let currentLocation = "Tirupati";
let weatherMap = null;

// Initialize the app
document.addEventListener("DOMContentLoaded", function () {
  updateDateTime();
  setInterval(updateDateTime, 60000);
  fetchWeatherData(currentLocation);

  // Set up event listeners
  searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") handleSearch();
  });

  // Navigation links
  homeLink.addEventListener("click", function (e) {
    e.preventDefault();
    showHomeView();
  });

  forecastLink.addEventListener("click", function (e) {
    e.preventDefault();
    showForecastView();
  });

  mapLink.addEventListener("click", function (e) {
    e.preventDefault();
    showMapView();
  });

  setTimeout(hideLoading, 1000);
});

function showHomeView() {
  homeLink.classList.add("active");
  forecastLink.classList.remove("active");
  mapLink.classList.remove("active");

  currentWeatherSection.style.display = "block";
  hourlyForecastSection.style.display = "none";
  dailyForecastSection.style.display = "none";
  mapSection.style.display = "none";
}

// Show forecast view (hourly and daily)
function showForecastView() {
  // Update active nav link
  homeLink.classList.remove("active");
  forecastLink.classList.add("active");
  mapLink.classList.remove("active");

  // Show/hide sections
  currentWeatherSection.style.display = "none";
  hourlyForecastSection.style.display = "block";
  dailyForecastSection.style.display = "block";
  mapSection.style.display = "none";
}

// Show map view
function showMapView() {
  // Update active nav link
  homeLink.classList.remove("active");
  forecastLink.classList.remove("active");
  mapLink.classList.add("active");

  // Show/hide sections
  currentWeatherSection.style.display = "none";
  hourlyForecastSection.style.display = "none";
  dailyForecastSection.style.display = "none";
  mapSection.style.display = "block";

  // Initialize map if not already done
  if (!weatherMap) {
    initWeatherMap();
  }
}

let locationMarker = null;
function initWeatherMap() {
  weatherMap = L.map("weatherMap").setView([13.6288, 79.4192], 10); // Default to Tirupati coordinates

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(weatherMap);

  // Add initial marker
  locationMarker = L.marker([13.6288, 79.4192])
    .addTo(weatherMap)
    .bindPopup("Current Location");
}

document
  .getElementById("darkModeToggle")
  .addEventListener("click", function () {
    document.body.classList.toggle("dark");
    const icon = this.querySelector("i");
    if (document.body.classList.contains("dark")) {
      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");
    } else {
      icon.classList.remove("fa-sun");
      icon.classList.add("fa-moon");
    }

    // Re-render chart with appropriate theme colors
    if (weatherChart) {
      renderHourlyChart(
        weatherChart.data.labels,
        weatherChart.data.datasets[0].data
      );
    }
  });

// Update date and time
function updateDateTime() {
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  document.getElementById("dateTime").textContent =
    now.toLocaleDateString("en-US", options);
}

// Handle search
function handleSearch() {
  const location = searchInput.value.trim();
  if (location) {
    currentLocation = location;
    showLoading();
    fetchWeatherData(location);
  }
}

// Fetch all weather data
async function fetchWeatherData(location) {
  try {
    // Fetch current weather
    const currentWeather = await fetch(
      `${BASE_URL}/weather?q=${location}&units=metric&appid=${API_KEY}`
    );
    const currentData = await currentWeather.json();

    if (currentData.cod !== 200) {
      throw new Error(
        currentData.message || "Failed to fetch weather data"
      );
    }

    // Fetch 5-day forecast (3-hour intervals)
    const forecastResponse = await fetch(
      `${BASE_URL}/forecast?q=${location}&units=metric&appid=${API_KEY}`
    );
    const forecastData = await forecastResponse.json();

    if (forecastData.cod !== "200") {
      throw new Error(
        forecastData.message || "Failed to fetch forecast data"
      );
    }

    // Process and display data
    displayCurrentWeather(currentData);
    processHourlyForecast(forecastData);
    processDailyForecast(forecastData);

    // Update map if it's visible
    if (mapSection.style.display === "block") {
      // Initialize map if not already done
      if (!weatherMap) {
        initWeatherMap();
      }

      // Set view to new location
      weatherMap.setView(
        [currentData.coord.lat, currentData.coord.lon],
        10
      );

      // Remove existing marker if it exists
      if (locationMarker) {
        weatherMap.removeLayer(locationMarker);
      }

      // Add new marker with custom icon
      const customIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png", // Custom marker icon
        iconSize: [25, 40], // Size of the icon
        iconAnchor: [16, 32], // Point of the icon which will correspond to marker's location
        popupAnchor: [0, -32], // Point from which the popup should open relative to the iconAnchor
      });

      locationMarker = L.marker(
        [currentData.coord.lat, currentData.coord.lon],
        {
          icon: customIcon,
        }
      )
        .addTo(weatherMap)
        .bindPopup(
          `
          <b>${currentData.name}, ${currentData.sys.country}</b><br>
          Temp: ${Math.round(currentData.main.temp)}°C<br>
          ${currentData.weather[0].description}
        `
        )
        .openPopup();
    }

    hideError();
  } catch (error) {
    showError(error.message);
  } finally {
    hideLoading();
  }
}

// Display current weather
function displayCurrentWeather(data) {
  document.getElementById(
    "location"
  ).textContent = `${data.name}, ${data.sys.country}`;
  document.getElementById("temperature").textContent = `${Math.round(
    data.main.temp
  )}°C`;
  document.getElementById("condition").textContent = data.weather[0].main;

  // Weather icon
  const iconCode = data.weather[0].icon;
  document.getElementById(
    "weatherIcon"
  ).src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  document.getElementById("weatherIcon").alt =
    data.weather[0].description;

  // Weather details
  document.getElementById(
    "humidity"
  ).textContent = `${data.main.humidity}%`;
  document.getElementById("wind").textContent = `${(
    data.wind.speed * 3.6
  ).toFixed(1)} km/h`;
  document.getElementById("visibility").textContent = `${(
    data.visibility / 1000
  ).toFixed(1)} km`;

  // UV index (not available in basic API - would need One Call API for this)
  document.getElementById("uv").textContent = "--";
}

// Process hourly forecast data
function processHourlyForecast(data) {
  const hourlyData = data.list.slice(0, 8); // Next 24 hours (3-hour intervals)

  // Prepare data for chart
  const labels = [];
  const temperatures = [];

  // Clear previous hourly cards
  const hourlyContainer = document.getElementById(
    "hourlyForecastContainer"
  );
  hourlyContainer.innerHTML = "";

  // Process each hour
  hourlyData.forEach((hour) => {
    const time = new Date(hour.dt * 1000);
    const hours = time.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const timeString = `${displayHours} ${ampm}`;

    labels.push(timeString);
    temperatures.push(Math.round(hour.main.temp));

    // Create hourly card
    const card = document.createElement("div");
    card.className = "hourly-card glass";
    card.innerHTML = `
            <div class="hourly-time">${timeString}</div>
            <img src="https://openweathermap.org/img/wn/${hour.weather[0].icon
      }.png" 
                 alt="${hour.weather[0].description}" class="hourly-icon">
            <div class="hourly-temp">${Math.round(hour.main.temp)}°</div>
          `;
    hourlyContainer.appendChild(card);
  });

  // Render chart
  renderHourlyChart(labels, temperatures);
}

// Render hourly chart
function renderHourlyChart(labels, data) {
  const ctx = document.getElementById("hourlyChart").getContext("2d");

  // Destroy previous chart if exists
  if (weatherChart) {
    weatherChart.destroy();
  }

  // Determine theme colors
  const isDark = document.body.classList.contains("dark");
  const bgColor = isDark
    ? "rgba(67, 97, 238, 0.2)"
    : "rgba(67, 97, 238, 0.1)";
  const borderColor = isDark
    ? "rgba(76, 201, 240, 1)"
    : "rgba(67, 97, 238, 1)";
  const textColor = isDark ? "#f0f0f0" : "#1a1a2e";

  // Create new chart
  weatherChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Temperature (°C)",
          data: data,
          backgroundColor: bgColor,
          borderColor: borderColor,
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: borderColor,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: textColor,
            font: {
              family: "'Inter', sans-serif",
            },
          },
        },
        tooltip: {
          backgroundColor: isDark ? "#1a1a2e" : "#f8f9fa",
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: borderColor,
          borderWidth: 1,
          padding: 12,
          usePointStyle: true,
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.raw}°C`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          },
          ticks: {
            color: textColor,
            font: {
              family: "'Inter', sans-serif",
            },
          },
        },
        y: {
          grid: {
            color: isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          },
          ticks: {
            color: textColor,
            font: {
              family: "'Inter', sans-serif",
            },
            callback: function (value) {
              return `${value}°`;
            },
          },
        },
      },
    },
  });
}

// Process daily forecast data
function processDailyForecast(data) {
  // Group by day (OpenWeatherMap's 5-day forecast is in 3-hour intervals)
  const dailyData = {};

  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dateString = date.toLocaleDateString("en-US", {
      weekday: "short",
    });

    if (!dailyData[dateString]) {
      dailyData[dateString] = {
        temps: [],
        icons: [],
        descriptions: [],
      };
    }

    dailyData[dateString].temps.push(item.main.temp);
    dailyData[dateString].icons.push(item.weather[0].icon);
    dailyData[dateString].descriptions.push(item.weather[0].description);
  });

  // Get the days in order (today + next 6 days)
  const days = Object.keys(dailyData).slice(0, 7);

  // Clear previous daily cards
  const dailyContainer = document.getElementById(
    "dailyForecastContainer"
  );
  dailyContainer.innerHTML = "";

  // Create cards for each day
  days.forEach((day) => {
    const dayData = dailyData[day];
    const avgTemp =
      dayData.temps.reduce((a, b) => a + b, 0) / dayData.temps.length;
    const maxTemp = Math.max(...dayData.temps);
    const minTemp = Math.min(...dayData.temps);

    // Use the most frequent icon or first one
    const icon = mode(dayData.icons) || dayData.icons[0];
    const description =
      mode(dayData.descriptions) || dayData.descriptions[0];

    const card = document.createElement("div");
    card.className = "forecast-card glass";
    card.innerHTML = `
            <div class="forecast-day">${day}</div>
            <img src="https://openweathermap.org/img/wn/${icon}.png" 
                 alt="${description}" class="forecast-icon">
            <div class="forecast-temp">
              <span class="high-temp">${Math.round(maxTemp)}°</span>
              <span class="low-temp">${Math.round(minTemp)}°</span>
            </div>
          `;
    dailyContainer.appendChild(card);
  });
}

// Helper function to find mode (most frequent value) in array
function mode(array) {
  if (array.length === 0) return null;

  const frequency = {};
  let maxCount = 0;
  let modeValue = array[0];

  array.forEach((value) => {
    frequency[value] = (frequency[value] || 0) + 1;
    if (frequency[value] > maxCount) {
      maxCount = frequency[value];
      modeValue = value;
    }
  });

  return modeValue;
}

// Loading state functions
function showLoading() {
  document.querySelector(".loading").style.display = "flex";
  document.querySelector(".loading").style.opacity = "1";
}

function hideLoading() {
  document.querySelector(".loading").style.opacity = "0";
  setTimeout(() => {
    document.querySelector(".loading").style.display = "none";
  }, 300);
}

// Error handling
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
}

function hideError() {
  errorMessage.style.display = "none";
}