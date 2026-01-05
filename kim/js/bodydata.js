// 공통 페이지 이동
function goPage(path) {
  window.location.href = path;
}

/* ===== 이름 세팅 ===== */
const bodyUserNameEl = document.getElementById("bodyUserName");
const storedName = localStorage.getItem("fh_user_name");

if (bodyUserNameEl) {
  if (storedName && storedName.trim() !== "") {
    bodyUserNameEl.textContent = storedName + "님,";
  } else {
    bodyUserNameEl.textContent = "회원님,";
  }
}

/* ===== 더미 신체 데이터 (추후 API로 교체) ===== */

function createMockBodyData(days = 90) {
  const data = [];
  const today = new Date();

  let weight = 74;   // kg
  let bodyFat = 22;  // %

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    weight += (Math.random() - 0.5) * 0.3;
    bodyFat += (Math.random() - 0.5) * 0.15;

    data.push({
      date: d,
      weight: Number(weight.toFixed(1)),
      bodyFat: Number(bodyFat.toFixed(1))
    });
  }
  return data;
}

const ALL_DATA = createMockBodyData(90);

function createCurrentMetrics(latest) {
  const heightCm = 175; // 예시
  const heightM = heightCm / 100;

  const bmi = latest.weight / (heightM * heightM);
  const bodyFatMass = (latest.bodyFat / 100) * latest.weight;
  const muscleMass = latest.weight - bodyFatMass - 10; // 예시 추정값

  const whr = 0.85;
  const bmr = 1650;

  return {
    weightKg: latest.weight,
    bodyFatPct: latest.bodyFat,
    bodyFatMassKg: Number(bodyFatMass.toFixed(1)),
    skeletalMuscleKg: Number(muscleMass.toFixed(1)),
    bmi: Number(bmi.toFixed(1)),

    chest: 98,
    waist: 82,
    hip: 100,
    thigh: 58,
    arm: 33,

    shoulderBalance: "좌우 균형 양호 (±2mm)",
    neckAngle: 18,
    whr: whr.toFixed(2),
    bmr: bmr,

    rhr: 62,
    vo2: 44,
    sleepTime: 7.1,
    sleepScore: 84
  };
}

/* ===== DOM 참조 ===== */

const currentWeightEl = document.getElementById("currentWeight");
const weightDiffEl = document.getElementById("weightDiff");
const currentBodyFatEl = document.getElementById("currentBodyFat");
const bodyFatDiffEl = document.getElementById("bodyFatDiff");

const filterChips = document.querySelectorAll(".filter-chip");
const compareToggle = document.getElementById("compareToggle");

const chartCaptionEl = document.getElementById("chartCaption");
const chartRangeLabelEl = document.getElementById("chartRangeLabel");

const svg = document.getElementById("bodyChart");
const gridGroup = document.getElementById("chartGrid");
const weightLine = document.getElementById("weightLine");
const bodyFatLine = document.getElementById("bodyFatLine");
const weightPointsGroup = document.getElementById("weightPoints");
const bodyFatPointsGroup = document.getElementById("bodyFatPoints");

const historyListEl = document.getElementById("historyList");

/* 메트릭 DOM */
const metricWeightEl = document.getElementById("metricWeight");
const metricSmmEl = document.getElementById("metricSmm");
const metricBfmEl = document.getElementById("metricBfm");
const metricBfpEl = document.getElementById("metricBfp");
const metricBmiEl = document.getElementById("metricBmi");

const metricChestEl = document.getElementById("metricChest");
const metricWaistEl = document.getElementById("metricWaist");
const metricHipEl = document.getElementById("metricHip");
const metricThighEl = document.getElementById("metricThigh");
const metricArmEl = document.getElementById("metricArm");

const metricShoulderEl = document.getElementById("metricShoulder");
const metricNeckAngleEl = document.getElementById("metricNeckAngle");
const metricWhrEl = document.getElementById("metricWhr");
const metricBmrEl = document.getElementById("metricBmr");

const metricRhrEl = document.getElementById("metricRhr");
const metricVo2El = document.getElementById("metricVo2");
const metricSleepTimeEl = document.getElementById("metricSleepTime");
const metricSleepScoreEl = document.getElementById("metricSleepScore");

let currentRange = 7;

/* ===== 유틸 ===== */

function formatDate(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}.${day}`;
}

function getYoil(d) {
  const Y = ["일", "월", "화", "수", "목", "금", "토"];
  return Y[d.getDay()];
}

/* ===== 요약 + 메트릭 ===== */

function renderSummary(data) {
  if (!data.length) return;

  const latest = data[data.length - 1];
  const baseIndex = Math.max(0, data.length - 1 - 30);
  const base = data[baseIndex];

  if (currentWeightEl) {
    currentWeightEl.textContent = `${latest.weight.toFixed(1)} kg`;
  }
  if (currentBodyFatEl) {
    currentBodyFatEl.textContent = `${latest.bodyFat.toFixed(1)} %`;
  }

  const wDiff = latest.weight - base.weight;
  const bfDiff = latest.bodyFat - base.bodyFat;

  if (weightDiffEl) {
    const sign = wDiff > 0 ? "+" : "";
    weightDiffEl.textContent = `지난 달 대비 ${sign}${wDiff.toFixed(1)} kg`;
  }
  if (bodyFatDiffEl) {
    const sign = bfDiff > 0 ? "+" : "";
    bodyFatDiffEl.textContent = `지난 달 대비 ${sign}${bfDiff.toFixed(1)} %p`;
  }

  const metrics = createCurrentMetrics(latest);

  if (metricWeightEl) metricWeightEl.textContent = `${metrics.weightKg.toFixed(1)} kg`;
  if (metricSmmEl) metricSmmEl.textContent = `${metrics.skeletalMuscleKg.toFixed(1)} kg`;
  if (metricBfmEl) metricBfmEl.textContent = `${metrics.bodyFatMassKg.toFixed(1)} kg`;
  if (metricBfpEl) metricBfpEl.textContent = `${metrics.bodyFatPct.toFixed(1)} %`;
  if (metricBmiEl) metricBmiEl.textContent = metrics.bmi.toFixed(1);

  if (metricChestEl) metricChestEl.textContent = `${metrics.chest} cm`;
  if (metricWaistEl) metricWaistEl.textContent = `${metrics.waist} cm`;
  if (metricHipEl) metricHipEl.textContent = `${metrics.hip} cm`;
  if (metricThighEl) metricThighEl.textContent = `${metrics.thigh} cm`;
  if (metricArmEl) metricArmEl.textContent = `${metrics.arm} cm`;

  if (metricShoulderEl) metricShoulderEl.textContent = metrics.shoulderBalance;
  if (metricNeckAngleEl) metricNeckAngleEl.textContent = `${metrics.neckAngle}°`;
  if (metricWhrEl) metricWhrEl.textContent = metrics.whr;
  if (metricBmrEl) metricBmrEl.textContent = `${metrics.bmr} kcal`;

  if (metricRhrEl) metricRhrEl.textContent = `${metrics.rhr} bpm`;
  if (metricVo2El) metricVo2El.textContent = `${metrics.vo2} ml/kg/min`;
  if (metricSleepTimeEl) metricSleepTimeEl.textContent = `${metrics.sleepTime.toFixed(1)} h`;
  if (metricSleepScoreEl) metricSleepScoreEl.textContent = `${metrics.sleepScore} /100`;
}

/* ===== 차트 ===== */

function renderChart(data) {
  if (!svg || !data.length) return;

  const width = 320;
  const height = 180;
  const paddingLeft = 24;
  const paddingRight = 8;
  const paddingTop = 12;
  const paddingBottom = 24;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const weights = data.map((d) => d.weight);
  const bodyFats = data.map((d) => d.bodyFat);

  const weightMin = Math.min(...weights);
  const weightMax = Math.max(...weights);
  const bfMin = Math.min(...bodyFats);
  const bfMax = Math.max(...bodyFats);

  const globalMin = Math.min(weightMin, bfMin);
  const globalMax = Math.max(weightMax, bfMax);
  const paddingValue = 1;

  const vMin = globalMin - paddingValue;
  const vMax = globalMax + paddingValue;

  function xScale(i) {
    if (data.length === 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (chartWidth * i) / Math.max(1, data.length - 1);
  }

  function yScale(v) {
    if (vMax === vMin) return paddingTop + chartHeight / 2;
    const ratio = (v - vMin) / (vMax - vMin);
    return paddingTop + chartHeight - ratio * chartHeight;
  }

  if (gridGroup) {
    gridGroup.innerHTML = "";
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const y = paddingTop + (chartHeight * i) / steps;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", paddingLeft);
      line.setAttribute("y1", y);
      line.setAttribute("x2", width - paddingRight);
      line.setAttribute("y2", y);
      line.setAttribute("class", "grid-line");
      gridGroup.appendChild(line);
    }
  }

  const weightPoints = data.map((d, i) => {
    const x = xScale(i);
    const y = yScale(d.weight);
    return `${x},${y}`;
  });

  if (weightLine) {
    weightLine.setAttribute("points", weightPoints.join(" "));
  }

  const showBodyFat = compareToggle && compareToggle.checked;

  if (bodyFatLine) {
    if (showBodyFat) {
      const bfPoints = data.map((d, i) => {
        const x = xScale(i);
        const y = yScale(d.bodyFat);
        return `${x},${y}`;
      });
      bodyFatLine.setAttribute("points", bfPoints.join(" "));
      bodyFatLine.style.opacity = "1";
    } else {
      bodyFatLine.setAttribute("points", "");
      bodyFatLine.style.opacity = "0";
    }
  }

  if (weightPointsGroup) {
    weightPointsGroup.innerHTML = "";
    data.forEach((d, i) => {
      const x = xScale(i);
      const y = yScale(d.weight);
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", x);
      circle.setAttribute("cy", y);
      circle.setAttribute("r", 3);
      circle.setAttribute("class", "chart-point weight");
      weightPointsGroup.appendChild(circle);
    });
  }

  if (bodyFatPointsGroup) {
    bodyFatPointsGroup.innerHTML = "";
    if (showBodyFat) {
      data.forEach((d, i) => {
        const x = xScale(i);
        const y = yScale(d.bodyFat);
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", 3);
        circle.setAttribute("class", "chart-point bodyfat");
        bodyFatPointsGroup.appendChild(circle);
      });
    }
  }

  if (chartCaptionEl) {
    chartCaptionEl.textContent = `최근 ${currentRange}일 기준 체중과 체지방률 변화`;
  }

  if (chartRangeLabelEl) {
    const first = data[0];
    const last = data[data.length - 1];
    chartRangeLabelEl.textContent = `${formatDate(first.date)} ~ ${formatDate(last.date)}`;
  }
}

/* ===== 기록 리스트 ===== */

function renderHistory(data) {
  if (!historyListEl) return;
  historyListEl.innerHTML = "";

  const reversed = [...data].reverse();

  reversed.forEach((item) => {
    const li = document.createElement("li");
    li.className = "history-item";

    const left = document.createElement("div");
    left.className = "history-left";
    const dateEl = document.createElement("p");
    dateEl.className = "history-date";
    dateEl.textContent = formatDate(item.date);
    const yoilEl = document.createElement("p");
    yoilEl.className = "history-yoil";
    yoilEl.textContent = `${getYoil(item.date)}요일`;
    left.appendChild(dateEl);
    left.appendChild(yoilEl);

    const right = document.createElement("div");
    right.className = "history-right";
    right.innerHTML = `
      <div><strong>${item.weight.toFixed(1)} kg</strong></div>
      <div>체지방 ${item.bodyFat.toFixed(1)} %</div>
    `;

    li.appendChild(left);
    li.appendChild(right);
    historyListEl.appendChild(li);
  });
}

/* ===== 전체 렌더링 ===== */

function getRangeData(range) {
  const len = ALL_DATA.length;
  const count = Math.min(range, len);
  return ALL_DATA.slice(len - count);
}

function renderAll() {
  const data = getRangeData(currentRange);
  renderSummary(data);
  renderChart(data);
  renderHistory(data);
}

/* ===== 이벤트 바인딩 ===== */

filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    filterChips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    currentRange = Number(chip.dataset.range || 7);
    renderAll();
  });
});

if (compareToggle) {
  compareToggle.addEventListener("change", () => {
    renderAll();
  });
}

/* ===== 초기 렌더링 ===== */

renderAll();
