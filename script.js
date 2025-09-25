// script.js - Final, Working Version

class WeatherApp {
  constructor() {
    this.apiBaseUrl = "https://api.open-meteo.com/v1/forecast";
    this.geocodingUrl = "https://geocoding-api.open-meteo.com/v1/search";
    this.currentLocation = null;
    this.currentUnit = "metric"; // 'metric' or 'imperial'
    this.lastFetchedHourlyData = null;
    this.lastFetchedDailyData = null;

    this.initializeElements();
    this.attachEventListeners();
    this.loadDefaultWeather();
  }

  initializeElements() {
    // Search Elements
    this.searchInput = document.getElementById("search-input");
    this.searchButton = document.querySelector(".search-bar button");

    // Current Weather Elements
    this.locationNameEl = document.querySelector(
      ".current-weather .location h2"
    );
    this.locationDateEl = document.querySelector(
      ".current-weather .location p"
    );
    this.currentIconEl = document.querySelector(
      ".current-weather .temperature .icon img"
    );
    this.currentTempEl = document.querySelector(
      ".current-weather .temperature .temp"
    );

    // Weather Stats
    this.feelsLikeEl = document.querySelector(
      ".weather-stats .stat:nth-child(1) h3"
    );
    this.humidityEl = document.querySelector(
      ".weather-stats .stat:nth-child(2) h3"
    );
    this.windSpeedEl = document.querySelector(
      ".weather-stats .stat:nth-child(3) h3"
    );
    this.precipitationEl = document.querySelector(
      ".weather-stats .stat:nth-child(4) h3"
    );

    // Forecast Elements
    this.forecastList = document.querySelector(".forecast-list");
    this.hourlyList = document.querySelector(".hourly-list");
    this.daySelect = document.querySelector(".day-select");

    // Unit Toggle
    this.unitsBtn = document.querySelector(".units-btn");
    this.unitDropdown = document.querySelector(".unit-dropdown");
  }

  attachEventListeners() {
    this.searchButton.addEventListener("click", () => this.handleSearch());
    this.searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.handleSearch();
    });

    // Unit Toggle Dropdown Show/Hide
    this.unitsBtn.addEventListener("click", () => {
      this.unitDropdown.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (
        !this.unitsBtn.contains(e.target) &&
        !this.unitDropdown.contains(e.target)
      ) {
        this.unitDropdown.classList.remove("active");
      }
    });

    // Unit Selection
    const unitItems = this.unitDropdown.querySelectorAll(
      "li:not(.section-title):not(.divider)"
    );
    unitItems.forEach((item) => {
      item.addEventListener("click", () => {
        if (
          item.textContent.includes("Fahrenheit") ||
          item.textContent.includes("mph") ||
          item.textContent.includes("Inches")
        ) {
          this.currentUnit = "imperial";
        } else {
          this.currentUnit = "metric";
        }
        this.updateUnitDisplay();
        if (this.currentLocation) {
          this.fetchAndDisplayWeather(
            this.currentLocation.latitude,
            this.currentLocation.longitude
          );
        }
      });
    });

    // Day Selector
    this.daySelect.addEventListener("change", (e) => {
      const selectedDayIndex = parseInt(e.target.value);
      this.updateHourlyForecastForDay(selectedDayIndex);
    });
  }

  updateUnitDisplay() {
    const allCheckmarks = this.unitDropdown.querySelectorAll(".checkmark-icon");
    allCheckmarks.forEach((cm) => cm.remove());

    if (this.currentUnit === "metric") {
      this.addCheckmarkToItem("Celsius (C)");
      this.addCheckmarkToItem("Km/h");
      this.addCheckmarkToItem("Millimeters (mm)/h");
    } else {
      this.addCheckmarkToItem("Fahrenheit");
      this.addCheckmarkToItem("mph");
      this.addCheckmarkToItem("Inches (in)");
    }
  }

  addCheckmarkToItem(text) {
    const items = this.unitDropdown.querySelectorAll("li");
    for (let item of items) {
      if (item.textContent.includes(text)) {
        const img = document.createElement("img");
        img.src = "./assets/images/icon-checkmark.svg";
        img.alt = "Selected";
        img.className = "checkmark-icon";
        item.appendChild(img);
        break;
      }
    }
  }

  async loadDefaultWeather() {
    const setLocationAndFetchWeather = async (lat, lon) => {
      // ✅ Add validation for coordinates
      if (
        typeof lat !== "number" ||
        typeof lon !== "number" ||
        isNaN(lat) ||
        isNaN(lon)
      ) {
        console.error("Invalid coordinates provided:", lat, lon);
        return;
      }

      try {
        const geoResponse = await fetch(
          `${this.geocodingUrl}?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`
        );
        const geoData = await geoResponse.json();

        if (geoData.results && geoData.results.length > 0) {
          const result = geoData.results[0];

          const getLocationName = (res) => {
            return (
              res.name ||
              res.city ||
              res.town ||
              res.village ||
              res.municipality ||
              res.administrative_area ||
              "Location"
            );
          };

          this.currentLocation = {
            ...result,
            name: getLocationName(result),
          };
        } else {
          this.currentLocation = {
            latitude: lat,
            longitude: lon,
            name: "Location",
            country: "",
          };
        }

        this.fetchAndDisplayWeather(lat, lon);
      } catch (error) {
        console.warn("Geocoding error:", error);
        this.currentLocation = {
          latitude: lat,
          longitude: lon,
          name: "Berlin",
          country: "Germany",
        };
        this.fetchAndDisplayWeather(lat, lon);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationAndFetchWeather(
            position.coords.latitude,
            position.coords.longitude
          );
        },
        (error) => {
          console.warn("Geolocation error:", error);
          setLocationAndFetchWeather(52.52, 13.41); // Berlin
        }
      );
    } else {
      setLocationAndFetchWeather(52.52, 13.41);
    }
  }

  async searchLocation(query) {
    try {
      const response = await fetch(
        `${this.geocodingUrl}?name=${encodeURIComponent(
          query
        )}&count=1&language=en&format=json`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        this.currentLocation = data.results[0];
        this.searchInput.value = `${this.currentLocation.name}, ${this.currentLocation.country}`;
        this.fetchAndDisplayWeather(
          this.currentLocation.latitude,
          this.currentLocation.longitude
        );
      } else {
        alert("Location not found. Please try another.");
        this.searchInput.value = "";
      }
    } catch (error) {
      console.error("Error searching location:", error);
      alert("An error occurred while searching for the location.");
    }
  }

  async fetchAndDisplayWeather(lat, lon) {
    try {
      const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current:
          "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code",
        hourly: "temperature_2m,weather_code",
        daily:
          "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,wind_speed_10m_max",
        timezone: "auto",
        forecast_days: 7,
      });

      const response = await fetch(`${this.apiBaseUrl}?${params}`);
      const data = await response.json();

      // Ensure currentLocation is set to avoid null errors
      if (!this.currentLocation) {
        this.currentLocation = {
          latitude: lat,
          longitude: lon,
          name: "Location",
          country: "",
        };
      }

      this.updateUI(data);
    } catch (error) {
      console.error("Error fetching weather ", error);
      alert("An error occurred while fetching weather data.");
    }
  }

  handleSearch() {
    const query = this.searchInput.value.trim();
    if (query) {
      this.searchLocation(query);
    }
  }

  updateUI(data) {
    const now = new Date();
    this.locationNameEl.textContent = `${this.currentLocation.name}, ${this.currentLocation.country}`;
    this.locationDateEl.textContent = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const current = data.current;
    const currentWMOCode = current.weather_code;
    const currentTemp = this.formatTemperature(current.temperature_2m);

    this.currentTempEl.textContent = currentTemp;
    this.currentIconEl.src = this.getWeatherIconPath(currentWMOCode);
    this.currentIconEl.alt = this.getWeatherDescription(currentWMOCode);

    this.feelsLikeEl.textContent = this.formatTemperature(
      current.apparent_temperature
    );
    this.humidityEl.textContent = `${Math.round(
      current.relative_humidity_2m
    )}%`;
    this.windSpeedEl.textContent = this.formatWindSpeed(current.wind_speed_10m);
    this.precipitationEl.textContent = this.formatPrecipitation(
      current.precipitation
    );

    this.lastFetchedDailyData = data.daily;
    this.lastFetchedHourlyData = data.hourly;

    this.updateSevenDayForecast(data.daily);
    this.updateDaySelector(data.daily);
    this.updateHourlyForecastForDay(0);
  }

  updateSevenDayForecast(dailyData) {
    this.forecastList.innerHTML = ""; // This clears any existing content

    for (let i = 0; i < 7; i++) {
      const day = document.createElement("li");
      day.className = "day";

      // Day Name
      const dayName = document.createElement("p");
      dayName.textContent =
        i === 0
          ? "Today"
          : new Date(dailyData.time[i]).toLocaleDateString("en-US", {
              weekday: "short",
            });

      // Emoji - This is a TEXT node, not an image
      const emoji = document.createElement("p");
      emoji.textContent = this.getWeatherEmoji(dailyData.weather_code[i]);

      // Temp Range
      const tempRange = document.createElement("div");
      tempRange.className = "forecast-day";
      tempRange.innerHTML = `
            <span>${this.formatTemperature(
              dailyData.temperature_2m_max[i]
            )}</span>
            <span>${this.formatTemperature(
              dailyData.temperature_2m_min[i]
            )}</span>
        `;

      day.appendChild(dayName);
      day.appendChild(emoji); // This is where the emoji text goes
      day.appendChild(tempRange);

      this.forecastList.appendChild(day);
    }
  }

  updateDaySelector(dailyData) {
    this.daySelect.innerHTML = "";

    for (let i = 0; i < 7; i++) {
      const option = document.createElement("option");
      option.value = i;

      if (i === 0) {
        option.textContent = "Today";
      } else {
        const date = new Date(dailyData.time[i]);
        option.textContent = date.toLocaleDateString("en-US", {
          weekday: "long",
        });
      }

      this.daySelect.appendChild(option);
    }
  }

  updateHourlyForecastForDay(dayIndex) {
    if (!this.lastFetchedHourlyData) return;

    this.hourlyList.innerHTML = "";

    const startIndex = dayIndex * 24;
    const endIndex = startIndex + 24;

    for (
      let i = startIndex;
      i < endIndex && i < this.lastFetchedHourlyData.time.length;
      i += 3
    ) {
      const hourItem = document.createElement("div");

      const hour = document.createElement("p");
      const time = new Date(this.lastFetchedHourlyData.time[i]);
      const emoji = this.getWeatherEmoji(
        this.lastFetchedHourlyData.weather_code[i]
      );
      hour.textContent = `${emoji} ${time.toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true,
      })}`;

      const temp = document.createElement("p");
      temp.textContent = this.formatTemperature(
        this.lastFetchedHourlyData.temperature_2m[i]
      );

      hourItem.appendChild(hour);
      hourItem.appendChild(temp);

      this.hourlyList.appendChild(hourItem);
    }
  }

  formatTemperature(celsius) {
    if (this.currentUnit === "imperial") {
      const fahrenheit = (celsius * 9) / 5 + 32;
      return `${Math.round(fahrenheit)}°`;
    }
    return `${Math.round(celsius)}°`;
  }

  formatWindSpeed(kph) {
    if (this.currentUnit === "imperial") {
      const mph = kph * 0.621371;
      return `${Math.round(mph)} mph`;
    }
    return `${Math.round(kph)} km/h`;
  }

  formatPrecipitation(mm) {
    if (this.currentUnit === "imperial") {
      const inches = mm * 0.0393701;
      return `${inches.toFixed(2)} in`;
    }
    return `${mm} mm`;
  }

  getWeatherIconPath(wmoCode) {
    const iconMap = {
      0: "icon-sunny.webp",
      1: "icon-clear-night.webp",
      2: "icon-partly-cloudy.webp",
      3: "icon-cloudy.webp",
      45: "icon-fog.webp",
      48: "icon-fog.webp",
      51: "icon-drizzle.webp",
      53: "icon-drizzle.webp",
      55: "icon-drizzle.webp",
      56: "icon-freezing-drizzle.webp",
      57: "icon-freezing-drizzle.webp",
      61: "icon-rain.webp",
      63: "icon-rain.webp",
      65: "icon-heavy-rain.webp",
      66: "icon-freezing-rain.webp",
      67: "icon-freezing-rain.webp",
      71: "icon-snow.webp",
      73: "icon-snow.webp",
      75: "icon-heavy-snow.webp",
      77: "icon-snow.webp",
      80: "icon-rain-showers.webp",
      81: "icon-rain-showers.webp",
      82: "icon-heavy-rain-showers.webp",
      85: "icon-snow-showers.webp",
      86: "icon-snow-showers.webp",
      95: "icon-storm.webp",
      96: "icon-storm.webp",
      99: "icon-storm.webp",
    };

    const iconName = iconMap[wmoCode] || "icon-cloudy.webp";
    return `./assets/images/${iconName}`;
  }

  getWeatherEmoji(wmoCode) {
    const emojiMap = {
      0: "☀️",
      1: "🌤️",
      2: "⛅",
      3: "☁️",
      45: "🌫️",
      48: "🌫️",
      51: "🌦️",
      53: "🌦️",
      55: "🌧️",
      56: "🌨️",
      57: "🌨️",
      61: "🌧️",
      63: "🌧️",
      65: "⛈️",
      66: "🌨️",
      67: "🌨️",
      71: "❄️",
      73: "❄️",
      75: "❄️",
      77: "❄️",
      80: "🌦️",
      81: "⛈️",
      82: "⛈️",
      85: "🌨️",
      86: "🌨️",
      95: "⛈️",
      96: "⛈️",
      99: "⛈️",
    };

    return emojiMap[wmoCode] || "☁️";
  }

  getWeatherDescription(wmoCode) {
    if (wmoCode === 0) return "Clear Sky";
    if (wmoCode >= 1 && wmoCode <= 3) return "Partly cloud";
    if (wmoCode === 45 || wmoCode === 48) return "Fog";
    if (wmoCode >= 51 && wmoCode <= 57) return "Drizzle";
    if (wmoCode >= 61 && wmoCode <= 67) return "Rain";
    if (wmoCode >= 71 && wmoCode <= 77) return "Snow";
    if (wmoCode >= 80 && wmoCode <= 82) return "Showers";
    if (wmoCode >= 85 && wmoCode <= 86) return "Snow Showers";
    if (wmoCode >= 95 && wmoCode <= 99) return "Thunderstorm";
    return "Cloudy";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new WeatherApp();
});
