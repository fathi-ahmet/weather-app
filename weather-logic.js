(function (global) {
  function capitalizeWords(value) {
    if (!value) return "";
    return value
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function buildHourlyForecastData(data, limit = 8, units = "metric") {
    if (!data || !Array.isArray(data.list) || !data.list.length) {
      return [];
    }

    const hourlyEntries = data.list.slice(0, Math.max(1, Number(limit) || 8));

    return hourlyEntries.map((item, index) => {
      const date = new Date(item.dt * 1000);
      const condition =
        item.weather && item.weather[0]
          ? capitalizeWords(item.weather[0].description)
          : "Weather";

      return {
        hourLabel:
          index === 0
            ? "Now"
            : date.toLocaleTimeString("en-US", {
                hour: "numeric",
              }),
        temperature: Math.round(item.main?.temp ?? 0),
        humidity: Math.round(item.main?.humidity ?? 0),
        condition,
        icon: item.weather && item.weather[0] ? item.weather[0].icon : "",
        rainChance: Math.round((item.pop ?? 0) * 100),
        units,
      };
    });
  }

  function buildWeatherMetrics(data, units = "metric") {
    if (!data || !data.main) {
      return [];
    }

    const tempUnit = units === "metric" ? "C" : "F";
    const visibilityKm = data.visibility
      ? Number((data.visibility / 1000).toFixed(1))
      : 0;
    const sunrise =
      data.sys && data.sys.sunrise
        ? new Date(data.sys.sunrise * 1000).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })
        : "N/A";
    const sunset =
      data.sys && data.sys.sunset
        ? new Date(data.sys.sunset * 1000).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })
        : "N/A";

    return [
      {
        label: "Feels like",
        value: `${Math.round(data.main.feels_like ?? data.main.temp ?? 0)}°${tempUnit}`,
      },
      { label: "Pressure", value: `${data.main.pressure ?? 0} hPa` },
      { label: "Visibility", value: `${visibilityKm} km` },
      { label: "Sunrise", value: sunrise },
      { label: "Sunset", value: sunset },
    ];
  }

  function buildWeatherAlertMessage(description) {
    if (!description) return "";

    const normalized = description.toLowerCase();
    const severeKeywords = [
      "thunderstorm",
      "storm",
      "rain",
      "snow",
      "hail",
      "fog",
      "mist",
      "haze",
      "smoke",
      "dust",
      "ash",
      "squall",
      "sand",
      "wind",
      "tornado",
      "cyclone",
      "hurricane",
      "blizzard",
    ];

    const match = severeKeywords.find(keyword => normalized.includes(keyword));
    if (!match) return "";

    return `Weather alert: ${capitalizeWords(description)} may affect travel or outdoor plans.`;
  }

  function buildAirQualityInfo(data) {
    const item = data && Array.isArray(data.list) ? data.list[0] : null;
    const aqi = Number(item?.main?.aqi ?? 0);
    const categories = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];

    const category = categories[Math.max(0, Math.min(4, aqi - 1))] ?? "Good";
    const components = item?.components || {};

    return {
      label: "Air Quality",
      category,
      aqi,
      pm25: `${Number(components.pm2_5 ?? 0).toFixed(1)} µg/m³`,
      o3: `${Number(components.o3 ?? 0).toFixed(1)} µg/m³`,
    };
  }

  function formatCityDateTime(data) {
    if (!data || typeof data.dt !== "number") {
      return { date: "N/A", time: "N/A" };
    }

    const timezoneOffsetSeconds = Number(data.timezone) || 0;
    const cityDate = new Date((data.dt + timezoneOffsetSeconds) * 1000);

    const date = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(cityDate);

    const time = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(cityDate);

    return { date, time };
  }

  const api = {
    buildAirQualityInfo,
    buildHourlyForecastData,
    buildWeatherAlertMessage,
    buildWeatherMetrics,
    capitalizeWords,
    formatCityDateTime,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  global.WeatherAppUtils = api;
})(typeof window !== "undefined" ? window : globalThis);
