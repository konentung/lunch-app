(function () {
  "use strict";

  const ITEM_HEIGHT = 88;
  const SPIN_DURATION_MS = 2800;
  const EXTRA_LOOPS = 6;

  const optionInput = document.getElementById("optionInput");
  const addBtn = document.getElementById("addBtn");
  const optionSelect = document.getElementById("optionSelect");
  const removeBtn = document.getElementById("removeBtn");
  const slotWindow = document.querySelector(".slot-window");
  const slotStrip = document.getElementById("slotStrip");
  const spinBtn = document.getElementById("spinBtn");
  const resultEl = document.getElementById("result");

  let options = ["牛肉麵", "雞排飯", "壽司", "拉麵", "炒飯", "便當"];
  let spinning = false;

  function renderOptions() {
    optionSelect.innerHTML = "";
    options.forEach((opt) => {
      const el = document.createElement("option");
      el.value = opt;
      el.textContent = opt;
      optionSelect.appendChild(el);
    });
    spinBtn.disabled = options.length === 0;
    renderStripStatic();
  }

  function renderStripStatic() {
    slotStrip.style.transition = "none";
    slotStrip.style.transform = "translateY(0px)";
    slotStrip.innerHTML = "";
    const placeholder = options.length ? options[0] : "請新增選項";
    const item = document.createElement("div");
    item.className = "slot-item";
    item.textContent = placeholder;
    slotStrip.appendChild(item);
  }

  function addOption() {
    const value = optionInput.value.trim();
    if (!value) return;
    if (options.includes(value)) {
      optionInput.value = "";
      optionInput.focus();
      return;
    }
    options.push(value);
    renderOptions();
    optionInput.value = "";
    optionInput.focus();
  }

  function removeSelected() {
    const selected = optionSelect.value;
    if (!selected) return;
    options = options.filter((o) => o !== selected);
    renderOptions();
  }

  function buildSpinStrip(finalIndex) {
    slotStrip.innerHTML = "";
    const totalItems = options.length * EXTRA_LOOPS + finalIndex + 1;
    for (let i = 0; i < totalItems; i++) {
      const item = document.createElement("div");
      item.className = "slot-item";
      item.textContent = options[i % options.length];
      slotStrip.appendChild(item);
    }
    return totalItems;
  }

  function spin() {
    if (spinning || options.length === 0) return;
    spinning = true;
    spinBtn.disabled = true;
    resultEl.textContent = "";

    const finalIndex = Math.floor(Math.random() * options.length);
    const finalOption = options[finalIndex];
    const totalItems = buildSpinStrip(finalIndex);
    const distance = (totalItems - 1) * ITEM_HEIGHT;

    slotStrip.style.transition = "none";
    slotStrip.style.transform = "translateY(0px)";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        slotStrip.style.transition = `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.15, 0.85, 0.25, 1)`;
        slotStrip.style.transform = `translateY(-${distance}px)`;
      });
    });

    const onEnd = () => {
      slotStrip.removeEventListener("transitionend", onEnd);
      const landedItem = slotStrip.lastElementChild;
      if (landedItem) landedItem.classList.add("landed");
      resultEl.textContent = `今天就吃 ${finalOption}！`;
      spinning = false;
      spinBtn.disabled = false;
    };
    slotStrip.addEventListener("transitionend", onEnd);
  }

  addBtn.addEventListener("click", addOption);
  optionInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addOption();
  });
  removeBtn.addEventListener("click", removeSelected);
  spinBtn.addEventListener("click", spin);

  renderOptions();
})();
