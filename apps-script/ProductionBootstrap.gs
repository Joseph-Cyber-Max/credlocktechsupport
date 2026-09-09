/**
 * One-time production bootstrap for the Credlock Technical Support backend.
 * Run initializeProductionBackend(email, pin) manually from Apps Script after
 * deploying this project. The PIN is hashed by createAuthUser and is never
 * stored in this source file.
 */
function initializeProductionBackend(superAdminEmail, superAdminPin) {
  if (!superAdminEmail || !superAdminPin) {
    throw new Error('Superadmin email and PIN are required.');
  }

  const config = configureCredlockProductionBackend();
  const setup = safeSetupBackend();
  const existing = listRecords(SpreadsheetApp.openById(CREDLOCK_PRODUCTION_SHEET_ID), 'Auth Users', 5000)
    .find(function(user) {
      return String(user.Email).trim().toLowerCase() === String(superAdminEmail).trim().toLowerCase();
    });

  let admin = existing;
  if (!existing) {
    admin = createAuthUser(
      String(superAdminEmail).trim().toLowerCase(),
      String(superAdminPin),
      'ADMIN',
      'Technical Support'
    );
  }

  const validation = validateCredlockBackend();
  if (!validation.ok) {
    throw new Error('Production backend validation failed: ' + JSON.stringify(validation));
  }

  return {
    ok: true,
    spreadsheetId: config.spreadsheetId,
    spreadsheetUrl: config.url,
    createdSuperadmin: !existing,
    superadminEmail: admin.Email,
    setup: setup,
    validation: validation
  };
}

function productionBackendStatus() {
  const validation = validateCredlockBackend();
  return {
    ok: validation.ok,
    spreadsheetId: validation.spreadsheetId,
    spreadsheetUrl: validation.url,
    missingSheets: validation.missingSheets,
    schema: validation.schema
  };
}
