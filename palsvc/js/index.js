/* ===============================
   Firebase + Firestore + Storage
   (No Auth) Shared by roomKey
   =============================== */

/* ---------- 0) 설정 ---------- */

const PASSWORD = "0113"; // 잠금 비번 (= roomKey로도 사용)
const SESSION_KEY = "ywjy_unlocked_v2";

// 함께 시작 날짜 (기존과 동일)
const START = new Date(2026, 0, 13, 0, 0, 0);

const MILESTONES = [
  { days: 100, name: "100일 (우리, 꽤 멋지게 여기까지)" },
  { days: 200, name: "200일 (서로에게 더 편해진 날)" },
  { days: 365, name: "1주년 (처음부터 지금까지, 너라서)" },
  { days: 500, name: "500일 (사랑은 오늘도 진행 중)" },
  { days: 730, name: "2주년 (익숙함 속 설렘)" },
  { days: 1000, name: "1000일 (우리만의 전설)" },
];

// 이미지 업로드 압축
const MAX_IMAGE_LONG_SIDE = 1600;
const JPG_QUALITY = 0.86;

// 페이징
const PAGE_SIZE = 12;

/* ---------- 1) Firebase 모듈 import ---------- */
// HTML에서 <script type="module" src="./js/index.js"></script> 로 로딩되는 전제
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  getStorage,
  ref as sRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

/* ---------- 2) Firebase 초기화 ---------- */

const firebaseConfig = {
  apiKey: "AIzaSyCbAWAchLN1IRitre_VW-drnSoPPBkVDSo",
  authDomain: "duddn730.firebaseapp.com",
  databaseURL: "https://duddn730-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "duddn730",
  storageBucket: "duddn730.firebasestorage.app",
  messagingSenderId: "326941968662",
  appId: "1:326941968662:web:a1d756ce52e22a92fd2837",
  measurementId: "G-XJCZH9SJLS",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

/* ---------- 3) 유틸 ---------- */

const $ = (id) => document.getElementById(id);
const week = ["일", "월", "화", "수", "목", "금", "토"];
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
  const d = tsOrDate instanceof Date ? tsOrDate : new Date(tsOrDate);
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

/** roomId 만들기: 비번 기반으로 같은 비번이면 같은 room */
async function makeRoomId(pass) {
  // 브라우저 crypto.subtle 지원 전제 (대부분 OK)
  const enc = new TextEncoder().encode(`room:${pass}`);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  // 너무 길 필요 없으니 앞 24자만
  return hex.slice(0, 24);
}

/* ---------- 4) 잠금 화면 ---------- */

let roomId = null;

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

  $("lockForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const pass = normalizePass($("lockPass").value);
    const hint = $("lockHint");
    const card = document.querySelector(".lock__card");

    if (pass === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      hint.classList.remove("error");
      hint.textContent = "열렸어요. 우리만의 공간으로 ♡";
      hideLock();

      // roomId 세팅
      roomId = await makeRoomId(pass);
      await ensureRoomDoc();
      await bootFirebaseData(); // 사진/메모 불러오기 시작
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

/* ---------- 5) 카운터 ---------- */

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

/* ---------- 6) 마일스톤 ---------- */

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

/* ---------- 7) Firestore 경로 ---------- */

function roomDocRef() {
  return doc(db, "rooms", roomId);
}
function photosColRef() {
  return collection(db, "rooms", roomId, "photos");
}
function memosColRef() {
  return collection(db, "rooms", roomId, "memos");
}

async function ensureRoomDoc() {
  // 방 문서가 없으면 만든다 (메타용)
  const ref = roomDocRef();
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      createdAt: serverTimestamp(),
      hint: "No-auth room. Share by password(roomKey).",
    });
  }
}

/* ---------- 8) 이미지 압축 + 업로드 ---------- */

async function fileToJpegBlobCompressed(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("파일을 읽을 수 없어요."));
    r.onload = () => resolve(r.result);
    r.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("이미지를 불러올 수 없어요."));
    i.src = dataUrl;
  });

  const { width, height } = img;
  const longSide = Math.max(width, height);
  const scale = longSide > MAX_IMAGE_LONG_SIDE ? MAX_IMAGE_LONG_SIDE / longSide : 1;

  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", JPG_QUALITY)
  );

  if (!blob) throw new Error("이미지 변환에 실패했어요.");
  return blob;
}

/* ---------- 9) 사진첩 (Firestore + Storage) ---------- */

let galleryAll = [];     // 현재 로딩된(필터 기준) 전체(페이지 누적)
let gallerySlice = [];   // 현재 화면 표시 목록 (= galleryAll)
let currentAlbum = "__ALL__";
let lastDocSnap = null;  // 페이징 커서

let dragSrcId = null;

// 라이트박스 인덱스
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

  $("lbImg").src = it.url;
  $("lbCaption").textContent = it.caption?.trim() ? it.caption.trim() : "캡션 없음";
  $("lbSub").textContent =
    `${it.album || "기본앨범"} · ${it.date ? niceShortDate(it.date) : "날짜 없음"} · ${it.name || "photo"} (${lbIndex + 1}/${arr.length})`;
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

  // 모바일 스와이프
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

function resetPagingState() {
  lastDocSnap = null;
  galleryAll = [];
  gallerySlice = [];
  $("pagingHint").textContent = "—";
  $("loadMore").style.display = "inline-flex";
}

async function fetchNextPhotosPage() {
  const col = photosColRef();

  // 앨범 필터
  let qBase = null;
  if (currentAlbum === "__ALL__") {
    qBase = query(col, orderBy("order", "asc"), limit(PAGE_SIZE));
  } else {
    // album + order 조합은 인덱스가 필요할 수 있어요.
    qBase = query(
      col,
      where("album", "==", currentAlbum),
      orderBy("order", "asc"),
      limit(PAGE_SIZE)
    );
  }

  const qPaged = lastDocSnap ? query(qBase, startAfter(lastDocSnap)) : qBase;
  const snap = await getDocs(qPaged);

  if (snap.empty) {
    $("loadMore").style.display = "none";
    return;
  }

  lastDocSnap = snap.docs[snap.docs.length - 1];

  const rows = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      album: data.album || "기본앨범",
      caption: data.caption || "",
      date: typeof data.date === "number" ? data.date : null,
      name: data.name || "photo",
      url: data.url || "",
      storagePath: data.storagePath || "",
      order: typeof data.order === "number" ? data.order : 0,
      createdAt: data.createdAt || null,
    };
  });

  galleryAll = [...galleryAll, ...rows];
  gallerySlice = [...galleryAll];

  $("photoCount").textContent = String(gallerySlice.length);

  // 페이징 힌트
  $("pagingHint").textContent = `${gallerySlice.length}장 표시 중`;
}

async function rebuildAlbumOptions() {
  // 작은 앱 기준: 전체를 한번 훑어서 앨범 목록 만든다
  const snap = await getDocs(query(photosColRef(), orderBy("createdAt", "desc"), limit(1500)));
  const albums = new Set();
  snap.forEach((d) => {
    const a = (d.data()?.album || "기본앨범").trim();
    albums.add(a || "기본앨범");
  });

  const list = [...albums].sort((a, b) => a.localeCompare(b, "ko"));
  const sel = $("albumFilter");
  const prev = sel.value || "__ALL__";

  sel.innerHTML =
    `<option value="__ALL__">전체 앨범</option>` +
    list.map((a) => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join("");

  // 기존 선택 유지
  if ([ "__ALL__", ...list ].includes(prev)) sel.value = prev;
  else sel.value = "__ALL__";
}

async function renderGallery() {
  const wrap = $("gallery");

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
        <img class="photo__img" src="${escapeHtml(it.url)}" alt="${escapeHtml(caption)}" loading="lazy" />
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
      const ok = confirm("이 사진을 삭제할까요? (Storage에서도 지워져요)");
      if (!ok) return;

      await deletePhotoById(id);
      await refreshPhotos(true);
    });
  });

  // 수정
  wrap.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-edit");
      const target = gallerySlice.find((x) => x.id === id);
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

async function uploadOnePhoto(file, album, dateTs, caption) {
  const blob = await fileToJpegBlobCompressed(file);

  // order = 현재 전체 사진 수 기준으로 끝에 붙이기
  // (정확도: 동시에 업로드하면 약간 엇갈릴 수 있지만, 커플앱은 충분)
  const countSnap = await getDocs(query(photosColRef(), orderBy("order", "asc"), limit(1)));
  // 위는 최솟값이라 의미 없음 → 그냥 createdAt 기반으로 order 대충 마지막으로:
  // 더 정확히 하려면 별도 counter 문서 필요.
  // 여기서는 Date.now()로 order를 큰 값으로 넣자.
  const orderValue = Date.now();

  // 먼저 Firestore doc 만들고 id 확보
  const docRef = await addDoc(photosColRef(), {
    album,
    caption: caption?.trim() || "",
    date: dateTs || null,
    name: humanName(file.name),
    createdAt: Date.now(),
    order: orderValue,
    url: "",
    storagePath: "",
  });

  const path = `rooms/${roomId}/photos/${docRef.id}.jpg`;
  const fileRef = sRef(storage, path);

  await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });
  const url = await getDownloadURL(fileRef);

  await updateDoc(docRef, { url, storagePath: path });

  return true;
}

async function deletePhotoById(id) {
  const ref = doc(db, "rooms", roomId, "photos", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const path = data?.storagePath;
  if (path) {
    try {
      await deleteObject(sRef(storage, path));
    } catch (e) {
      // Storage 파일이 이미 없을 수도 있으니 무시
    }
  }
  await deleteDoc(ref);
}

/* ---- Edit Modal ---- */
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

    const ref = doc(db, "rooms", roomId, "photos", currentEditId);
    await updateDoc(ref, {
      album,
      date: dateTs,
      caption,
    });

    closeEditModal();
    await refreshPhotos(true);
  });
}

/* ---- Drag & Drop order ---- */
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
      await refreshPhotos(true);
    });
  });
}

async function reorderByDrop(srcId, targetId) {
  // 같은 앨범 안에서만 재정렬
  const src = gallerySlice.find((x) => x.id === srcId);
  const tgt = gallerySlice.find((x) => x.id === targetId);
  if (!src || !tgt) return;

  const album = src.album || "기본앨범";
  if ((tgt.album || "기본앨범") !== album) return;

  // 해당 앨범 전체를 order 순으로 가져온 뒤 재정렬
  // (인덱스 필요할 수 있음: album + order)
  const snap = await getDocs(query(
    photosColRef(),
    where("album", "==", album),
    orderBy("order", "asc"),
    limit(1500)
  ));

  const arr = snap.docs.map((d) => ({
    id: d.id,
    order: d.data()?.order ?? 0
  }));

  const srcIdx = arr.findIndex((x) => x.id === srcId);
  const tgtIdx = arr.findIndex((x) => x.id === targetId);
  if (srcIdx < 0 || tgtIdx < 0) return;

  const [moved] = arr.splice(srcIdx, 1);
  arr.splice(tgtIdx, 0, moved);

  // order 재할당 (간단하게 10 단위로)
  const batch = writeBatch(db);
  for (let i = 0; i < arr.length; i++) {
    const ref = doc(db, "rooms", roomId, "photos", arr[i].id);
    batch.update(ref, { order: i * 10 });
  }
  await batch.commit();
}

/* ---- 사진 UI init ---- */
function initGalleryUI() {
  $("photoDate").value = toISODateInputValue(new Date());

  $("photoInput").addEventListener("change", async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;

    const album = normalizeAlbum($("albumName").value);
    const dateTs = fromISODateInputValue($("photoDate").value);
    const caption = $("photoCaption").value.trim();

    try {
      // 여러 장 업로드
      for (const f of files) {
        if (!f.type.startsWith("image/")) continue;
        await uploadOnePhoto(f, album, dateTs, caption);
      }
      e.target.value = "";

      await rebuildAlbumOptions();
      await refreshPhotos(true);
    } catch (err) {
      alert(err?.message || "사진 업로드 중 문제가 생겼어요.");
    }
  });

  $("albumFilter").addEventListener("change", async (e) => {
    currentAlbum = e.target.value;
    await refreshPhotos(true);
  });

  $("loadMore").addEventListener("click", async () => {
    await fetchNextPhotosPage();
    await renderGallery();
  });

  $("resetPaging").addEventListener("click", async () => {
    await refreshPhotos(true);
  });
}

async function refreshPhotos(reset = false) {
  if (reset) resetPagingState();
  await fetchNextPhotosPage();
  await renderGallery();
}

/* ---------- 10) 메모 (Firestore) ---------- */

async function addMemo(title, body) {
  await addDoc(memosColRef(), {
    title: title?.trim() || "",
    body: body?.trim() || "",
    createdAt: Date.now(),
  });
}

async function deleteMemo(id) {
  await deleteDoc(doc(db, "rooms", roomId, "memos", id));
}

async function clearAllMemos() {
  const pass = prompt("메모를 전부 삭제하려면 비밀번호를 입력해요.");
  if (normalizePass(pass) !== PASSWORD) {
    alert("비밀번호가 달라요. 삭제하지 않았어요.");
    return;
  }

  const snap = await getDocs(query(memosColRef(), orderBy("createdAt", "desc"), limit(2000)));
  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

async function renderMemos() {
  const wrap = $("memoList");

  const snap = await getDocs(query(memosColRef(), orderBy("createdAt", "desc"), limit(200)));
  const memos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (!memos.length) {
    wrap.innerHTML = `<p class="hint">아직 메모가 없어요. 오늘의 다정함을 한 줄 남겨볼까요?</p>`;
    return;
  }

  wrap.innerHTML = memos.map((m) => `
    <div class="memo">
      <div class="memo__top">
        <div>
          <div class="memo__title">${escapeHtml(m.title || "제목 없음")}</div>
          <div class="memo__date">${fmtDate(new Date(m.createdAt || Date.now()))}</div>
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
      const ok = confirm("이 메모를 삭제할까요?");
      if (!ok) return;
      await deleteMemo(id);
      await renderMemos();
    });
  });
}

function initMemo() {
  const form = $("memoForm");
  const titleEl = $("memoTitle");
  const bodyEl = $("memoBody");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = titleEl.value.trim();
    const body = bodyEl.value.trim();
    if (!title && !body) return;

    await addMemo(title, body);

    titleEl.value = "";
    bodyEl.value = "";
    await renderMemos();
  });

  $("clearMemos").addEventListener("click", async () => {
    const ok = confirm("메모를 전부 삭제할까요?");
    if (!ok) return;
    await clearAllMemos();
    await renderMemos();
  });
}

/* ---------- 11) Firebase 데이터 부트 ---------- */

async function bootFirebaseData() {
  // 사진/메모 공유 영역 초기 로딩
  await rebuildAlbumOptions();
  currentAlbum = $("albumFilter").value || "__ALL__";
  resetPagingState();
  await refreshPhotos(true);

  await renderMemos();
}

/* ---------- 12) Boot ---------- */

async function boot() {
  initLock();
  initEditModal();
  initLightbox();

  renderCounter();
  renderMilestones();
  initMemo();
  initGalleryUI();

  // 잠금이 이미 풀린 상태면 바로 room 세팅 후 데이터 로딩
  const unlocked = sessionStorage.getItem(SESSION_KEY) === "1";
  if (unlocked) {
    roomId = await makeRoomId(PASSWORD);
    await ensureRoomDoc();
    await bootFirebaseData();
    hideLock();
  }

  setInterval(() => {
    renderCounter();
    renderMilestones();
  }, 1000);
}

boot();
