const slides = document.querySelectorAll(".slide");
const stepBtns = document.querySelectorAll(".step");
const pageDots = document.querySelectorAll(".p-dot");
const nextBtn = document.getElementById("nextBtn");
const skipBtn = document.getElementById("skipBtn");

const LOGIN_URL = "login.html";

let currentIndex = 0;

/* CTA 문구를 "결심"으로 */
const CTA_TEXT = [
  "내 몸을 분석하기",
  "오늘 컨디션 확인하기",
  "맞춤 루틴 만들기",
  "지금 시작하기"
];

/* 숫자 카운트업 */
function animateCount(el) {
  const to = Number(el.dataset.countTo || "0");
  const decimals = Number(el.dataset.decimals || "0");
  const duration = 650;

  const start = performance.now();
  const from = 0;

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    // easeOutCubic
    const eased = 1 - Math.pow(1 - t, 3);
    const val = from + (to - from) * eased;
    el.textContent = val.toFixed(decimals);

    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function animateCountsInSlide(index) {
  const slide = slides[index];
  if (!slide) return;
  const nums = slide.querySelectorAll(".num[data-count-to]");
  nums.forEach((n) => {
    // 이미 한번 돌렸으면 재실행 방지
    if (n.dataset.counted === "true") return;
    n.dataset.counted = "true";
    animateCount(n);
  });
}

function updateUI(index) {
  slides.forEach((s, i) => s.classList.toggle("active", i === index));

  stepBtns.forEach((b, i) => {
    b.classList.toggle("active", i === index);
    b.setAttribute("aria-current", i === index ? "step" : "false");
  });

  pageDots.forEach((d, i) => d.classList.toggle("active", i === index));

  if (nextBtn) nextBtn.textContent = CTA_TEXT[index] || "다음";

  // 마지막이면 skip 숨김
  if (skipBtn) {
    skipBtn.style.display = index === slides.length - 1 ? "none" : "inline-block";
  }

  currentIndex = index;
  animateCountsInSlide(index);
}

function goLogin() {
  window.location.href = LOGIN_URL;
}

function next() {
  if (currentIndex < slides.length - 1) {
    updateUI(currentIndex + 1);
  } else {
    goLogin();
  }
}

/* 이벤트 */
nextBtn?.addEventListener("click", next);
skipBtn?.addEventListener("click", goLogin);

stepBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const idx = Number(btn.dataset.step || "0");
    updateUI(idx);
  });
});

/* 키보드 UX */
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") next();
  if (e.key === "ArrowLeft") updateUI(Math.max(0, currentIndex - 1));
});

/* 초기 */
updateUI(0);
