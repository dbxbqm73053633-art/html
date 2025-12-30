document.addEventListener("DOMContentLoaded", () => {
  // 하단 탭 active 변경
  const tabs = document.querySelectorAll(".bottom-tabbar .tab-item");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // active 초기화
      tabs.forEach((t) => t.classList.remove("active"));
      // 클릭한 탭만 선택
      tab.classList.add("active");

      // 탭 이름에 따라 페이지 이동을 걸고 싶으면 여기에서 분기
      const tabName = tab.dataset.tab;

      // 예시: 나중에 실제 페이지 만들어지면 이렇게 연결하면 됨
      /*
      if (tabName === "home") location.href = "main.html";
      if (tabName === "search") location.href = "search.html";
      if (tabName === "group") location.href = "group.html";
      if (tabName === "live") location.href = "live.html";
      if (tabName === "my") location.href = "my.html";
      */
    });
  });

  // 북마크 토글 예시
  const bookmarkBtn = document.getElementById("bookmarkBtn");
  if (bookmarkBtn) {
    bookmarkBtn.addEventListener("click", () => {
      const active = bookmarkBtn.classList.toggle("on");
      bookmarkBtn.textContent = active ? "★" : "♡";
    });
  }
});
