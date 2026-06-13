const apikey = "71bc1946236544bb78132d31f191712f";
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const cityInput = document.getElementById("cityInput");
const unitToggle = document.getElementById("unitToggle");

let currentUnits = "metric";
let currentSearchType = "city";
let lastQueryParam = "London";

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
    alert("Please enter a city name first.");
    return;
  }
  currentSearchType = "city";
  lastQueryParam = city;

  localStorage.setItem("weatherSearchType", "city");
  localStorage.setItem("weatherQueryParam", JSON.stringify(city));

  executeWeatherFetchPipeline();
});

cityInput.addEventListener("keydown", (event) => {
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
    (position) => {
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
    (error) => {
      alert(
        "Unable to retrieve your location. Please verify your browser location permissions.",
      );
      locationBtn.innerText = "Use Current Location";
    },
  );
}

async function executeWeatherFetchPipeline() {
  let currentWeatherUrl = "";
  let forecastUrl = "";

  // FIX: Added 'api.' subdomain, proper '/data/2.5/...' paths, and the missing '$' for variables.
  if (currentSearchType === "city") {
    currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${lastQueryParam}&appid=${apikey}&units=${currentUnits}`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${lastQueryParam}&appid=${apikey}&units=${currentUnits}`;
  } else if (currentSearchType === "coords") {
    currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lastQueryParam.lat}&lon=${lastQueryParam.lon}&appid=${apikey}&units=${currentUnits}`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lastQueryParam.lat}&lon=${lastQueryParam.lon}&appid=${apikey}&units=${currentUnits}`;
  }

  try {
    const currentRes = await fetch(currentWeatherUrl);
    const currentData = await currentRes.json();

    if (!currentRes.ok) {
      alert(`Error: ${currentData.message}`);
      return;
    }
    updateCurrentUI(currentData);

    const forecastRes = await fetch(forecastUrl);
    const forecastData = await forecastRes.json();

    if (forecastRes.ok) {
      updateForecastUI(forecastData);
    }
  } catch (error) {
    console.error("Pipeline network error:", error);
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

  // FIX: Added proper icon URL path and missing '$' interpolation
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

  const targetIndexes = [7, 15, 23]; // Roughly 24h, 48h, and 72h out
  const tempUnit = currentUnits === "metric" ? "°C" : "°F";

  targetIndexes.forEach((index) => {
    const item = data.list[index];
    if (!item) return;

    const date = new Date(item.dt * 1000);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

    // FIX: Added proper icon URL path and missing '$' interpolation
    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `
      <h4>${dayName}</h4>
      <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="icon" />
      <p>${Math.round(item.main.temp)}${tempUnit}</p>
    `;
    container.appendChild(card);
  });
}

function capitalizeWords(str) {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
