const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildHourlyForecastData,
  buildWeatherAlertMessage,
  buildWeatherMetrics,
} = require("./weather-logic.js");

test("buildHourlyForecastData keeps the next 8 hourly entries and normalizes values", () => {
  const result = buildHourlyForecastData(
    {
      list: [
        {
          dt: 1700000000,
          main: { temp: 18, humidity: 60 },
          weather: [{ description: "light rain", icon: "10d" }],
        },
        {
          dt: 1700003600,
          main: { temp: 20, humidity: 65 },
          weather: [{ description: "clear sky", icon: "01d" }],
        },
        {
          dt: 1700007200,
          main: { temp: 21, humidity: 70 },
          weather: [{ description: "broken clouds", icon: "04d" }],
        },
        {
          dt: 1700010800,
          main: { temp: 22, humidity: 62 },
          weather: [{ description: "few clouds", icon: "02d" }],
        },
        {
          dt: 1700014400,
          main: { temp: 24, humidity: 58 },
          weather: [{ description: "clear sky", icon: "01d" }],
        },
        {
          dt: 1700018000,
          main: { temp: 23, humidity: 55 },
          weather: [{ description: "sunny", icon: "01d" }],
        },
        {
          dt: 1700021600,
          main: { temp: 25, humidity: 52 },
          weather: [{ description: "clear sky", icon: "01d" }],
        },
        {
          dt: 1700025200,
          main: { temp: 26, humidity: 50 },
          weather: [{ description: "clear sky", icon: "01d" }],
        },
        {
          dt: 1700028800,
          main: { temp: 27, humidity: 48 },
          weather: [{ description: "clear sky", icon: "01d" }],
        },
      ],
    },
    8,
    "metric",
  );

  assert.equal(result.length, 8);
  assert.equal(result[0].hourLabel, "Now");
  assert.equal(result[0].temperature, 18);
  assert.equal(result[0].humidity, 60);
  assert.equal(result[0].condition, "Light Rain");
  assert.equal(result[7].temperature, 26);
});

test("buildWeatherMetrics formats current-weather detail values", () => {
  const result = buildWeatherMetrics(
    {
      main: { temp: 20, feels_like: 21, pressure: 1012 },
      visibility: 12000,
      sys: { sunrise: 1700000000, sunset: 1700030000 },
    },
    "metric",
  );

  assert.deepEqual(
    result.map(item => item.label),
    ["Feels like", "Pressure", "Visibility", "Sunrise", "Sunset"],
  );
  assert.equal(result[0].value, "21°C");
  assert.equal(result[1].value, "1012 hPa");
  assert.equal(result[2].value, "12 km");
});

test("buildWeatherAlertMessage flags severe conditions", () => {
  const result = buildWeatherAlertMessage("Thunderstorm with heavy rain");

  assert.equal(
    result,
    "Weather alert: Thunderstorm With Heavy Rain may affect travel or outdoor plans.",
  );
});
