const experiments = [
  {
    id: "lung-aerosol",
    title: "肺泡氣霧暴露晶片",
    tissue: "肺泡屏障",
    compound: "AX-17 氣霧配方",
    sample: "AIV-112-L01",
    status: "需複核",
    dose: 35,
    viability: 88,
    barrier: 74,
    inflammation: 31,
    quality: 94,
    anomaly: 42,
    note: "氣霧暴露後屏障下降，建議追加 24 小時恢復期觀察。",
  },
  {
    id: "liver-clearance",
    title: "肝臟代謝晶片",
    tissue: "肝細胞球體",
    compound: "NV-08 代謝候選",
    sample: "AIV-112-H03",
    status: "穩定",
    dose: 22,
    viability: 93,
    barrier: 82,
    inflammation: 18,
    quality: 97,
    anomaly: 24,
    note: "代謝曲線穩定，適合進入多劑量比較。",
  },
  {
    id: "vascular-immune",
    title: "血管發炎模型晶片",
    tissue: "血管內皮",
    compound: "IM-42 抑制組",
    sample: "AIV-112-V07",
    status: "分析中",
    dose: 48,
    viability: 81,
    barrier: 68,
    inflammation: 46,
    quality: 91,
    anomaly: 55,
    note: "發炎指標偏高，AI 建議與陰性對照重新校準。",
  },
];

const candidates = [
  { name: "AX-17 低劑量組", score: 82, detail: "屏障維持佳，發炎反應可控" },
  { name: "NV-08 代謝候選", score: 91, detail: "影像品質高，毒性訊號低" },
  { name: "IM-42 抑制組", score: 67, detail: "需補做陰性對照與時間序列" },
];

let selectedId = experiments[0].id;
let mode = "toxicity";
let analysisTick = 0;

function currentExperiment() {
  return experiments.find((experiment) => experiment.id === selectedId) || experiments[0];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function adjustedReadings() {
  const experiment = currentExperiment();
  const dose = Number(document.querySelector("#dose-slider").value);
  const shift = dose - experiment.dose;
  const pulse = (analysisTick % 4) * 2;

  return {
    dose,
    viability: clamp(Math.round(experiment.viability - shift * 0.18 - pulse), 42, 99),
    barrier: clamp(Math.round(experiment.barrier - shift * 0.24 - pulse / 2), 35, 98),
    inflammation: clamp(Math.round(experiment.inflammation + shift * 0.22 + pulse), 5, 96),
    quality: clamp(Math.round(experiment.quality - Math.abs(shift) * 0.04), 78, 99),
  };
}

function riskFromReadings(readings) {
  const risk = Math.round(
    (100 - readings.viability) * 0.34
      + (100 - readings.barrier) * 0.28
      + readings.inflammation * 0.3
      + (100 - readings.quality) * 0.08,
  );
  return clamp(risk, 6, 92);
}

function riskLabel(score) {
  if (score >= 58) return "高反應";
  if (score >= 34) return "中度反應";
  return "低風險";
}

function renderBatches() {
  const list = document.querySelector("#batch-list");
  list.innerHTML = experiments.map((experiment) => `
    <button class="batch-card ${experiment.id === selectedId ? "active" : ""}" type="button" data-id="${experiment.id}">
      <strong>${experiment.title}</strong>
      <span>${experiment.sample} · ${experiment.tissue}</span>
      <span>${experiment.compound}</span>
      <small class="status-tag">${experiment.status}</small>
    </button>
  `).join("");

  list.querySelectorAll(".batch-card").forEach((button) => {
    button.addEventListener("click", () => {
      selectedId = button.dataset.id;
      document.querySelector("#dose-slider").value = currentExperiment().dose;
      render();
    });
  });
}

function drawChip(readings) {
  const canvas = document.querySelector("#chip-canvas");
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const experiment = currentExperiment();

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#d8d0c2";
  ctx.lineWidth = 1;
  for (let x = 30; x < width; x += 34) {
    ctx.beginPath();
    ctx.moveTo(x, 24);
    ctx.lineTo(x, height - 24);
    ctx.stroke();
  }
  for (let y = 28; y < height; y += 34) {
    ctx.beginPath();
    ctx.moveTo(24, y);
    ctx.lineTo(width - 24, y);
    ctx.stroke();
  }

  const colors = {
    toxicity: "#ce5d4a",
    barrier: "#3b8b7a",
    inflammation: "#d7a642",
  };
  const channelColor = colors[mode];

  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(47, 105, 143, 0.16)";
  ctx.beginPath();
  ctx.moveTo(78, 94);
  ctx.bezierCurveTo(210, 40, 278, 150, 388, 100);
  ctx.bezierCurveTo(470, 64, 520, 112, 556, 90);
  ctx.stroke();

  ctx.strokeStyle = channelColor;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(78, 94);
  ctx.bezierCurveTo(210, 40, 278, 150, 388, 100);
  ctx.bezierCurveTo(470, 64, 520, 112, 556, 90);
  ctx.stroke();

  ctx.strokeStyle = "rgba(59, 139, 122, 0.22)";
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(80, 246);
  ctx.bezierCurveTo(180, 300, 280, 194, 390, 246);
  ctx.bezierCurveTo(480, 288, 530, 220, 560, 250);
  ctx.stroke();

  const wells = [
    [118, 171, readings.viability, "#3b8b7a"],
    [230, 206, readings.barrier, "#2f698f"],
    [346, 174, readings.inflammation, "#d7a642"],
    [472, 210, readings.quality, "#ce5d4a"],
  ];

  wells.forEach(([x, y, value, color]) => {
    ctx.beginPath();
    ctx.fillStyle = "#fffdf8";
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.arc(x, y, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = "700 18px Avenir Next, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(value)}`, x, y);
  });

  ctx.fillStyle = "#27302f";
  ctx.font = "800 17px Avenir Next, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(experiment.sample, 34, 42);
  ctx.fillStyle = "#687170";
  ctx.font = "700 13px Avenir Next, sans-serif";
  ctx.fillText(`${experiment.tissue} · ${experiment.compound}`, 34, 64);
}

function renderReadouts(readings) {
  const items = [
    { label: "細胞存活率", value: readings.viability, suffix: "%", tone: "越高越穩定" },
    { label: "屏障完整性", value: readings.barrier, suffix: "%", tone: "低於 70 需複核" },
    { label: "發炎反應", value: readings.inflammation, suffix: " pt", tone: "越高越需追蹤" },
  ];

  document.querySelector("#readout-grid").innerHTML = items.map((item) => `
    <article class="readout">
      <span>${item.label}</span>
      <strong>${item.value}${item.suffix}</strong>
      <div class="mini-track"><div class="mini-fill" style="--value: ${item.value}%"></div></div>
      <span>${item.tone}</span>
    </article>
  `).join("");
}

function renderRisk(readings) {
  const experiment = currentExperiment();
  const risk = riskFromReadings(readings);
  const label = riskLabel(risk);
  const copy = risk >= 58
    ? "反應偏高，建議先暫停進入下一輪候選。"
    : risk >= 34
      ? "中度反應，建議追加時間序列與屏障檢測。"
      : "反應穩定，可進入候選排序。";

  document.querySelector("#metric-risk").textContent = risk;
  document.querySelector("#metric-risk-copy").textContent = `${label}，${copy}`;
  document.querySelector("#metric-quality").textContent = `${readings.quality}%`;
  document.querySelector("#metric-report").textContent = `${clamp(62 + analysisTick * 3, 62, 96)}%`;

  document.querySelector("#risk-card").innerHTML = `
    <span>${experiment.compound}</span>
    <strong>${risk}</strong>
    <p>${label}。${copy}</p>
  `;

  const recs = [
    { title: "下一步實驗", body: experiment.note },
    { title: "資料品質", body: `影像品質 ${readings.quality}%，AI 已排除低對焦視野並保留可追溯紀錄。` },
    { title: "判讀模式", body: `目前以「${document.querySelector(".segment.active").textContent}」為主軸，劑量設定為 ${readings.dose}%。` },
  ];

  document.querySelector("#recommendations").innerHTML = recs.map((rec) => `
    <article class="recommendation">
      <strong>${rec.title}</strong>
      <p>${rec.body}</p>
    </article>
  `).join("");
}

function renderCandidates() {
  document.querySelector("#candidate-list").innerHTML = candidates.map((candidate) => `
    <article class="candidate">
      <div>
        <p>${candidate.name}</p>
        <span>${candidate.detail}</span>
      </div>
      <div class="candidate-score">
        <strong>${candidate.score}</strong>
        <div class="mini-track"><div class="mini-fill" style="--value: ${candidate.score}%"></div></div>
      </div>
    </article>
  `).join("");
}

function checkedEndpoints() {
  return [...document.querySelectorAll(".endpoint-controls input:checked")].map((input) => input.value);
}

function renderReport(readings) {
  const experiment = currentExperiment();
  const risk = riskFromReadings(readings);
  const endpoints = checkedEndpoints().join("、") || "尚未選取端點";
  document.querySelector("#report-output").innerHTML = `
    <strong>${experiment.title} · ${experiment.sample}</strong>
    <p>本輪以 ${experiment.compound}、${readings.dose}% 劑量完成分析。AI 風險分數為 ${risk}，主要報告端點包含 ${endpoints}。建議將本批次列為「${riskLabel(risk)}」並附上影像品質 ${readings.quality}% 的追溯紀錄。</p>
  `;
}

function renderHeader(readings) {
  const experiment = currentExperiment();
  document.querySelector("#chip-title").textContent = experiment.title;
  document.querySelector("#chip-subtitle").textContent = `${experiment.tissue} · ${experiment.compound}`;
  document.querySelector("#dose-value").textContent = `${readings.dose}%`;
}

function render() {
  const readings = adjustedReadings();
  renderBatches();
  renderHeader(readings);
  drawChip(readings);
  renderReadouts(readings);
  renderRisk(readings);
  renderCandidates();
  renderReport(readings);
}

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => {
    mode = button.dataset.mode;
    document.querySelectorAll(".segment").forEach((segment) => segment.classList.remove("active"));
    button.classList.add("active");
    render();
  });
});

document.querySelector("#dose-slider").addEventListener("input", render);

document.querySelector("#analyze-button").addEventListener("click", () => {
  analysisTick += 1;
  render();
});

document.querySelector("#report-button").addEventListener("click", () => {
  analysisTick += 1;
  render();
});

document.querySelector("#promote-button").addEventListener("click", () => {
  const experiment = currentExperiment();
  const score = clamp(100 - riskFromReadings(adjustedReadings()) + 18, 42, 98);
  candidates.unshift({
    name: `${experiment.compound} 新候選`,
    score,
    detail: `${experiment.tissue} 批次自動加入比較清單`,
  });
  candidates.splice(4);
  renderCandidates();
});

document.querySelector("#queue-button").addEventListener("click", () => {
  const experiment = currentExperiment();
  experiment.status = experiment.status === "已排程" ? "分析中" : "已排程";
  renderBatches();
});

document.querySelectorAll(".endpoint-controls input").forEach((input) => {
  input.addEventListener("change", () => renderReport(adjustedReadings()));
});

render();
