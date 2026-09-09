/** Transport layer for synchronizing Zite data into the production Google Sheet. */
const ZITE_TRANSPORT_VERSION = '1.0';

function ingestZiteSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') throw new Error('A Zite snapshot object is required.');
  const ss = SpreadsheetApp.openById(CREDLOCK_PRODUCTION_SHEET_ID);
  const report = [];
  Object.keys(snapshot).forEach(function(table) {
    if (['version','source','destination','generatedAt'].indexOf(table) >= 0) return;
    const rows = Array.isArray(snapshot[table]) ? snapshot[table] : [];
    if (!rows.length) return;
    const sh = ensureTransportSheet(ss, table, rows[0]);
    const headers = Object.keys(rows[0]);
    const values = rows.map(function(row) {
      return headers.map(function(header) {
        const value = row[header];
        if (value === null || value === undefined) return '';
        return typeof value === 'object' ? JSON.stringify(value) : value;
      });
    });
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).clearContent();
    if (values.length) sh.getRange(2, 1, values.length, headers.length).setValues(values);
    sh.setFrozenRows(1);
    report.push({table: table, rows: rows.length});
  });
  return {ok: true, version: ZITE_TRANSPORT_VERSION, syncedAt: now(), tables: report};
}

function ensureTransportSheet(ss, name, sample) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastColumn() === 0) sh.getRange(1, 1, 1, Object.keys(sample).length).setValues([Object.keys(sample)]);
  return sh;
}
