const apikey = window.WEATHER_APP_CONFIG?.apiKey || "";
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const cityInput = document.getElementById("cityInput");
const unitToggle = document.getElementById("unitToggle");
const statusMessage = document.getElementById("statusMessage");
const searchSuggestions = document.getElementById("searchSuggestions");
const favoriteBtn = document.getElementById("favoriteBtn");
const favoritesContainer = document.getElementById("favoritesContainer");
const themeToggle = document.getElementById("themeToggle");

const popularCities = [
  "London",
  "New York",
  "Tokyo",
  "Paris",
  "Dubai",
  "Sydney",
  "Rome",
  "Toronto",
  "Berlin",
  "Singapore",
];

let currentUnits = "metric";
let currentSearchType = "city";
let lastQueryParam = "London";
let currentLoadedCity = "";
let currentTheme = localStorage.getItem("weatherTheme") || "light";

function setStatus(message, type = "info") {
  if (!statusMessage) return;

  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
}

function setLoadingState(isLoading) {
  if (!searchBtn || !locationBtn) return;

  searchBtn.disabled = isLoading;
  locationBtn.disabled = isLoading;
  searchBtn.textContent = isLoading ? "Searching..." : "Search";
  cityInput.disabled = isLoading;

  if (!isLoading) {
    locationBtn.textContent = "Use Current Location";
  }
}

function normalizeCityQuery(value) {
  return value.trim().replace(/\s+/g, " ");
}

function getEncodedCityQuery() {
  return encodeURIComponent(normalizeCityQuery(lastQueryParam));
}

function getRecentCities() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("weatherRecentCities") || "[]",
    );
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function saveRecentCity(city) {
  const cleanedCity = normalizeCityQuery(city);
  if (!cleanedCity) return;

  const recent = getRecentCities();
  const updated = [
    cleanedCity,
    ...recent.filter(item => item.toLowerCase() !== cleanedCity.toLowerCase()),
  ].slice(0, 6);
  localStorage.setItem("weatherRecentCities", JSON.stringify(updated));
  renderSearchSuggestions();
}

function renderSearchSuggestions() {
  if (!searchSuggestions) return;

  const query = normalizeCityQuery(cityInput.value).toLowerCase();
  const recentCities = getRecentCities();
  const suggestedCities = query
    ? [...recentCities, ...popularCities]
        .filter((city, index, array) => {
          const normalizedCity = city.toLowerCase();
          return (
            normalizedCity.includes(query) && array.indexOf(city) === index
          );
        })
        .slice(0, 6)
    : [...recentCities, ...popularCities].slice(0, 6);

  if (!suggestedCities.length) {
    searchSuggestions.innerHTML = "";
    return;
  }

  searchSuggestions.innerHTML = suggestedCities
    .map(
      city => `
        <button class="search-suggestion" type="button" data-city="${city}">
          ${city}
        </button>
      `,
    )
    .join("");

  searchSuggestions.querySelectorAll(".search-suggestion").forEach(button => {
    button.addEventListener("click", () => {
      const selectedCity = button.dataset.city;
      cityInput.value = selectedCity;
      handleCitySearch(selectedCity);
    });
  });
}

function getFavoriteCities() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("weatherFavoriteCities") || "[]",
    );
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function updateFavoriteButtonState() {
  if (!favoriteBtn) return;

  const isFavorite = currentLoadedCity
    ? getFavoriteCities().some(
        city => city.toLowerCase() === currentLoadedCity.toLowerCase(),
      )
    : false;

  favoriteBtn.disabled = !currentLoadedCity;
  favoriteBtn.classList.toggle("active", isFavorite);
  favoriteBtn.setAttribute("aria-pressed", String(isFavorite));
  favoriteBtn.textContent = isFavorite ? "★ Saved" : "☆ Save City";
}

function renderFavoriteCities() {
  if (!favoritesContainer) return;

  const favorites = getFavoriteCities();
  if (!favorites.length) {
    favoritesContainer.innerHTML = "";
    return;
  }

  favoritesContainer.innerHTML = favorites
    .map(
      city => `
        <button class="favorite-item" type="button" data-city="${city}">
          ${city}
        </button>
      `,
    )
    .join("");

  favoritesContainer.querySelectorAll(".favorite-item").forEach(button => {
    button.addEventListener("click", () => {
      const selectedCity = button.dataset.city;
      cityInput.value = selectedCity;
      handleCitySearch(selectedCity);
    });
  });
}

function toggleFavoriteCity() {
  if (!currentLoadedCity) return;

  const favorites = getFavoriteCities();
  const normalizedCurrent = normalizeCityQuery(currentLoadedCity);
  const isFavorite = favorites.some(
    city => city.toLowerCase() === normalizedCurrent.toLowerCase(),
  );

  const updatedFavorites = isFavorite
    ? favorites.filter(
        city => city.toLowerCase() !== normalizedCurrent.toLowerCase(),
      )
    : [normalizedCurrent, ...favorites].slice(0, 6);

  localStorage.setItem(
    "weatherFavoriteCities",
    JSON.stringify(updatedFavorites),
  );
  renderFavoriteCities();
  updateFavoriteButtonState();
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  if (themeToggle) {
    themeToggle.checked = isDark;
  }
  localStorage.setItem("weatherTheme", theme);
}

function applyWeatherBackground(tempCelsius) {
  const isHot = tempCelsius >= 20;
  document.body.classList.toggle("hot", isHot);
  document.body.classList.toggle("cold", !isHot);
}

function handleCitySearch(forceCity) {
  const city = normalizeCityQuery(forceCity || cityInput.value);
  if (!city) {
    setStatus("Please enter a city name first.", "error");
    cityInput.focus();
    return;
  }

  currentSearchType = "city";
  lastQueryParam = city;
  cityInput.value = city;

  localStorage.setItem("weatherSearchType", "city");
  localStorage.setItem("weatherQueryParam", JSON.stringify(city));
  saveRecentCity(city);

  executeWeatherFetchPipeline();
}

// Run configuration check when the webpage finishes loading
window.addEventListener("DOMContentLoaded", () => {
  const savedUnits = localStorage.getItem("weatherUnits");
  if (savedUnits === "imperial") {
    unitToggle.checked = true;
    currentUnits = "imperial";
  }

  const savedTheme = localStorage.getItem("weatherTheme") || "light";
  currentTheme = savedTheme;
  applyTheme(currentTheme);

  const savedSearchType = localStorage.getItem("weatherSearchType");
  const savedQueryParam = localStorage.getItem("weatherQueryParam");

  if (savedSearchType && savedQueryParam) {
    currentSearchType = savedSearchType;
    lastQueryParam = JSON.parse(savedQueryParam);

    if (currentSearchType === "city" && typeof lastQueryParam === "string") {
      cityInput.value = lastQueryParam;
    }
  }

  renderFavoriteCities();
  renderSearchSuggestions();
  executeWeatherFetchPipeline();
});

searchBtn.addEventListener("click", () => handleCitySearch());

favoriteBtn.addEventListener("click", toggleFavoriteCity);

themeToggle.addEventListener("change", () => {
  applyTheme(themeToggle.checked ? "dark" : "light");
});

cityInput.addEventListener("input", () => {
  renderSearchSuggestions();
});

cityInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleCitySearch();
  }
});

locationBtn.addEventListener("click", getUserLocation);

unitToggle.addEventListener("change", () => {
  currentUnits = unitToggle.checked ? "imperial" : "metric";
  localStorage.setItem("weatherUnits", currentUnits);
  executeWeatherFetchPipeline();
});

function getUserLocation() {
  if (!navigator.geolocation) {
    setStatus("Geolocation is not supported by this browser.", "error");
    return;
  }

  setLoadingState(true);
  locationBtn.innerText = "Locating...";
  navigator.geolocation.getCurrentPosition(
    position => {
      const coords = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      };

      currentSearchType = "coords";
      lastQueryParam = coords;

      localStorage.setItem("weatherSearchType", "coords");
      localStorage.setItem("weatherQueryParam", JSON.stringify(coords));

      executeWeatherFetchPipeline();
      locationBtn.innerText = "Use Current Location";
    },
    error => {
      console.error("Geolocation error:", error);
      setStatus(
        error.code === 1
          ? "Location access was denied. Please allow access and try again."
          : "Unable to retrieve your location. Please check your connection or device settings and try again.",
        "error",
      );
      locationBtn.innerText = "Use Current Location";
      setLoadingState(false);
    },
  );
}

async function executeWeatherFetchPipeline() {
  let currentWeatherUrl = "";
  let forecastUrl = "";

  if (!apikey) {
    setStatus(
      "Weather API key is missing. Add your OpenWeatherMap key in config.js before loading the app.",
      "error",
    );
    return;
  }

  if (currentSearchType === "city") {
    const cityQuery = getEncodedCityQuery();
    currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityQuery}&appid=${apikey}&units=${currentUnits}`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cityQuery}&appid=${apikey}&units=${currentUnits}`;
  } else if (currentSearchType === "coords") {
    const lat = Number(lastQueryParam.lat);
    const lon = Number(lastQueryParam.lon);
    currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apikey}&units=${currentUnits}`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apikey}&units=${currentUnits}`;
  }

  if (!currentWeatherUrl) {
    setStatus("Weather request is missing location information.", "error");
    resetWeatherResultState();
    const forecastContainer = document.getElementById("forecastContainer");
    if (forecastContainer) {
      forecastContainer.innerHTML =
        "Forecast will appear here after a successful search.";
      forecastContainer.classList.add("forecast-empty");
    }
    return;
  }

  setLoadingState(true);
  setStatus("Loading weather data...", "info");

  try {
    const currentRes = await fetch(currentWeatherUrl);
    const currentData = await currentRes.json();

    if (!currentRes.ok) {
      setStatus(
        `Unable to find weather for "${lastQueryParam}". Please try a different city.`,
        "error",
      );
      resetWeatherResultState();
      const forecastContainer = document.getElementById("forecastContainer");
      if (forecastContainer) {
        forecastContainer.innerHTML =
          "Forecast will appear here after a successful search.";
        forecastContainer.classList.add("forecast-empty");
      }
      setLoadingState(false);
      return;
    }

    updateCurrentUI(currentData);
    saveRecentCity(currentData.name);
    setStatus(
      `Weather for ${currentData.name} loaded successfully.`,
      "success",
    );

    const forecastRes = await fetch(forecastUrl);
    const forecastData = await forecastRes.json();

    if (forecastRes.ok) {
      updateForecastUI(forecastData);
    } else {
      setStatus(
        "Current weather is available, but the forecast could not be loaded right now.",
        "info",
      );
    }
  } catch (error) {
    console.error("Pipeline network error:", error);
    resetWeatherResultState();
    const forecastContainer = document.getElementById("forecastContainer");
    if (forecastContainer) {
      forecastContainer.innerHTML =
        "Forecast will appear here after a successful search.";
      forecastContainer.classList.add("forecast-empty");
    }
    setStatus(
      "Unable to fetch weather data right now. Please check your internet connection and try again.",
      "error",
    );
  } finally {
    setLoadingState(false);
  }
}

function resetWeatherResultState() {
  const weatherResult = document.getElementById("weatherResult");
  const city = document.getElementById("city");
  const temp = document.getElementById("temp");
  const condition = document.getElementById("condition");
  const humidity = document.getElementById("humidity");
  const wind = document.getElementById("wind");
  const icon = document.getElementById("weatherIcon");

  if (weatherResult) {
    weatherResult.classList.add("empty-state");
  }

  currentLoadedCity = "";
  city.textContent = "No city selected";
  temp.textContent = "Search for a city to see the weather.";
  condition.textContent = "";
  humidity.textContent = "";
  wind.textContent = "";

  if (favoriteBtn) {
    favoriteBtn.disabled = true;
    favoriteBtn.classList.remove("active");
    favoriteBtn.textContent = "☆ Save City";
    favoriteBtn.setAttribute("aria-pressed", "false");
  }

  if (icon) {
    icon.style.display = "none";
    icon.src = "";
    icon.alt = "";
  }
}

function updateCurrentUI(data) {
  const tempVal = Math.round(data.main.temp);
  const windVal = data.wind.speed;
  const tempUnit = currentUnits === "metric" ? "°C" : "°F";
  const windUnit = currentUnits === "metric" ? "m/s" : "mph";
  const formattedDescription = capitalizeWords(data.weather[0].description);
  const weatherResult = document.getElementById("weatherResult");

  weatherResult.classList.remove("empty-state");
  currentLoadedCity = data.name;

  document.getElementById("city").innerText = data.name;
  document.getElementById("temp").innerText = `${tempVal}${tempUnit}`;
  document.getElementById("condition").innerText =
    `Condition: ${formattedDescription}`;
  document.getElementById("humidity").innerText =
    `Humidity: ${data.main.humidity}%`;
  document.getElementById("wind").innerText =
    `Wind Speed: ${windVal} ${windUnit}`;

  const iconImg = document.getElementById("weatherIcon");
  iconImg.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  iconImg.alt = formattedDescription;
  iconImg.style.display = "block";

  // Use Celsius equivalent for the theme switcher breakpoint (20°C)
  const celsiusTemp =
    currentUnits === "metric" ? tempVal : ((tempVal - 32) * 5) / 9;
  applyWeatherBackground(celsiusTemp);
  updateFavoriteButtonState();
}

function updateForecastUI(data) {
  const container = document.getElementById("forecastContainer");
  container.innerHTML = "";
  container.classList.remove("forecast-empty");

  const tempUnit = currentUnits === "metric" ? "°C" : "°F";
  const dailyMap = new Map();

  data.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toDateString();

    if (!dailyMap.has(dayKey)) {
      dailyMap.set(dayKey, {
        date,
        tempMin: item.main.temp,
        tempMax: item.main.temp,
        humidity: item.main.humidity,
        condition: item.weather[0].description,
        icon: item.weather[0].icon,
      });
      return;
    }

    const dayData = dailyMap.get(dayKey);
    dayData.tempMin = Math.min(dayData.tempMin, item.main.temp);
    dayData.tempMax = Math.max(dayData.tempMax, item.main.temp);
    dayData.humidity = Math.round((dayData.humidity + item.main.humidity) / 2);
    dayData.condition = item.weather[0].description;
    dayData.icon = item.weather[0].icon;
  });

  const dailyEntries = Array.from(dailyMap.values()).slice(0, 5);

  const title = document.createElement("h3");
  title.className = "forecast-title";
  title.textContent = "5-Day Forecast";
  container.appendChild(title);

  const grid = document.createElement("div");
  grid.className = "forecast-grid";

  dailyEntries.forEach(day => {
    const card = document.createElement("div");
    card.className = "forecast-card";

    const dayName = day.date.toLocaleDateString("en-US", { weekday: "short" });
    const dateLabel = day.date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const tempLow = Math.round(day.tempMin);
    const tempHigh = Math.round(day.tempMax);
    const description = capitalizeWords(day.condition);

    card.innerHTML = `
      <h4>${dayName}</h4>
      <p class="forecast-date">${dateLabel}</p>
      <img src="https://openweathermap.org/img/wn/${day.icon}.png" alt="${description}" />
      <p class="forecast-range">${tempLow}${tempUnit} / ${tempHigh}${tempUnit}</p>
      <p class="forecast-condition">${description}</p>
      <p class="forecast-humidity">Humidity: ${day.humidity}%</p>
    `;

    grid.appendChild(card);
  });

  container.appendChild(grid);
}

function capitalizeWords(str) {
  return str
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
