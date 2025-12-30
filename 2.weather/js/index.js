const API_KEY = '4ab1984d2f7fb65123474ac442fc31cf';
const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const currentLocationBtn = document.getElementById('current-location-btn');

const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const weatherWrapper = document.getElementById('weather-wrapper');

const tempEl = document.getElementById('temp');
const cityNameEl = document.getElementById('city-name');
const descEl = document.getElementById('description');
const windEl = document.getElementById('wind');
const humidityEl = document.getElementById('humidity');
const feelsLikeEl = document.getElementById('feels-like');
const coordChip = document.getElementById('coord-chip');
const timeChip = document.getElementById('time-chip');

const minmaxTempEl = document.getElementById('minmax-temp');
const pressureEl = document.getElementById('pressure');
const visibilityEl = document.getElementById('visibility');
const sunriseSunsetEl = document.getElementById('sunrise-sunset');

function showLoading(isLoading) {
  if (isLoading) {
    loadingEl.classList.remove('hidden');
  } else {
    loadingEl.classList.add('hidden');
  }
}

function showError(message) {
  if (!message) {
    errorEl.classList.add('hidden');
    errorEl.textContent = '';
    return;
  }
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

function formatTimeFromUnix(unix, timezoneOffsetSeconds) {
  const local = new Date((unix + timezoneOffsetSeconds) * 1000);
  const h = String(local.getHours()).padStart(2, '0');
  const m = String(local.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function renderWeather(data) {
  if (!data || !data.main || !data.weather || !data.weather.length) {
    showError('날씨 데이터를 불러오지 못했습니다.');
    return;
  }

  const temp = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  const description = data.weather[0].description;
  const wind = data.wind?.speed ?? '-';
  const humidity = data.main.humidity;
  const cityName = data.name || '알 수 없음';
  const { lon, lat } = data.coord || {};
  const tempMin = Math.round(data.main.temp_min);
  const tempMax = Math.round(data.main.temp_max);
  const pressure = data.main.pressure;
  const visibility = data.visibility;
  const sunrise = data.sys?.sunrise;
  const sunset = data.sys?.sunset;
  const timezoneOffset = data.timezone ?? 0;

  tempEl.textContent = temp;
  feelsLikeEl.textContent = feelsLike;
  descEl.textContent = description;
  windEl.textContent = wind;
  humidityEl.textContent = humidity;
  cityNameEl.textContent = cityName;

  if (lat != null && lon != null) {
    coordChip.textContent = `위도 ${lat.toFixed(2)}°, 경도 ${lon.toFixed(2)}°`;
  } else {
    coordChip.textContent = '위치 정보 없음';
  }

  const updatedAt = new Date((data.dt + timezoneOffset) * 1000);
  const hours = String(updatedAt.getHours()).padStart(2, '0');
  const minutes = String(updatedAt.getMinutes()).padStart(2, '0');
  timeChip.textContent = `업데이트 · ${hours}:${minutes}`;

  minmaxTempEl.textContent = `${tempMax}° / ${tempMin}°C`;
  pressureEl.textContent = `${pressure} hPa`;

  if (typeof visibility === 'number') {
    const km = (visibility / 1000).toFixed(1);
    visibilityEl.textContent = `${km} km`;
  } else {
    visibilityEl.textContent = '-- km';
  }

  if (sunrise && sunset) {
    const sr = formatTimeFromUnix(sunrise, timezoneOffset);
    const ss = formatTimeFromUnix(sunset, timezoneOffset);
    sunriseSunsetEl.textContent = `${sr} / ${ss}`;
  } else {
    sunriseSunsetEl.textContent = '-- / --';
  }

  weatherWrapper.classList.remove('hidden');
}

async function fetchWeatherByCoords(lat, lon) {
  showError('');
  showLoading(true);
  try {
    const url = `${WEATHER_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('해당 위치의 날씨 정보를 찾을 수 없습니다.');
      }
      throw new Error('날씨 정보를 가져오는 중 문제가 발생했습니다.');
    }
    const data = await res.json();
    renderWeather(data);
  } catch (err) {
    showError(err.message || '알 수 없는 에러가 발생했습니다.');
  } finally {
    showLoading(false);
  }
}

async function fetchWeatherByCityName(name) {
  const trimmed = name.trim();
  if (!trimmed) {
    showError('도시 이름을 입력해 주세요.');
    return;
  }

  showError('');
  showLoading(true);

  try {
    // 1단계: 지오코딩으로 위도/경도 찾기 (한글/영문 모두 지원)
    const geoUrl = `${GEO_URL}?q=${encodeURIComponent(trimmed)}&limit=1&appid=${API_KEY}`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) {
      throw new Error('도시 정보를 찾는 중 문제가 발생했습니다.');
    }
    const geoData = await geoRes.json();
    if (!Array.isArray(geoData) || geoData.length === 0) {
      throw new Error('해당 도시를 찾을 수 없습니다. (예: 서울, 부산, Tokyo, London)');
    }

    const { lat, lon, local_names, name: officialName, country } = geoData[0];

    // 2단계: 찾은 위도/경도로 날씨 조회
    const weatherUrl = `${WEATHER_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`;
    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) {
      throw new Error('날씨 정보를 가져오는 중 문제가 발생했습니다.');
    }
    const weatherData = await weatherRes.json();

    // 도시명 표시는 한국어 이름이 있으면 우선 사용
    if (local_names && local_names.ko) {
      weatherData.name = `${local_names.ko} (${country})`;
    } else if (officialName) {
      weatherData.name = `${officialName} (${country})`;
    }

    renderWeather(weatherData);
  } catch (err) {
    showError(err.message || '알 수 없는 에러가 발생했습니다.');
  } finally {
    showLoading(false);
  }
}

// 날씨 상태를 이모티콘으로 변환
function getWeatherEmoji(main) {
  if (!main) return '🌡️';
  const m = main.toLowerCase();

  if (m.includes('clear')) return '☀️';
  if (m.includes('cloud')) return '⛅';
  if (m.includes('rain') || m.includes('drizzle')) return '🌧️';
  if (m.includes('thunder')) return '⛈️';
  if (m.includes('snow')) return '❄️';
  if (m.includes('mist') || m.includes('fog') || m.includes('haze')) return '🌫️';

  return '🌡️';
}

const fixedCityConfigs = [
  { id: 'us', label: '뉴욕 (미국)', query: 'New York,US' },
  { id: 'cn', label: '베이징 (중국)', query: 'Beijing,CN' },
  { id: 'jp', label: '도쿄 (일본)', query: 'Tokyo,JP' },
  { id: 'uk', label: '런던 (영국)', query: 'London,GB' },
];

function updateFixedCity(id, emoji, tempText) {
  const emojiEl = document.getElementById(`fixed-emoji-${id}`);
  const tempEl = document.getElementById(`fixed-temp-${id}`);
  if (emojiEl) emojiEl.textContent = emoji;
  if (tempEl) tempEl.textContent = tempText;
}

async function fetchFixedCitiesWeather() {
  for (const city of fixedCityConfigs) {
    try {
      const url = `${WEATHER_URL}?q=${encodeURIComponent(city.query)}&appid=${API_KEY}&units=metric&lang=kr`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const main = data.weather?.[0]?.main || '';
      const emoji = getWeatherEmoji(main);
      const temp = Math.round(data.main?.temp ?? 0);
      updateFixedCity(city.id, emoji, `${temp}°C`);
    } catch (e) {
      // 실패 시 --°C 유지
    }
  }
}

// 이벤트 바인딩
searchBtn.addEventListener('click', () => {
  fetchWeatherByCityName(cityInput.value);
});

cityInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    fetchWeatherByCityName(cityInput.value);
  }
});

currentLocationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    showError('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
    return;
  }

  showError('');
  showLoading(true);

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      fetchWeatherByCoords(latitude, longitude);
    },
    (err) => {
      showLoading(false);
      if (err.code === err.PERMISSION_DENIED) {
        showError('위치 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.');
      } else {
        showError('현재 위치를 가져오는 데 실패했습니다.');
      }
    }
  );
});

// 페이지 로드 시 세계 주요 국가 날씨 불러오기
fetchFixedCitiesWeather();
