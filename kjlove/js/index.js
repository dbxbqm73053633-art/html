/* ===============================
   영우 ♡ 지선 - index.js (gallery clean + lightbox edit)
   =============================== */

/* ---------- Lock / Room ---------- */
const PASSWORD = "0205";
const SESSION_KEY = "ywjy_unlocked_v2";

/* ---------- Couple Start Date ---------- */
const START = new Date(2026, 1, 5, 0, 0, 0);

/* ---------- Milestones ---------- */
const MILESTONES = [
  { days: 100, name: "100일 (우리, 꽤 멋지게 여기까지)" },
  { days: 200, name: "200일 (서로에게 더 편해진 날)" },
  { days: 365, name: "1주년 (처음부터 지금까지, 너라서)" },
  { days: 500, name: "500일 (사랑은 오늘도 진행 중)" },
  { days: 730, name: "2주년 (익숙함 속 설렘)" },
  { days: 1000, name: "1000일 (우리만의 전설)" },
];

/* ---------- Gallery Options ---------- */
const MAX_IMAGE_LONG_SIDE = 1600;
const JPG_QUALITY = 0.86;
const PAGE_SIZE = 12;

/* ===============================
   Firebase
   =============================== */
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

/* ✅ 네 프로젝트 설정 그대로 사용 */
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

/* ===============================
   Utils
   =============================== */
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
function safeAlert(msg, err) {
  console.error(msg, err);
  alert(`${msg}\n\n${err?.message || String(err)}`);
}

/* ===============================
   Room Key (password -> roomId)
   =============================== */
async function makeRoomId(pass) {
  const enc = new TextEncoder().encode(`room:${pass}`);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex.slice(0, 24);
}

let roomId = null;

/* ===============================
   Lock Screen
   =============================== */
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

      try {
        roomId = await makeRoomId(pass);
        await ensureRoomDoc();
        await bootFirebaseData();
      } catch (err) {
        safeAlert("Firebase 연결/초기화에 실패했어요.", err);
        sessionStorage.removeItem(SESSION_KEY);
        showLock();
      }
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

/* ===============================
   Counter / Milestones
   =============================== */
function diffNow() {
  const now = new Date();
  const ms = Math.max(0, now - START);
  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  return {
    now,
    totalSeconds,
    totalMinutes,
    totalHours,
    totalDays,
    hhmmss: `${pad2(totalHours % 24)}:${pad2(totalMinutes % 60)}:${pad2(totalSeconds % 60)}`,
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

/* ===============================
   Firestore refs
   =============================== */
function roomDocRef() { return doc(db, "rooms", roomId); }
function photosColRef() { return collection(db, "rooms", roomId, "photos"); }
function memosColRef() { return collection(db, "rooms", roomId, "memos"); }

async function ensureRoomDoc() {
  const ref = roomDocRef();
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      createdAt: serverTimestamp(),
      hint: "No-auth room. Shared by password(roomKey).",
    });
  }
}

/* ===============================
   Image compress -> jpeg blob
   =============================== */
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

  const longSide = Math.max(img.width, img.height);
  const scale = longSide > MAX_IMAGE_LONG_SIDE ? MAX_IMAGE_LONG_SIDE / longSide : 1;
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(img, 0, 0, w, h);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPG_QUALITY));
  if (!blob) throw new Error("이미지 변환에 실패했어요.");
  return blob;
}

/* ===============================
   Photos (paging + albums + lightbox edit)
   =============================== */
let galleryAll = [];
let gallerySlice = [];
let currentAlbum = "__ALL__";
let lastDocSnap = null;

let lbIndex = 0;
let lbPhotoId = null;

function resetPagingState() {
  lastDocSnap = null;
  galleryAll = [];
  gallerySlice = [];
  $("pagingHint").textContent = "—";
  $("loadMore").style.display = "inline-flex";
  $("photoCount").textContent = "0";
}

async function fetchNextPhotosPage() {
  const col = photosColRef();

  let qBase;
  if (currentAlbum === "__ALL__") {
    qBase = query(col, orderBy("order", "asc"), limit(PAGE_SIZE));
  } else {
    qBase = query(col, where("album", "==", currentAlbum), orderBy("order", "asc"), limit(PAGE_SIZE));
  }

  const qPaged = lastDocSnap ? query(qBase, startAfter(lastDocSnap)) : qBase;
  const snap = await getDocs(qPaged);

  if (snap.empty) {
    $("loadMore").style.display = "none";
    return;
  }

  lastDocSnap = snap.docs[snap.docs.length - 1];

  const rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((x) => typeof x.url === "string" && x.url.trim().length > 0)
    .map((x) => ({
      id: x.id,
      album: (x.album || "기본앨범").trim() || "기본앨범",
      caption: x.caption || "",
      date: typeof x.date === "number" ? x.date : null,
      name: x.name || "photo",
      url: x.url || "",
      storagePath: x.storagePath || "",
      order: typeof x.order === "number" ? x.order : 0,
      createdAt: x.createdAt || null,
    }));

  galleryAll = [...galleryAll, ...rows];
  gallerySlice = [...galleryAll];

  $("photoCount").textContent = String(gallerySlice.length);
  $("pagingHint").textContent = `${gallerySlice.length}장 표시 중`;
}

async function rebuildAlbumOptions() {
  const snap = await getDocs(query(photosColRef(), orderBy("createdAt", "desc"), limit(1500)));
  const albums = new Set();
  snap.forEach((d) => {
    const a = String(d.data()?.album || "기본앨범").trim();
    albums.add(a || "기본앨범");
  });

  const list = [...albums].sort((a, b) => a.localeCompare(b, "ko"));
  const sel = $("albumFilter");
  const prev = sel.value || "__ALL__";

  sel.innerHTML =
    `<option value="__ALL__">전체 앨범</option>` +
    list.map((a) => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join("");

  sel.value = ([ "__ALL__", ...list ].includes(prev)) ? prev : "__ALL__";
}

/* ---------- Lightbox ---------- */
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

  lbPhotoId = it.id;

  $("lbImg").src = it.url;
  $("lbAlbum").value = it.album || "기본앨범";
  $("lbDate").value = it.date ? toISODateInputValue(it.date) : "";
  $("lbCaptionInput").value = it.caption?.trim() ? it.caption.trim() : "";

  $("lbSub").textContent = `${it.name || "photo"} · ${lbIndex + 1}/${arr.length}`;
  $("lbSaveHint").textContent = "수정 후 저장을 눌러주세요. (Ctrl/Cmd + S 가능)";
}

async function saveLightboxEdits() {
  if (!lbPhotoId) return;

  const album = normalizeAlbum($("lbAlbum").value);
  const dateTs = fromISODateInputValue($("lbDate").value);
  const caption = $("lbCaptionInput").value.trim();

  const ref = doc(db, "rooms", roomId, "photos", lbPhotoId);
  await updateDoc(ref, {
    album,
    date: dateTs || null,
    caption,
  });

  // 로컬 목록 즉시 반영
  const patchLocal = (arr) => {
    const idx = arr.findIndex((x) => x.id === lbPhotoId);
    if (idx >= 0) arr[idx] = { ...arr[idx], album, date: dateTs || null, caption };
  };
  patchLocal(galleryAll);
  patchLocal(gallerySlice);

  $("lbSaveHint").textContent = "저장 완료 ♡";

  // 앨범 옵션 갱신
  await rebuildAlbumOptions();

  // 특정 앨범 필터 중인데, 앨범명이 바뀌면 목록에서 빠질 수 있음
  if (currentAlbum !== "__ALL__" && album !== currentAlbum) {
    await refreshPhotos(true);
    closeLightbox();
    return;
  }

  await renderGallery();
}

function initLightbox() {
  $("lightbox").addEventListener("click", (e) => {
    const t = e.target;
    if (t?.getAttribute?.("data-lb-close") === "1") closeLightbox();
  });

  $("lbPrev").addEventListener("click", () => setLightboxByIndex(lbIndex - 1));
  $("lbNext").addEventListener("click", () => setLightboxByIndex(lbIndex + 1));

  $("lbSave").addEventListener("click", async () => {
    try {
      $("lbSaveHint").textContent = "저장 중…";
      await saveLightboxEdits();
    } catch (err) {
      $("lbSaveHint").textContent = "저장 실패";
      safeAlert("사진 정보 저장에 실패했어요.", err);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!$("lightbox").classList.contains("show")) return;

    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") setLightboxByIndex(lbIndex - 1);
    if (e.key === "ArrowRight") setLightboxByIndex(lbIndex + 1);

    // Ctrl/Cmd + S 저장
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      $("lbSave").click();
    }
  });
}

/* ---------- Render Gallery (삭제 버튼만) ---------- */
async function renderGallery() {
  const wrap = $("gallery");

  if (!gallerySlice.length) {
    wrap.innerHTML = `<p class="hint">아직 사진이 없어요. 우리 첫 장을 담아볼까요?</p>`;
    return;
  }

  wrap.innerHTML = gallerySlice.map((it, idx) => {
    const caption = it.caption?.trim() ? it.caption.trim() : "사진";
    return `
      <div class="photo" data-id="${escapeHtml(it.id)}" data-idx="${idx}">
        <img class="photo__img" src="${escapeHtml(it.url)}" alt="${escapeHtml(caption)}" loading="lazy" />
        <button class="photo__del" type="button" title="삭제" aria-label="사진 삭제" data-del="${escapeHtml(it.id)}">✕</button>
      </div>
    `;
  }).join("");

  // 카드 클릭 -> 라이트박스 (삭제 버튼 클릭은 제외)
  wrap.querySelectorAll(".photo").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target?.closest?.("[data-del]")) return;
      const idx = Number(card.getAttribute("data-idx"));
      setLightboxByIndex(idx);
      openLightbox();
    });
  });

  // 삭제 버튼
  wrap.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-del");
      const ok = confirm("이 사진을 삭제할까요? (Storage에서도 지워져요)");
      if (!ok) return;

      try {
        await deletePhotoById(id);
        await rebuildAlbumOptions();
        await refreshPhotos(true);
      } catch (err) {
        safeAlert("사진 삭제에 실패했어요.", err);
      }
    });
  });
}

/* ---------- Upload / Delete ---------- */
async function uploadOnePhoto(file, album, dateTs, caption) {
  const blob = await fileToJpegBlobCompressed(file);

  const docRef = await addDoc(photosColRef(), {
    album,
    caption: caption?.trim() || "",
    date: dateTs || null,
    name: humanName(file.name),
    createdAt: Date.now(),
    order: Date.now(),
    url: "",
    storagePath: "",
  });

  const path = `rooms/${roomId}/photos/${docRef.id}.jpg`;
  try {
    const fileRef = sRef(storage, path);
    await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });
    const url = await getDownloadURL(fileRef);
    await updateDoc(docRef, { url, storagePath: path });
  } catch (err) {
    console.error("[PHOTO UPLOAD FAIL]", err);
    try { await deleteDoc(docRef); } catch {}
    throw err;
  }
}

async function deletePhotoById(id) {
  const ref = doc(db, "rooms", roomId, "photos", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const path = data?.storagePath;

  if (path) {
    try { await deleteObject(sRef(storage, path)); } catch {}
  }
  await deleteDoc(ref);
}

async function refreshPhotos(reset = false) {
  if (reset) resetPagingState();
  await fetchNextPhotosPage();
  await renderGallery();
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
      for (const f of files) {
        if (!f.type.startsWith("image/")) continue;
        await uploadOnePhoto(f, album, dateTs, caption);
      }

      e.target.value = "";

      await rebuildAlbumOptions();
      await refreshPhotos(true);
    } catch (err) {
      safeAlert(
        "업로드가 막혔어요.\n대부분 Storage Rules(권한) 또는 버킷 설정 문제예요.",
        err
      );
    }
  });

  $("albumFilter").addEventListener("change", async (e) => {
    currentAlbum = e.target.value;
    try {
      await refreshPhotos(true);
    } catch (err) {
      safeAlert("앨범 불러오기에 실패했어요.", err);
    }
  });

  $("loadMore").addEventListener("click", async () => {
    try {
      await fetchNextPhotosPage();
      await renderGallery();
    } catch (err) {
      safeAlert("더 보기에 실패했어요.", err);
    }
  });

  $("resetPaging").addEventListener("click", async () => {
    try {
      await refreshPhotos(true);
    } catch (err) {
      safeAlert("초기화에 실패했어요.", err);
    }
  });
}

/* ===============================
   Memos (Firestore)
   =============================== */
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
      if (!confirm("이 메모를 삭제할까요?")) return;
      try {
        await deleteMemo(id);
        await renderMemos();
      } catch (err) {
        safeAlert("메모 삭제에 실패했어요.", err);
      }
    });
  });
}

function initMemo() {
  $("memoForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = $("memoTitle").value.trim();
    const body = $("memoBody").value.trim();
    if (!title && !body) return;

    try {
      await addMemo(title, body);
      $("memoTitle").value = "";
      $("memoBody").value = "";
      await renderMemos();
    } catch (err) {
      safeAlert("메모 저장에 실패했어요.", err);
    }
  });

  $("clearMemos").addEventListener("click", async () => {
    if (!confirm("메모를 전부 삭제할까요?")) return;
    try {
      await clearAllMemos();
      await renderMemos();
    } catch (err) {
      safeAlert("메모 전체 삭제에 실패했어요.", err);
    }
  });
}

/* ===============================
   Firebase Data Boot
   =============================== */
async function bootFirebaseData() {
  await rebuildAlbumOptions();
  currentAlbum = $("albumFilter").value || "__ALL__";
  resetPagingState();
  await refreshPhotos(true);
  await renderMemos();
}

/* ===============================
   Boot
   =============================== */
async function boot() {
  initLock();
  initLightbox();

  renderCounter();
  renderMilestones();

  initMemo();
  initGalleryUI();

  // 이미 잠금 해제 세션이면 자동 부팅
  const unlocked = sessionStorage.getItem(SESSION_KEY) === "1";
  if (unlocked) {
    try {
      roomId = await makeRoomId(PASSWORD);
      await ensureRoomDoc();
      await bootFirebaseData();
      hideLock();
    } catch (err) {
      console.error("[AUTO BOOT FAIL]", err);
      sessionStorage.removeItem(SESSION_KEY);
      showLock();
    }
  }

  // 1초마다 카운터 갱신
  setInterval(() => {
    renderCounter();
    renderMilestones();
  }, 1000);
}

boot();
