// ===============================
// Weather App - script.js
// ===============================

// Your API key from OpenWeatherMap (replace with your own)
const API_KEY = "b43b70420b69245a777f9b2f45cd3533";

// Elements
const searchInput = document.querySelector(".search-input input");
const searchBtn = document.querySelector(".search-bar button");
const locationElement = document.querySelector(".location h2");
const dateElement = document.querySelector(".location p");
const tempElement = document.querySelector(".temp");
const feelsLikeElement = document.querySelector(
  ".weather-stats .stat:nth-child(1) h3"
);
const humidityElement = document.querySelector(
  ".weather-stats .stat:nth-child(2) h3"
);
const windElement = document.querySelector(
  ".weather-stats .stat:nth-child(3) h3"
);
const precipElement = document.querySelector(
  ".weather-stats .stat:nth-child(4) h3"
);
const forecastList = document.querySelector(".forecast-list");
const hourlyList = document.querySelector(".hourly-list");

// For previous searches
let searchHistory = JSON.parse(localStorage.getItem("weatherSearches")) || [];

// =============== Fetch Weather ===============
async function fetchWeather(city) {
  try {
    // Current weather
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
    );
    const currentData = await currentRes.json();

    if (currentData.cod !== 200) {
      alert("City not found!");
      return;
    }

    // One Call API for forecast
    const { lat, lon } = currentData.coord;
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=metric&appid=${API_KEY}`
    );
    const forecastData = await forecastRes.json();

    // Update UI
    updateCurrentWeather(currentData);
    updateDailyForecast(forecastData.daily);
    updateHourlyForecast(forecastData.hourly);

    // Save search
    saveSearch(city);
  } catch (error) {
    console.error("Error fetching weather:", error);
  }
}

// =============== Update UI ===============
function updateCurrentWeather(data) {
  const date = new Date();
  const options = {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  };

  locationElement.textContent = `${data.name}, ${data.sys.country}`;
  dateElement.textContent = date.toLocaleDateString("en-US", options);
  tempElement.textContent = `${Math.round(data.main.temp)}°`;
  feelsLikeElement.textContent = `${Math.round(data.main.feels_like)}°`;
  humidityElement.textContent = `${data.main.humidity}%`;
  windElement.textContent = `${Math.round(data.wind.speed)} km/h`;
  precipElement.textContent = `${data.rain ? data.rain["1h"] : 0} mm`;
}

function updateDailyForecast(daily) {
  forecastList.innerHTML = "";
  daily.slice(0, 7).forEach((day) => {
    const date = new Date(day.dt * 1000);
    const options = { weekday: "short" };
    const dayName = date.toLocaleDateString("en-US", options);

    const li = document.createElement("li");
    li.classList.add("day");
    li.innerHTML = `
      <p>${dayName}</p>
      <p><img src="https://openweathermap.org/img/wn/${
        day.weather[0].icon
      }.png" alt=""></p>
      <div class="forecast-day">
        <span>${Math.round(day.temp.max)}°</span>
        <span>${Math.round(day.temp.min)}°</span>
      </div>
    `;
    forecastList.appendChild(li);
  });
}

function updateHourlyForecast(hourly) {
  hourlyList.innerHTML = "";
  hourly.slice(0, 8).forEach((hour) => {
    const date = new Date(hour.dt * 1000);
    const hourTime = date.toLocaleTimeString("en-US", { hour: "numeric" });

    const div = document.createElement("div");
    div.innerHTML = `
      <p>${hourTime}</p>
      <p>${Math.round(hour.temp)}°</p>
    `;
    hourlyList.appendChild(div);
  });
}

// =============== Search & History ===============
function saveSearch(city) {
  if (!searchHistory.includes(city)) {
    searchHistory.unshift(city);
    if (searchHistory.length > 5) searchHistory.pop();
    localStorage.setItem("weatherSearches", JSON.stringify(searchHistory));
  }
}

function showHistory() {
  const dropdown = document.querySelector(".search-bar .history-dropdown");
  if (!dropdown) {
    const ul = document.createElement("ul");
    ul.classList.add("history-dropdown");
    searchInput.parentElement.appendChild(ul);
  }
  const ul = document.querySelector(".history-dropdown");
  ul.innerHTML = "";

  searchHistory.forEach((city) => {
    const li = document.createElement("li");
    li.textContent = city;
    li.onclick = () => {
      searchInput.value = city;
      fetchWeather(city);
      ul.innerHTML = "";
    };
    ul.appendChild(li);
  });
}

// =============== Event Listeners ===============
searchBtn.addEventListener("click", () => {
  const city = searchInput.value.trim();
  if (city) fetchWeather(city);
});

searchInput.addEventListener("focus", showHistory);
