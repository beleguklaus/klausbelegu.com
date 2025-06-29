class WeatherDashboard {
    constructor() {
        // Use our secure server-side API endpoints
        this.baseUrl = '/api/weather';
        this.currentWeatherUrl = `${this.baseUrl}/current`;
        this.forecastUrl = `${this.baseUrl}/forecast`;
        this.coordsUrl = `${this.baseUrl}/coords`;
        
        this.settings = this.loadSettings();
        this.initializeElements();
        this.bindEvents();
        this.applyTheme();
        this.loadDefaultWeather();
    }

    initializeElements() {
        this.cityInput = document.getElementById('cityInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.currentWeather = document.getElementById('currentWeather');
        
        this.cityName = document.getElementById('cityName');
        this.weatherDate = document.getElementById('weatherDate');
        this.currentTemp = document.getElementById('currentTemp');
        this.mainWeatherIcon = document.getElementById('mainWeatherIcon');
        this.weatherDescription = document.getElementById('weatherDescription');
        
        this.visibility = document.getElementById('visibility');
        this.humidity = document.getElementById('humidity');
        this.windSpeed = document.getElementById('windSpeed');
        this.feelsLike = document.getElementById('feelsLike');
        this.pressure = document.getElementById('pressure');
        this.uvIndex = document.getElementById('uvIndex');
        
        this.forecastContainer = document.getElementById('forecastContainer');
        this.themeToggle = document.getElementById('themeToggle');
    }

    bindEvents() {
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    async handleSearch() {
        const city = this.cityInput.value.trim();
        if (!city) {
            this.showError('Please enter a city name');
            return;
        }
        
        await this.fetchWeatherData(city);
    }

    async loadDefaultWeather() {
        try {
            const position = await this.getCurrentPosition();
            const { latitude, longitude } = position.coords;
            await this.fetchWeatherByCoords(latitude, longitude);
        } catch (error) {
            await this.fetchWeatherData('New York');
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 10000,
                enableHighAccuracy: true
            });
        });
    }

    async fetchWeatherData(city) {
        this.showLoading();
        
        try {
            const [currentResponse, forecastResponse] = await Promise.all([
                fetch(`${this.currentWeatherUrl}/${city}`),
                fetch(`${this.forecastUrl}/${city}`)
            ]);

            if (!currentResponse.ok || !forecastResponse.ok) {
                throw new Error('City not found');
            }

            const currentData = await currentResponse.json();
            const forecastData = await forecastResponse.json();

            if (currentData.error || forecastData.error) {
                throw new Error(currentData.error || forecastData.error);
            }

            this.updateCurrentWeather(currentData);
            this.updateForecast(forecastData);
            this.hideLoading();
        } catch (error) {
            this.showError(error.message);
        }
    }

    async fetchWeatherByCoords(lat, lon) {
        this.showLoading();
        
        try {
            const response = await fetch(`${this.coordsUrl}?lat=${lat}&lon=${lon}`);

            if (!response.ok) {
                throw new Error('Unable to fetch weather data');
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            this.updateCurrentWeather(data.current);
            this.updateForecast(data.forecast);
            this.hideLoading();
        } catch (error) {
            this.showError(error.message);
        }
    }

    showDemoData(city = 'Demo City') {
        const demoCurrentData = {
            name: city,
            main: {
                temp: 22,
                feels_like: 25,
                humidity: 65,
                pressure: 1013
            },
            weather: [{
                main: 'Clear',
                description: 'clear sky',
                icon: '01d'
            }],
            wind: {
                speed: 3.5
            },
            visibility: 10000
        };

        const demoForecastData = {
            list: [
                {
                    dt: Date.now() / 1000 + 86400,
                    main: { temp_max: 25, temp_min: 18 },
                    weather: [{ main: 'Sunny', description: 'sunny', icon: '01d' }]
                },
                {
                    dt: Date.now() / 1000 + 172800,
                    main: { temp_max: 23, temp_min: 16 },
                    weather: [{ main: 'Clouds', description: 'partly cloudy', icon: '02d' }]
                },
                {
                    dt: Date.now() / 1000 + 259200,
                    main: { temp_max: 28, temp_min: 20 },
                    weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }]
                },
                {
                    dt: Date.now() / 1000 + 345600,
                    main: { temp_max: 21, temp_min: 15 },
                    weather: [{ main: 'Rain', description: 'light rain', icon: '10d' }]
                },
                {
                    dt: Date.now() / 1000 + 432000,
                    main: { temp_max: 26, temp_min: 19 },
                    weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }]
                }
            ]
        };

        this.updateCurrentWeather(demoCurrentData);
        this.updateForecast(demoForecastData);
        this.hideLoading();
    }

    updateCurrentWeather(data) {
        this.cityName.textContent = data.name;
        this.weatherDate.textContent = this.formatDate(new Date());
        this.currentTemp.textContent = `${Math.round(data.main.temp)}°`;
        this.weatherDescription.textContent = data.weather[0].description;
        
        this.visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
        this.humidity.textContent = `${data.main.humidity}%`;
        this.windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
        this.feelsLike.textContent = `${Math.round(data.main.feels_like)}°`;
        this.pressure.textContent = `${data.main.pressure} hPa`;
        this.uvIndex.textContent = '5'; // UV index would need separate API call
        
        this.mainWeatherIcon.className = this.getWeatherIconClass(data.weather[0].main);
    }

    updateForecast(data) {
        const dailyForecasts = this.processForecastData(data.list);
        this.forecastContainer.innerHTML = '';

        dailyForecasts.forEach(forecast => {
            const forecastItem = this.createForecastItem(forecast);
            this.forecastContainer.appendChild(forecastItem);
        });
    }

    processForecastData(list) {
        const dailyData = {};
        
        list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateKey = date.toDateString();
            
            if (!dailyData[dateKey]) {
                dailyData[dateKey] = {
                    date: date,
                    maxTemp: item.main.temp_max,
                    minTemp: item.main.temp_min,
                    weather: item.weather[0]
                };
            } else {
                dailyData[dateKey].maxTemp = Math.max(dailyData[dateKey].maxTemp, item.main.temp_max);
                dailyData[dateKey].minTemp = Math.min(dailyData[dateKey].minTemp, item.main.temp_min);
            }
        });

        return Object.values(dailyData).slice(0, 5);
    }

    createForecastItem(forecast) {
        const item = document.createElement('div');
        item.className = 'forecast-item fade-in';
        
        item.innerHTML = `
            <div class="forecast-date">${this.formatForecastDate(forecast.date)}</div>
            <div class="forecast-icon">
                <i class="${this.getWeatherIconClass(forecast.weather.main)}"></i>
            </div>
            <div class="forecast-temps">
                <span class="forecast-high">${Math.round(forecast.maxTemp)}°</span>
                <span class="forecast-low">${Math.round(forecast.minTemp)}°</span>
            </div>
            <div class="forecast-desc">${forecast.weather.description}</div>
        `;
        
        return item;
    }

    getWeatherIconClass(weatherMain) {
        const iconMap = {
            'Clear': 'fas fa-sun',
            'Clouds': 'fas fa-cloud',
            'Rain': 'fas fa-cloud-rain',
            'Drizzle': 'fas fa-cloud-drizzle',
            'Thunderstorm': 'fas fa-bolt',
            'Snow': 'fas fa-snowflake',
            'Mist': 'fas fa-smog',
            'Smoke': 'fas fa-smog',
            'Haze': 'fas fa-smog',
            'Dust': 'fas fa-smog',
            'Fog': 'fas fa-smog',
            'Sand': 'fas fa-smog',
            'Ash': 'fas fa-smog',
            'Squall': 'fas fa-wind',
            'Tornado': 'fas fa-tornado',
            'Sunny': 'fas fa-sun'
        };
        
        return iconMap[weatherMain] || 'fas fa-sun';
    }

    formatDate(date) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    }

    formatForecastDate(date) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        }
    }

    showLoading() {
        this.loadingSpinner.classList.add('show');
        this.errorMessage.classList.remove('show');
        this.currentWeather.classList.add('hidden');
    }

    hideLoading() {
        this.loadingSpinner.classList.remove('show');
        this.currentWeather.classList.remove('hidden');
        this.currentWeather.classList.add('fade-in');
    }

    showError(message) {
        this.loadingSpinner.classList.remove('show');
        this.errorText.textContent = message;
        this.errorMessage.classList.add('show');
        this.currentWeather.classList.add('hidden');
        
        setTimeout(() => {
            this.errorMessage.classList.remove('show');
            this.currentWeather.classList.remove('hidden');
        }, 3000);
    }

    loadSettings() {
        const defaultSettings = {
            theme: 'light'
        };
        
        try {
            const savedSettings = localStorage.getItem('weatherDashboardSettings');
            return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
        } catch (error) {
            console.warn('Failed to load settings from localStorage:', error);
            return defaultSettings;
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('weatherDashboardSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save settings to localStorage:', error);
        }
    }

    toggleTheme() {
        this.settings.theme = this.settings.theme === 'light' ? 'dark' : 'light';
        this.saveSettings();
        this.applyTheme();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        this.updateThemeToggleUI();
    }

    updateThemeToggleUI() {
        const slider = this.themeToggle.querySelector('.theme-toggle-slider');
        const icon = slider.querySelector('.theme-toggle-icon');
        
        if (this.settings.theme === 'dark') {
            icon.className = 'theme-toggle-icon fas fa-moon';
        } else {
            icon.className = 'theme-toggle-icon fas fa-sun';
        }
    }
}

// Initialize the weather dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WeatherDashboard();
});

// Service Worker Registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}