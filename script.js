const apikey = "71bc1946236544bb78132d31f191712f";
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const cityInput = document.getElementById("cityInput");
const unitToggle = document.getElementById("unitToggle");
const statusMessage = document.getElementById("statusMessage");

let currentUnits = "metric";
let currentSearchType = "city";
let lastQueryParam = "London";

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
  if (!isLoading) {
    locationBtn.textContent = "Use Current Location";
  }
}

// Run configuration check when the webpage finishes loading
window.addEventListener("DOMContentLoaded", () => {
  const savedUnits = localStorage.getItem("weatherUnits");
  if (savedUnits === "imperial") {
    unitToggle.checked = true;
    currentUnits = "imperial";
  }

  const savedSearchType = localStorage.getItem("weatherSearchType");
  const savedQueryParam = localStorage.getItem("weatherQueryParam");

  if (savedSearchType && savedQueryParam) {
    currentSearchType = savedSearchType;
    lastQueryParam = JSON.parse(savedQueryParam);
  }

  executeWeatherFetchPipeline();
});

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) {
    setStatus("Please enter a city name first.", "error");
    return;
  }
  currentSearchType = "city";
  lastQueryParam = city;

  localStorage.setItem("weatherSearchType", "city");
  localStorage.setItem("weatherQueryParam", JSON.stringify(city));

  executeWeatherFetchPipeline();
});

cityInput.addEventListener("keydown", event => {
  if (event.key === "Enter") searchBtn.click();
});

locationBtn.addEventListener("click", getUserLocation);

unitToggle.addEventListener("change", () => {
  currentUnits = unitToggle.checked ? "imperial" : "metric";
  localStorage.setItem("weatherUnits", currentUnits);
  executeWeatherFetchPipeline();
});

function getUserLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

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
        "Unable to retrieve your location. Please verify your browser location permissions and try again.",
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

  if (currentSearchType === "city") {
    currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${lastQueryParam}&appid=${apikey}&units=${currentUnits}`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${lastQueryParam}&appid=${apikey}&units=${currentUnits}`;
  } else if (currentSearchType === "coords") {
    currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lastQueryParam.lat}&lon=${lastQueryParam.lon}&appid=${apikey}&units=${currentUnits}`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lastQueryParam.lat}&lon=${lastQueryParam.lon}&appid=${apikey}&units=${currentUnits}`;
  }

  if (!currentWeatherUrl) {
    setStatus("Weather request is missing location information.", "error");
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
      setLoadingState(false);
      return;
    }

    updateCurrentUI(currentData);
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
    setStatus(
      "Unable to fetch weather data right now. Please check your internet connection and try again.",
      "error",
    );
  } finally {
    setLoadingState(false);
  }
}

function updateCurrentUI(data) {
  const tempVal = Math.round(data.main.temp);
  const windVal = data.wind.speed;
  const tempUnit = currentUnits === "metric" ? "°C" : "°F";
  const windUnit = currentUnits === "metric" ? "m/s" : "mph";
  const formattedDescription = capitalizeWords(data.weather[0].description);

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
  document.body.className = celsiusTemp >= 20 ? "hot" : "cold";
}

function updateForecastUI(data) {
  const container = document.getElementById("forecastContainer");
  container.innerHTML = "";

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
