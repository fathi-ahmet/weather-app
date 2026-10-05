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
    const sunrise = data.sys && data.sys.sunrise
      ? new Date(data.sys.sunrise * 1000).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })
      : "N/A";
    const sunset = data.sys && data.sys.sunset
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

  const api = {
    buildHourlyForecastData,
    buildWeatherAlertMessage,
    buildWeatherMetrics,
    capitalizeWords,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  global.WeatherAppUtils = api;
})(typeof window !== "undefined" ? window : globalThis);
