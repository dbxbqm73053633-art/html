// ===============================
// 0) 설정
// ===============================

const PASSWORD = "0113";               // ✅ 공통 비밀번호
const SESSION_KEY = "ywjy_unlocked_v2";

const START = new Date(2026, 0, 13, 0, 0, 0);

const MILESTONES = [
  { days: 100, name: "100일 (우리, 꽤 멋지게 여기까지)" },
  { days: 200, name: "200일 (서로에게 더 편해진 날)" },
  { days: 365, name: "1주년 (처음부터 지금까지, 너라서)" },
  { days: 500, name: "500일 (사랑은 오늘도 진행 중)" },
  { days: 730, name: "2주년 (익숙함 속 설렘)" },
  { days: 1000, name: "1000일 (우리만의 전설)" },
];

const MAX_IMAGE_LONG_SIDE = 1600;
const JPG_QUALITY = 0.86;

const LS_MEMO = "ourday_memos_v5";

const DB_NAME = "yw_jy_story_db";
const DB_VERSION = 2;                  // ✅ album 필드 추가로 버전 업
const STORE = "photos";

// 페이징
const PAGE_SIZE = 12;

// ===============================
// 1) 유틸
// ===============================

const $ = (id) => document.getElementById(id);
const week = ["일","월","화","수","목","금","토"];
const pad2 = (n) => String(n).padStart(2, "0");

function fmtDate(d) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}.${m}.${day} (${week[d.getDay()]})`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toISODateInputValue(tsOrDate) {
  if (!tsOrDate) return "";
  const d = (tsOrDate instanceof Date) ? tsOrDate : new Date(tsOrDate);
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

function fromISODateInputValue(v) {
  if (!v) return null;
  const [y, m, d] = v.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0).getTime();
}

function niceShortDate(ts) {
  if (!ts) return "날짜 없음";
  const d = new Date(ts);
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
}

function humanName(filename) {
  if (!filename) return "photo";
  const base = filename.replace(/\.[^/.]+$/, "");
  return base.length > 18 ? base.slice(0, 18) + "…" : base;
}

function normalizePass(v) {
  return String(v || "").trim();
}

function normalizeAlbum(v) {
  const t = String(v || "").trim();
  return t ? t : "기본앨범";
}

// ===============================
// 2) 잠금 화면
// ===============================

function showLock() {
  $("lock").classList.add("show");
  $("lock").setAttribute("aria-hidden", "false");
  $("lockPass").value = "";
  $("lockPass").focus();
}
function hideLock() {
  $("lock").classList.remove("show");
  $("lock").setAttribute("aria-hidden", "true");
}

function initLock() {
  const unlocked = sessionStorage.getItem(SESSION_KEY) === "1";
  if (!unlocked) showLock();

  $("lockForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const pass = normalizePass($("lockPass").value);
    const hint = $("lockHint");
    const card = document.querySelector(".lock__card");

    if (pass === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      hint.classList.remove("error");
      hint.textContent = "열렸어요. 우리만의 공간으로 ♡";
      hideLock();
      return;
    }

    hint.classList.add("error");
    hint.textContent = "앗, 비밀번호가 달라요. 우리만 아는 숫자 4자리 ♡";
    card.classList.remove("shake");
    void card.offsetWidth;
    card.classList.add("shake");
    $("lockPass").select();
  });
}

// ===============================
// 3) 카운터
// ===============================

function diffNow() {
  const now = new Date();
  const ms = Math.max(0, now - START);

  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  const remSeconds = totalSeconds % 60;
  const remMinutes = totalMinutes % 60;
  const remHours = totalHours % 24;

  return {
    now,
    totalSeconds,
    totalMinutes,
    totalHours,
    totalDays,
    hhmmss: `${pad2(remHours)}:${pad2(remMinutes)}:${pad2(remSeconds)}`,
  };
}

function renderCounter() {
  const { now, totalDays, totalHours, totalMinutes, totalSeconds, hhmmss } = diffNow();

  $("startDateLabel").textContent = fmtDate(START);
  $("todayLabel").textContent = fmtDate(now);

  $("dDay").textContent = `D+${totalDays}`;
  $("sinceText").textContent = `${fmtDate(START)}부터 우리가 만든 따뜻한 시간`;
  $("hhmmss").textContent = hhmmss;

  $("days").textContent = totalDays.toLocaleString();
  $("hours").textContent = totalHours.toLocaleString();
  $("minutes").textContent = totalMinutes.toLocaleString();
  $("seconds").textContent = totalSeconds.toLocaleString();
}

// ===============================
// 4) 마일스톤
// ===============================

function renderMilestones() {
  const { totalDays } = diffNow();
  const list = $("milestoneList");

  list.innerHTML = MILESTONES.map((m) => {
    const target = addDays(START, m.days);
    const left = m.days - totalDays;
    const pill = left <= 0 ? `D+${m.days}` : `D-${left}`;
    const msg = left <= 0 ? `이미 도착했어 ♡` : `${left}일 남았어 ♡`;

    return `
      <div class="milestone">
        <div class="milestone__left">
          <div class="milestone__name">${escapeHtml(m.name)}</div>
          <div class="milestone__date">${fmtDate(target)} · ${msg}</div>
        </div>
        <div class="pill">${pill}</div>
      </div>
    `;
  }).join("");

  const next = MILESTONES
    .map((m) => ({ ...m, left: m.days - totalDays, date: addDays(START, m.days) }))
    .filter((x) => x.left > 0)
    .sort((a, b) => a.left - b.left)[0];

  if (next) {
    $("nextLabel").textContent = `${next.name}까지`;
    $("nextValue").textContent = `${next.left}일 · ${fmtDate(next.date)}`;
  } else {
    $("nextLabel").textContent = "다음 기념일";
    $("nextValue").textContent = "새 마일스톤을 추가해도 좋아요 ♡";
  }
}

// ===============================
// 5) 메모(localStorage)
// ===============================

function loadMemos() {
  try {
    const raw = localStorage.getItem(LS_MEMO);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveMemos(memos) {
  localStorage.setItem(LS_MEMO, JSON.stringify(memos));
}
function renderMemos() {
  const wrap = $("memoList");
  const memos = loadMemos().sort((a,b) => b.createdAt - a.createdAt);

  if (!memos.length) {
    wrap.innerHTML = `<p class="hint">아직 메모가 없어요. 오늘의 다정함을 한 줄 남겨볼까요?</p>`;
    return;
  }

  wrap.innerHTML = memos.map((m) => `
    <div class="memo">
      <div class="memo__top">
        <div>
          <div class="memo__title">${escapeHtml(m.title || "제목 없음")}</div>
          <div class="memo__date">${fmtDate(new Date(m.createdAt))}</div>
        </div>
      </div>
      <div class="memo__body">${escapeHtml(m.body || "")}</div>
      <div class="memo__actions">
        <button class="btn btn--ghost" data-memo-del="${escapeHtml(m.id)}">삭제</button>
      </div>
    </div>
  `).join("");

  wrap.querySelectorAll("[data-memo-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-memo-del");
      const next = loadMemos().filter(x => x.id !== id);
      saveMemos(next);
      renderMemos();
    });
  });
}
function initMemo() {
  const form = $("memoForm");
  const titleEl = $("memoTitle");
  const bodyEl = $("memoBody");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = titleEl.value.trim();
    const body = bodyEl.value.trim();
    if (!title && !body) return;

    const memos = loadMemos();
    memos.push({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
      title,
      body,
      createdAt: Date.now(),
    });
    saveMemos(memos);

    titleEl.value = "";
    bodyEl.value = "";
    renderMemos();
  });

  $("clearMemos").addEventListener("click", () => {
    localStorage.removeItem(LS_MEMO);
    renderMemos();
  });
}

// ===============================
// 6) IndexedDB
// ===============================

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const _db = req.result;

      if (!_db.objectStoreNames.contains(STORE)) {
        const store = _db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("order", "order", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("album", "album", { unique: false });
      } else {
        // store exists, ensure index
        const store = req.transaction.objectStore(STORE);
        if (!store.indexNames.contains("album")) {
          store.createIndex("album", "album", { unique: false });
        }
      }
    };

    req.onsuccess = () => { db = req.result; resolve(db); };
    req.onerror = () => reject(req.error || new Error("DB를 열 수 없어요."));
  });
}

function tx(storeName, mode = "readonly") {
  const t = db.transaction(storeName, mode);
  return t.objectStore(storeName);
}

function idbGetAllSorted() {
  return new Promise((resolve, reject) => {
    const store = tx(STORE, "readonly");
    const req = store.getAll();

    req.onsuccess = () => {
      const rows = req.result || [];
      rows.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

function idbPut(item) {
  return new Promise((resolve, reject) => {
    const store = tx(STORE, "readwrite");
    const req = store.put(item);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

function idbDelete(id) {
  return new Promise((resolve, reject) => {
    const store = tx(STORE, "readwrite");
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

function idbClear() {
  return new Promise((resolve, reject) => {
    const store = tx(STORE, "readwrite");
    const req = store.clear();
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

// ===============================
// 7) 이미지 압축
// ===============================

function fileToDataUrlCompressed(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("파일을 읽을 수 없어요."));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const longSide = Math.max(width, height);
        const scale = longSide > MAX_IMAGE_LONG_SIDE ? (MAX_IMAGE_LONG_SIDE / longSide) : 1;

        const w = Math.round(width * scale);
        const h = Math.round(height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        const dataUrl = canvas.toDataURL("image/jpeg", JPG_QUALITY);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("이미지를 불러올 수 없어요."));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ===============================
// 8) Edit Modal
// ===============================

let currentEditId = null;

function openEditModal() {
  $("editModal").classList.add("show");
  $("editModal").setAttribute("aria-hidden", "false");
}
function closeEditModal() {
  $("editModal").classList.remove("show");
  $("editModal").setAttribute("aria-hidden", "true");
  currentEditId = null;
}

function initEditModal() {
  $("editModal").addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.getAttribute && t.getAttribute("data-close") === "1") closeEditModal();
  });

  $("saveEdit").addEventListener("click", async () => {
    if (!currentEditId) return;

    const album = normalizeAlbum($("editAlbum").value);
    const dateTs = fromISODateInputValue($("editDate").value);
    const caption = $("editCaption").value.trim();

    const items = await idbGetAllSorted();
    const target = items.find(x => x.id === currentEditId);
    if (!target) return;

    target.album = album;
    target.date = dateTs;
    target.caption = caption;

    await idbPut(target);
    await rebuildAlbumOptions();
    resetPagingState(true);
    await renderGallery();
    closeEditModal();
  });
}

// ===============================
// 9) Password Prompt Modal (delete all)
// ===============================

let pmodalResolver = null;

function openPasswordModal(descText) {
  $("pmodalDesc").textContent = descText || "안전을 위해 비밀번호가 필요해요.";
  $("pmodalPass").value = "";
  $("pmodalHint").textContent = "비밀번호가 틀리면 실행되지 않아요.";
  $("pmodal").classList.add("show");
  $("pmodal").setAttribute("aria-hidden", "false");
  setTimeout(() => $("pmodalPass").focus(), 0);

  return new Promise((resolve) => { pmodalResolver = resolve; });
}

function closePasswordModal(result) {
  $("pmodal").classList.remove("show");
  $("pmodal").setAttribute("aria-hidden", "true");
  if (pmodalResolver) {
    pmodalResolver(result);
    pmodalResolver = null;
  }
}

function initPasswordModal() {
  $("pmodal").addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.getAttribute && t.getAttribute("data-pclose") === "1") closePasswordModal(false);
  });

  $("pmodalOk").addEventListener("click", () => {
    const pass = normalizePass($("pmodalPass").value);
    if (pass === PASSWORD) return closePasswordModal(true);

    $("pmodalHint").textContent = "비밀번호가 달라요. 다시 한 번만 ♡";
    $("pmodalPass").select();
  });

  $("pmodalPass").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("pmodalOk").click();
    if (e.key === "Escape") closePasswordModal(false);
  });
}

// ===============================
// 10) 앨범 + 페이징 상태
// ===============================

let galleryAll = [];
let galleryView = [];         // 필터 적용 후
let gallerySlice = [];        // 현재 페이지 표시 목록

let currentAlbum = "__ALL__";
let page = 0;

function resetPagingState(resetPage = true) {
  if (resetPage) page = 0;
  gallerySlice = [];
}

function applyFilterAndPaging() {
  if (currentAlbum === "__ALL__") {
    galleryView = [...galleryAll];
  } else {
    galleryView = galleryAll.filter(x => (x.album || "기본앨범") === currentAlbum);
  }

  const total = galleryView.length;
  const nextEnd = Math.min(total, (page + 1) * PAGE_SIZE);
  gallerySlice = galleryView.slice(0, nextEnd);

  $("pagingHint").textContent = `${gallerySlice.length} / ${total}장`;
  $("loadMore").style.display = (gallerySlice.length < total) ? "inline-flex" : "none";
}

async function rebuildAlbumOptions() {
  const items = await idbGetAllSorted();
  const albums = new Set(items.map(x => x.album || "기본앨범"));
  const list = [...albums].sort((a,b) => a.localeCompare(b, "ko"));

  const sel = $("albumFilter");
  const prev = sel.value || "__ALL__";

  sel.innerHTML = `<option value="__ALL__">전체 앨범</option>` + list.map(a =>
    `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`
  ).join("");

  // 가능한 경우 기존 선택 유지
  if ([ "__ALL__", ...list ].includes(prev)) sel.value = prev;
  else sel.value = "__ALL__";
}

// ===============================
// 11) 라이트박스 + 좌우 넘기기 + 스와이프
// ===============================

let lbIndex = 0;

function openLightbox() {
  $("lightbox").classList.add("show");
  $("lightbox").setAttribute("aria-hidden", "false");
}
function closeLightbox() {
  $("lightbox").classList.remove("show");
  $("lightbox").setAttribute("aria-hidden", "true");
}

function setLightboxByIndex(i) {
  const arr = gallerySlice;
  if (!arr.length) return;

  lbIndex = (i + arr.length) % arr.length;
  const it = arr[lbIndex];

  $("lbImg").src = it.dataUrl;
  $("lbCaption").textContent = it.caption?.trim() ? it.caption.trim() : "캡션 없음";
  $("lbSub").textContent = `${it.album || "기본앨범"} · ${it.date ? niceShortDate(it.date) : "날짜 없음"} · ${it.name || "photo"} (${lbIndex + 1}/${arr.length})`;
}

function initLightbox() {
  $("lightbox").addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.getAttribute && t.getAttribute("data-lb-close") === "1") closeLightbox();
  });

  $("lbPrev").addEventListener("click", () => setLightboxByIndex(lbIndex - 1));
  $("lbNext").addEventListener("click", () => setLightboxByIndex(lbIndex + 1));

  document.addEventListener("keydown", (e) => {
    const open = $("lightbox").classList.contains("show");
    if (!open) return;

    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") setLightboxByIndex(lbIndex - 1);
    if (e.key === "ArrowRight") setLightboxByIndex(lbIndex + 1);
  });

  // ✅ 모바일 스와이프
  const stage = $("lbStage");
  let startX = 0;
  let startY = 0;
  let tracking = false;

  stage.addEventListener("touchstart", (e) => {
    if (!$("lightbox").classList.contains("show")) return;
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    tracking = true;
  }, { passive: true });

  stage.addEventListener("touchmove", (e) => {
    // 세로 스크롤 방해하지 않도록 여기서는 막지 않음
    // (touch-action: pan-y로 수평만 처리)
  }, { passive: true });

  stage.addEventListener("touchend", (e) => {
    if (!tracking) return;
    tracking = false;

    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    // 수평 스와이프만 인식 (세로로 많이 움직이면 무시)
    if (Math.abs(dx) < 40) return;
    if (Math.abs(dy) > 60) return;

    if (dx < 0) setLightboxByIndex(lbIndex + 1); // 왼쪽으로 밀면 다음
    else setLightboxByIndex(lbIndex - 1);        // 오른쪽으로 밀면 이전
  }, { passive: true });
}

// ===============================
// 12) 갤러리 렌더/드래그정렬(현재 앨범/뷰 기준)
// ===============================

let dragSrcId = null;

async function renderGallery() {
  const wrap = $("gallery");

  galleryAll = await idbGetAllSorted();
  $("photoCount").textContent = String(galleryAll.length);

  applyFilterAndPaging();

  if (!gallerySlice.length) {
    wrap.innerHTML = `<p class="hint">아직 사진이 없어요. 우리 첫 장을 담아볼까요?</p>`;
    return;
  }

  wrap.innerHTML = gallerySlice.map((it, idx) => {
    const caption = it.caption?.trim() ? it.caption.trim() : "캡션 없음";
    const dateLabel = it.date ? niceShortDate(it.date) : "날짜 없음";
    const fileLabel = it.name ? it.name : "photo";

    return `
      <div class="photo" draggable="true" data-id="${escapeHtml(it.id)}" data-idx="${idx}">
        <img class="photo__img" src="${it.dataUrl}" alt="${escapeHtml(caption)}" loading="lazy" />
        <div class="photo__tags">
          <span class="tag">${escapeHtml(it.album || "기본앨범")}</span>
          <span class="tag">${escapeHtml(dateLabel)}</span>
        </div>

        <div class="photo__bar">
          <div class="photo__name">
            <div class="photo__caption">${escapeHtml(caption)}</div>
            <div class="photo__sub">${escapeHtml(fileLabel)}</div>
          </div>

          <div class="photo__actions">
            <button class="iconBtn" type="button" title="수정" data-edit="${escapeHtml(it.id)}">✎</button>
            <button class="iconBtn" type="button" title="삭제" data-del="${escapeHtml(it.id)}">✕</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  // 카드 클릭 → 라이트박스 (버튼 클릭 제외)
  wrap.querySelectorAll(".photo").forEach((card) => {
    card.addEventListener("click", (e) => {
      const t = e.target;
      if (t && (t.closest("[data-edit]") || t.closest("[data-del]"))) return;

      const idx = Number(card.getAttribute("data-idx"));
      setLightboxByIndex(idx);
      openLightbox();
    });
  });

  // 삭제
  wrap.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-del");
      await idbDelete(id);
      await normalizeOrders();
      await rebuildAlbumOptions();
      await renderGallery();
    });
  });

  // 수정
  wrap.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-edit");
      const target = galleryAll.find(x => x.id === id);
      if (!target) return;

      currentEditId = id;
      $("editAlbum").value = target.album || "기본앨범";
      $("editDate").value = target.date ? toISODateInputValue(target.date) : "";
      $("editCaption").value = target.caption || "";
      openEditModal();
    });
  });

  initDragAndDrop();
}

function initDragAndDrop() {
  const wrap = $("gallery");
  const cards = [...wrap.querySelectorAll(".photo")];

  cards.forEach((card) => {
    card.addEventListener("dragstart", (e) => {
      dragSrcId = card.getAttribute("data-id");
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      dragSrcId = null;
    });

    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    card.addEventListener("drop", async (e) => {
      e.preventDefault();
      const targetId = card.getAttribute("data-id");
      if (!dragSrcId || !targetId || targetId === dragSrcId) return;

      await reorderByDrop(dragSrcId, targetId);
      await renderGallery();
    });
  });
}

// ⚠️ 드래그 정렬은 "현재 보여지는 slice" 기준으로 바꾸고,
// 실제 전체 order는 ALL 목록에서 반영 (필터/페이징에서도 자연스럽게 유지)
async function reorderByDrop(srcId, targetId) {
  const all = await idbGetAllSorted();

  const srcItem = all.find(x => x.id === srcId);
  const tgtItem = all.find(x => x.id === targetId);
  if (!srcItem || !tgtItem) return;

  // 같은 앨범 내에서만 정렬되게(기본)
  const srcAlbum = srcItem.album || "기본앨범";
  const tgtAlbum = tgtItem.album || "기본앨범";
  if (srcAlbum !== tgtAlbum) return;

  const albumItems = all.filter(x => (x.album || "기본앨범") === srcAlbum);
  albumItems.sort((a,b) => (a.order ?? 0) - (b.order ?? 0));

  const srcIdx = albumItems.findIndex(x => x.id === srcId);
  const tgtIdx = albumItems.findIndex(x => x.id === targetId);
  if (srcIdx < 0 || tgtIdx < 0) return;

  const [moved] = albumItems.splice(srcIdx, 1);
  albumItems.splice(tgtIdx, 0, moved);

  // 앨범 아이템만 order 재할당
  // 전체 order가 섞여 있어도 "앨범 단위"의 상대 순서를 유지하도록 재정규화
  // (단순하고 안정적인 방식)
  const base = Math.min(...albumItems.map(x => x.order ?? 0));
  for (let i = 0; i < albumItems.length; i++) {
    albumItems[i].order = base + i;
    await idbPut(albumItems[i]);
  }
}

async function normalizeOrders() {
  const items = await idbGetAllSorted();
  for (let i = 0; i < items.length; i++) {
    if (items[i].order !== i) {
      items[i].order = i;
      await idbPut(items[i]);
    }
  }
}

// ===============================
// 13) 업로드/백업/복원 + 전체삭제 비번
// ===============================

async function addPhotosFromFiles(files, album, dateTs, caption) {
  const current = await idbGetAllSorted();
  let orderStart = current.length;

  for (const f of files) {
    if (!f.type.startsWith("image/")) continue;

    const dataUrl = await fileToDataUrlCompressed(f);
    const item = {
      id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()),
      album,
      name: humanName(f.name),
      caption: caption?.trim() || "",
      date: dateTs || null,
      dataUrl,
      createdAt: Date.now(),
      order: orderStart++,
    };
    await idbPut(item);
  }
}

function downloadJSON(filename, obj) {
  const blob = new Blob([JSON.stringify(obj)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function exportDB() {
  const items = await idbGetAllSorted();
  downloadJSON("yw_jy_gallery_backup.json", items);
}

async function importDBFromFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error("백업 파일 형식이 올바르지 않아요.");

  await idbClear();

  const cleaned = parsed
    .filter(x => x && typeof x.dataUrl === "string")
    .map((x, idx) => ({
      id: x.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()),
      album: normalizeAlbum(x.album),
      name: String(x.name || "photo"),
      caption: String(x.caption || ""),
      date: (typeof x.date === "number" ? x.date : null),
      dataUrl: x.dataUrl,
      createdAt: (typeof x.createdAt === "number" ? x.createdAt : Date.now()),
      order: (typeof x.order === "number" ? x.order : idx),
    }));

  cleaned.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  for (let i = 0; i < cleaned.length; i++) {
    cleaned[i].order = i;
    await idbPut(cleaned[i]);
  }
}

function initGalleryUI() {
  $("photoDate").value = toISODateInputValue(new Date());

  $("photoInput").addEventListener("change", async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;

    const album = normalizeAlbum($("albumName").value);
    const dateTs = fromISODateInputValue($("photoDate").value);
    const caption = $("photoCaption").value.trim();

    try {
      await addPhotosFromFiles(files, album, dateTs, caption);
      await rebuildAlbumOptions();
      resetPagingState(true);
      await renderGallery();
      e.target.value = "";
    } catch (err) {
      alert(err?.message || "사진을 추가하는 중 문제가 생겼어요.");
    }
  });

  $("albumFilter").addEventListener("change", async (e) => {
    currentAlbum = e.target.value;
    resetPagingState(true);
    await renderGallery();
  });

  $("loadMore").addEventListener("click", async () => {
    page += 1;
    await renderGallery();
  });

  $("resetPaging").addEventListener("click", async () => {
    resetPagingState(true);
    await renderGallery();
  });

  $("clearDB").addEventListener("click", async () => {
    const ok = confirm("갤러리를 전부 지울까요? (사진이 정말 다 사라져요)");
    if (!ok) return;

    const passOk = await openPasswordModal("갤러리를 전부 삭제하려면 비밀번호(0113)가 필요해요.");
    if (!passOk) return;

    await idbClear();
    resetPagingState(true);
    await rebuildAlbumOptions();
    await renderGallery();
  });

  $("exportDB").addEventListener("click", exportDB);

  $("importDB").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importDBFromFile(file);
      await normalizeOrders();
      await rebuildAlbumOptions();
      resetPagingState(true);
      await renderGallery();
      e.target.value = "";
    } catch (err) {
      alert(err?.message || "복원에 실패했어요. 백업 파일을 확인해줘요.");
    }
  });

  $("resetPaging").click(); // 초기 상태 힌트 세팅
}

// ===============================
// 14) Boot
// ===============================

async function boot() {
  initLock();
  initPasswordModal();
  initEditModal();
  initLightbox();

  renderCounter();
  renderMilestones();
  renderMemos();
  initMemo();

  await openDB();
  await normalizeOrders();
  await rebuildAlbumOptions();
  currentAlbum = $("albumFilter").value || "__ALL__";
  resetPagingState(true);
  await renderGallery();
  initGalleryUI();

  setInterval(() => {
    renderCounter();
    renderMilestones();
  }, 1000);
}

boot();
