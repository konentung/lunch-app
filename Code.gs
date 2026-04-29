// 午餐拉霸機 — Google Apps Script Web App
// 部署位置：在目標 Google Sheet 內 → 擴充功能 → Apps Script → 取代 Code.gs → 儲存
// 部署設定：部署 → 管理部署作業 → ✏️ → 版本：新版本 → 部署
// 存取權限：所有人（前端才能免登入呼叫）

function doGet() {
  const sheet = getSheet_();
  return jsonResponse_(getOptions_(sheet));
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    const body = e && e.postData ? JSON.parse(e.postData.contents || "{}") : {};
    const action = body.action || "add"; // 預設 add，相容舊呼叫
    const option = String(body.option || "").trim();
    if (!option) {
      return jsonResponse_({ ok: false, error: "empty option" });
    }

    const sheet = getSheet_();
    if (action === "delete") {
      return jsonResponse_(deleteOption_(sheet, option));
    }
    return jsonResponse_(addOption_(sheet, option));
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function addOption_(sheet, option) {
  const existing = getOptions_(sheet);
  if (existing.includes(option)) return { ok: true, dedup: true };
  sheet.appendRow([option]);
  return { ok: true };
}

function deleteOption_(sheet, option) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok: true, removed: 0 };
  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let removed = 0;
  // 由下往上刪，避免索引位移
  for (let i = values.length - 1; i >= 0; i--) {
    if (String(values[i][0]).trim() === option) {
      sheet.deleteRow(i + 2);
      removed++;
    }
  }
  return { ok: true, removed };
}

function getSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getRange(1, 1).getValue() !== "選項") {
    sheet.getRange(1, 1).setValue("選項");
  }
  return sheet;
}

function getOptions_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet
    .getRange(2, 1, lastRow - 1, 1)
    .getValues()
    .map((row) => String(row[0]).trim())
    .filter(Boolean);
}

function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
