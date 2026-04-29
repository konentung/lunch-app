(() => {
  "use strict";

  // 修改：請將 WEBHOOK_URL 換成你的 Google Apps Script Web App 或 Firebase REST URL
  // - Google Apps Script: GET 應回傳 JSON 陣列；POST body 為 { option: "牛肉麵" }
  // - Firebase RTDB:      使用 https://<db>.firebaseio.com/lunch.json 形式
  const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyhcQAYribHTn7_NL8IL2dgmxoUfiLAPZGHkr8-kHDk6iFyya3MWFl8z-2InmQP3TaO/exec";

  const DEFAULT_OPTIONS = [
    "牛肉麵",
    "便當",
    "壽司",
    "拉麵",
    "火鍋",
    "咖哩飯",
    "義大利麵",
    "三明治",
  ];

  const SPIN_DURATION_MS = 3000;
  const START_INTERVAL = 50;
  const END_INTERVAL = 380;

  const optionInput = document.getElementById("optionInput");
  const addBtn = document.getElementById("addBtn");
  const optionList = document.getElementById("optionList");
  const removeBtn = document.getElementById("removeBtn");
  const reel = document.getElementById("reel");
  const spinBtn = document.getElementById("spinBtn");
  const resultEl = document.getElementById("result");

  let options = [...DEFAULT_OPTIONS];
  let spinning = false;

  function renderOptions() {
    optionList.innerHTML = "";
    options.forEach((opt) => {
      const el = document.createElement("option");
      el.value = opt;
      el.textContent = opt;
      optionList.appendChild(el);
    });
  }

  // 新增：把雲端回傳的資料正規化為字串陣列
  // 支援格式：["牛肉麵", ...]、{ options: [...] }、{ "-Nx": "牛肉麵", ... }（Firebase push key）
  function normalizeOptions(data) {
    if (Array.isArray(data)) return data.filter((v) => typeof v === "string");
    if (data && Array.isArray(data.options)) {
      return data.options.filter((v) => typeof v === "string");
    }
    if (data && typeof data === "object") {
      return Object.values(data)
        .map((v) => (typeof v === "string" ? v : v && v.option))
        .filter((v) => typeof v === "string");
    }
    return [];
  }

  // 新增：頁面載入時抓取雲端最新名單
  async function fetchOptions() {
    try {
      const res = await fetch(WEBHOOK_URL, { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const remote = normalizeOptions(data);
      if (remote.length > 0) {
        options = [...new Set(remote)];
        renderOptions();
      }
    } catch (err) {
      console.warn("讀取雲端名單失敗，使用預設選項：", err);
    }
  }

  // 新增：將新選項送至雲端
  async function pushOption(value) {
    try {
      // 使用 text/plain 以避開 Google Apps Script 的 CORS preflight
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ option: value }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.warn("上傳雲端失敗：", err);
    }
  }

  // 修改：新增選項時同步上傳雲端
  async function addOption() {
    const value = optionInput.value.trim();
    if (!value) return;
    if (options.includes(value)) {
      flashInput("已存在相同選項");
      return;
    }
    options.push(value);
    renderOptions();
    optionInput.value = "";
    optionInput.focus();
    await pushOption(value);
  }

  function removeOption() {
    const selected = optionList.value;
    if (!selected) return;
    options = options.filter((o) => o !== selected);
    renderOptions();
  }

  function flashInput(message) {
    const original = optionInput.placeholder;
    optionInput.value = "";
    optionInput.placeholder = message;
    optionInput.style.borderColor = "#ff7a7a";
    setTimeout(() => {
      optionInput.placeholder = original;
      optionInput.style.borderColor = "";
    }, 1200);
  }

  function pickRandom(excluding) {
    if (options.length <= 1) return options[0];
    let next;
    do {
      next = options[Math.floor(Math.random() * options.length)];
    } while (next === excluding);
    return next;
  }

  // 使用 easeOutCubic 使切換頻率由快變慢，模擬拉霸機慣性
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function spin() {
    if (spinning) return;
    if (options.length < 2) {
      resultEl.textContent = "⚠️ 至少需要 2 個選項才能抽籤";
      resultEl.classList.add("show");
      return;
    }

    spinning = true;
    spinBtn.disabled = true;
    addBtn.disabled = true;
    removeBtn.disabled = true;
    reel.classList.remove("landed");
    reel.classList.add("spinning");
    resultEl.textContent = "";
    resultEl.classList.remove("show");

    const finalPick = options[Math.floor(Math.random() * options.length)];
    const startTs = performance.now();
    let lastSwitchTs = startTs;
    let currentInterval = START_INTERVAL;
    let currentText = reel.textContent;

    function tick(now) {
      const elapsed = now - startTs;
      const progress = Math.min(elapsed / SPIN_DURATION_MS, 1);
      currentInterval =
        START_INTERVAL + (END_INTERVAL - START_INTERVAL) * easeOutCubic(progress);

      if (now - lastSwitchTs >= currentInterval) {
        currentText = pickRandom(currentText);
        reel.textContent = currentText;
        lastSwitchTs = now;
      }

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        reel.textContent = finalPick;
        reel.classList.remove("spinning");
        reel.classList.add("landed");
        resultEl.textContent = `今天吃：${finalPick} 🎉`;
        resultEl.classList.add("show");
        spinBtn.disabled = false;
        addBtn.disabled = false;
        removeBtn.disabled = false;
        spinning = false;
      }
    }

    requestAnimationFrame(tick);
  }

  addBtn.addEventListener("click", addOption);
  optionInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addOption();
    }
  });
  removeBtn.addEventListener("click", removeOption);
  spinBtn.addEventListener("click", spin);

  // 修改：先渲染預設選項，再去雲端拉最新名單覆蓋
  renderOptions();
  fetchOptions();
})();
