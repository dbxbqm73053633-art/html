// ===============================
// 0) 설정
// ===============================

const PASSWORD = "0113"; // ✅ 공통 비밀번호
const SESSION_KEY = "ywjy_unlocked_v1";

// ✅ 사귄 날짜: 1월 13일(화요일) (연도 필요하면 여기만 변경)
const START = new Date(2026, 0, 13, 0, 0, 0);

// 마일스톤
const MILESTONES = [
  { days: 100, name: "100일 (우리, 꽤 멋지게 여기까지)" },
  { days: 200, name: "200일 (서로에게 더 편해진 날)" },
  { days: 365, name: "1주년 (처음부터 지금까지, 너라서)" },
  { days: 500, name: "500일 (사랑은 오늘도 진행 중)" },
  { days: 730, name: "2주년 (익숙함 속 설렘)" },
  { days: 1000, name: "1000일 (우리만의 전설)" },
];

// 이미지 저장 크기/품질 (IndexedDB라도 리사이즈 저장 권장)
const MAX_IMAGE_LONG_SIDE = 1600;
const JPG_QUALITY = 0.86;

// localStorage (메모)
const LS_MEMO = "ourday_memos_v4";

// IndexedDB (갤러리)
const DB_NAME = "yw_jy_story_db";
const DB_VERSION = 1;
const STORE = "photos";

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

// ===============================
// 2) 잠금 화면(Entrance Gate)
// ===============================

function showLock() {
  const lock = $("lock");
  lock.classList.add("show");
  lock.setAttribute("aria-hidden", "false");
  $("lockPass").value = "";
  $("lockPass").focus();
}

function hideLock() {
  const lock = $("lock");
  lock.classList.remove("show");
  lock.setAttribute("aria-hidden", "true");
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
    void card.offsetWidth; // reflow
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
// 6) IndexedDB 래퍼
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
      }
    };

    req.onsuccess = () => {
      db = req.result;
      resolve(db);
    };
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
// 7) 이미지 압축 → dataUrl
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
// 8) Edit Modal (caption/date)
// ===============================

let currentEditId = null;

function openEditModal() {
  const m = $("editModal");
  m.classList.add("show");
  m.setAttribute("aria-hidden", "false");
}
function closeEditModal() {
  const m = $("editModal");
  m.classList.remove("show");
  m.setAttribute("aria-hidden", "true");
  currentEditId = null;
}

function initEditModal() {
  $("editModal").addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.getAttribute && t.getAttribute("data-close") === "1") closeEditModal();
  });

  $("saveEdit").addEventListener("click", async () => {
    if (!currentEditId) return;

    const dateTs = fromISODateInputValue($("editDate").value);
    const caption = $("editCaption").value.trim();

    const items = await idbGetAllSorted();
    const target = items.find(x => x.id === currentEditId);
    if (!target) return;

    target.date = dateTs;
    target.caption = caption;

    await idbPut(target);
    await renderGallery();
    closeEditModal();
  });
}

// ===============================
// 9) Password Prompt Modal (delete all)
// ===============================

let pmodalResolver = null;

function openPasswordModal(descText = "안전을 위해 비밀번호가 필요해요.") {
  $("pmodalDesc").textContent = descText;
  $("pmodalPass").value = "";
  $("pmodalHint").textContent = "비밀번호가 틀리면 실행되지 않아요.";
  const m = $("pmodal");
  m.classList.add("show");
  m.setAttribute("aria-hidden", "false");
  setTimeout(() => $("pmodalPass").focus(), 0);

  return new Promise((resolve) => {
    pmodalResolver = resolve;
  });
}
function closePasswordModal(result) {
  const m = $("pmodal");
  m.classList.remove("show");
  m.setAttribute("aria-hidden", "true");
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
// 10) 갤러리 렌더/정렬/라이트박스
// ===============================

let dragSrcId = null;
let galleryCache = [];   // 라이트박스/넘김에 사용
let lbIndex = 0;

function openLightbox() {
  const lb = $("lightbox");
  lb.classList.add("show");
  lb.setAttribute("aria-hidden", "false");
}
function closeLightbox() {
  const lb = $("lightbox");
  lb.classList.remove("show");
  lb.setAttribute("aria-hidden", "true");
}

function setLightboxByIndex(i) {
  if (!galleryCache.length) return;
  lbIndex = (i + galleryCache.length) % galleryCache.length;
  const it = galleryCache[lbIndex];

  $("lbImg").src = it.dataUrl;
  $("lbCaption").textContent = it.caption?.trim() ? it.caption.trim() : "캡션 없음";
  $("lbSub").textContent = `${it.date ? niceShortDate(it.date) : "날짜 없음"} · ${it.name || "photo"} (${lbIndex + 1}/${galleryCache.length})`;
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
}

async function renderGallery() {
  const wrap = $("gallery");
  galleryCache = await idbGetAllSorted();
  $("photoCount").textContent = String(galleryCache.length);

  if (!galleryCache.length) {
    wrap.innerHTML = `<p class="hint">아직 사진이 없어요. 우리 첫 장을 담아볼까요?</p>`;
    return;
  }

  wrap.innerHTML = galleryCache.map((it, idx) => {
    const caption = it.caption?.trim() ? it.caption.trim() : "캡션 없음";
    const dateLabel = it.date ? niceShortDate(it.date) : "날짜 없음";
    const fileLabel = it.name ? it.name : "photo";

    return `
      <div class="photo" draggable="true" data-id="${escapeHtml(it.id)}" data-idx="${idx}">
        <img class="photo__img" src="${it.dataUrl}" alt="${escapeHtml(caption)}" loading="lazy" />
        <div class="photo__tags">
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

  // 카드 클릭 → 라이트박스 (버튼 클릭은 제외)
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
      await renderGallery();
    });
  });

  // 수정
  wrap.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-edit");
      const target = galleryCache.find(x => x.id === id);
      if (!target) return;

      currentEditId = id;
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

async function reorderByDrop(srcId, targetId) {
  const items = await idbGetAllSorted();
  const srcIdx = items.findIndex(x => x.id === srcId);
  const tgtIdx = items.findIndex(x => x.id === targetId);
  if (srcIdx < 0 || tgtIdx < 0) return;

  const [moved] = items.splice(srcIdx, 1);
  items.splice(tgtIdx, 0, moved);

  for (let i = 0; i < items.length; i++) {
    items[i].order = i;
    await idbPut(items[i]);
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
// 11) 갤러리 업로드/백업/복원 + 전체삭제 비번
// ===============================

async function addPhotosFromFiles(files, dateTs, caption) {
  const current = await idbGetAllSorted();
  let orderStart = current.length;

  for (const f of files) {
    if (!f.type.startsWith("image/")) continue;

    const dataUrl = await fileToDataUrlCompressed(f);
    const item = {
      id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()),
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

    const dateTs = fromISODateInputValue($("photoDate").value);
    const caption = $("photoCaption").value.trim();

    try {
      await addPhotosFromFiles(files, dateTs, caption);
      await renderGallery();
      e.target.value = "";
    } catch (err) {
      alert(err?.message || "사진을 추가하는 중 문제가 생겼어요.");
    }
  });

  $("clearDB").addEventListener("click", async () => {
    const ok = confirm("갤러리를 전부 지울까요? (사진이 정말 다 사라져요)");
    if (!ok) return;

    const passOk = await openPasswordModal("갤러리를 전부 삭제하려면 비밀번호가 필요해요.");
    if (!passOk) return;

    await idbClear();
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
      await renderGallery();
      e.target.value = "";
    } catch (err) {
      alert(err?.message || "가져오기에 실패했어요. 백업 파일을 확인해줘요.");
    }
  });
}

// ===============================
// 12) Password Modal init
// ===============================

function initPasswordModalUI() {
  $("pmodal").addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.getAttribute && t.getAttribute("data-pclose") === "1") closePasswordModal(false);
  });
  // close 버튼
  $("pmodal").querySelectorAll("[data-pclose]").forEach((el) => {
    el.addEventListener("click", () => closePasswordModal(false));
  });
}

// ===============================
// 13) Boot
// ===============================

async function boot() {
  initLock();

  // password modal + edit modal + lightbox
  initPasswordModal();
  initEditModal();
  initLightbox();

  // counter/milestones/memos
  renderCounter();
  renderMilestones();
  renderMemos();
  initMemo();

  // DB
  await openDB();
  await normalizeOrders();
  await renderGallery();
  initGalleryUI();

  setInterval(() => {
    renderCounter();
    renderMilestones();
  }, 1000);
}

boot();
