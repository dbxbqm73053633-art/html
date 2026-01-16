// =====================================
// Firebase (RTDB + Storage) 버전
// - 사진: Storage 업로드 + RTDB에 메타 저장
// - 메모: RTDB 저장
// =====================================

// -------------------------------
// 0) 기존 설정(비번/카운터 등)
// -------------------------------
const PASSWORD = "0113";
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

// 페이징
const PAGE_SIZE = 12;

// -------------------------------
// 1) Firebase 초기화 (너가 준 설정 + RTDB URL 적용)
// -------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js";

import {
  getDatabase, ref, onValue, set, update, remove, get, child
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

import {
  getStorage, ref as sref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCbAWAchLN1IRitre_VW-drnSoPPBkVDSo",
  authDomain: "duddn730.firebaseapp.com",
  projectId: "duddn730",
  storageBucket: "duddn730.firebasestorage.app",
  messagingSenderId: "326941968662",
  appId: "1:326941968662:web:a1d756ce52e22a92fd2837",
  measurementId: "G-XJCZH9SJLS"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);

// ✅ RTDB 주소를 명시적으로 지정
const db = getDatabase(app, "https://duddn730-default-rtdb.asia-southeast1.firebasedatabase.app/");
const storage = getStorage(app);

// DB 경로
const PHOTOS_PATH = "photos";
const MEMOS_PATH = "memos";

// -------------------------------
// 2) 유틸
// -------------------------------
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
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
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

function uid() {
  return (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());
}

function dataUrlToBlob(dataUrl) {
  const [meta, b64] = dataUrl.split(",");
  const mime = (meta.match(/data:(.*?);base64/) || [])[1] || "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// -------------------------------
// 3) 잠금 화면
// -------------------------------
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

// -------------------------------
// 4) 카운터
// -------------------------------
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

// -------------------------------
// 5) 마일스톤
// -------------------------------
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

// -------------------------------
// 6) 이미지 압축 → dataURL (기존 유지)
// -------------------------------
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

// -------------------------------
// 7) Firebase: 사진/메모 데이터 상태
// -------------------------------
let galleryAll = [];    // 전체 사진 (order 정렬)
let galleryView = [];   // 필터 적용 후
let gallerySlice = [];  // 현재 페이지 표시 목록
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

function rebuildAlbumOptionsFromList(items) {
  const albums = new Set(items.map(x => x.album || "기본앨범"));
  const list = [...albums].sort((a,b) => a.localeCompare(b, "ko"));

  const sel = $("albumFilter");
  const prev = sel.value || "__ALL__";

  sel.innerHTML = `<option value="__ALL__">전체 앨범</option>` + list.map(a =>
    `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`
  ).join("");

  if ([ "__ALL__", ...list ].includes(prev)) sel.value = prev;
  else sel.value = "__ALL__";
}

// -------------------------------
// 8) Lightbox (기존 유지)
// -------------------------------
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

  $("lbImg").src = it.url; // ✅ Storage URL
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

  stage.addEventListener("touchend", (e) => {
    if (!tracking) return;
    tracking = false;

    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    if (Math.abs(dx) < 40) return;
    if (Math.abs(dy) > 60) return;

    if (dx < 0) setLightboxByIndex(lbIndex + 1);
    else setLightboxByIndex(lbIndex - 1);
  }, { passive: true });
}

// -------------------------------
// 9) Edit Modal (Firebase update)
// -------------------------------
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

    // ✅ RTDB 업데이트
    await update(ref(db, `${PHOTOS_PATH}/${currentEditId}`), {
      album,
      date: dateTs || null,
      caption
    });

    closeEditModal();
  });
}

// -------------------------------
// 10) Password Modal (기존 유지)
// -------------------------------
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

// -------------------------------
// 11) 갤러리 렌더 + 드래그정렬(앨범 내 order 재할당)
// -------------------------------
let dragSrcId = null;

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

      await reorderByDropFirebase(dragSrcId, targetId);
    });
  });
}

async function reorderByDropFirebase(srcId, targetId) {
  const srcItem = galleryAll.find(x => x.id === srcId);
  const tgtItem = galleryAll.find(x => x.id === targetId);
  if (!srcItem || !tgtItem) return;

  const srcAlbum = srcItem.album || "기본앨범";
  const tgtAlbum = tgtItem.album || "기본앨범";
  if (srcAlbum !== tgtAlbum) return;

  const albumItems = galleryAll
    .filter(x => (x.album || "기본앨범") === srcAlbum)
    .sort((a,b) => (a.order ?? 0) - (b.order ?? 0));

  const srcIdx = albumItems.findIndex(x => x.id === srcId);
  const tgtIdx = albumItems.findIndex(x => x.id === targetId);
  if (srcIdx < 0 || tgtIdx < 0) return;

  const [moved] = albumItems.splice(srcIdx, 1);
  albumItems.splice(tgtIdx, 0, moved);

  // ✅ 앨범 단위로 order 재할당 후 RTDB update
  const updates = {};
  for (let i = 0; i < albumItems.length; i++) {
    updates[`${PHOTOS_PATH}/${albumItems[i].id}/order`] = i;
  }
  await update(ref(db), updates);
}

function renderGallery() {
  const wrap = $("gallery");

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
        <img class="photo__img" src="${it.url}" alt="${escapeHtml(caption)}" loading="lazy" />
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

  // 삭제(Storage 파일 + RTDB 메타)
  wrap.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-del");
      await deletePhotoFirebase(id);
    });
  });

  // 수정
  wrap.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
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

// -------------------------------
// 12) Firebase: 사진 CRUD
// -------------------------------
async function uploadPhotoToStorageAndSaveMeta({ file, album, dateTs, caption, order }) {
  // 1) 압축 -> dataURL -> blob
  const dataUrl = await fileToDataUrlCompressed(file);
  const blob = dataUrlToBlob(dataUrl);

  // 2) Storage 업로드
  const id = uid();
  const ext = "jpg";
  const storagePath = `photos/${id}.${ext}`;
  const storageRef = sref(storage, storagePath);

  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  const url = await getDownloadURL(storageRef);

  // 3) RTDB 메타 저장
  const item = {
    id,
    album,
    name: humanName(file.name),
    caption: caption?.trim() || "",
    date: dateTs || null,
    createdAt: Date.now(),
    order: typeof order === "number" ? order : 0,
    storagePath,
    url
  };

  await set(ref(db, `${PHOTOS_PATH}/${id}`), item);
}

async function deletePhotoFirebase(id) {
  const target = galleryAll.find(x => x.id === id);
  if (!target) return;

  // Storage 파일 삭제 시도(실패해도 메타는 삭제)
  if (target.storagePath) {
    try {
      await deleteObject(sref(storage, target.storagePath));
    } catch (e) {
      // 권한/이미 삭제 등은 무시
    }
  }
  await remove(ref(db, `${PHOTOS_PATH}/${id}`));
}

async function clearAllPhotosFirebase() {
  // 현재 목록을 기반으로 Storage 파일도 최대한 지움
  const tasks = galleryAll.map(async (it) => {
    if (it.storagePath) {
      try { await deleteObject(sref(storage, it.storagePath)); } catch {}
    }
  });
  await Promise.allSettled(tasks);

  // 메타 전체 삭제
  await remove(ref(db, PHOTOS_PATH));
}

// -------------------------------
// 13) Firebase: 메모 CRUD
// -------------------------------
function renderMemosFromList(list) {
  const wrap = $("memoList");
  const memos = [...list].sort((a,b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

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
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-memo-del");
      await remove(ref(db, `${MEMOS_PATH}/${id}`));
    });
  });
}

function initMemoUI() {
  const form = $("memoForm");
  const titleEl = $("memoTitle");
  const bodyEl = $("memoBody");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = titleEl.value.trim();
    const body = bodyEl.value.trim();
    if (!title && !body) return;

    const id = uid();
    await set(ref(db, `${MEMOS_PATH}/${id}`), {
      id,
      title,
      body,
      createdAt: Date.now()
    });

    titleEl.value = "";
    bodyEl.value = "";
  });

  $("clearMemos").addEventListener("click", async () => {
    await remove(ref(db, MEMOS_PATH));
  });
}

// -------------------------------
// 14) 백업/복원(JSON)
// - export: RTDB의 photo 메타 + memo를 JSON으로 다운로드
// - import: photos에 dataUrl이 있으면 Storage에 올리고 복원
// -------------------------------
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

async function exportAll() {
  const snap = await get(ref(db));
  const all = snap.val() || {};
  downloadJSON("yw_jy_backup.json", {
    exportedAt: Date.now(),
    photos: all[PHOTOS_PATH] || {},
    memos: all[MEMOS_PATH] || {}
  });
}

// import 포맷 2가지 지원:
// A) { photos: {id: { ... , url, storagePath } }, memos: {...} }  -> 메타만 복원(스토리지는 기존 url 가정)
// B) photos 안에 dataUrl이 들어있으면 -> 새로 업로드 후 복원
async function importAllFromFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);

  const photosObj = parsed?.photos || {};
  const memosObj = parsed?.memos || {};

  // 1) 메모 복원 (통째로 set)
  await set(ref(db, MEMOS_PATH), memosObj);

  // 2) 사진 복원
  // dataUrl 있으면 새로 업로드 -> 새 id로 저장
  const photoEntries = Object.values(photosObj);

  for (const p of photoEntries) {
    if (p && typeof p.dataUrl === "string" && p.dataUrl.startsWith("data:")) {
      // dataUrl 기반 복원(스토리지 새 업로드)
      const id = uid();
      const storagePath = `photos/${id}.jpg`;
      const storageRef = sref(storage, storagePath);

      const blob = dataUrlToBlob(p.dataUrl);
      await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
      const url = await getDownloadURL(storageRef);

      await set(ref(db, `${PHOTOS_PATH}/${id}`), {
        id,
        album: normalizeAlbum(p.album),
        name: String(p.name || "photo"),
        caption: String(p.caption || ""),
        date: (typeof p.date === "number" ? p.date : null),
        createdAt: (typeof p.createdAt === "number" ? p.createdAt : Date.now()),
        order: (typeof p.order === "number" ? p.order : 0),
        storagePath,
        url
      });
    } else if (p && p.id && p.url) {
      // 메타만 복원(기존 url/경로 그대로)
      const clean = {
        id: String(p.id),
        album: normalizeAlbum(p.album),
        name: String(p.name || "photo"),
        caption: String(p.caption || ""),
        date: (typeof p.date === "number" ? p.date : null),
        createdAt: (typeof p.createdAt === "number" ? p.createdAt : Date.now()),
        order: (typeof p.order === "number" ? p.order : 0),
        storagePath: p.storagePath || null,
        url: String(p.url)
      };
      await set(ref(db, `${PHOTOS_PATH}/${clean.id}`), clean);
    }
  }
}

// -------------------------------
// 15) Firebase 리스너(실시간 반영)
// -------------------------------
function listenPhotos() {
  onValue(ref(db, PHOTOS_PATH), (snap) => {
    const obj = snap.val() || {};
    const rows = Object.values(obj);

    // order 정렬
    rows.sort((a,b) => (a.order ?? 0) - (b.order ?? 0));

    galleryAll = rows;

    // 앨범 옵션 재구성
    rebuildAlbumOptionsFromList(galleryAll);

    // 현재 앨범 값 유지
    currentAlbum = $("albumFilter").value || "__ALL__";

    // 화면 렌더
    renderGallery();
  });
}

function listenMemos() {
  onValue(ref(db, MEMOS_PATH), (snap) => {
    const obj = snap.val() || {};
    renderMemosFromList(Object.values(obj));
  });
}

// -------------------------------
// 16) UI 이벤트(업로드/페이징/삭제/백업/복원)
// -------------------------------
function initGalleryUI() {
  $("photoDate").value = toISODateInputValue(new Date());

  $("photoInput").addEventListener("change", async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;

    const album = normalizeAlbum($("albumName").value);
    const dateTs = fromISODateInputValue($("photoDate").value);
    const caption = $("photoCaption").value.trim();

    try {
      const startOrder = galleryAll.length;

      // 여러 장 업로드
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (!f.type.startsWith("image/")) continue;
        await uploadPhotoToStorageAndSaveMeta({
          file: f,
          album,
          dateTs,
          caption,
          order: startOrder + i
        });
      }

      e.target.value = "";
      resetPagingState(true);
    } catch (err) {
      alert(err?.message || "사진을 추가하는 중 문제가 생겼어요.");
    }
  });

  $("albumFilter").addEventListener("change", async (e) => {
    currentAlbum = e.target.value;
    resetPagingState(true);
    renderGallery();
  });

  $("loadMore").addEventListener("click", () => {
    page += 1;
    renderGallery();
  });

  $("resetPaging").addEventListener("click", () => {
    resetPagingState(true);
    renderGallery();
  });

  $("clearDB").addEventListener("click", async () => {
    const ok = confirm("갤러리를 전부 지울까요? (사진이 정말 다 사라져요)");
    if (!ok) return;

    const passOk = await openPasswordModal("갤러리를 전부 삭제하려면 비밀번호(0113)가 필요해요.");
    if (!passOk) return;

    await clearAllPhotosFirebase();
    resetPagingState(true);
  });

  $("exportDB").addEventListener("click", exportAll);

  $("importDB").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importAllFromFile(file);
      e.target.value = "";
      alert("복원 완료 ♡");
    } catch (err) {
      alert(err?.message || "복원에 실패했어요. 백업 파일을 확인해줘요.");
    }
  });

  $("resetPaging").click();
}

// -------------------------------
// 17) Boot
// -------------------------------
function boot() {
  initLock();
  initPasswordModal();
  initEditModal();
  initLightbox();

  renderCounter();
  renderMilestones();

  initMemoUI();
  initGalleryUI();

  listenPhotos();
  listenMemos();

  setInterval(() => {
    renderCounter();
    renderMilestones();
  }, 1000);
}

boot();
