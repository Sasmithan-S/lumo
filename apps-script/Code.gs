const CONFIG = {
  accounts: 'Lumo_Accounts',
  statuses: 'Lumo_OrderStatus',
  trends: 'Ventes - Lumo Trends',
  shop: 'Ventes - Lumo Shop'
};

function setupAccounts() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName(CONFIG.accounts) || book.insertSheet(CONFIG.accounts);
  sheet.getRange(1, 1, 1, 7).setValues([['name', 'role', 'rateCents', 'passwordHash', 'email', 'username', 'active']]);
  upsertAccount_(sheet, ['Admin Lumo', 'admin', 100, '', '', 'admin', true]);
  upsertAccount_(sheet, ['joys', 'seller', 100, '', '', 'joys', true]);
  return 'Comptes installes.';
}

function setPasswords() {
  const adminPassword = 'CHANGE_ADMIN_PASSWORD';
  const joysPassword = 'CHANGE_JOYS_PASSWORD';
  if (adminPassword.indexOf('CHANGE_') === 0 || joysPassword.indexOf('CHANGE_') === 0) throw new Error('Remplace les mots de passe dans setPasswords.');
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.accounts);
  setPassword_(sheet, 'admin', adminPassword);
  setPassword_(sheet, 'joys', joysPassword);
  return 'Mots de passe enregistres.';
}

function doGet(event) {
  try {
    if ((event.parameter || {}).action === 'list') return json_({ok: true, sales: []});
    return json_({ok: true, service: 'lumo-api'});
  } catch (error) { return json_({ok: false, error: error.message}); }
}

function doPost(event) {
  try {
    const body = JSON.parse(event.postData.contents || '{}');
    if (body.action === 'auth') return json_(login_(body));
    const account = session_(body.sessionToken);
    if (body.action === 'createAccount') return json_(createAccount_(account, body));
    if (body.action === 'create') return json_(createSale_(body));
    if (body.action === 'pack' || body.action === 'cancel') return json_(changeStatus_(body.id, body.action === 'pack' ? 'packed' : 'cancelled'));
    throw new Error('Action inconnue.');
  } catch (error) { return json_({ok: false, error: error.message}); }
}

function login_(body) {
  const account = accounts_().find(row => String(row.username).toLowerCase() === String(body.username || '').toLowerCase() && String(row.active).toLowerCase() !== 'false');
  if (!account || account.passwordHash !== hash_(body.password || '')) throw new Error('Identifiant ou mot de passe incorrect.');
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('lumo:' + token, account.username, 21600);
  return {ok: true, sessionToken: token, account: publicAccount_(account)};
}

function session_(token) {
  const username = CacheService.getScriptCache().get('lumo:' + token);
  if (!username) throw new Error('Session expiree.');
  const account = accounts_().find(row => row.username === username);
  if (!account) throw new Error('Compte introuvable.');
  return account;
}

function createAccount_(admin, body) {
  if (admin.role !== 'admin') throw new Error('Action reservee a l admin.');
  if (!body.name || !body.username || !body.password) throw new Error('Nom, identifiant et mot de passe requis.');
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.accounts);
  if (accounts_().some(row => row.username === body.username)) throw new Error('Identifiant deja utilise.');
  sheet.appendRow([body.name, 'seller', 100, hash_(body.password), '', body.username, true]);
  return {ok: true, account: {name: body.name, username: body.username, roles: ['seller'], rateCents: 100}};
}

function createSale_(body) {
  if (!body.id || !body.buyer || !body.products) throw new Error('Vente incomplete.');
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName(body.shop === 'Lumo Shop' ? CONFIG.shop : CONFIG.trends);
  const p = body.products;
  sheet.appendRow([body.date || new Date(), body.seller || '', body.buyer, p['Velvet Kiss'] || 0, p['Sublime Satin'] || 0, p['Cotton Bloom'] || 0, p['Cashmere Whisper'] || 0, p['Eternal Silk'] || 0, p['Sweet Tweed'] || 0, Number(body.priceCents || 0) / 100, body.verified ? 'Oui' : '', Number(body.costCents || 0) / 100, '', '', Number(body.feeCents || 0) / 100, '', '', body.receiptUrl || '']);
  const status = book.getSheetByName(CONFIG.statuses) || book.insertSheet(CONFIG.statuses);
  if (status.getLastRow() === 0) status.appendRow(['id', 'sheetName', 'rowNumber', 'status']);
  status.appendRow([body.id, sheet.getName(), sheet.getLastRow(), 'pending']);
  return {ok: true, id: body.id};
}

function changeStatus_(id, value) {
  if (!id) throw new Error('Identifiant de vente manquant.');
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.statuses);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) if (String(rows[i][0]) === String(id)) { sheet.getRange(i + 1, 4).setValue(value); return {ok: true, id: id, status: value}; }
  throw new Error('Vente introuvable.');
}

function accounts_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.accounts);
  if (!sheet) throw new Error('Execute setupAccounts.');
  return sheet.getDataRange().getValues().slice(1).map(row => ({name: row[0], role: row[1], rateCents: row[2], passwordHash: row[3], email: row[4], username: row[5], active: row[6]}));
}

function upsertAccount_(sheet, account) {
  const rows = sheet.getDataRange().getValues();
  const index = rows.findIndex((row, i) => i > 0 && (row[0] === account[0] || row[5] === account[5]));
  if (index < 0) sheet.appendRow(account);
  else sheet.getRange(index + 1, 1, 1, 7).setValues([[account[0], account[1], account[2], rows[index][3] || '', account[4], account[5], account[6]]]);
}

function setPassword_(sheet, username, password) {
  const rows = sheet.getDataRange().getValues();
  const index = rows.findIndex((row, i) => i > 0 && row[5] === username);
  if (index < 0) throw new Error('Compte introuvable : ' + username);
  sheet.getRange(index + 1, 4).setValue(hash_(password));
}

function hash_(value) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8).map(byte => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0')).join(''); }
function publicAccount_(account) { return {name: account.name, username: account.username, roles: String(account.role).split(','), rateCents: Number(account.rateCents || 0)}; }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
