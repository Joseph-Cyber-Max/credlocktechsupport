/**
 * Advanced operational utilities for Credlock Technical Support.
 * These functions operate directly on the production Google Sheet and are
 * intentionally separated from the HTTP handlers so they can be tested safely.
 */
function getOperationalSnapshot() {
  const ss = SpreadsheetApp.openById(CREDLOCK_PRODUCTION_SHEET_ID);
  const issues = listRecords(ss, 'Issues', 5000);
  const nowMs = Date.now();
  const openStatuses = ['OPEN', 'IN_PROGRESS', 'PENDING', 'REOPENED'];
  const open = issues.filter(r => openStatuses.indexOf(String(r.Status || '').toUpperCase()) >= 0);
  const critical = open.filter(r => String(r.Priority || '').toUpperCase() === 'CRITICAL');
  const overdue = open.filter(r => isTicketSlaBreached(r, nowMs));
  const byCategory = countBy(issues, 'Category');
  const byOfficer = countBy(open, 'Assigned Officer');
  return {
    generatedAt: now(),
    totalTickets: issues.length,
    openTickets: open.length,
    criticalTickets: critical.length,
    slaBreaches: overdue.length,
    categoryVolume: byCategory,
    officerQueue: byOfficer
  };
}

function isTicketSlaBreached(ticket, nowMs) {
  const status = String(ticket.Status || '').toUpperCase();
  if (['RESOLVED', 'CLOSED'].indexOf(status) >= 0) return false;
  const created = new Date(ticket['Date Created']).getTime();
  if (!created || isNaN(created)) return false;
  const target = Number(ticket['SLA Target (Minutes)'] || 0);
  if (!target) return false;
  return nowMs > created + target * 60000;
}

function findDuplicateDevices() {
  const ss = SpreadsheetApp.openById(CREDLOCK_PRODUCTION_SHEET_ID);
  const issues = listRecords(ss, 'Issues', 10000);
  const seen = {};
  issues.forEach(function(r) {
    const keys = [String(r['Customer Device / IMEI'] || '').trim(), String(r['NIN Number'] || '').trim()];
    keys.forEach(function(key) {
      if (!key) return;
      if (!seen[key]) seen[key] = [];
      seen[key].push(r['Ticket ID'] || r['Record ID']);
    });
  });
  return Object.keys(seen)
    .filter(k => seen[k].length > 1)
    .map(k => ({ identifier: k, tickets: seen[k], count: seen[k].length }));
}

function searchAllOperationalData(query, limit) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const max = Number(limit || 100);
  const ss = SpreadsheetApp.openById(CREDLOCK_PRODUCTION_SHEET_ID);
  const results = [];
  Object.keys(SCHEMA).some(function(table) {
    const records = listRecords(ss, table, 5000);
    records.forEach(function(record) {
      if (results.length >= max) return;
      const match = Object.keys(record).some(function(key) {
        return String(record[key] == null ? '' : record[key]).toLowerCase().indexOf(q) >= 0;
      });
      if (match) results.push({ table: table, record: record });
    });
    return results.length >= max;
  });
  return results;
}

function bulkUpdateTickets(ticketIds, changes, actor, reason) {
  const ids = Array.isArray(ticketIds) ? ticketIds : [];
  const updates = changes || {};
  if (!ids.length) return { updated: 0, skipped: 0, results: [] };
  const ss = SpreadsheetApp.openById(CREDLOCK_PRODUCTION_SHEET_ID);
  const results = [];
  ids.forEach(function(id) {
    try {
      const current = getRecord(ss, 'Issues', id);
      if (!current) throw new Error('Ticket not found');
      const record = updateRecord(ss, 'Issues', id, updates, actor || 'SYSTEM');
      if (reason) writeAudit('BULK_UPDATE', 'Issues', id, JSON.stringify(current), JSON.stringify(record), 'MEDIUM', actor || 'SYSTEM');
      results.push({ id: id, ok: true });
    } catch (e) {
      results.push({ id: id, ok: false, error: String(e) });
    }
  });
  return { updated: results.filter(r => r.ok).length, skipped: results.filter(r => !r.ok).length, results: results };
}

function writeSlaBreachSnapshot() {
  const ss = SpreadsheetApp.openById(CREDLOCK_PRODUCTION_SHEET_ID);
  let sh = ss.getSheetByName('SLA Breach Snapshots');
  if (!sh) sh = ss.insertSheet('SLA Breach Snapshots');
  const headers = ['Snapshot Time','Ticket ID','Record ID','Status','Priority','Assigned Officer','SLA Target (Minutes)','Date Created','Customer / Merchant Phone'];
  const current = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String) : [];
  if (!current.length) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  const issues = listRecords(ss, 'Issues', 10000);
  const breached = issues.filter(r => isTicketSlaBreached(r, Date.now()));
  if (breached.length) {
    const rows = breached.map(r => [now(), r['Ticket ID'] || '', r['Record ID'] || '', r.Status || '', r.Priority || '', r['Assigned Officer'] || '', r['SLA Target (Minutes)'] || '', r['Date Created'] || '', r['Customer / Merchant Phone'] || '']);
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
  }
  return { ok: true, breached: breached.length, snapshotTime: now() };
}

function countBy(records, field) {
  return records.reduce(function(acc, record) {
    const key = String(record[field] || 'Unassigned').trim() || 'Unassigned';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}
