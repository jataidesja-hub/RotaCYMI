/**
 * ============================================================================
 * ROTA CYMI - BACKEND SERVERLESS (GOOGLE APPS SCRIPT + GOOGLE SHEETS API)
 * ============================================================================
 * Sistema Corporativo de Gestão e Rastreamento de Transporte em Tempo Real
 * 
 * INSTRUÇÕES DE IMPLANTAÇÃO NO GOOGLE SHEETS:
 * 1. Crie uma nova planilha no Google Sheets.
 * 2. Vá no menu superior: Extensões -> Apps Script.
 * 3. Apague qualquer código existente e cole todo este arquivo (Code.gs).
 * 4. Salve o projeto (Ctrl+S) e execute a função `setupDatabase` uma vez pelo
 *    botão "Executar" na barra superior (autorize as permissões quando solicitado).
 * 5. Clique em "Implantar" (canto superior direito) -> "Nova implantação".
 * 6. Em "Selecionar tipo", escolha "App da Web".
 * 7. Em "Executar como", selecione "Eu" (seu e-mail).
 * 8. Em "Quem pode acessar", selecione "Qualquer pessoa" (Essencial para CORS funcionar!).
 * 9. Clique em "Implantar", copie a "URL do app da Web" gerada (termina em /exec)
 *    e cole no modal de Configuração da API no seu app RotaCYMI na Vercel.
 * ============================================================================
 */

const SHEETS_SCHEMA = {
  Usuarios: [
    'id', 'nome', 'email', 'senha', 'perfil', 'telefone', 'endereco',
    'lat', 'lng', 'rotaId', 'pontoId', 'statusEmbarque', 'foto', 'updatedAt'
  ],
  Rotas: [
    'id', 'nome', 'turno', 'veiculoId', 'motoristaId', 'status',
    'pontosJson', 'polylineJson', 'distanciaKm', 'duracaoMin', 'updatedAt'
  ],
  Veiculos: [
    'id', 'placa', 'prefixo', 'modelo', 'capacidade', 'status', 'updatedAt'
  ],
  Motoristas: [
    'id', 'nome', 'cpf', 'cnh', 'telefone', 'email', 'senha', 'veiculoId', 'updatedAt'
  ],
  Telemetria_TempoReal: [
    'rotaId', 'motoristaId', 'veiculoId', 'lat', 'lng',
    'velocidade', 'heading', 'statusRota', 'proximoPontoId', 'updatedAt'
  ],
  Historico_Viagens: [
    'id', 'rotaId', 'nomeRota', 'motoristaId', 'nomeMotorista',
    'veiculoId', 'placaVeiculo', 'inicio', 'fim', 'status',
    'passageirosPrevistos', 'resumoJson'
  ]
};

/**
 * Cria automaticamente todas as abas necessárias na planilha com formatação
 * e insere o usuário Master ADMIN padrão (jasantos@cymibr.com / Sabre0858)
 * além de dados iniciais caso as abas estejam vazias.
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const now = new Date().toISOString();

  Object.keys(SHEETS_SCHEMA).forEach(function(sheetName) {
    let sheet = ss.getSheetByName(sheetName);
    const headers = SHEETS_SCHEMA[sheetName];

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#0f172a');
      headerRange.setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
  });

  // Garante a inserção do Usuário Master ADMIN: jasantos@cymibr.com / Sabre0858
  const userSheet = ss.getSheetByName('Usuarios');
  const users = getSheetRowsAsObjects_(userSheet);
  const masterExists = users.some(function(u) {
    return String(u.email).trim().toLowerCase() === 'jasantos@cymibr.com';
  });

  if (!masterExists) {
    appendObjectToSheet_(userSheet, 'Usuarios', {
      id: 'usr_admin_master',
      nome: 'J. A. Santos (Admin Master CYMI)',
      email: 'jasantos@cymibr.com',
      senha: 'Sabre0858',
      perfil: 'ADMIN',
      telefone: '(11) 99999-0858',
      endereco: 'Sede Corporativa CYMI Brasil',
      lat: -23.55052,
      lng: -46.633308,
      rotaId: '',
      pontoId: '',
      statusEmbarque: 'NAO_VOU',
      foto: '',
      updatedAt: now
    });
  }

  return {
    ok: true,
    message: 'Banco de dados RotaCYMI inicializado e validado com sucesso!',
    timestamp: now
  };
}

/**
 * Handler HTTP GET - Suporta healthcheck, bootstrap completo e leitura de abas
 */
function doGet(e) {
  try {
    setupDatabase();
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action || 'bootstrap';

    // Permite enviar payload via GET param `payload` como fallback caso necessário
    if (params.payload) {
      const parsedPayload = JSON.parse(params.payload);
      return jsonResponse_(routeAction_(parsedPayload));
    }

    if (action === 'ping') {
      return jsonResponse_({ ok: true, service: 'RotaCYMI API', timestamp: new Date().toISOString() });
    }

    if (action === 'bootstrap') {
      return jsonResponse_(getBootstrapData_());
    }

    if (action === 'telemetry') {
      return jsonResponse_(getTelemetryData_());
    }

    return jsonResponse_(routeAction_(params));
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: err && err.message ? err.message : String(err)
    });
  }
}

/**
 * Handler HTTP POST - Processa todas as operações de escrita/leitura da API
 * Compatível com `Content-Type: text/plain;charset=utf-8` para evitar preflight CORS bloqueado no GAS
 */
function doPost(e) {
  try {
    setupDatabase();
    let body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      body = e.parameter;
    }

    const result = routeAction_(body);
    return jsonResponse_(result);
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: err && err.message ? err.message : String(err)
    });
  }
}

/**
 * Roteador central de ações da API
 */
function routeAction_(body) {
  const action = body.action || 'bootstrap';
  const now = new Date().toISOString();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  switch (action) {
    case 'ping':
      return { ok: true, service: 'RotaCYMI GAS Backend', timestamp: now };

    case 'setupDatabase':
      return setupDatabase();

    case 'bootstrap':
      return getBootstrapData_();

    case 'telemetry':
      return getTelemetryData_();

    case 'login':
      return handleLogin_(ss, body.email, body.senha);

    case 'upsertEntity':
      return handleUpsertEntity_(ss, body.sheet, body.record);

    case 'deleteEntity':
      return handleDeleteEntity_(ss, body.sheet, body.id);

    case 'updatePassengerStatus':
      return handleUpdatePassengerStatus_(ss, body);

    case 'updatePassengerProfile':
      return handleUpdatePassengerProfile_(ss, body);

    case 'pushTelemetry':
      return handlePushTelemetry_(ss, body);

    case 'startRouteTrip':
      return handleStartRouteTrip_(ss, body);

    case 'finishRouteTrip':
      return handleFinishRouteTrip_(ss, body);

    case 'syncBatch':
      return handleSyncBatch_(ss, body);

    default:
      return { ok: false, error: 'Ação desconhecida: ' + action };
  }
}

/**
 * Retorna todos os dados estruturados das abas para sincronização rápida do PWA
 */
function getBootstrapData_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usuarios = getSheetRowsAsObjects_(ss.getSheetByName('Usuarios'));
  const rotasRaw = getSheetRowsAsObjects_(ss.getSheetByName('Rotas'));
  const veiculos = getSheetRowsAsObjects_(ss.getSheetByName('Veiculos'));
  const motoristas = getSheetRowsAsObjects_(ss.getSheetByName('Motoristas'));
  const telemetria = getSheetRowsAsObjects_(ss.getSheetByName('Telemetria_TempoReal'));
  const historico = getSheetRowsAsObjects_(ss.getSheetByName('Historico_Viagens'));

  const rotas = rotasRaw.map(function(r) {
    return {
      id: r.id,
      nome: r.nome,
      turno: r.turno,
      veiculoId: r.veiculoId,
      motoristaId: r.motoristaId,
      status: r.status || 'PARADA',
      pontos: safeJsonParse_(r.pontosJson, []),
      polyline: safeJsonParse_(r.polylineJson, []),
      distanciaKm: Number(r.distanciaKm || 0),
      duracaoMin: Number(r.duracaoMin || 0),
      updatedAt: r.updatedAt
    };
  });

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    data: {
      usuarios: usuarios,
      rotas: rotas,
      veiculos: veiculos,
      motoristas: motoristas,
      telemetria: telemetria,
      historico: historico
    }
  };
}

/**
 * Retorna telemetria e status dos passageiros em tempo real (leve e rápido para polling de 5s)
 */
function getTelemetryData_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const telemetria = getSheetRowsAsObjects_(ss.getSheetByName('Telemetria_TempoReal'));
  const usuarios = getSheetRowsAsObjects_(ss.getSheetByName('Usuarios')).map(function(u) {
    return {
      id: u.id,
      nome: u.nome,
      perfil: u.perfil,
      rotaId: u.rotaId,
      pontoId: u.pontoId,
      lat: Number(u.lat || 0),
      lng: Number(u.lng || 0),
      statusEmbarque: u.statusEmbarque || 'VOU',
      telefone: u.telefone || '',
      foto: u.foto || '',
      updatedAt: u.updatedAt
    };
  });

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    telemetria: telemetria,
    passageiros: usuarios.filter(function(u) { return u.perfil === 'PASSAGEIRO'; })
  };
}

/**
 * Autenticação unificada (verifica Usuarios e Motoristas + Credencial Master)
 */
function handleLogin_(ss, emailInput, senhaInput) {
  const email = String(emailInput || '').trim().toLowerCase();
  const senha = String(senhaInput || '').trim();

  if (email === 'jasantos@cymibr.com' && senha === 'Sabre0858') {
    const userSheet = ss.getSheetByName('Usuarios');
    const users = getSheetRowsAsObjects_(userSheet);
    const adminRow = users.find(function(u) {
      return String(u.email).trim().toLowerCase() === 'jasantos@cymibr.com';
    });
    return {
      ok: true,
      user: adminRow || {
        id: 'usr_admin_master',
        nome: 'J. A. Santos (Admin Master CYMI)',
        email: 'jasantos@cymibr.com',
        perfil: 'ADMIN',
        telefone: '(11) 99999-0858'
      }
    };
  }

  // Busca na aba Usuarios (ADMIN, PASSAGEIRO ou MOTORISTA cadastrado lá)
  const usuarios = getSheetRowsAsObjects_(ss.getSheetByName('Usuarios'));
  const foundUser = usuarios.find(function(u) {
    return String(u.email).trim().toLowerCase() === email && String(u.senha).trim() === senha;
  });

  if (foundUser) {
    return { ok: true, user: foundUser };
  }

  // Busca na aba Motoristas
  const motoristas = getSheetRowsAsObjects_(ss.getSheetByName('Motoristas'));
  const foundDriver = motoristas.find(function(m) {
    return String(m.email).trim().toLowerCase() === email && String(m.senha).trim() === senha;
  });

  if (foundDriver) {
    return {
      ok: true,
      user: {
        id: foundDriver.id,
        nome: foundDriver.nome,
        email: foundDriver.email,
        senha: foundDriver.senha,
        perfil: 'MOTORISTA',
        telefone: foundDriver.telefone,
        cnh: foundDriver.cnh,
        cpf: foundDriver.cpf,
        veiculoId: foundDriver.veiculoId || ''
      }
    };
  }

  return { ok: false, error: 'E-mail ou senha inválidos.' };
}

/**
 * Cria ou atualiza um registro em qualquer aba do banco (`Usuarios`, `Rotas`, `Veiculos`, `Motoristas`)
 */
function handleUpsertEntity_(ss, sheetName, record) {
  if (!SHEETS_SCHEMA[sheetName]) {
    return { ok: false, error: 'Aba inválida: ' + sheetName };
  }
  if (!record || typeof record !== 'object') {
    return { ok: false, error: 'Dados do registro ausentes.' };
  }

  const sheet = ss.getSheetByName(sheetName);
  const now = new Date().toISOString();
  const payload = Object.assign({}, record, { updatedAt: now });

  if (!payload.id) {
    payload.id = sheetName.slice(0, 3).toLowerCase() + '_' + new Date().getTime();
  }

  // Serializa arrays/objetos da aba Rotas se vierem como objeto
  if (sheetName === 'Rotas') {
    if (Array.isArray(payload.pontos)) {
      payload.pontosJson = JSON.stringify(payload.pontos);
    }
    if (Array.isArray(payload.polyline)) {
      payload.polylineJson = JSON.stringify(payload.polyline);
    }
  }

  const upserted = upsertObjectByKey_(sheet, sheetName, 'id', payload);

  // Se for um motorista salvo na aba Motoristas, sincroniza espelho na aba Usuarios se desejado
  return {
    ok: true,
    sheet: sheetName,
    record: upserted,
    timestamp: now
  };
}

/**
 * Remove um registro pelo ID em qualquer aba
 */
function handleDeleteEntity_(ss, sheetName, recordId) {
  if (!SHEETS_SCHEMA[sheetName]) {
    return { ok: false, error: 'Aba inválida: ' + sheetName };
  }
  const sheet = ss.getSheetByName(sheetName);
  const deleted = deleteRowByKey_(sheet, 'id', recordId);
  return {
    ok: deleted,
    sheet: sheetName,
    id: recordId
  };
}

/**
 * Atualiza rapidamente o status de embarque ("VOU" | "NAO_VOU") e GPS atual do passageiro
 */
function handleUpdatePassengerStatus_(ss, body) {
  const sheet = ss.getSheetByName('Usuarios');
  const rows = getSheetRowsAsObjects_(sheet);
  const target = rows.find(function(u) { return String(u.id) === String(body.userId); });

  if (!target) {
    return { ok: false, error: 'Passageiro não encontrado.' };
  }

  target.statusEmbarque = body.statusEmbarque || target.statusEmbarque || 'VOU';
  if (body.lat !== undefined && body.lat !== null && body.lat !== '') target.lat = body.lat;
  if (body.lng !== undefined && body.lng !== null && body.lng !== '') target.lng = body.lng;
  if (body.pontoId !== undefined) target.pontoId = body.pontoId;
  target.updatedAt = new Date().toISOString();

  upsertObjectByKey_(sheet, 'Usuarios', 'id', target);
  return { ok: true, user: target };
}

/**
 * Atualiza perfil completo do passageiro (telefone, endereço, senha, foto Base64 150x150, lat/lng casa)
 */
function handleUpdatePassengerProfile_(ss, body) {
  const sheet = ss.getSheetByName('Usuarios');
  const rows = getSheetRowsAsObjects_(sheet);
  const userObj = body.user || {};
  const target = rows.find(function(u) {
    return String(u.id) === String(userObj.id) ||
           String(u.email).toLowerCase() === String(userObj.email || '').toLowerCase();
  });

  const merged = Object.assign({}, target || {}, userObj, {
    updatedAt: new Date().toISOString()
  });

  if (!merged.id) {
    merged.id = 'usr_' + new Date().getTime();
  }

  upsertObjectByKey_(sheet, 'Usuarios', 'id', merged);
  return { ok: true, user: merged };
}

/**
 * Recebe telemetria GPS em tempo real do motorista (a cada 5-8s) e atualiza a aba Telemetria_TempoReal
 */
function handlePushTelemetry_(ss, body) {
  const sheet = ss.getSheetByName('Telemetria_TempoReal');
  const now = new Date().toISOString();
  const telemetry = {
    rotaId: body.rotaId || '',
    motoristaId: body.motoristaId || '',
    veiculoId: body.veiculoId || '',
    lat: Number(body.lat || 0),
    lng: Number(body.lng || 0),
    velocidade: Number(body.velocidade || 0),
    heading: Number(body.heading || 0),
    statusRota: body.statusRota || 'EM_ANDAMENTO',
    proximoPontoId: body.proximoPontoId || '',
    updatedAt: now
  };

  upsertObjectByKey_(sheet, 'Telemetria_TempoReal', 'rotaId', telemetry);

  // Também garante que o status na aba Rotas esteja sincronizado
  if (telemetry.rotaId) {
    const routeSheet = ss.getSheetByName('Rotas');
    const routes = getSheetRowsAsObjects_(routeSheet);
    const routeRow = routes.find(function(r) { return String(r.id) === String(telemetry.rotaId); });
    if (routeRow && routeRow.status !== telemetry.statusRota) {
      routeRow.status = telemetry.statusRota;
      routeRow.updatedAt = now;
      upsertObjectByKey_(routeSheet, 'Rotas', 'id', routeRow);
    }
  }

  return { ok: true, telemetry: telemetry };
}

/**
 * Inicia oficialmente uma viagem na rota e registra no Histórico + Telemetria
 */
function handleStartRouteTrip_(ss, body) {
  const now = new Date().toISOString();
  const routeSheet = ss.getSheetByName('Rotas');
  const routes = getSheetRowsAsObjects_(routeSheet);
  const routeRow = routes.find(function(r) { return String(r.id) === String(body.rotaId); });

  if (routeRow) {
    routeRow.status = 'EM_ANDAMENTO';
    routeRow.updatedAt = now;
    upsertObjectByKey_(routeSheet, 'Rotas', 'id', routeRow);
  }

  // Atualiza telemetria inicial
  handlePushTelemetry_(ss, {
    rotaId: body.rotaId,
    motoristaId: body.motoristaId,
    veiculoId: body.veiculoId,
    lat: body.lat,
    lng: body.lng,
    velocidade: body.velocidade || 0,
    heading: body.heading || 0,
    statusRota: 'EM_ANDAMENTO',
    proximoPontoId: body.proximoPontoId || ''
  });

  // Registra início no Historico_Viagens
  const histSheet = ss.getSheetByName('Historico_Viagens');
  const tripId = body.tripId || ('viagem_' + new Date().getTime());
  const tripRecord = {
    id: tripId,
    rotaId: body.rotaId || '',
    nomeRota: body.nomeRota || (routeRow ? routeRow.nome : ''),
    motoristaId: body.motoristaId || '',
    nomeMotorista: body.nomeMotorista || '',
    veiculoId: body.veiculoId || '',
    placaVeiculo: body.placaVeiculo || '',
    inicio: now,
    fim: '',
    status: 'EM_ANDAMENTO',
    passageirosPrevistos: Number(body.passageirosPrevistos || 0),
    resumoJson: JSON.stringify({ iniciadoVia: 'PWA Motorista 3D' })
  };

  upsertObjectByKey_(histSheet, 'Historico_Viagens', 'id', tripRecord);
  return { ok: true, trip: tripRecord };
}

/**
 * Finaliza uma viagem em andamento, atualizando Telemetria, Rotas e Historico_Viagens
 */
function handleFinishRouteTrip_(ss, body) {
  const now = new Date().toISOString();
  const routeSheet = ss.getSheetByName('Rotas');
  const routes = getSheetRowsAsObjects_(routeSheet);
  const routeRow = routes.find(function(r) { return String(r.id) === String(body.rotaId); });

  if (routeRow) {
    routeRow.status = 'FINALIZADA';
    routeRow.updatedAt = now;
    upsertObjectByKey_(routeSheet, 'Rotas', 'id', routeRow);
  }

  const telemetrySheet = ss.getSheetByName('Telemetria_TempoReal');
  const telemetries = getSheetRowsAsObjects_(telemetrySheet);
  const telRow = telemetries.find(function(t) { return String(t.rotaId) === String(body.rotaId); });
  if (telRow) {
    telRow.statusRota = 'FINALIZADA';
    telRow.velocidade = 0;
    telRow.updatedAt = now;
    upsertObjectByKey_(telemetrySheet, 'Telemetria_TempoReal', 'rotaId', telRow);
  }

  const histSheet = ss.getSheetByName('Historico_Viagens');
  const histRows = getSheetRowsAsObjects_(histSheet);
  let targetTrip = null;
  if (body.tripId) {
    targetTrip = histRows.find(function(h) { return String(h.id) === String(body.tripId); });
  }
  if (!targetTrip) {
    // Busca última viagem em andamento desta rota
    for (let i = histRows.length - 1; i >= 0; i--) {
      if (String(histRows[i].rotaId) === String(body.rotaId) && histRows[i].status === 'EM_ANDAMENTO') {
        targetTrip = histRows[i];
        break;
      }
    }
  }

  if (targetTrip) {
    targetTrip.fim = now;
    targetTrip.status = 'CONCLUIDA';
    targetTrip.resumoJson = JSON.stringify(body.resumo || { finalizadoEm: now });
    upsertObjectByKey_(histSheet, 'Historico_Viagens', 'id', targetTrip);
  }

  return { ok: true, finishedAt: now, trip: targetTrip };
}

/**
 * Permite sincronizar um lote de dados do frontend para a planilha de uma só vez
 */
function handleSyncBatch_(ss, body) {
  const data = body.data || {};
  const now = new Date().toISOString();

  if (Array.isArray(data.veiculos)) {
    const s = ss.getSheetByName('Veiculos');
    data.veiculos.forEach(function(v) { upsertObjectByKey_(s, 'Veiculos', 'id', v); });
  }
  if (Array.isArray(data.motoristas)) {
    const s = ss.getSheetByName('Motoristas');
    data.motoristas.forEach(function(m) { upsertObjectByKey_(s, 'Motoristas', 'id', m); });
  }
  if (Array.isArray(data.usuarios)) {
    const s = ss.getSheetByName('Usuarios');
    data.usuarios.forEach(function(u) { upsertObjectByKey_(s, 'Usuarios', 'id', u); });
  }
  if (Array.isArray(data.rotas)) {
    const s = ss.getSheetByName('Rotas');
    data.rotas.forEach(function(r) {
      const copy = Object.assign({}, r);
      if (Array.isArray(copy.pontos)) copy.pontosJson = JSON.stringify(copy.pontos);
      if (Array.isArray(copy.polyline)) copy.polylineJson = JSON.stringify(copy.polyline);
      upsertObjectByKey_(s, 'Rotas', 'id', copy);
    });
  }

  return { ok: true, syncedAt: now };
}

/* ============================================================================
 * FUNÇÕES UTILITÁRIAS DE MANIPULAÇÃO DO GOOGLE SHEETS
 * ============================================================================ */

function getSheetRowsAsObjects_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(function(h) { return String(h).trim(); });
  const results = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const isEmpty = row.every(function(cell) { return cell === '' || cell === null; });
    if (isEmpty) continue;

    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = row[c];
    }
    results.push(obj);
  }
  return results;
}

function appendObjectToSheet_(sheet, sheetName, obj) {
  const headers = SHEETS_SCHEMA[sheetName];
  const row = headers.map(function(col) {
    return obj[col] !== undefined && obj[col] !== null ? obj[col] : '';
  });
  sheet.appendRow(row);
  return obj;
}

function upsertObjectByKey_(sheet, sheetName, keyField, obj) {
  const headers = SHEETS_SCHEMA[sheetName];
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return appendObjectToSheet_(sheet, sheetName, obj);
  }

  const dataRange = sheet.getRange(1, 1, lastRow, headers.length);
  const values = dataRange.getValues();
  const keyIndex = headers.indexOf(keyField);

  if (keyIndex === -1) {
    return appendObjectToSheet_(sheet, sheetName, obj);
  }

  let foundRowIndex = -1;
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][keyIndex]) === String(obj[keyField])) {
      foundRowIndex = r + 1; // 1-indexed no Sheets
      break;
    }
  }

  const rowValues = headers.map(function(col, idx) {
    if (obj[col] !== undefined && obj[col] !== null) {
      return obj[col];
    }
    if (foundRowIndex !== -1) {
      return values[foundRowIndex - 1][idx];
    }
    return '';
  });

  if (foundRowIndex !== -1) {
    sheet.getRange(foundRowIndex, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  const finalObj = {};
  headers.forEach(function(col, idx) {
    finalObj[col] = rowValues[idx];
  });
  return finalObj;
}

function deleteRowByKey_(sheet, keyField, keyValue) {
  if (!sheet || sheet.getLastRow() < 2) return false;
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(function(h) { return String(h).trim(); });
  const keyIndex = headers.indexOf(keyField);
  if (keyIndex === -1) return false;

  for (let r = values.length - 1; r >= 1; r--) {
    if (String(values[r][keyIndex]) === String(keyValue)) {
      sheet.deleteRow(r + 1);
      return true;
    }
  }
  return false;
}

function safeJsonParse_(str, fallback) {
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
