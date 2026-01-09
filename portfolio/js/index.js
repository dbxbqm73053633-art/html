(() => {
  // year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav
  const toggle = document.querySelector(".nav__toggle");
  const navList = document.getElementById("navList");

  if (toggle && navList) {
    toggle.addEventListener("click", () => {
      const isOpen = navList.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    navList.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      navList.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });

    document.addEventListener("click", (e) => {
      if (window.innerWidth > 720) return;
      if (e.target.closest(".nav")) return;
      navList.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  }

  // Reveal on scroll
  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((ent) => {
        if (ent.isIntersecting) {
          ent.target.classList.add("is-in");
          io.unobserve(ent.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => io.observe(el));

  // Modal (Design 이미지 크게 보기 + 내부 스크롤)
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modalImg");
  const modalTitle = document.getElementById("modalTitle");
  const modalTools = document.getElementById("modalTools");
  const modalOpeners = document.querySelectorAll("[data-modal]");
  const closeTargets = modal ? modal.querySelectorAll("[data-close]") : [];

  let lastFocus = null;

  const openModal = (card) => {
    if (!modal || !modalImg || !modalTitle || !modalTools) return;

    const img = card.querySelector("img");
    if (!img) return;

    lastFocus = document.activeElement;

    modalImg.src = img.getAttribute("src");
    modalImg.alt = img.getAttribute("alt") || "Project image";
    modalTitle.textContent = card.dataset.title || "Project";
    modalTools.textContent = card.dataset.tools ? `Tools: ${card.dataset.tools}` : "";

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const btn = modal.querySelector(".modal__close");
    if (btn) btn.focus();
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (modalImg) modalImg.src = "";
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  };

  modalOpeners.forEach((card) => {
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "프로젝트 크게 보기");

    card.addEventListener("click", () => openModal(card));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(card);
      }
    });
  });

  closeTargets.forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // Panorama: 애니메이션이 멈춘 느낌이 들지 않게, 탭 비활성/활성 시 재시작 트릭
  const tracks = document.querySelectorAll("[data-panorama-track]");
  const restartAnimation = () => {
    tracks.forEach((t) => {
      // 강제 reflow로 애니메이션 재시작
      t.style.animation = "none";
      // eslint-disable-next-line no-unused-expressions
      t.offsetHeight;
      t.style.animation = "";
    });
  };

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) restartAnimation();
  });
})();
