# README

1. Navigate to the project directory:

   cd weather-app

2. API Key Setup:

   This project keeps the API key in a dedicated config file so it is easier to replace and manage.

   Generate your own free API key from OpenWeatherMap, then open config.js and replace the placeholder value:

   window.WEATHER_APP_CONFIG = {
   apiKey: "YOUR_API_KEY_HERE"
   };

   Note: because this is a browser-based app, a key is still visible to the client in the browser. For production use, a safer pattern is to proxy requests through a backend service.

3. Run the App:

   Simply double-click on the index.html file to open it in your default web browser. Alternatively, you can use a local development server like VS Code's "Live Server" extension

   ## usage

   Search: Enter a city name in the input field and press "Search" or hit the Enter key.

Current Location: Click "Use Current Location" and allow browser location permissions to get weather for your exact coordinates.

Toggle Units: Click the toggle switch at the top to change between Celsius and Fahrenheit.
