// TMDB 설정
const TMDB_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwZGE0NzZjMTQyOGY4NzZkMWY2N2MyZWNhYWUyMzE2YSIsIm5iZiI6MTc2NzA3ODQzMS43MDg5OTk5LCJzdWIiOiI2OTUzN2ExZmE5OTMxMTliNmRlNDE5ZWEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.nZVmFjRrGQPJim1CQoNmv6V8DWYvVLwQCms5O-ec7Hk";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_ORIGINAL = "https://image.tmdb.org/t/p/original";
const IMAGE_BASE_W500 = "https://image.tmdb.org/t/p/w500";

// DOM 요소
const statusEl = document.getElementById("status");
const heroSection = document.getElementById("hero");
const heroTitle = document.getElementById("hero-title");
const heroMeta = document.getElementById("hero-meta");
const heroOverview = document.getElementById("hero-overview");
const headerLabel = document.getElementById("header-label");

const nowPlayingRow = document.getElementById("now-playing-row");
const latestRow = document.getElementById("latest-row");
const trendingRow = document.getElementById("trending-row");
const topRatedRow = document.getElementById("top-rated-row");

const actionRow = document.getElementById("action-row");
const comedyRow = document.getElementById("comedy-row");
const horrorRow = document.getElementById("horror-row");
const romanceRow = document.getElementById("romance-row");
const documentaryRow = document.getElementById("documentary-row");

// 상태 출력
function setStatus(message) {
  if (statusEl) {
    statusEl.textContent = message;
  }
}

function setHeaderLabel(text) {
  if (headerLabel) headerLabel.textContent = text;
}

// 히어로 영역 세팅
function setupHero(movie) {
  const {
    title,
    name,
    original_title,
    release_date,
    vote_average,
    overview,
    backdrop_path,
    poster_path,
  } = movie;

  const displayTitle = title || name || original_title || "제목 정보 없음";
  heroTitle.textContent = displayTitle;

  const year = release_date ? release_date.slice(0, 4) : "연도 정보 없음";
  const rating = vote_average ? vote_average.toFixed(1) : "평점 없음";
  heroMeta.textContent = `${year} • 평점 ${rating}`;

  heroOverview.textContent =
    overview && overview.trim().length > 0
      ? overview
      : "줄거리 정보가 제공되지 않습니다.";

  const bgPath = backdrop_path || poster_path;
  if (bgPath) {
    heroSection.style.backgroundImage =
      `url("${IMAGE_BASE_ORIGINAL}${bgPath}")`;
  } else {
    heroSection.style.backgroundColor = "#000";
  }
}

// 카드 생성
function createMovieCard(movie, labelText) {
  const { title, name, original_title, poster_path, vote_average } = movie;

  const card = document.createElement("div");
  card.className = "card";
  card.tabIndex = 0;

  const imgWrapper = document.createElement("div");
  imgWrapper.className = "card__image-wrapper";

  const img = document.createElement("img");
  img.className = "card__image";

  if (poster_path) {
    img.src = `${IMAGE_BASE_W500}${poster_path}`;
  } else {
    img.src =
      "https://via.placeholder.com/300x450/222222/ffffff?text=No+Image";
  }

  img.alt = title || name || original_title || "영화 포스터";

  const ratingBadge = document.createElement("div");
  ratingBadge.className = "card__rating";
  ratingBadge.textContent = vote_average
    ? `★ ${vote_average.toFixed(1)}`
    : "평점 없음";

  imgWrapper.appendChild(img);
  imgWrapper.appendChild(ratingBadge);

  const titleEl = document.createElement("div");
  titleEl.className = "card__title";
  titleEl.textContent =
    title || name || original_title || "제목 정보 없음";

  card.appendChild(imgWrapper);
  card.appendChild(titleEl);

  function activateCard() {
    setupHero(movie);
    if (labelText) setHeaderLabel(labelText);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  card.addEventListener("click", activateCard);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activateCard();
    }
  });

  return card;
}

// 행 렌더링
function renderMoviesToRow(movies, rowElement, labelText) {
  if (!rowElement) return;
  rowElement.innerHTML = "";
  movies.forEach((movie) => {
    const card = createMovieCard(movie, labelText);
    rowElement.appendChild(card);
  });
}

// 최신 상영작
async function fetchNowPlaying() {
  try {
    setStatus("최신 상영작을 불러오는 중입니다...");

    const res = await fetch(
      `${TMDB_BASE_URL}/movie/now_playing?language=ko-KR&page=1`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
          "Content-Type": "application/json;charset=utf-8",
        },
      }
    );

    if (!res.ok) {
      throw new Error("TMDB now_playing 요청 실패: " + res.status);
    }

    const data = await res.json();
    const results = data.results || [];

    if (!results.length) {
      setStatus("불러올 최신 상영작이 없습니다.");
      return;
    }

    // 새로고침마다 랜덤 히어로
    const randomIndex = Math.floor(Math.random() * results.length);
    const heroMovie = results[randomIndex];
    setupHero(heroMovie);

    renderMoviesToRow(results, nowPlayingRow, "최신 상영작");
    setHeaderLabel("최신 상영작");
    setStatus(`최신 상영작 ${results.length}편을 불러왔습니다.`);
  } catch (err) {
    console.error(err);
    setStatus(
      "데이터를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
    );
  }
}

// 넷플릭스에서만 상영작 (upcoming 느낌)
async function fetchLatest() {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/movie/upcoming?language=ko-KR&region=KR&page=1`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
          "Content-Type": "application/json;charset=utf-8",
        },
      }
    );

    if (!res.ok) {
      throw new Error("TMDB upcoming 요청 실패: " + res.status);
    }

    const data = await res.json();
    const results = data.results || [];
    if (!results.length) return;

    results.sort((a, b) => {
      const da = a.release_date || "9999-12-31";
      const db = b.release_date || "9999-12-31";
      return da.localeCompare(db);
    });

    renderMoviesToRow(results, latestRow, "넷플릭스에서만 상영작");
  } catch (err) {
    console.error(err);
  }
}

// 최신 트렌드 상영화 (popular)
async function fetchTrending() {
  try {
    const randomPage = Math.floor(Math.random() * 3) + 1;
    const res = await fetch(
      `${TMDB_BASE_URL}/movie/popular?language=ko-KR&page=${randomPage}`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
          "Content-Type": "application/json;charset=utf-8",
        },
      }
    );

    if (!res.ok) {
      throw new Error("TMDB popular 요청 실패: " + res.status);
    }

    const data = await res.json();
    const results = data.results || [];
    if (!results.length) return;

    const picked = results.slice(0, 20);
    renderMoviesToRow(picked, trendingRow, "최신 트렌드 상영화");
  } catch (err) {
    console.error(err);
  }
}

// 최신 인기작 (top_rated)
async function fetchTopRated() {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/movie/top_rated?language=ko-KR&page=1`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
          "Content-Type": "application/json;charset=utf-8",
        },
      }
    );

    if (!res.ok) {
      throw new Error("TMDB top_rated 요청 실패: " + res.status);
    }

    const data = await res.json();
    const results = data.results || [];
    if (!results.length) return;

    const sliced = results.slice(0, 20);
    renderMoviesToRow(sliced, topRatedRow, "최신 인기작");
  } catch (err) {
    console.error(err);
  }
}

// 장르별 공통
async function fetchGenreRow(genreId, rowElement, labelText) {
  if (!rowElement) return;
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/discover/movie?language=ko-KR&sort_by=popularity.desc&with_genres=${genreId}&page=1&region=KR`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
          "Content-Type": "application/json;charset=utf-8",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`TMDB discover 장르 요청 실패 (${genreId}): ` + res.status);
    }

    const data = await res.json();
    const results = data.results || [];
    if (!results.length) return;

    const sliced = results.slice(0, 20);
    renderMoviesToRow(sliced, rowElement, labelText);
  } catch (err) {
    console.error(err);
  }
}

// 좌우 스크롤 버튼
function initRowScrollButtons() {
  const buttons = document.querySelectorAll(".row__scroll-btn");

  buttons.forEach((btn) => {
    const targetId = btn.getAttribute("data-target");
    const target = document.getElementById(targetId);
    if (!target) return;

    btn.addEventListener("click", () => {
      const scrollAmount = target.clientWidth * 0.8;
      if (btn.classList.contains("row__scroll-btn--left")) {
        target.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        target.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    });
  });
}

// 초기화
document.addEventListener("DOMContentLoaded", () => {
  initRowScrollButtons();
  fetchNowPlaying();
  fetchLatest();
  fetchTrending();
  fetchTopRated();

  // 장르: 액션(28), 코미디(35), 공포(27), 로맨스(10749), 다큐(99)
  fetchGenreRow(28, actionRow, "액션영화");
  fetchGenreRow(35, comedyRow, "코메디영화");
  fetchGenreRow(27, horrorRow, "공포영화");
  fetchGenreRow(10749, romanceRow, "로맨스영화");
  fetchGenreRow(99, documentaryRow, "다큐멘터리영화");
});
