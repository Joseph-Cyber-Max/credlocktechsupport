/**
 * Credlock Technical Support backend configuration.
 * Safe migration helpers for the production Google Sheet.
 * This file intentionally never clears or deletes existing sheet data.
 */
const CREDLOCK_PRODUCTION_SHEET_ID = '11Zi2cLsPdjOSw40pVg9DeC_udbj8mb78WJjZgo0qrRE';

function configureCredlockProductionBackend() {
  const ss = SpreadsheetApp.openById(CREDLOCK_PRODUCTION_SHEET_ID);
  PropertiesService.getScriptProperties().setProperty(CONFIG_KEY, CREDLOCK_PRODUCTION_SHEET_ID);
  return {
    ok: true,
    spreadsheetId: ss.getId(),
    url: ss.getUrl(),
    name: ss.getName(),
    message: 'Credlock production Google Sheet configured as the Apps Script backend.'
  };
}

function safeSetupBackend() {
  const ss = SpreadsheetApp.openById(CREDLOCK_PRODUCTION_SHEET_ID);
  PropertiesService.getScriptProperties().setProperty(CONFIG_KEY, CREDLOCK_PRODUCTION_SHEET_ID);

  const report = [];
  Object.keys(SCHEMA).forEach(function(name) {
    let sh = ss.getSheetByName(name);
    const created = !sh;
    if (!sh) sh = ss.insertSheet(name);

    const expected = SCHEMA[name];
    const lastColumn = sh.getLastColumn();
    const current = lastColumn > 0
      ? sh.getRange(1, 1, 1, lastColumn).getValues()[0].map(String)
      : [];

    const currentNonEmpty = current.filter(Boolean);
    const missing = expected.filter(function(header) { return currentNonEmpty.indexOf(header) === -1; });
    if (missing.length) {
      sh.getRange(1, lastColumn + 1, 1, missing.length).setValues([missing]);
    }

    sh.setFrozenRows(1);
    const finalColumns = Math.max(sh.getLastColumn(), expected.length);
    if (finalColumns > 0) {
      sh.getRange(1, 1, 1, finalColumns).setFontWeight('bold');
      sh.getRange(1, 1, 1, finalColumns).setWrap(true);
    }

    report.push({
      sheet: name,
      created: created,
      addedHeaders: missing,
      rows: Math.max(0, sh.getLastRow() - 1),
      columns: sh.getLastColumn()
    });
  });

  seedDefaults(ss);
  return {
    ok: true,
    spreadsheetId: ss.getId(),
    url: ss.getUrl(),
    preservedExistingData: true,
    sheets: report
  };
}

function validateCredlockBackend() {
  const ss = SpreadsheetApp.openById(CREDLOCK_PRODUCTION_SHEET_ID);
  const missingSheets = [];
  const schemaChecks = [];

  Object.keys(SCHEMA).forEach(function(name) {
    const sh = ss.getSheetByName(name);
    if (!sh) {
      missingSheets.push(name);
      return;
    }
    const actual = sh.getLastColumn() > 0
      ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String)
      : [];
    const missingHeaders = SCHEMA[name].filter(function(h) { return actual.indexOf(h) === -1; });
    schemaChecks.push({ sheet: name, ok: missingHeaders.length === 0, missingHeaders: missingHeaders, rows: Math.max(0, sh.getLastRow() - 1) });
  });

  return {
    ok: missingSheets.length === 0 && schemaChecks.every(function(x) { return x.ok; }),
    spreadsheetId: ss.getId(),
    url: ss.getUrl(),
    missingSheets: missingSheets,
    schema: schemaChecks
  };
}
