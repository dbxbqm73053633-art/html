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
  if (revealEls.length) {
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
  }

  // Tabs (Skills)
  const tabsRoot = document.querySelector("[data-tabs]");
  if (tabsRoot) {
    const btns = Array.from(tabsRoot.querySelectorAll("[data-tab]"));
    const panels = Array.from(tabsRoot.querySelectorAll("[data-panel]"));

    const activate = (key) => {
      btns.forEach((b) => {
        const on = b.dataset.tab === key;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panel === key));
    };

    btns.forEach((b) => b.addEventListener("click", () => activate(b.dataset.tab)));
  }

  // Skill bar animation (when visible)
  const barsWrap = document.querySelector("[data-skill-bars]");
  const animateBars = () => {
    if (!barsWrap) return;
    const bars = Array.from(barsWrap.querySelectorAll(".bar"));
    bars.forEach((bar) => {
      const level = Number(bar.dataset.level || 0);
      const fill = bar.querySelector(".bar__fill");
      const countEl = bar.querySelector("[data-count]");
      if (fill) fill.style.width = `${level}%`;

      // count up
      if (countEl) {
        const duration = 900;
        const start = performance.now();
        const from = 0;
        const to = level;

        const step = (t) => {
          const p = Math.min(1, (t - start) / duration);
          const v = Math.round(from + (to - from) * p);
          countEl.textContent = String(v);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    });
  };

  if (barsWrap) {
    const ioBars = new IntersectionObserver(
      (entries) => {
        entries.forEach((ent) => {
          if (ent.isIntersecting) {
            animateBars();
            ioBars.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    ioBars.observe(barsWrap);
  }

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

  // Contact form -> mailto
  const form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const phone = String(data.get("phone") || "").trim();
      const message = String(data.get("message") || "").trim();

      const to = "sunaide@naver.com";
      const subject = encodeURIComponent(`[Portfolio Contact] ${name || "Guest"}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "-"}\n\nMessage:\n${message}`
      );

      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    });
  }
})();
