document.addEventListener("DOMContentLoaded", () => {

  // 탭 활성화
  const tabs = document.querySelectorAll(".tab-item");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
    });
  });

  // 북마크 토글
  const bookmarkBtn = document.getElementById("bookmarkBtn");

  bookmarkBtn.addEventListener("click", () => {
    const on = bookmarkBtn.classList.toggle("on");
    bookmarkBtn.textContent = on ? "★" : "♡";
  });

});
