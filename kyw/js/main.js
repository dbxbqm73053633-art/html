// 상단 인사에 이름 표시
const userNameEl = document.getElementById("userName");
const storedName = localStorage.getItem("fh_user_name");

if (storedName && storedName.trim() !== "") {
  userNameEl.textContent = storedName + "님,";
} else {
  userNameEl.textContent = "회원님,";
}

/** 페이지 이동 */
function goPage(path) {
  window.location.href = path;
}

/* =========================
   드로어: 왼쪽 상단 버튼으로만 열기
========================= */
const drawer = document.getElementById("drawer");
const backdrop = document.getElementById("drawerBackdrop");
const menuBtn = document.getElementById("menuBtn");
const closeBtn = document.getElementById("drawerClose");

function openDrawer() {
  document.body.classList.add("drawer-open");
  drawer.setAttribute("aria-hidden", "false");
  backdrop.hidden = false;
  menuBtn.setAttribute("aria-expanded", "true");
}

function closeDrawer() {
  document.body.classList.remove("drawer-open");
  drawer.setAttribute("aria-hidden", "true");
  menuBtn.setAttribute("aria-expanded", "false");

  // 트랜지션 후 overlay 숨김
  window.setTimeout(() => {
    if (!document.body.classList.contains("drawer-open")) {
      backdrop.hidden = true;
    }
  }, 220);
}

// 메뉴 열기/닫기
menuBtn.addEventListener("click", () => {
  const isOpen = document.body.classList.contains("drawer-open");
  if (isOpen) closeDrawer();
  else openDrawer();
});

// 닫기 트리거
closeBtn.addEventListener("click", closeDrawer);
backdrop.addEventListener("click", closeDrawer);

// ESC로 닫기
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.body.classList.contains("drawer-open")) {
    closeDrawer();
  }
});

// 메뉴 클릭 시 이동
drawer.addEventListener("click", (e) => {
  const item = e.target.closest(".drawer-item");
  if (!item) return;

  const path = item.dataset.path;
  if (!path) return;

  // active 표시
  drawer.querySelectorAll(".drawer-item").forEach((el) => el.classList.remove("is-active"));
  item.classList.add("is-active");

  closeDrawer();
  window.setTimeout(() => goPage(path), 140);
});
