// TMDB API 설정
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


// 상위 20개 정도만 사용
const sliced = results.slice(0, 20);
renderMoviesToRow(sliced, topRatedRow);
} catch (err) {
console.error(err);
}


// 랜덤 추천 영화 (popular에서 랜덤 섞기)
async function fetchRandomRecommendations() {
try {
// 1~5 페이지 중 하나 랜덤 선택
const randomPage = Math.floor(Math.random() * 5) + 1;


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
let results = data.results || [];


if (!results.length) return;


// 랜덤 섞기
results = results.sort(() => 0.5 - Math.random());


// 12개만 사용
const picked = results.slice(0, 12);
renderMoviesToRow(picked, randomRow);
} catch (err) {
console.error(err);
}
}


// 가로 스크롤 버튼 기능
function initRowScrollButtons() {
const buttons = document.querySelectorAll(".row__scroll-btn");


buttons.forEach((btn) => {
const targetId = btn.getAttribute("data-target");
const target = document.getElementById(targetId);
if (!target) return;


btn.addEventListener("click", () => {
const scrollAmount = target.clientWidth * 0.8; // 한 번에 80%씩 이동
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
fetchTopRated();
fetchRandomRecommendations();
});