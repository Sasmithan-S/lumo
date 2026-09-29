const CONFIG = {
  spreadsheetId: '1xJePHU-coBR_L-p0PwrjS-PbGgAXfo4lrlHzayZSS_s',
  sheets: {
    sales: 'Lumo_Sales',
    trends: 'Ventes - Lumo Trends',
    shop: 'Ventes - Lumo Shop',
    orderStatus: 'Lumo_OrderStatus',
    accounts: 'Lumo_Accounts',
    products: 'Lumo_Products',
    config: 'Lumo_Config'
  }
};

function doGet(event) {
  try {
    const params = event.parameter || {};
    if (params.action === 'list') return json_(list_(params));
    if (params.action === 'health') return json_(health_());
    return json_({ ok: true, service: 'lumo-api', version: '1' });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function doPost(event) {
  try {
    const body = JSON.parse(event.postData.contents || '{}');
    switch (body.action) {
      case 'setup': return json_(setup_());
      case 'health': return json_(health_());
      case 'create': return json_(createSale_(body));
      case 'pack': return json_(setStatus_(body, 'packed'));
      case 'cancel': return json_(setStatus_(body, 'cancelled'));
      case 'roles': return json_(setRoles_(body));
      case 'rate': return json_(setRate_(body));
      default: return json_({ ok: false, error: 'Action inconnue.' });
    }
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function setup_() {
  const book = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const definitions = {
    [CONFIG.sheets.accounts]: ['name', 'role', 'rateCents', 'active'],
    [CONFIG.sheets.products]: ['name', 'abbr', 'costCents', 'stock', 'active'],
    [CONFIG.sheets.config]: ['key', 'value'],
    [CONFIG.sheets.orderStatus]: ['id', 'sheetName', 'rowNumber', 'status', 'packedAt', 'cancelledAt']
  };

  Object.keys(definitions).forEach(name => {
    const sheet = book.getSheetByName(name) || book.insertSheet(name);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, definitions[name].length).setValues([definitions[name]]);
      sheet.setFrozenRows(1);
    }
  });

  return { ok: true, message: 'Onglets Lumo créés ou conservés.' };
}

function health_() {
  const book = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  return {
    ok: true,
    spreadsheet: book.getName(),
    sheets: Object.keys(CONFIG.sheets).map(key => CONFIG.sheets[key])
  };
}

function list_(params) {
  const statusRows = readRows_(sheet_(CONFIG.sheets.orderStatus));
  const rows = [CONFIG.sheets.trends, CONFIG.sheets.shop].flatMap(name => readExistingSales_(sheet_(name), name, statusRows));
  const seller = params.seller || '';
  return { ok: true, sales: rows.filter(row => !seller || row.seller === seller) };
}

function createSale_(body) {
  if (!body.id || !body.seller || !body.buyer || !body.products) {
    throw new Error('Vente incomplète.');
  }
  const sheet = sheet_(body.shop === 'Lumo Shop' ? CONFIG.sheets.shop : CONFIG.sheets.trends);
  const products = typeof body.products === 'string' ? body.products : JSON.stringify(body.products);
  const row = appendExistingSale_(sheet, body, products);
  appendObject_(sheet_(CONFIG.sheets.orderStatus), {id: body.id, sheetName: sheet.getName(), rowNumber: sheet.getLastRow(), status: 'pending', packedAt: '', cancelledAt: ''});
  return { ok: true, sale: row };
}

function setStatus_(body, status) {
  if (!body.id) throw new Error('Identifiant de vente manquant.');
  const sheet = sheet_(CONFIG.sheets.orderStatus);
  const headers = headers_(sheet);
  const idColumn = headers.indexOf('id') + 1;
  const statusColumn = headers.indexOf('status') + 1;
  const timestampColumn = headers.indexOf(status === 'packed' ? 'packedAt' : 'cancelledAt') + 1;
  if (!idColumn || !statusColumn || !timestampColumn) throw new Error('Colonnes de statut absentes. Exécuter setup_.');
  const values = sheet.getDataRange().getValues();
  for (let index = 1; index < values.length; index += 1) {
    if (String(values[index][idColumn - 1]) === String(body.id)) {
      sheet.getRange(index + 1, statusColumn).setValue(status);
      sheet.getRange(index + 1, timestampColumn).setValue(new Date().toISOString());
      if (status === 'cancelled') {
        const sourceName = values[index][headers.indexOf('sheetName')];
        const sourceRow = Number(values[index][headers.indexOf('rowNumber')]);
        sheet_(sourceName).deleteRow(sourceRow);
        adjustStatusRows_(sheet, sourceName, sourceRow, body.id);
      }
      return { ok: true, id: body.id, status: status };
    }
  }
  throw new Error('Vente introuvable.');
}

function adjustStatusRows_(sheet, sourceName, deletedRow, deletedId) {
  const headers = headers_(sheet);
  const values = sheet.getDataRange().getValues();
  const idColumn = headers.indexOf('id');
  const sheetColumn = headers.indexOf('sheetName');
  const rowColumn = headers.indexOf('rowNumber');
  for (let index = 1; index < values.length; index += 1) {
    if (String(values[index][sheetColumn]) === String(sourceName) && Number(values[index][rowColumn]) > deletedRow && String(values[index][idColumn]) !== String(deletedId)) {
      sheet.getRange(index + 1, rowColumn + 1).setValue(Number(values[index][rowColumn]) - 1);
    }
  }
}

function setRoles_(body) {
  if (!body.name || !Array.isArray(body.roles)) throw new Error('Compte ou rôles manquants.');
  const sheet = sheet_(CONFIG.sheets.accounts);
  const headers = headers_(sheet);
  const rows = sheet.getDataRange().getValues();
  const nameColumn = headers.indexOf('name');
  const roleColumn = headers.indexOf('role');
  for (let index = 1; index < rows.length; index += 1) {
    if (String(rows[index][nameColumn]) === String(body.name)) {
      sheet.getRange(index + 1, roleColumn + 1).setValue(body.roles.join(','));
      return { ok: true, name: body.name, roles: body.roles };
    }
  }
  throw new Error('Compte introuvable.');
}

function setRate_(body) {
  if (!body.name || !Number.isFinite(Number(body.rateCents))) throw new Error('Tarif manquant.');
  const sheet = sheet_(CONFIG.sheets.accounts);
  const headers = headers_(sheet);
  const rows = sheet.getDataRange().getValues();
  const nameColumn = headers.indexOf('name');
  const rateColumn = headers.indexOf('rateCents');
  for (let index = 1; index < rows.length; index += 1) {
    if (String(rows[index][nameColumn]) === String(body.name)) {
      sheet.getRange(index + 1, rateColumn + 1).setValue(Number(body.rateCents));
      return { ok: true, name: body.name, rateCents: Number(body.rateCents) };
    }
  }
  throw new Error('Compte introuvable.');
}

function sheet_(name) {
  const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(name);
  if (!sheet) throw new Error('Onglet absent : ' + name + '. Exécuter setup_.');
  return sheet;
}

function headers_(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
}

function readRows_(sheet) {
  const headers = headers_(sheet);
  return sheet.getDataRange().getValues().slice(1).map(values => headers.reduce((row, header, index) => {
    row[header] = values[index];
    return row;
  }, {}));
}

function appendObject_(sheet, object) {
  const headers = headers_(sheet);
  sheet.appendRow(headers.map(header => object[header] === undefined ? '' : object[header]));
}

function appendExistingSale_(sheet, body, productsJson) {
  const quantities = typeof body.products === 'string' ? JSON.parse(body.products) : body.products;
  const values = {
    'Date': body.date || new Date().toISOString(),
    'Vendeur': body.seller,
    'Acheteur (pseudo)': body.buyer,
    'Qté Velvet Kiss': quantities['Velvet Kiss'] || 0,
    'Qté Sublime Satin': quantities['Sublime Satin'] || 0,
    'Qté Cotton Bloom': quantities['Cotton Bloom'] || 0,
    'Qté Cashmere Whisper': quantities['Cashmere Whisper'] || 0,
    'Qté Eternal Silk': quantities['Eternal Silk'] || 0,
    'Qté Sweet Tweed': quantities['Sweet Tweed'] || 0,
    'Prix de vente (€)': Number(body.priceCents || 0) / 100,
    'Vérifié': body.verified ? 'Oui' : '',
    "Coût d'achat (€)": Number(body.costCents || 0) / 100,
    'Frais par article (€)': Number(body.feeCents || 0) / 100,
    'Lien bordereau': body.receiptUrl || ''
  };
  const headers = headers_(sheet);
  sheet.appendRow(headers.map(header => values[header] === undefined ? '' : values[header]));
  return {id: body.id, sheetName: sheet.getName(), rowNumber: sheet.getLastRow(), ...values, productsJson: productsJson};
}

function readExistingSales_(sheet, sheetName, statusRows) {
  const headers = headers_(sheet);
  const rows = sheet.getDataRange().getValues().slice(1);
  return rows.map((values, offset) => {
    const row = headers.reduce((result, header, index) => { result[header] = values[index]; return result; }, {});
    const status = statusRows.find(item => item.sheetName === sheetName && Number(item.rowNumber) === offset + 2);
    const products = {
      'Velvet Kiss': Number(row['Qté Velvet Kiss'] || 0),
      'Sublime Satin': Number(row['Qté Sublime Satin'] || 0),
      'Cotton Bloom': Number(row['Qté Cotton Bloom'] || 0),
      'Cashmere Whisper': Number(row['Qté Cashmere Whisper'] || 0),
      'Eternal Silk': Number(row['Qté Eternal Silk'] || 0),
      'Sweet Tweed': Number(row['Qté Sweet Tweed'] || 0)
    };
    return {
      id: status ? status.id : sheetName + '-' + (offset + 2),
      date: row.Date,
      seller: row.Vendeur,
      buyer: row['Acheteur (pseudo)'],
      shop: sheetName === CONFIG.sheets.shop ? 'Lumo Shop' : 'Lumo Trends',
      products: products,
      price: Number(String(row['Prix de vente (€)'] || 0).replace(',', '.')),
      verified: row.Vérifié === 'Oui' || row.Vérifié === true,
      status: status ? status.status : 'pending',
      packed: status ? status.status === 'packed' : false,
      payCents: 0
    };
  });
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
