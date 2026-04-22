(() => {
  "use strict";

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

  function addOption() {
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

  renderOptions();
})();
