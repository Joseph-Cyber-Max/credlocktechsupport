/**
 * Credlock Technical Support Ticketing System
 * Google Sheets + Apps Script backend for the React frontend.
 *
 * First-time setup:
 * 1. Open Apps Script and paste this file.
 * 2. Run setupBackend() once and approve permissions.
 * 3. Deploy as Web app: Execute as Me, access for your intended users.
 * 4. Put the deployed /exec URL in VITE_APPS_SCRIPT_URL.
 */

const TZ = 'Africa/Lagos';
const CONFIG_KEY = 'CREDLOCK_SPREADSHEET_ID';

const SCHEMA = {
  'Users': ['Record ID','Email','First Name','Last Name','Role','Photo','Date Created','Status','Department'],
  'Departments': ['Record ID','Department Name','Manager Email','Users','Issue Categories','Officers','Issues','BNPL Applications','Incidents','Internal Requests','Monthly Evaluations'],
  'Issue Categories': ['Record ID','Category Name','Priority Level','Default Department','Issues'],
  'Officers': ['Record ID','Officer Name','Email','Department','Role','Issues','Status'],
  'Issues': ['Record ID','Issue Title','Description','Category','Department','Reported By Email','Assigned Officer','Priority','Status','Date Created','First Response Time','Date Resolved','Feedback','Customer Name','NIN Number','Incidents','Todo Items','Source','Contact Phone','Has Foneflex Loan','Rejection Reason','Foneflex Request Type','Subject Type','Action Reason','Crime Book Logged','Ticket ID','SLA Target (Minutes)','FRT Minutes','Resolution Minutes','SLA Met','Resolution Notes','Root Cause','Escalation Required','Escalation Level','Ticket Closed At','Channel','Customer / Merchant Phone','Customer Device / IMEI','Customer Loan / Application Reference','Reopen Count','Attachment URLs'],
  'Feedback': ['Record ID','Feedback ID','Issue','Message','Sender Email','Sender Type','Date Sent'],
  'Meetings': ['Record ID','Meeting Title','Meeting Date','Meeting Type','Status','Meeting Notes','Created By Email','Created At'],
  'Meeting Items': ['Record ID','Topic','Meeting','Item Type','Details','Status','Priority','Added By','Date Added'],
  'AuditLog': ['Record ID','Action','Performed By','Affected Record','Affected Table','Reason','Old Value','New Value','Timestamp','Severity'],
  'Incidents': ['Record ID','Incident Title','Severity','Incident Type','Status','Department','Linked Ticket','Impact Description','Resolution Notes','Date Reported','Date Resolved','Assigned To Email'],
  'Todo Items': ['Record ID','Task','Priority','Status','Assigned To','Created By','Due Date','Notes','Date Created','Related Ticket','Is Personal'],
  'Page Permissions': ['Record ID','Page Key','Allowed Roles','Allowed Actions','Updated By','Updated At'],
  'Internal Requests': ['Record ID','Request Title','Status','Requested By Email','Requested By Name','Department','Amount','Description','Reviewed By','Review Notes','Date Submitted','Date Reviewed'],
  'Knowledge Base Articles': ['Record ID','Title','Category','Severity','Tags','Steps','Response Template','Escalation Path','Created By Email','Date Created'],
  'Recovery Records': ['Record ID','Device Name','Serial Number','IMEI Number','Device Type','Customer Name','Customer Phone','Recovery Status','Recovered By Email','Recovered By Name','Recovery Date','Notes','Location Found','Date Logged'],
  'Recovery Tasks': ['Record ID','Task Title','Description','Status','Priority','Assigned To Email','Assigned To Name','Assigned By Email','Due Date','Date Assigned','Notes'],
  'Monthly Evaluations': ['Record ID','Evaluation ID','Team Lead Name','Month','Year','Team Member Name','Team Member Email','Customers Assisted','Merchants Assisted','Technical Issues Resolved','Accounts Unlocked','Issues Escalated','Additional Notes','Status','Submitted By Email','Submitted By Name','Department','Reviewed By','Review Notes','Date Submitted','Date Reviewed','AI Score','AI Summary','Avg Response Time','CSAT','NPS','FCR','Tickets Closed','Tickets Reopened','Live Chat Interactions','Voice Calls','Devices Enrolled','Devices Wiped','Device Compliance','App Installations','MDM Policy Violations','Remote Lock Unlock','Loan Apps Processed','Loan Approvals','Loan Rejections','Collections Follow Ups','Reversals Processed','Defaults Overdues Managed','Credit Adjustments','KB Articles Updated','Training Attended','Process Improvements','Compliance Audits Passed','Errors Reported','New Merchants Onboarded','New Customers Registered','Upsell Cross Sell','Revenue Influenced'],
  'Staff Schedules': ['Record ID','Schedule Title','Employee Email','Employee Name','Department Name','Date','Day Type','Shift','Start Time','End Time','Notes','Approved By','Submitted By Email','Date Created','Week Number','Year'],
  'Pending Questions': ['Record ID','Question','Language','Asked By Name','Status','Answer','Answered By','Source','Date Asked'],
  'Broadcasts': ['Record ID','Title','Message','Type','Target','Created By Email','Is Active','Expires At','Date Created'],
  'KPI Targets': ['Record ID','Target Name','Target Value','Unit','Category','Description','Last Updated'],
  'Manual Reports': ['Record ID','Report Date','Officer Name','BNPL Reviewed','BNPL Ongoing','BNPL Pending','BNPL Rejected','Customers Assisted','Merchants Assisted','Calls Chats','Customers Unlocked','Training Support','Merchant Complaints','Technical Issues','Operational Challenge','Recommendations','Period Breakdown','Uploaded Documents','Submitted By','Created At'],
  'BNPL Applications': ['Record ID','Application Reference','Customer Name','Customer Phone','Merchant Name','Device','IMEI','Amount','Status','Assigned Officer','Submitted At','Reviewed At','Rejection Reason','Department'],
  'Operational Blueprints': ['Record ID','Title','Content','Version','Last Updated']
};

const SELECTS = {
  Role: ['ADMIN','EMPLOYEE','BUSINESS MANAGER','TECHNICAL SUPPORT OFFICER','HR','OFFICER'],
  UserStatus: ['ACTIVE','INACTIVE'],
  Priority: ['HIGH','MEDIUM','LOW'],
  IssueStatus: ['OPEN','IN_PROGRESS','PENDING','RESOLVED','CLOSED'],
  Source: ['Web Portal','WhatsApp','Email','Phone','Walk-In','SYSTEM_CREATE','AI Assistant','Merchant Support Portal'],
  SubjectType: ['Customer','Merchant'],
  FoneflexRequestType: ['Unlock Request','Lock Request','Removal Request'],
  EscalationLevel: ['L1','L2','L3','MANAGEMENT'],
  IncidentStatus: ['OPEN','INVESTIGATING','RESOLVED','CLOSED'],
  TaskStatus: ['Assigned','In Progress','Completed','Cancelled'],
  BroadcastType: ['INFO','ALERT','MAINTENANCE','POLICY','TRAINING'],
  Target: ['ALL','OFFICERS','MERCHANTS','CUSTOMERS','MANAGERS','ADMIN']
};

function setupBackend() {
  const existingId = PropertiesService.getScriptProperties().getProperty(CONFIG_KEY);
  let ss = existingId ? SpreadsheetApp.openById(existingId) : SpreadsheetApp.create('Credlock Technical Support Ticketing Backend');
  PropertiesService.getScriptProperties().setProperty(CONFIG_KEY, ss.getId());

  Object.keys(SCHEMA).forEach((name) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    const headers = SCHEMA[name];
    const current = sheet.getLastColumn() ? sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0] : [];
    if (current.length === 0 || current.every(v => !v)) sheet.getRange(1,1,1,headers.length).setValues([headers]);
    else if (current.join('|') !== headers.join('|')) {
      sheet.clear();
      sheet.getRange(1,1,1,headers.length).setValues([headers]);
    }
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,headers.length).setFontWeight('bold');
    sheet.autoResizeColumns(1, headers.length);
  });

  seedDefaults(ss);
  return { ok:true, spreadsheetId:ss.getId(), url:ss.getUrl(), sheets:Object.keys(SCHEMA) };
}

function seedDefaults(ss) {
  const seed = (sheetName, rows) => {
    const sh = ss.getSheetByName(sheetName);
    if (!sh || sh.getLastRow() > 1) return;
    const headers = SCHEMA[sheetName];
    const values = rows.map(row => headers.map(h => row[h] ?? ''));
    if (values.length) sh.getRange(2,1,values.length,headers.length).setValues(values);
  };
  seed('Departments', [
    {'Record ID':'DEP-TECH','Department Name':'Technical Support','Manager Email':'','Users':'','Issue Categories':'','Officers':'','Issues':'','BNPL Applications':'','Incidents':'','Internal Requests':'','Monthly Evaluations':''},
    {'Record ID':'DEP-COL','Department Name':'Collections','Manager Email':'','Users':'','Issue Categories':'','Officers':'','Issues':'','BNPL Applications':'','Incidents':'','Internal Requests':'','Monthly Evaluations':''}
  ]);
  seed('Issue Categories', [
    {'Record ID':'CAT-APP','Category Name':'App / Login Issue','Priority Level':'HIGH','Default Department':'Technical Support'},
    {'Record ID':'CAT-DEVICE','Category Name':'Device / IMEI','Priority Level':'HIGH','Default Department':'Technical Support'},
    {'Record ID':'CAT-BNPL','Category Name':'BNPL Operations','Priority Level':'MEDIUM','Default Department':'Technical Support'},
    {'Record ID':'CAT-MERCHANT','Category Name':'Merchant Support','Priority Level':'MEDIUM','Default Department':'Technical Support'},
    {'Record ID':'CAT-PAYMENT','Category Name':'Payment / Reversal','Priority Level':'HIGH','Default Department':'Technical Support'},
    {'Record ID':'CAT-COLLECTIONS','Category Name':'Collections','Priority Level':'MEDIUM','Default Department':'Collections'}
  ]);
  seed('Page Permissions', [
    {'Record ID':'PERM-DASH','Page Key':'dashboard','Allowed Roles':'ADMIN,TECHNICAL SUPPORT OFFICER,BUSINESS MANAGER,HR','Allowed Actions':'read'},
    {'Record ID':'PERM-TICKETS','Page Key':'tickets','Allowed Roles':'ADMIN,TECHNICAL SUPPORT OFFICER,BUSINESS MANAGER,OFFICER','Allowed Actions':'read,create,update'},
    {'Record ID':'PERM-ADMIN','Page Key':'admin','Allowed Roles':'ADMIN','Allowed Actions':'read,create,update,delete'}
  ]);
}

function doGet(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};
    const action = p.action || 'health';
    if (action === 'health') return json({ok:true, service:'credlock-ticketing', timezone:TZ, time:now()});
    const ss = getSpreadsheet();
    if (action === 'setup') return json(setupBackend());
    if (action === 'metadata') return json({ok:true, schema:SCHEMA, selects:SELECTS});
    if (action === 'dashboard') return json({ok:true, metrics:getMetrics(ss), tickets:listRecords(ss,'Issues',p.limit || 50)});
    if (action === 'tickets') return json({ok:true, metrics:getMetrics(ss), tickets:listRecords(ss,'Issues',p.limit || 200)});
    if (action === 'list') return json({ok:true, table:p.table, records:listRecords(ss,p.table,p.limit || 500)});
    if (action === 'get') return json({ok:true, record:getRecord(ss,p.table,p.id)});
    return json({ok:false,error:'Unknown action'});
  } catch (err) { return json({ok:false,error:String(err)}); }
}

function doPost(e) {
  try {
    const body = parseBody(e);
    const action = body.action || 'create';
    const ss = getSpreadsheet();
    if (action === 'setup') return json(setupBackend());
    if (action === 'create') return json({ok:true, record:createRecord(ss,body.table,body.record || {})});
    if (action === 'update') return json({ok:true, record:updateRecord(ss,body.table,body.id,body.record || {})});
    if (action === 'delete') return json({ok:true, deleted:deleteRecord(ss,body.table,body.id)});
    if (action === 'upload') return json({ok:true, file:saveAttachment(body)});
    return json({ok:false,error:'Unknown action'});
  } catch (err) { return json({ok:false,error:String(err)}); }
}

function getSpreadsheet() {
  const id = PropertiesService.getScriptProperties().getProperty(CONFIG_KEY);
  if (!id) throw new Error('Backend is not initialized. Run setupBackend() once.');
  return SpreadsheetApp.openById(id);
}

function listRecords(ss, table, limit) {
  const sh = getSheet(ss,table);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values.shift();
  return values.filter(row => row.some(v => v !== '')).slice(0,Number(limit)||500).map(rowToObject(headers,row));
}

function getRecord(ss,table,id) {
  const sh = getSheet(ss,table);
  const values = sh.getDataRange().getValues();
  if (!values.length) return null;
  const headers = values[0];
  const idx = headers.indexOf('Record ID');
  const row = values.slice(1).find(r => String(r[idx]) === String(id));
  return row ? rowToObject(headers,row) : null;
}

function createRecord(ss,table,record) {
  const sh = getSheet(ss,table);
  const headers = SCHEMA[table];
  const out = Object.assign({},record);
  if (!out['Record ID']) out['Record ID'] = makeId(table);
  if (table === 'Issues') {
    if (!out['Ticket ID']) out['Ticket ID'] = nextTicketId(sh);
    if (!out['Date Created']) out['Date Created'] = now();
    if (!out['Status']) out['Status'] = 'OPEN';
    if (!out['Reopen Count']) out['Reopen Count'] = 0;
  }
  if (table === 'AuditLog' && !out['Timestamp']) out['Timestamp'] = now();
  if (table === 'Feedback' && !out['Feedback ID']) out['Feedback ID'] = nextNumericId(sh,'Feedback ID');
  const row = headers.map(h => normalizeCell(out[h]));
  sh.appendRow(row);
  if (table === 'Issues') writeDerivedTicketMetrics(sh,sh.getLastRow());
  writeAudit('CREATE',table,out['Record ID'],'',JSON.stringify(out),'MEDIUM');
  return rowToObject(headers,row);
}

function updateRecord(ss,table,id,record) {
  const sh = getSheet(ss,table);
  const values = sh.getDataRange().getValues();
  const headers = values[0];
  const idx = headers.indexOf('Record ID');
  const rowIndex = values.slice(1).findIndex(r => String(r[idx]) === String(id));
  if (rowIndex < 0) throw new Error('Record not found');
  const actualRow = rowIndex + 2;
  const old = rowToObject(headers,values[actualRow-1]);
  const next = Object.assign({},old,record);
  sh.getRange(actualRow,1,1,headers.length).setValues([headers.map(h => normalizeCell(next[h]))]);
  if (table === 'Issues') writeDerivedTicketMetrics(sh,actualRow);
  writeAudit('UPDATE',table,id,JSON.stringify(old),JSON.stringify(next),'MEDIUM');
  return rowToObject(headers,headers.map(h => normalizeCell(next[h])));
}

function deleteRecord(ss,table,id) {
  const sh = getSheet(ss,table);
  const values = sh.getDataRange().getValues();
  const idx = values[0].indexOf('Record ID');
  const rowIndex = values.slice(1).findIndex(r => String(r[idx]) === String(id));
  if (rowIndex < 0) return false;
  sh.deleteRow(rowIndex+2);
  writeAudit('DELETE',table,id,'','', 'HIGH');
  return true;
}

function getMetrics(ss) {
  const tickets = listRecords(ss,'Issues',5000);
  const active = tickets.filter(t => ['OPEN','IN_PROGRESS','PENDING'].includes(String(t.Status).toUpperCase()));
  const closed = tickets.filter(t => ['CLOSED','RESOLVED'].includes(String(t.Status).toUpperCase()));
  const critical = tickets.filter(t => String(t.Priority).toUpperCase() === 'HIGH' && !['CLOSED','RESOLVED'].includes(String(t.Status).toUpperCase()));
  const frt = tickets.map(t => Number(t['FRT Minutes'])).filter(Number.isFinite);
  const res = tickets.map(t => Number(t['Resolution Minutes'])).filter(Number.isFinite);
  const sla = closed.filter(t => String(t['SLA Met']).toUpperCase() === 'TRUE');
  const categories = {};
  tickets.forEach(t => { const k = t.Category || 'Uncategorized'; categories[k] = (categories[k]||0)+1; });
  const imeiValidation = tickets.filter(t => t['Customer Device / IMEI'] || String(t.Category).toLowerCase().includes('imei')).filter(t => !['CLOSED','RESOLVED'].includes(String(t.Status).toUpperCase())).length;
  const reopened = tickets.reduce((n,t)=>n+(Number(t['Reopen Count'])||0),0);
  return {
    total:tickets.length,
    open:active.length,
    pending:tickets.filter(t=>String(t.Status).toUpperCase()==='PENDING').length,
    closed:closed.length,
    critical:critical.length,
    slaCompliance:closed.length ? Math.round((sla.length/closed.length)*100) : 100,
    resolutionTime:res.length ? Math.round(res.reduce((a,b)=>a+b,0)/res.length/60*10)/10 : 0,
    firstResponseTime:frt.length ? Math.round(frt.reduce((a,b)=>a+b,0)/frt.length) : 0,
    imeiValidation,
    deviceChanges:tickets.filter(t=>/device/i.test(String(t.Category))).length,
    duplicatePayments:tickets.filter(t=>/duplicate|payment/i.test(String(t.Category)+' '+String(t.IssueTitle))).length,
    officerPerformance:closed.length ? Math.round((closed.length/tickets.length)*100) : 100,
    merchantPerformance:Math.round((tickets.filter(t=>String(t.SubjectType).toLowerCase()==='merchant').length/Math.max(tickets.length,1))*100),
    recurringIssues:Object.keys(categories).filter(k=>categories[k]>1).length,
    aiInsights:Math.max(0,critical.length+imeiValidation),
    technicalIssues:categories['App / Login Issue']||categories['Device / IMEI']||categories['Technical']||0,
    customerIssues:categories['Customer']||categories['Customer Support']||0,
    loanIssues:categories['BNPL Operations']||categories['Loan']||0,
    merchantIssues:categories['Merchant Support']||categories['Merchant']||0,
    reopened
  };
}

function writeDerivedTicketMetrics(sh,row) {
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const rowValues = sh.getRange(row,1,1,sh.getLastColumn()).getValues()[0];
  const get = key => rowValues[headers.indexOf(key)];
  const set = (key,value) => { const i=headers.indexOf(key); if(i>=0) sh.getRange(row,i+1).setValue(value); };
  const created = dateValue(get('Date Created'));
  const response = dateValue(get('First Response Time'));
  const resolved = dateValue(get('Date Resolved') || get('Ticket Closed At'));
  if (created && response) set('FRT Minutes',Math.max(0,(response-created)/60000));
  if (created && resolved) set('Resolution Minutes',Math.max(0,(resolved-created)/60000));
  const target = Number(get('SLA Target (Minutes)')) || 1440;
  const resolution = Number(get('Resolution Minutes'));
  if (resolution && target) set('SLA Met',resolution <= target);
}

function writeAudit(action,table,id,oldValue,newValue,severity) {
  try {
    const ss = getSpreadsheet();
    const sh = ss.getSheetByName('AuditLog');
    if (!sh) return;
    const rec = {'Record ID':makeId('AUD'),'Action':action,'Performed By':Session.getActiveUser().getEmail() || 'SYSTEM','Affected Record':id,'Affected Table':table,'Reason':'API operation','Old Value':oldValue,'New Value':newValue,'Timestamp':now(),'Severity':severity};
    sh.appendRow(SCHEMA.AuditLog.map(h=>normalizeCell(rec[h])));
  } catch (_) {}
}

function saveAttachment(body) {
  if (!body || !body.data) throw new Error('Attachment data is required');
  const bytes = Utilities.base64Decode(String(body.data).split(',').pop());
  const blob = Utilities.newBlob(bytes,body.mimeType || 'application/octet-stream',body.name || ('attachment-'+Date.now()));
  const folderName = 'Credlock Ticket Attachments';
  const folders = DriveApp.getFoldersByName(folderName);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
  const file = folder.createFile(blob);
  return {name:file.getName(),url:file.getUrl(),id:file.getId()};
}

function parseBody(e) {
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  try { return JSON.parse(raw); } catch (_) { return e.parameter || {}; }
}

function getSheet(ss,name) {
  if (!SCHEMA[name]) throw new Error('Unsupported table: '+name);
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Missing sheet: '+name+'. Run setupBackend().');
  return sh;
}

function rowToObject(headers,row) {
  const out = {};
  headers.forEach((h,i)=>out[h]=row[i] instanceof Date ? Utilities.formatDate(row[i],TZ,"yyyy-MM-dd'T'HH:mm:ssXXX") : row[i]);
  return out;
}
function normalizeCell(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}
function dateValue(v) { if (!v) return null; const d=v instanceof Date?v:new Date(v); return isNaN(d.getTime())?null:d.getTime(); }
function now() { return Utilities.formatDate(new Date(),TZ,"yyyy-MM-dd'T'HH:mm:ssXXX"); }
function makeId(prefix) { return prefix.replace(/[^A-Z0-9]/gi,'').slice(0,5).toUpperCase()+'-'+Utilities.getUuid().slice(0,8).toUpperCase(); }
function nextNumericId(sh,header) { const values=sh.getDataRange().getValues(); const i=values[0].indexOf(header); return Math.max(0,...values.slice(1).map(r=>Number(r[i])||0))+1; }
function nextTicketId(sh) { const n=nextNumericId(sh,'Ticket ID'); return n; }
function json(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
