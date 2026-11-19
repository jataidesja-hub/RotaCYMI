/**
 * ============================================================================
 * ROTA CYMI — SISTEMA DE GESTÃO E RASTREAMENTO DE TRANSPORTE EM TEMPO REAL
 * ============================================================================
 * Arquitetura Full-Stack Serverless (PWA + MapLibre GL 2D/3D + OSRM + Google Sheets API)
 */

(() => {
  'use strict';

  /* ==========================================================================
   * 1. CONSTANTES, CHAVES DE ARMAZENAMENTO E ESTILO DE MAPA VETORIAL GRATUITO
   * ========================================================================== */
  const STORAGE_KEYS = {
    SESSION: 'rotacymi_session_v1',
    DB_CACHE: 'rotacymi_db_cache_v1',
    GAS_URL: 'rotacymi_gas_webapp_url_v1',
    OFFLINE_QUEUE: 'rotacymi_offline_queue_v1'
  };

  // Canal de sincronização instantânea (0ms) entre abas/telas no mesmo dispositivo
  const realtimeChannel =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('rotacymi_realtime_channel') : null;

  // URL oficial do Web App Google Apps Script do projeto RotaCYMI
  const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbxS8iYzbh9ULPsZVfgttiDYTvhBCVgIYwTbDf7mBfGdt1AOUQqGOJdLicfKQVkGPmWk/exec';

  // Coordenadas Padrão Fixadas em Juazeiro - BA / Petrolina - PE (Vale do São Francisco)
  const DEFAULT_LAT = -9.4112;
  const DEFAULT_LNG = -40.5028;
  const CITY_COORDS = {
    juazeiro: { lat: -9.4162, lng: -40.5033, label: 'Juazeiro - BA' },
    petrolina: { lat: -9.3942, lng: -40.5012, label: 'Petrolina - PE' }
  };

  // Estilo Vetorial Gratuito CartoDB Dark Matter
  const VECTOR_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

  /* ==========================================================================
   * 2. DADOS INICIAIS (SEED CORPORATIVO JUAZEIRO/PETROLINA + MASTER ADMIN)
   * ========================================================================== */
  function createInitialSeedData() {
    const now = new Date().toISOString();
    return {
      usuarios: [
        {
          id: 'usr_admin_master',
          nome: 'J. A. Santos (Admin Master CYMI)',
          email: 'jasantos@cymibr.com',
          senha: 'Sabre0858',
          perfil: 'ADMIN',
          telefone: '(74) 99999-0858',
          endereco: 'Av. Adolfo Viana, Centro, Juazeiro - BA',
          lat: -9.4138,
          lng: -40.5032,
          rotaId: 'rota_01',
          pontoId: 'pto_01',
          statusEmbarque: 'NAO_VOU',
          foto: '',
          updatedAt: now
        },
        {
          id: 'usr_pax_01',
          nome: 'Mariana Silva',
          email: 'mariana.silva@cymibr.com',
          senha: 'cymi123',
          perfil: 'PASSAGEIRO',
          telefone: '(74) 98765-4321',
          endereco: 'Orla de Juazeiro, Centro, Juazeiro - BA',
          lat: -9.4102,
          lng: -40.5018,
          rotaId: 'rota_01',
          pontoId: 'pto_02',
          statusEmbarque: 'VOU',
          foto: '',
          updatedAt: now
        },
        {
          id: 'usr_pax_02',
          nome: 'Rafael Oliveira',
          email: 'rafael.oliveira@cymibr.com',
          senha: 'cymi123',
          perfil: 'PASSAGEIRO',
          telefone: '(87) 98222-1199',
          endereco: 'Av. Monsenhor Ângelo Sampaio, Petrolina - PE',
          lat: -9.4018,
          lng: -40.4996,
          rotaId: 'rota_01',
          pontoId: 'pto_03',
          statusEmbarque: 'VOU',
          foto: '',
          updatedAt: now
        },
        {
          id: 'usr_pax_03',
          nome: 'Fernanda Costa',
          email: 'fernanda.costa@cymibr.com',
          senha: 'cymi123',
          perfil: 'PASSAGEIRO',
          telefone: '(87) 97111-3344',
          endereco: 'Av. Guararapes, Centro, Petrolina - PE',
          lat: -9.3942,
          lng: -40.5012,
          rotaId: 'rota_01',
          pontoId: 'pto_04',
          statusEmbarque: 'NAO_VOU',
          foto: '',
          updatedAt: now
        }
      ],
      veiculos: [
        {
          id: 'veic_101',
          placa: 'CYM-2E26',
          prefixo: 'Ônibus 101',
          modelo: 'Marcopolo Viaggio G7 • Mercedes-Benz OF-1721',
          capacidade: 44,
          status: 'Ativo',
          updatedAt: now
        },
        {
          id: 'veic_102',
          placa: 'CYM-8A90',
          prefixo: 'Micro 102',
          modelo: 'Volare Attack 9 Executivo',
          capacidade: 32,
          status: 'Ativo',
          updatedAt: now
        }
      ],
      motoristas: [
        {
          id: 'mot_01',
          nome: 'Carlos Eduardo Mendes',
          cpf: '284.910.448-12',
          cnh: '04918273611 (Cat D)',
          telefone: '(74) 97654-3210',
          email: 'carlos.mot@cymibr.com',
          senha: 'cymi123',
          veiculoId: 'veic_101',
          updatedAt: now
        },
        {
          id: 'mot_02',
          nome: 'Roberto Alves Nascimento',
          cpf: '319.442.871-04',
          cnh: '05829104491 (Cat E)',
          telefone: '(87) 96543-9988',
          email: 'roberto.mot@cymibr.com',
          senha: 'cymi123',
          veiculoId: 'veic_102',
          updatedAt: now
        }
      ],
      rotas: [
        {
          id: 'rota_01',
          nome: 'Rota 01 — IDA (Juazeiro BA / Petrolina PE)',
          tipoRota: 'IDA',
          turno: 'Manhã',
          veiculoId: 'veic_101',
          motoristaId: 'mot_01',
          status: 'PARADA',
          distanciaKm: 5.8,
          duracaoMin: 18,
          pontos: [
            {
              id: 'pto_01',
              nome: 'Ponto 1 — Rodoviária / Centro Juazeiro (BA)',
              horario: '06:30',
              lat: -9.4195,
              lng: -40.5015
            },
            {
              id: 'pto_02',
              nome: 'Ponto 2 — Av. Adolfo Viana / Orla Juazeiro (BA)',
              horario: '06:40',
              lat: -9.4112,
              lng: -40.5032
            },
            {
              id: 'pto_03',
              nome: 'Ponto 3 — River Shopping / Petrolina (PE)',
              horario: '06:52',
              lat: -9.4018,
              lng: -40.4996
            },
            {
              id: 'pto_04',
              nome: 'Ponto 4 — Av. Guararapes / Centro Petrolina (PE)',
              horario: '07:05',
              lat: -9.3942,
              lng: -40.5012
            }
          ],
          polyline: [
            [-40.5015, -9.4195],
            [-40.5025, -9.4150],
            [-40.5032, -9.4112],
            [-40.5015, -9.4055],
            [-40.4996, -9.4018],
            [-40.5005, -9.3978],
            [-40.5012, -9.3942]
          ],
          updatedAt: now
        },
        {
          id: 'rota_02',
          nome: 'Rota 01 — VOLTA (Petrolina PE / Juazeiro BA)',
          tipoRota: 'VOLTA',
          turno: 'Tarde',
          veiculoId: 'veic_101',
          motoristaId: 'mot_01',
          status: 'PARADA',
          distanciaKm: 6.1,
          duracaoMin: 20,
          pontos: [
            {
              id: 'pto_201',
              nome: 'Ponto 1 — Av. Guararapes / Centro Petrolina (PE)',
              horario: '17:30',
              lat: -9.3942,
              lng: -40.5012
            },
            {
              id: 'pto_202',
              nome: 'Ponto 2 — River Shopping / Petrolina (PE)',
              horario: '17:42',
              lat: -9.4018,
              lng: -40.4996
            },
            {
              id: 'pto_203',
              nome: 'Ponto 3 — Orla / Av. Adolfo Viana Juazeiro (BA)',
              horario: '17:55',
              lat: -9.4112,
              lng: -40.5032
            },
            {
              id: 'pto_204',
              nome: 'Ponto 4 — Rodoviária / Centro Juazeiro (BA)',
              horario: '18:05',
              lat: -9.4195,
              lng: -40.5015
            }
          ],
          polyline: [
            [-40.5012, -9.3942],
            [-40.5005, -9.3978],
            [-40.4996, -9.4018],
            [-40.5015, -9.4055],
            [-40.5032, -9.4112],
            [-40.5025, -9.4150],
            [-40.5015, -9.4195]
          ],
          updatedAt: now
        }
      ],
      telemetria: [
        {
          rotaId: 'rota_01',
          motoristaId: 'mot_01',
          veiculoId: 'veic_101',
          lat: -9.4112,
          lng: -40.5032,
          velocidade: 38,
          heading: 15,
          statusRota: 'PARADA',
          proximoPontoId: 'pto_03',
          updatedAt: now
        },
        {
          rotaId: 'rota_02',
          motoristaId: 'mot_01',
          veiculoId: 'veic_101',
          lat: -9.3942,
          lng: -40.5012,
          velocidade: 0,
          heading: 195,
          statusRota: 'PARADA',
          proximoPontoId: 'pto_201',
          updatedAt: now
        }
      ],
      historico: []
    };
  }

  /* ==========================================================================
   * 3. ESTADO CENTRAL DA APLICAÇÃO
   * ========================================================================== */
  const state = {
    db: loadLocalDb(),
    currentUser: null,
    isMasterAdminSession: false,
    gasUrl: localStorage.getItem(STORAGE_KEYS.GAS_URL) || DEFAULT_GAS_URL,
    activeAdminTab: 'tower',
    isSatelliteMode: false,
    builderClickMode: 'navigate', // 'navigate' | 'waypoint' | 'add_stop'
    hasInitialTowerCentered: false,
    passengerViewRouteFilter: 'ALL',
    passengerShiftMode: 'IDA', // 'IDA' (seleciona ponto onde sobe) | 'VOLTA' (seleciona ponto onde desce)
    passengerSelectedRouteIda: '',
    passengerSelectedRouteVolta: '',
    isFlushingOfflineQueue: false,

    // Instâncias de Mapas MapLibre GL
    maps: {
      tower: null,
      routeBuilder: null,
      paxPicker: null,
      passengerLive: null,
      selfPaxHome: null,
      selfSignup: null,
      driver3d: null
    },

    // Coleções de Marcadores DOM do MapLibre
    markers: {
      towerBuses: [],
      towerStops: [],
      towerPax: [],
      builderStops: [],
      paxPickerMarker: null,
      passengerBus: null,
      passengerBuses: [],
      passengerSelf: null,
      passengerStops: [],
      selfHomeMarker: null,
      selfSignupMarker: null,
      driverBus: null,
      driverStops: [],
      driverPax: []
    },

    tempSelfSignupPhoto: '',

    // Estado do Construtor de Rotas
    routeDraft: {
      id: '',
      pontos: [],
      polyline: [],
      distanciaKm: 0,
      duracaoMin: 0
    },

    // Fotos Base64 temporárias em edição
    tempAdminPaxPhoto: '',
    tempSelfPaxPhoto: '',

    // Estado de GPS e Telemetria do Passageiro (Padrão Juazeiro / Petrolina)
    passengerGps: {
      lat: DEFAULT_LAT,
      lng: DEFAULT_LNG,
      hasRealGpsFix: false,
      accuracy: null,
      watchId: null
    },

    // Estado de Viagem, WakeLock, WatchPosition e Simulador do Motorista 3D
    driverRuntime: {
      activeRouteId: 'rota_01',
      isTripRunning: false,
      autoFollowCamera: true,
      isFullscreen: false,
      hasRealGpsFix: false,
      lastTelemetryPushMs: 0,
      tripId: null,
      watchId: null,
      telemetryTimer: null,
      wakeLockSentinel: null,
      simInterval: null,
      simCoordIndex: 0,
      currentLat: DEFAULT_LAT,
      currentLng: DEFAULT_LNG,
      currentSpeed: 0,
      currentHeading: 15
    },

    // Simulador da Torre de Controle
    towerSimInterval: null,
    towerSimStep: 0,
    pollingInterval: null,
    deferredInstallPrompt: null
  };

  /* ==========================================================================
   * 4. PERSISTÊNCIA LOCAL & CLIENTE SERVERLESS GOOGLE APPS SCRIPT (CORS SAFE)
   * ========================================================================== */
  function isLegacySaoPauloCoord(lat, lng) {
    const la = Number(lat);
    const ln = Number(lng);
    return la < -20 && la > -25 && ln < -44 && ln > -48;
  }

  /**
   * Migra automaticamente coordenadas antigas de exemplo de São Paulo (-23.5, -46.6)
   * para Juazeiro - BA / Petrolina - PE (-9.41, -40.50) para que o mapa nunca abra em SP.
   */
  function migrateLegacySaoPauloCoords(dbObj) {
    if (!dbObj) return;

    // Descobre primeiro ponto válido de rota já criada em Juazeiro/Petrolina, se houver
    let refLat = DEFAULT_LAT;
    let refLng = DEFAULT_LNG;
    if (Array.isArray(dbObj.rotas)) {
      for (const r of dbObj.rotas) {
        if (Array.isArray(r.pontos) && r.pontos.length > 0) {
          const p0 = r.pontos[0];
          if (!isLegacySaoPauloCoord(p0.lat, p0.lng)) {
            refLat = Number(p0.lat);
            refLng = Number(p0.lng);
            break;
          }
        }
      }
    }

    if (Array.isArray(dbObj.usuarios)) {
      dbObj.usuarios.forEach((u, idx) => {
        if (!u.lat || !u.lng || isLegacySaoPauloCoord(u.lat, u.lng)) {
          u.lat = Number((refLat - idx * 0.0025).toFixed(6));
          u.lng = Number((refLng + idx * 0.0015).toFixed(6));
          if (String(u.endereco || '').includes('São Paulo') || String(u.endereco || '').includes('SP')) {
            u.endereco = 'Centro, Juazeiro - BA / Petrolina - PE';
          }
        }
      });
    }

    if (Array.isArray(dbObj.rotas)) {
      const seenOpenVehicle = new Set();
      dbObj.rotas.forEach((r) => {
        if (Array.isArray(r.pontos) && r.pontos.length > 0 && isLegacySaoPauloCoord(r.pontos[0].lat, r.pontos[0].lng)) {
          const seedRoute = createInitialSeedData().rotas[0];
          r.nome = seedRoute.nome;
          r.pontos = seedRoute.pontos;
          r.polyline = seedRoute.polyline;
        }
        if (!r.tipoRota) {
          r.tipoRota = String(r.nome || '').toUpperCase().includes('VOLTA') ? 'VOLTA' : 'IDA';
        }
        // Garante que o mesmo ônibus não tenha IDA e VOLTA abertas simultaneamente por cache antigo
        if (r.status === 'EM_ANDAMENTO' && r.veiculoId) {
          if (seenOpenVehicle.has(r.veiculoId)) {
            r.status = 'PARADA';
          } else {
            seenOpenVehicle.add(r.veiculoId);
          }
        }
      });
    }

    if (Array.isArray(dbObj.telemetria)) {
      dbObj.telemetria.forEach((t) => {
        if (!t.lat || !t.lng || isLegacySaoPauloCoord(t.lat, t.lng)) {
          t.lat = refLat;
          t.lng = refLng;
        }
      });
    }
  }

  function loadLocalDb() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DB_CACHE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.usuarios)) {
          ensureMasterAdminInDb(parsed);
          migrateLegacySaoPauloCoords(parsed);
          // Migração única: fecha rotas que ficaram "abertas" por cache/seed antigo (motorista deve iniciar)
          if (!localStorage.getItem('rotacymi_routes_reset_v1')) {
            (parsed.rotas || []).forEach((r) => (r.status = 'PARADA'));
            (parsed.telemetria || []).forEach((t) => (t.statusRota = 'PARADA'));
            localStorage.setItem('rotacymi_routes_reset_v1', '1');
          }
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Falha ao ler cache local, recriando seed:', err);
    }
    const seed = createInitialSeedData();
    localStorage.setItem(STORAGE_KEYS.DB_CACHE, JSON.stringify(seed));
    return seed;
  }

  function ensureMasterAdminInDb(dbObj) {
    const exists = dbObj.usuarios.some(
      (u) => String(u.email).trim().toLowerCase() === 'jasantos@cymibr.com'
    );
    if (!exists) {
      dbObj.usuarios.unshift({
        id: 'usr_admin_master',
        nome: 'J. A. Santos (Admin Master CYMI)',
        email: 'jasantos@cymibr.com',
        senha: 'Sabre0858',
        perfil: 'ADMIN',
        telefone: '(74) 99999-0858',
        endereco: 'Sede Operacional CYMI — Juazeiro / Petrolina',
        lat: DEFAULT_LAT,
        lng: DEFAULT_LNG,
        rotaId: 'rota_01',
        pontoId: 'pto_01',
        statusEmbarque: 'NAO_VOU',
        foto: '',
        updatedAt: new Date().toISOString()
      });
    }
  }

  function saveLocalDb(broadcastChange = true) {
    ensureMasterAdminInDb(state.db);
    migrateLegacySaoPauloCoords(state.db);
    localStorage.setItem(STORAGE_KEYS.DB_CACHE, JSON.stringify(state.db));

    if (broadcastChange && realtimeChannel) {
      try {
        realtimeChannel.postMessage({
          type: 'DB_UPDATED',
          timestamp: Date.now()
        });
      } catch (e) {}
    }
  }

  function getOfflineQueue() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function setOfflineQueue(list) {
    try {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(list || []));
    } catch (e) {}
  }

  /**
   * Enfileira ações de escrita quando o celular estiver sem internet (Modo Offline).
   * Para telemetria, mantém apenas a coordenada mais recente de cada rota para não acumular fila velha.
   */
  function enqueueOfflineAction(payload) {
    if (!payload || !payload.action) return;
    const readOnlyActions = ['bootstrap', 'telemetry', 'ping'];
    if (readOnlyActions.includes(payload.action)) return;

    let queue = getOfflineQueue();

    if (payload.action === 'pushTelemetry') {
      queue = queue.filter(
        (item) => !(item.action === 'pushTelemetry' && item.rotaId === payload.rotaId)
      );
    } else if (payload.action === 'updatePassengerStatus') {
      queue = queue.filter(
        (item) => !(item.action === 'updatePassengerStatus' && item.userId === payload.userId)
      );
    }

    queue.push({
      ...payload,
      _queuedAt: new Date().toISOString()
    });

    // Limita fila de segurança a 150 itens
    if (queue.length > 150) {
      queue = queue.slice(queue.length - 150);
    }

    setOfflineQueue(queue);
    updateConnectionBadge();
  }

  /**
   * Descarrega automaticamente todas as ações salvas offline assim que a internet voltar
   */
  async function flushOfflineQueue() {
    if (state.isFlushingOfflineQueue) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    const url = (state.gasUrl || '').trim();
    if (!url) return;

    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    state.isFlushingOfflineQueue = true;
    updateConnectionBadge();

    const remaining = [];
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      const cleanPayload = { ...item };
      delete cleanPayload._queuedAt;

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 7500);
        const response = await fetch(url, {
          method: 'POST',
          mode: 'cors',
          redirect: 'follow',
          signal: controller.signal,
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(cleanPayload)
        });
        clearTimeout(timer);
        const json = await response.json();
        if (!json || !json.ok) {
          remaining.push(item);
        }
      } catch (e) {
        // Se a rede cair novamente no meio do envio, preserva o restante da fila
        remaining.push(...queue.slice(i));
        break;
      }
    }

    setOfflineQueue(remaining);
    state.isFlushingOfflineQueue = false;
    updateConnectionBadge();
  }

  /**
   * Chama o Google Apps Script usando `text/plain;charset=utf-8` no POST
   * para evitar bloqueios de CORS Preflight OPTIONS do Google Apps Script.
   * Suporta operação 100% Offline com fila de sincronização automática!
   */
  async function callGasApi(payload) {
    const url = (state.gasUrl || '').trim();
    if (!url) {
      return { ok: true, localOnly: true };
    }

    const isReadOnly = ['bootstrap', 'telemetry', 'ping'].includes(payload?.action);

    // Se o aparelho estiver sem conexão à internet, salva na fila offline imediatamente sem travar a tela
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      if (!isReadOnly) {
        enqueueOfflineAction(payload);
      }
      updateConnectionBadge();
      return { ok: false, offline: true, queued: !isReadOnly };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
      clearTimeout(timeoutId);
      const json = await response.json();

      // Se a internet está funcionando e há itens pendentes na fila offline, sincroniza em background
      if (getOfflineQueue().length > 0 && !state.isFlushingOfflineQueue) {
        flushOfflineQueue();
      }
      updateConnectionBadge();
      return json;
    } catch (err) {
      if (!isReadOnly) {
        enqueueOfflineAction(payload);
      }
      updateConnectionBadge();
      console.warn('Operando em Modo Offline / Cache Local (sem conexão com Apps Script):', err);
      return { ok: false, offline: true, error: err.message || String(err) };
    }
  }

  async function syncWithGoogleSheets(showToastFeedback = false) {
    const spinIcon = document.getElementById('icon-sync-spin');
    if (spinIcon) spinIcon.classList.add('animate-spin');

    updateConnectionBadge();

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      if (spinIcon) setTimeout(() => spinIcon.classList.remove('animate-spin'), 350);
      if (showToastFeedback) {
        showToast('Sem internet no momento. O sistema está operando 100% Offline e sincronizará quando a rede voltar!', 'warning');
      }
      refreshActiveViews();
      return;
    }

    if (!state.gasUrl) {
      if (spinIcon) setTimeout(() => spinIcon.classList.remove('animate-spin'), 350);
      if (showToastFeedback) {
        showToast('Dados sincronizados no armazenamento local. Configure a URL do Apps Script quando desejar conectar à planilha.', 'info');
      }
      refreshActiveViews();
      return;
    }

    // Primeiro envia alterações que foram feitas enquanto estava sem internet
    await flushOfflineQueue();

    const res = await callGasApi({ action: 'bootstrap' });
    if (spinIcon) spinIcon.classList.remove('animate-spin');

    if (res && res.ok && res.data) {
      // Mescla dados vindos da planilha mantendo Master Admin garantido
      if (Array.isArray(res.data.usuarios) && res.data.usuarios.length > 0) {
        state.db.usuarios = res.data.usuarios;
      }
      if (Array.isArray(res.data.veiculos) && res.data.veiculos.length > 0) {
        state.db.veiculos = res.data.veiculos;
      }
      if (Array.isArray(res.data.motoristas) && res.data.motoristas.length > 0) {
        state.db.motoristas = res.data.motoristas;
      }
      if (Array.isArray(res.data.rotas) && res.data.rotas.length > 0) {
        state.db.rotas = res.data.rotas;
      }
      if (Array.isArray(res.data.telemetria) && res.data.telemetria.length > 0) {
        state.db.telemetria = res.data.telemetria;
      }
      if (Array.isArray(res.data.historico)) {
        state.db.historico = res.data.historico;
      }
      saveLocalDb();
      refreshActiveViews();
      if (showToastFeedback) {
        showToast('Sincronizado com sucesso com o Google Sheets!', 'success');
      }
    } else if (showToastFeedback) {
      showToast('Operando em Modo Offline / Cache Local no celular.', 'warning');
    }
  }

  function updateConnectionBadge() {
    const textEl = document.getElementById('text-connection-mode');
    const dotEl = document.getElementById('dot-connection');
    if (!textEl) return;

    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    const pendingCount = getOfflineQueue().length;

    if (isOffline) {
      textEl.textContent = pendingCount > 0 ? `Modo Offline (${pendingCount} pend.)` : 'Modo Offline Ativo';
      if (dotEl) dotEl.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
      return;
    }

    if (state.isFlushingOfflineQueue || pendingCount > 0) {
      textEl.textContent = `Sincronizando (${pendingCount})...`;
      if (dotEl) dotEl.className = 'w-2 h-2 rounded-full bg-sky-400 animate-ping';
      return;
    }

    if (state.gasUrl) {
      textEl.textContent = 'Sheets Cloud + Offline Ready';
      if (dotEl) dotEl.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
    } else {
      textEl.textContent = 'Tempo Real (Local + OSRM)';
      if (dotEl) dotEl.className = 'w-2 h-2 rounded-full bg-emerald-400';
    }
  }

  /* ==========================================================================
   * 5. UTILITÁRIOS GEOMÉTRICOS (FÓRMULA DE HAVERSINE, BEARING, OSRM, CANVAS)
   * ========================================================================== */

  /**
   * Fórmula de Haversine: Calcula a distância exata em metros entre duas coordenadas GPS
   */
  function calculateHaversineMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Raio da Terra em metros
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  /**
   * Calcula o rumo/direção (Bearing 0-360°) entre dois pontos GPS para câmera 3D do motorista
   */
  function calculateBearingDegrees(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    const brng = toDeg(Math.atan2(y, x));
    return Math.round((brng + 360) % 360);
  }

  /**
   * Consulta a API pública do OSRM (Open Source Routing Machine) para traçar o trajeto nas ruas
   */
  async function fetchOsrmStreetRoute(stopsArray) {
    if (! Array.isArray(stopsArray) || stopsArray.length < 2) {
      return {
        polyline: stopsArray.map((s) => [Number(s.lng), Number(s.lat)]),
        distanciaKm: 0,
        duracaoMin: 0
      };
    }

    const coordsString = stopsArray
      .map((pt) => `${Number(pt.lng).toFixed(6)},${Number(pt.lat).toFixed(6)}`)
      .join(';');

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

    try {
      const response = await fetch(osrmUrl);
      const data = await response.json();
      if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          polyline: route.geometry.coordinates,
          distanciaKm: Number((route.distance / 1000).toFixed(2)),
          duracaoMin: Math.max(1, Math.round(route.duration / 60))
        };
      }
    } catch (err) {
      console.warn('Fallback de linha reta acionado (OSRM indisponível):', err);
    }

    // Fallback caso offline
    let totalMeters = 0;
    for (let i = 1; i < stopsArray.length; i++) {
      totalMeters += calculateHaversineMeters(
        Number(stopsArray[i - 1].lat),
        Number(stopsArray[i - 1].lng),
        Number(stopsArray[i].lat),
        Number(stopsArray[i].lng)
      );
    }

    return {
      polyline: stopsArray.map((s) => [Number(s.lng), Number(s.lat)]),
      distanciaKm: Number((totalMeters / 1000).toFixed(2)),
      duracaoMin: Math.max(1, Math.round(totalMeters / 500))
    };
  }

  /**
   * Retorna o centro inicial ideal do mapa priorizando a rota ativa ou Juazeiro/Petrolina
   */
  function getDefaultMapCenter() {
    if (Array.isArray(state.db.rotas) && state.db.rotas.length > 0) {
      const r0 = state.db.rotas[0];
      if (Array.isArray(r0.pontos) && r0.pontos.length > 0) {
        const p0 = r0.pontos[0];
        if (!isLegacySaoPauloCoord(p0.lat, p0.lng)) {
          return [Number(p0.lng), Number(p0.lat)];
        }
      }
    }
    return [DEFAULT_LNG, DEFAULT_LAT];
  }

  /**
   * Centraliza rapidamente os mapas em Juazeiro - BA ou Petrolina - PE
   */
  function focusMapsOnCity(cityKey) {
    const target = CITY_COORDS[cityKey] || CITY_COORDS.juazeiro;
    const coords = [target.lng, target.lat];
    [state.maps.tower, state.maps.routeBuilder, state.maps.paxPicker, state.maps.passengerLive].forEach((m) => {
      if (m) {
        m.flyTo({ center: coords, zoom: 14.2, duration: 750 });
      }
    });
    showToast(`Mapa centralizado em ${target.label}!`, 'info');
  }

  /**
   * Geocodificação gratuita via Nominatim OpenStreetMap priorizando Juazeiro - BA e Petrolina - PE
   */
  async function geocodeAddressString(query) {
    if (!query || !query.trim()) return null;
    const rawQ = query.trim();
    const hasCity = /juazeiro|petrolina|ba|pe/i.test(rawQ);
    const regionalQuery = hasCity ? rawQ : `${rawQ}, Juazeiro, Petrolina`;

    try {
      // Viewbox focado no Vale do São Francisco (Juazeiro - BA / Petrolina - PE)
      const viewbox = '-40.68,-9.25,-40.35,-9.58';
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&viewbox=${viewbox}&q=${encodeURIComponent(regionalQuery)}`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'pt-BR' }
      });
      let items = await res.json();

      if (!Array.isArray(items) || items.length === 0) {
        const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(rawQ)}`;
        const fallbackRes = await fetch(fallbackUrl, {
          headers: { 'Accept-Language': 'pt-BR' }
        });
        items = await fallbackRes.json();
      }

      if (Array.isArray(items) && items.length > 0) {
        return {
          lat: parseFloat(items[0].lat),
          lng: parseFloat(items[0].lon),
          displayName: items[0].display_name
        };
      }
    } catch (err) {
      console.warn('Erro ao geocodificar endereço:', err);
    }
    return null;
  }

  /**
   * Geocodificação Reversa (Coordenadas GPS -> Endereço formatado de Rua, Nº, Bairro, Cidade/UF)
   * Preenche automaticamente o campo de endereço quando o funcionário clica em "Meu GPS Atual"
   * ou toca/arrasta o pino no mapa.
   */
  async function reverseGeocodeCoords(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lng)}&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'pt-BR' }
      });
      const data = await res.json();
      if (!data) return null;

      const addr = data.address || {};
      const road =
        addr.road ||
        addr.pedestrian ||
        addr.residential ||
        addr.path ||
        addr.cycleway ||
        addr.amenity ||
        '';
      const houseNumber = addr.house_number || '';
      const suburb =
        addr.suburb ||
        addr.neighbourhood ||
        addr.quarter ||
        addr.city_district ||
        addr.village ||
        '';
      const city =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.county ||
        '';
      const stateCode =
        addr['ISO3166-2-lvl4']
          ? addr['ISO3166-2-lvl4'].replace('BR-', '')
          : addr.state || '';

      const parts = [];
      if (road) {
        parts.push(houseNumber ? `${road}, ${houseNumber}` : road);
      }
      if (suburb) {
        parts.push(suburb);
      }
      if (city) {
        parts.push(stateCode ? `${city} - ${stateCode}` : city);
      }

      if (parts.length > 0) {
        return parts.join(', ');
      }
      if (data.display_name) {
        return data.display_name
          .split(',')
          .slice(0, 4)
          .map((s) => s.trim())
          .join(', ');
      }
    } catch (err) {
      console.warn('Erro na geocodificação reversa:', err);
    }
    return null;
  }

  /**
   * Compressão de foto de perfil via HTML5 <canvas> (máx 150x150px em JPEG Base64 leve)
   * para caber diretamente na célula do Google Sheets sem estourar o limite de 50.000 caracteres.
   */
  function compressImageToBase64(file, maxSize = 150, quality = 0.72) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve('');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Crop central quadrado 150x150 para avatar uniforme e leve
          const size = Math.min(width, height);
          const sx = (width - size) / 2;
          const sy = (height - size) / 2;

          canvas.width = maxSize;
          canvas.height = maxSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, sx, sy, size, size, 0, 0, maxSize, maxSize);

          const base64 = canvas.toDataURL('image/jpeg', quality);
          resolve(base64);
        };
        img.onerror = (err) => reject(err);
        img.src = ev.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const colors = {
      info: '#0ea5e9',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#f43f5e'
    };

    const item = document.createElement('div');
    item.className = 'toast-item';
    item.style.borderLeftColor = colors[type] || colors.info;
    item.innerHTML = `
      <div class="flex-1 pr-2">${message}</div>
      <button type="button" class="text-slate-400 hover:text-white text-xs font-bold">✕</button>
    `;
    item.querySelector('button').addEventListener('click', () => item.remove());
    container.appendChild(item);

    setTimeout(() => {
      if (item.parentNode) item.remove();
    }, 4500);
  }

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  /**
   * Adiciona e sincroniza a camada de imagens de Satélite de Alta Resolução (Esri World Imagery)
   * + Rótulos Híbridos de Ruas/Bairros em qualquer instância de mapa MapLibre GL,
   * funcionando mesmo enquanto o mapa está animando ou carregando tiles.
   */
  function ensureSatelliteLayerOnMap(map, beforeLayerId) {
    if (!map) return;

    const applyLayers = () => {
      try {
        if (!map.getSource('esri-world-satellite')) {
          map.addSource('esri-world-satellite', {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: 'Tiles &copy; Esri — World Imagery Satellite'
          });
        }

        if (!map.getSource('esri-world-hybrid-roads')) {
          map.addSource('esri-world-hybrid-roads', {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            maxzoom: 19
          });
        }

        if (!map.getSource('esri-world-hybrid-places')) {
          map.addSource('esri-world-hybrid-places', {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            maxzoom: 19
          });
        }

        const targetBefore = beforeLayerId && map.getLayer(beforeLayerId) ? beforeLayerId : undefined;
        const vis = state.isSatelliteMode ? 'visible' : 'none';

        if (!map.getLayer('esri-world-satellite-layer')) {
          map.addLayer(
            {
              id: 'esri-world-satellite-layer',
              type: 'raster',
              source: 'esri-world-satellite',
              layout: { visibility: vis },
              paint: {
                'raster-opacity': 1,
                'raster-contrast': 0.05
              }
            },
            targetBefore
          );
        } else {
          map.setLayoutProperty('esri-world-satellite-layer', 'visibility', vis);
        }

        if (!map.getLayer('esri-world-hybrid-roads-layer')) {
          map.addLayer(
            {
              id: 'esri-world-hybrid-roads-layer',
              type: 'raster',
              source: 'esri-world-hybrid-roads',
              layout: { visibility: vis },
              paint: { 'raster-opacity': 0.88 }
            },
            targetBefore
          );
        } else {
          map.setLayoutProperty('esri-world-hybrid-roads-layer', 'visibility', vis);
        }

        if (!map.getLayer('esri-world-hybrid-places-layer')) {
          map.addLayer(
            {
              id: 'esri-world-hybrid-places-layer',
              type: 'raster',
              source: 'esri-world-hybrid-places',
              layout: { visibility: vis },
              paint: { 'raster-opacity': 0.95 }
            },
            targetBefore
          );
        } else {
          map.setLayoutProperty('esri-world-hybrid-places-layer', 'visibility', vis);
        }

        if (typeof map.triggerRepaint === 'function') {
          map.triggerRepaint();
        }
      } catch (err) {
        // Caso o estilo base ainda esteja inicializando, agenda aplicação assim que carregar
        map.once('styledata', applyLayers);
        map.once('load', applyLayers);
      }
    };

    applyLayers();
  }

  function updateSatelliteButtonsUi() {
    document.querySelectorAll('.label-satellite-state').forEach((el) => {
      el.textContent = state.isSatelliteMode ? 'Mapa Vetorial' : 'Modo Satélite';
    });

    document.querySelectorAll('[data-toggle-satellite]').forEach((btn) => {
      btn.classList.toggle('bg-emerald-500/25', state.isSatelliteMode);
      btn.classList.toggle('border-emerald-400', state.isSatelliteMode);
    });
  }

  function toggleAllMapsSatelliteMode() {
    state.isSatelliteMode = !state.isSatelliteMode;

    const mapConfigs = [
      { map: state.maps.tower, before: 'tower-routes-glow' },
      { map: state.maps.routeBuilder, before: 'builder-route-glow' },
      { map: state.maps.paxPicker, before: undefined },
      { map: state.maps.passengerLive, before: 'pax-route-line' },
      { map: state.maps.selfPaxHome, before: undefined },
      { map: state.maps.selfSignup, before: undefined },
      { map: state.maps.driver3d, before: 'driver-route-glow' }
    ];

    mapConfigs.forEach(({ map, before }) => {
      if (map) {
        ensureSatelliteLayerOnMap(map, before);
      }
    });

    updateSatelliteButtonsUi();

    showToast(
      state.isSatelliteMode
        ? 'Modo Satélite Híbrido (Imagens Reais + Ruas) ativado!'
        : 'Modo Mapa Vetorial Tático ativado!',
      'info'
    );
  }

  /**
   * Permite ao Admin alternar instantaneamente entre a Visão Admin, Motorista 3D e Passageiro
   * sem precisar encerrar a sessão.
   */
  function switchAdminPreviewMode(targetRole) {
    if (!state.currentUser) return;

    document.querySelectorAll('[data-switch-view]').forEach((btn) => {
      const isTarget = btn.getAttribute('data-switch-view') === targetRole;
      btn.className = isTarget
        ? 'px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 transition text-center truncate'
        : 'px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white transition text-center truncate';
    });

    document.getElementById('view-auth').classList.add('hidden');
    document.getElementById('view-admin').classList.add('hidden');
    document.getElementById('view-passenger').classList.add('hidden');
    document.getElementById('view-driver').classList.add('hidden');

    document.getElementById('header-user-role').textContent = targetRole;

    if (targetRole === 'ADMIN') {
      document.getElementById('view-admin').classList.remove('hidden');
      initAdminModule();
    } else if (targetRole === 'MOTORISTA') {
      document.getElementById('view-driver').classList.remove('hidden');
      initDriverModule();
    } else if (targetRole === 'PASSAGEIRO') {
      document.getElementById('view-passenger').classList.remove('hidden');
      initPassengerModule();
    }
    refreshIcons();
  }

  /* ==========================================================================
   * 6. AUTENTICAÇÃO E PERSISTÊNCIA DE SESSÃO ("LEMBRAR-ME")
   * ========================================================================== */
  function checkExistingSession() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (saved) {
        const user = JSON.parse(saved);
        if (user && user.email && user.perfil) {
          loginSuccessRedirect(user, false);
          return true;
        }
      }
    } catch (e) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
    return false;
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    const emailInput = document.getElementById('login-email').value.trim().toLowerCase();
    const passInput = document.getElementById('login-password').value.trim();
    const remember = document.getElementById('login-remember').checked;

    // 1. Verifica Credencial Master Hardcoded + Auto-Seed
    if (emailInput === 'jasantos@cymibr.com' && passInput === 'Sabre0858') {
      ensureMasterAdminInDb(state.db);
      const masterUser = state.db.usuarios.find(
        (u) => String(u.email).trim().toLowerCase() === 'jasantos@cymibr.com'
      );
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(masterUser));
      }
      loginSuccessRedirect(masterUser, true);
      return;
    }

    // 2. Se houver URL do Google Apps Script configurada, tenta autenticar também na nuvem
    if (state.gasUrl) {
      const cloudAuth = await callGasApi({
        action: 'login',
        email: emailInput,
        senha: passInput
      });
      if (cloudAuth && cloudAuth.ok && cloudAuth.user) {
        if (remember) {
          localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(cloudAuth.user));
        }
        loginSuccessRedirect(cloudAuth.user, true);
        return;
      }
    }

    // 3. Verifica na tabela local Usuarios (ADMIN ou PASSAGEIRO)
    const foundUser = state.db.usuarios.find(
      (u) =>
        String(u.email).trim().toLowerCase() === emailInput &&
        String(u.senha).trim() === passInput
    );

    if (foundUser) {
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(foundUser));
      }
      loginSuccessRedirect(foundUser, true);
      return;
    }

    // 4. Verifica na tabela Motoristas
    const foundDriver = state.db.motoristas.find(
      (m) =>
        String(m.email).trim().toLowerCase() === emailInput &&
        String(m.senha).trim() === passInput
    );

    if (foundDriver) {
      const driverUser = {
        id: foundDriver.id,
        nome: foundDriver.nome,
        email: foundDriver.email,
        senha: foundDriver.senha,
        perfil: 'MOTORISTA',
        telefone: foundDriver.telefone,
        cnh: foundDriver.cnh,
        cpf: foundDriver.cpf,
        veiculoId: foundDriver.veiculoId || ''
      };
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(driverUser));
      }
      loginSuccessRedirect(driverUser, true);
      return;
    }

    showToast('Credenciais inválidas. Verifique seu e-mail e senha.', 'danger');
  }

  function loginSuccessRedirect(user, notify = true) {
    state.currentUser = user;
    state.isMasterAdminSession = user.perfil === 'ADMIN';

    // Atualiza Header Global
    const userBox = document.getElementById('header-user-box');
    const nameEl = document.getElementById('header-user-name');
    const roleEl = document.getElementById('header-user-role');
    const avatarEl = document.getElementById('header-user-avatar');
    const switcherEl = document.getElementById('admin-view-switcher');

    userBox.classList.remove('hidden');
    userBox.classList.add('flex');
    nameEl.textContent = user.nome || user.email;
    roleEl.textContent = user.perfil;

    if (switcherEl) {
      if (state.isMasterAdminSession) {
        switcherEl.classList.remove('hidden');
        switcherEl.classList.add('grid');
      } else {
        switcherEl.classList.add('hidden');
        switcherEl.classList.remove('grid');
      }
    }

    if (user.foto) {
      avatarEl.src = user.foto;
      avatarEl.classList.remove('hidden');
    } else {
      avatarEl.classList.add('hidden');
    }

    // Esconde todas as views principais
    document.getElementById('view-auth').classList.add('hidden');
    document.getElementById('view-admin').classList.add('hidden');
    document.getElementById('view-passenger').classList.add('hidden');
    document.getElementById('view-driver').classList.add('hidden');

    // Redireciona automaticamente para o módulo correspondente ao perfil
    if (user.perfil === 'ADMIN') {
      document.getElementById('view-admin').classList.remove('hidden');
      initAdminModule();
    } else if (user.perfil === 'MOTORISTA') {
      document.getElementById('view-driver').classList.remove('hidden');
      initDriverModule();
    } else {
      document.getElementById('view-passenger').classList.remove('hidden');
      initPassengerModule();
    }

    if (notify) {
      showToast(`Bem-vindo(a), ${user.nome}! Painel ${user.perfil} carregado.`, 'success');
    }
    refreshIcons();
  }

  function handleLogout() {
    stopDriverTripExecution(false);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    state.currentUser = null;
    state.isMasterAdminSession = false;

    const userBox = document.getElementById('header-user-box');
    userBox?.classList.add('hidden');
    userBox?.classList.remove('flex');
    const switcherEl = document.getElementById('admin-view-switcher');
    switcherEl?.classList.add('hidden');
    switcherEl?.classList.remove('grid');
    document.getElementById('view-admin').classList.add('hidden');
    document.getElementById('view-passenger').classList.add('hidden');
    document.getElementById('view-driver').classList.add('hidden');
    document.getElementById('view-auth').classList.remove('hidden');

    showToast('Sessão encerrada com segurança.', 'info');
  }

  /* ==========================================================================
   * 7. MÓDULO 1: PAINEL ADMINISTRATIVO (TORRE, ROTAS, PASSAGEIROS, FROTA, MOTORISTAS)
   * ========================================================================== */
  async function initAdminModule() {
    renderAdminKpiCounts();
    renderAdminFleetList();
    renderAdminDriversList();
    renderAdminPassengersList();
    populateAdminSelectDropdowns();

    // Garante que a rota inicial tenha geometria real das ruas via OSRM
    for (const r of state.db.rotas) {
      if (Array.isArray(r.pontos) && r.pontos.length >= 2 && (!r.polyline || r.polyline.length <= r.pontos.length)) {
        const osrm = await fetchOsrmStreetRoute(r.pontos);
        r.polyline = osrm.polyline;
        r.distanciaKm = osrm.distanciaKm;
        r.duracaoMin = osrm.duracaoMin;
      }
    }
    saveLocalDb();

    switchAdminTab(state.activeAdminTab || 'tower');
  }

  function switchAdminTab(tabName) {
    state.activeAdminTab = tabName;

    document.querySelectorAll('[data-admin-tab]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-admin-tab') === tabName);
    });

    const panels = ['tower', 'routes', 'passengers', 'fleet', 'drivers'];
    panels.forEach((p) => {
      const el = document.getElementById(`admin-panel-${p}`);
      if (el) el.classList.toggle('hidden', p !== tabName);
    });

    populateAdminSelectDropdowns();

    if (tabName === 'tower') {
      setTimeout(() => {
        initAdminTowerMap();
        renderTowerMapAndSidebar();
      }, 60);
    } else if (tabName === 'routes') {
      setTimeout(() => {
        initRouteBuilderMap();
        renderSavedRoutesListAdmin();
        if (!state.routeDraft.id && state.db.rotas.length > 0 && state.routeDraft.pontos.length === 0) {
          loadRouteIntoBuilder(state.db.rotas[0].id);
        } else {
          renderRouteBuilderStopsAndPolyline();
        }
      }, 60);
    } else if (tabName === 'passengers') {
      setTimeout(() => {
        initAdminPaxPickerMap();
        renderAdminPassengersList();
      }, 60);
    }
    refreshIcons();
  }

  function renderAdminKpiCounts() {
    const paxCount = state.db.usuarios.filter((u) => u.perfil === 'PASSAGEIRO').length;
    const fleetCount = state.db.veiculos.length;
    const driverCount = state.db.motoristas.length;

    const elPax = document.getElementById('kpi-count-passengers');
    const elFleet = document.getElementById('kpi-count-fleet');
    const elDrivers = document.getElementById('kpi-count-drivers');

    if (elPax) elPax.textContent = paxCount;
    if (elFleet) elFleet.textContent = fleetCount;
    if (elDrivers) elDrivers.textContent = driverCount;
  }

  function populateAdminSelectDropdowns() {
    // Selects no Construtor de Rotas
    const vehSelect = document.getElementById('route-vehicle');
    const drvSelect = document.getElementById('route-driver');

    if (vehSelect) {
      vehSelect.innerHTML = state.db.veiculos
        .map((v) => `<option value="${v.id}">${v.prefixo} (${v.placa}) - ${v.status}</option>`)
        .join('');
    }
    if (drvSelect) {
      drvSelect.innerHTML = state.db.motoristas
        .map((m) => `<option value="${m.id}">${m.nome}</option>`)
        .join('');
    }

    // Selects no Cadastro de Funcionário
    const paxRouteSel = document.getElementById('pax-route');
    if (paxRouteSel) {
      paxRouteSel.innerHTML = state.db.rotas
        .map((r) => `<option value="${r.id}">${r.nome} (${r.turno})</option>`)
        .join('');
      updatePaxStopsDropdown(paxRouteSel.value);
    }
  }

  function getBoardingStopsOnly(rota) {
    if (!rota || !Array.isArray(rota.pontos)) return [];
    return rota.pontos.filter((pt) => pt.tipo !== 'WAYPOINT');
  }

  function updatePaxStopsDropdown(rotaId, selectedStopId = '') {
    const stopSel = document.getElementById('pax-stop');
    if (!stopSel) return;
    const rota = state.db.rotas.find((r) => r.id === rotaId) || state.db.rotas[0];
    const boardingStops = getBoardingStopsOnly(rota);
    if (boardingStops.length === 0) {
      stopSel.innerHTML = '<option value="">Sem pontos cadastrados</option>';
      return;
    }
    stopSel.innerHTML = boardingStops
      .map(
        (pt) =>
          `<option value="${pt.id}" ${pt.id === selectedStopId ? 'selected' : ''}>${pt.horario} — ${pt.nome}</option>`
      )
      .join('');
  }

  /* --------------------------------------------------------------------------
   * 7.1 TORRE DE CONTROLE (MAPA DE MONITORAMENTO GERAL)
   * -------------------------------------------------------------------------- */
  function initAdminTowerMap() {
    if (state.maps.tower) {
      state.maps.tower.resize();
      ensureSatelliteLayerOnMap(state.maps.tower, 'tower-routes-glow');
      return;
    }

    const map = new maplibregl.Map({
      container: 'map-admin-tower',
      style: VECTOR_MAP_STYLE,
      center: getDefaultMapCenter(),
      zoom: 13.4,
      pitch: 35,
      bearing: 0,
      antialias: true
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    map.on('load', () => {
      map.addSource('tower-routes-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.addLayer({
        id: 'tower-routes-glow',
        type: 'line',
        source: 'tower-routes-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#38bdf8',
          'line-width': 9,
          'line-opacity': 0.22
        }
      });

      map.addLayer({
        id: 'tower-routes-line',
        type: 'line',
        source: 'tower-routes-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#0ea5e9',
          'line-width': 4,
          'line-opacity': 0.92
        }
      });

      ensureSatelliteLayerOnMap(map, 'tower-routes-glow');
      renderTowerMapAndSidebar();
    });

    state.maps.tower = map;
  }

  function renderTowerMapAndSidebar() {
    const map = state.maps.tower;
    const routes = state.db.rotas || [];
    const telemetries = state.db.telemetria || [];
    const passengers = state.db.usuarios.filter((u) => u.perfil === 'PASSAGEIRO');

    // Atualiza KPIs da Torre
    const activeBusesCount = routes.filter((r) => r.status === 'EM_ANDAMENTO').length;
    const waitingPaxCount = passengers.filter((p) => p.statusEmbarque !== 'NAO_VOU').length;

    const elActive = document.getElementById('tower-kpi-active-buses');
    const elWaiting = document.getElementById('tower-kpi-waiting-pax');
    const elUpdated = document.getElementById('tower-last-update');

    if (elActive) elActive.textContent = activeBusesCount;
    if (elWaiting) elWaiting.textContent = waitingPaxCount;
    if (elUpdated) {
      elUpdated.textContent = new Date().toLocaleTimeString('pt-BR');
    }

    // Renderiza lista lateral de rotas na Torre (com botão rápido para Abrir/Fechar rota IDA ou VOLTA)
    const listContainer = document.getElementById('tower-routes-list');
    if (listContainer) {
      listContainer.innerHTML = routes
        .map((r) => {
          const veh = state.db.veiculos.find((v) => v.id === r.veiculoId);
          const drv = state.db.motoristas.find((m) => m.id === r.motoristaId);
          const tel = telemetries.find((t) => t.rotaId === r.id);
          const paxInRoute = passengers.filter((p) => p.rotaId === r.id);
          const paxGoing = paxInRoute.filter((p) => p.statusEmbarque !== 'NAO_VOU').length;
          const speed = tel ? Math.round(Number(tel.velocidade || 0)) : 0;
          const isLive = r.status === 'EM_ANDAMENTO';
          const sentido =
            r.tipoRota ||
            (String(r.nome).toUpperCase().includes('VOLTA') ? 'VOLTA' : 'IDA');

          return `
            <div class="p-3.5 rounded-xl bg-slate-900/80 border ${
              isLive ? 'border-emerald-500/40' : 'border-slate-800'
            } hover:border-sky-500/40 transition cursor-pointer" data-focus-route="${r.id}">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5">
                  <span class="status-pill ${isLive ? 'live' : 'idle'}">${
                    isLive ? 'ROTA ABERTA' : 'FECHADA'
                  }</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-extrabold font-mono ${
                    sentido === 'VOLTA'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  }">${sentido}</span>
                </div>
                <span class="font-mono-num text-xs font-bold text-sky-400">${speed} km/h</span>
              </div>
              <h4 class="text-sm font-bold text-white mt-2">${r.nome}</h4>
              <p class="text-xs text-slate-400 mt-0.5">${
                veh ? `${veh.prefixo} (${veh.placa})` : 'Sem veículo'
              } • ${drv ? drv.nome : 'Sem motorista'}</p>
              <div class="flex items-center justify-between text-[11px] text-slate-300 mt-3 pt-2 border-t border-slate-800/80">
                <span>Turno: <strong>${r.turno}</strong> (${paxGoing} emb.)</span>
                <button type="button" data-toggle-open-route="${r.id}" class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  isLive
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                }">
                  ${isLive ? 'Fechar Rota' : 'Abrir Rota para Usuários'}
                </button>
              </div>
            </div>
          `;
        })
        .join('');

      listContainer.querySelectorAll('[data-focus-route]').forEach((card) => {
        card.addEventListener('click', (ev) => {
          if (ev.target.closest('[data-toggle-open-route]')) return;
          const rId = card.getAttribute('data-focus-route');
          const rObj = state.db.rotas.find((r) => r.id === rId);
          if (rObj && Array.isArray(rObj.pontos) && rObj.pontos.length > 0 && state.maps.tower) {
            const bounds = new maplibregl.LngLatBounds();
            rObj.pontos.forEach((pt) => bounds.extend([Number(pt.lng), Number(pt.lat)]));
            state.maps.tower.fitBounds(bounds, { padding: 65, maxZoom: 14.8, duration: 850 });
          }
        });
      });

      listContainer.querySelectorAll('[data-toggle-open-route]').forEach((btn) => {
        btn.addEventListener('click', async (ev) => {
          ev.stopPropagation();
          const rId = btn.getAttribute('data-toggle-open-route');
          await toggleRouteOpenState(rId);
        });
      });
    }

    if (!map || !map.getSource('tower-routes-source')) return;

    // Atualiza Polylines de todas as rotas
    const features = routes
      .filter((r) => Array.isArray(r.polyline) && r.polyline.length > 1)
      .map((r) => ({
        type: 'Feature',
        properties: { id: r.id, nome: r.nome },
        geometry: {
          type: 'LineString',
          coordinates: r.polyline
        }
      }));

    map.getSource('tower-routes-source').setData({
      type: 'FeatureCollection',
      features
    });

    // Limpa marcadores anteriores da Torre
    state.markers.towerBuses.forEach((m) => m.remove());
    state.markers.towerStops.forEach((m) => m.remove());
    state.markers.towerPax.forEach((m) => m.remove());
    state.markers.towerBuses = [];
    state.markers.towerStops = [];
    state.markers.towerPax = [];

    // Adiciona apenas Pontos de Parada reais (ignora pontos de desvio WAYPOINT) na Torre
    routes.forEach((r) => {
      getBoardingStopsOnly(r).forEach((pt, idx) => {
        const el = document.createElement('div');
        el.className = 'cymi-stop-marker';
        el.innerHTML = `
          <div class="cymi-stop-badge">
            <span>P${idx + 1}</span>
            <span class="text-sky-400 font-mono">${pt.horario || '--:--'}</span>
          </div>
          <div class="cymi-stop-pin"></div>
        `;
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([Number(pt.lng), Number(pt.lat)])
          .setPopup(
            new maplibregl.Popup({ offset: 18 }).setHTML(`
              <div class="text-xs">
                <div class="font-bold text-sky-400">${r.nome}</div>
                <div class="font-bold text-white mt-0.5">${pt.nome}</div>
                <div class="text-slate-300 mt-1">Horário previsto: <strong class="font-mono">${pt.horario}</strong></div>
              </div>
            `)
          )
          .addTo(map);
        state.markers.towerStops.push(marker);
      });
    });

    // Adiciona Passageiros na Torre (apenas se estiverem na região válida)
    passengers.forEach((pax) => {
      if (!pax.lat || !pax.lng || isLegacySaoPauloCoord(pax.lat, pax.lng)) return;
      const isGoing = pax.statusEmbarque !== 'NAO_VOU';
      const initials = (pax.nome || 'P')
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      const el = document.createElement('div');
      el.className = `cymi-user-marker ${isGoing ? '' : 'is-skipping'}`;
      el.innerHTML = pax.foto ? `<img src="${pax.foto}" alt="${pax.nome}" />` : `<span>${initials}</span>`;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([Number(pax.lng), Number(pax.lat)])
        .setPopup(
          new maplibregl.Popup({ offset: 16 }).setHTML(`
            <div class="text-xs">
              <div class="font-bold text-white">${pax.nome}</div>
              <div class="text-slate-400">${pax.endereco || ''}</div>
              <div class="mt-1 font-semibold ${isGoing ? 'text-emerald-400' : 'text-rose-400'}">
                ${isGoing ? '✓ Vai embarcar hoje' : '✕ Não utilizará hoje'}
              </div>
            </div>
          `)
        )
        .addTo(map);
      state.markers.towerPax.push(marker);
    });

    // Adiciona Ônibus em Tempo Real na Torre
    routes.forEach((r) => {
      const tel = telemetries.find((t) => t.rotaId === r.id) || {
        lat: r.pontos && r.pontos[0] ? r.pontos[0].lat : DEFAULT_LAT,
        lng: r.pontos && r.pontos[0] ? r.pontos[0].lng : DEFAULT_LNG,
        velocidade: 0,
        heading: 0
      };
      const veh = state.db.veiculos.find((v) => v.id === r.veiculoId);
      const drv = state.db.motoristas.find((m) => m.id === r.motoristaId);

      const el = document.createElement('div');
      el.className = 'cymi-bus-marker';
      el.innerHTML = `
        <div class="cymi-bus-pulse"></div>
        <div class="cymi-bus-marker-inner" title="${r.nome}">🚌</div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([Number(tel.lng), Number(tel.lat)])
        .setPopup(
          new maplibregl.Popup({ offset: 20 }).setHTML(`
            <div class="text-xs space-y-1">
              <div class="font-extrabold text-sky-400">${veh ? veh.prefixo : 'Ônibus'} • ${veh ? veh.placa : ''}</div>
              <div class="font-bold text-white">${r.nome}</div>
              <div class="text-slate-300">Motorista: ${drv ? drv.nome : '—'}</div>
              <div class="font-mono text-emerald-400 font-bold">Velocidade: ${Math.round(Number(tel.velocidade || 0))} km/h</div>
            </div>
          `)
        )
        .addTo(map);
      state.markers.towerBuses.push(marker);
    });

    // Enquadra automaticamente na rota ativa (Juazeiro/Petrolina) ao abrir pela primeira vez
    if (!state.hasInitialTowerCentered && routes.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      let count = 0;
      routes.forEach((r) => {
        (r.pontos || []).forEach((pt) => {
          if (!isLegacySaoPauloCoord(pt.lat, pt.lng)) {
            bounds.extend([Number(pt.lng), Number(pt.lat)]);
            count += 1;
          }
        });
      });
      if (count > 0) {
        state.hasInitialTowerCentered = true;
        map.fitBounds(bounds, { padding: 65, maxZoom: 14.2, duration: 600 });
      }
    }
  }

  /* --------------------------------------------------------------------------
   * 7.2 CONSTRUTOR VISUAL DE ROTAS NO MAPA (MODOS DE EDIÇÃO + DESVIOS + OSRM)
   * -------------------------------------------------------------------------- */
  function setRouteBuilderClickMode(mode) {
    state.builderClickMode = mode;

    document.querySelectorAll('[data-builder-mode]').forEach((btn) => {
      const m = btn.getAttribute('data-builder-mode');
      const isSelected = m === mode;
      if (m === 'navigate') {
        btn.className = isSelected
          ? 'px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1.5 transition'
          : 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 border border-transparent flex items-center gap-1.5 transition';
      } else if (m === 'waypoint') {
        btn.className = isSelected
          ? 'px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition'
          : 'px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 hover:bg-amber-500/15 border border-transparent flex items-center gap-1.5 transition';
      } else if (m === 'add_stop') {
        btn.className = isSelected
          ? 'px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition'
          : 'px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 hover:bg-emerald-500/15 border border-transparent flex items-center gap-1.5 transition';
      }
    });

    const hintEl = document.getElementById('route-builder-mode-hint');
    if (hintEl) {
      if (mode === 'navigate') {
        hintEl.textContent =
          'Modo Mover/Ajustar: navegue pelo mapa, altere dados da rota ou arraste os pinos existentes sem criar novas paradas ao clicar.';
      } else if (mode === 'waypoint') {
        hintEl.textContent =
          'Modo Desvio de Rua (Sem Parada): clique em qualquer rua para forçar o ônibus a passar por ela sem criar parada de embarque.';
      } else {
        hintEl.textContent =
          'Modo Nova Parada: clique em qualquer local do mapa para adicionar um novo Ponto de Embarque com horário.';
      }
    }
  }

  /**
   * Encontra o melhor índice para inserir um ponto de desvio (Waypoint) entre os pontos existentes
   * com base na menor distância geométrica aos segmentos da rota.
   */
  function findBestInsertionIndexForWaypoint(lat, lng, points) {
    if (!Array.isArray(points) || points.length < 2) {
      return points ? points.length : 0;
    }

    let bestIndex = points.length - 1;
    let bestScore = Infinity;

    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const dA = calculateHaversineMeters(lat, lng, Number(a.lat), Number(a.lng));
      const dB = calculateHaversineMeters(lat, lng, Number(b.lat), Number(b.lng));
      const dAB = calculateHaversineMeters(Number(a.lat), Number(a.lng), Number(b.lat), Number(b.lng));
      const detour = dA + dB - dAB;
      if (detour < bestScore) {
        bestScore = detour;
        bestIndex = i + 1;
      }
    }
    return bestIndex;
  }

  function initRouteBuilderMap() {
    if (state.maps.routeBuilder) {
      state.maps.routeBuilder.resize();
      ensureSatelliteLayerOnMap(state.maps.routeBuilder, 'builder-route-glow');
      return;
    }

    const map = new maplibregl.Map({
      container: 'map-route-builder',
      style: VECTOR_MAP_STYLE,
      center: getDefaultMapCenter(),
      zoom: 13.5,
      antialias: true
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      map.addSource('builder-route-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [] }
        }
      });

      map.addLayer({
        id: 'builder-route-glow',
        type: 'line',
        source: 'builder-route-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#10b981',
          'line-width': 9,
          'line-opacity': 0.25
        }
      });

      map.addLayer({
        id: 'builder-route-line',
        type: 'line',
        source: 'builder-route-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#10b981',
          'line-width': 4,
          'line-opacity': 0.95
        }
      });

      ensureSatelliteLayerOnMap(map, 'builder-route-glow');
      renderRouteBuilderStopsAndPolyline();
    });

    // Clique no mapa respeita o modo selecionado pelo usuário
    map.on('click', async (e) => {
      if (state.builderClickMode === 'navigate') {
        // Modo padrão: permite navegar, dar zoom e arrastar pontos existentes sem adicionar parada acidentalmente
        return;
      }

      const lat = Number(e.lngLat.lat.toFixed(6));
      const lng = Number(e.lngLat.lng.toFixed(6));

      if (state.builderClickMode === 'waypoint') {
        const insertIdx = findBestInsertionIndexForWaypoint(lat, lng, state.routeDraft.pontos);
        const wpNode = {
          id: `wp_${Date.now()}`,
          nome: 'Desvio de Trajeto (Via)',
          horario: '',
          tipo: 'WAYPOINT',
          lat,
          lng
        };
        state.routeDraft.pontos.splice(insertIdx, 0, wpNode);
        await recalculateBuilderOsrm();
        renderRouteBuilderStopsAndPolyline();
        showToast('Ponto de desvio de rua inserido! Arraste a bolinha amarela para ajustar a via.', 'info');
        return;
      }

      // Modo 'add_stop': adiciona nova Parada de Embarque
      const boardingCount = state.routeDraft.pontos.filter((p) => p.tipo !== 'WAYPOINT').length + 1;
      const defaultHour = `${String(6 + Math.floor(boardingCount / 4)).padStart(2, '0')}:${String((boardingCount * 10) % 60).padStart(2, '0')}`;
      state.routeDraft.pontos.push({
        id: `pto_${Date.now()}_${boardingCount}`,
        nome: `Ponto ${boardingCount} — Parada Embarque`,
        horario: defaultHour,
        tipo: 'PARADA',
        lat,
        lng
      });

      await recalculateBuilderOsrm();
      renderRouteBuilderStopsAndPolyline();
      showToast(`Parada #${boardingCount} adicionada à rota!`, 'success');
    });

    state.maps.routeBuilder = map;
  }

  async function recalculateBuilderOsrm() {
    if (state.routeDraft.pontos.length >= 2) {
      const osrmResult = await fetchOsrmStreetRoute(state.routeDraft.pontos);
      state.routeDraft.polyline = osrmResult.polyline;
      state.routeDraft.distanciaKm = osrmResult.distanciaKm;
      state.routeDraft.duracaoMin = osrmResult.duracaoMin;
    } else {
      state.routeDraft.polyline = state.routeDraft.pontos.map((p) => [Number(p.lng), Number(p.lat)]);
      state.routeDraft.distanciaKm = 0;
      state.routeDraft.duracaoMin = 0;
    }

    const kmEl = document.getElementById('route-metric-km');
    const minEl = document.getElementById('route-metric-min');
    if (kmEl) kmEl.textContent = `${state.routeDraft.distanciaKm} km`;
    if (minEl) minEl.textContent = `${state.routeDraft.duracaoMin} min`;
  }

  function renderRouteBuilderStopsAndPolyline() {
    const stopsContainer = document.getElementById('route-stops-container');
    let stopCounter = 0;

    if (stopsContainer) {
      if (state.routeDraft.pontos.length === 0) {
        stopsContainer.innerHTML = `
          <div class="p-3 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 text-xs text-slate-400 text-center">
            Selecione <strong>"+ Adicionar Parada"</strong> acima do mapa ou edite uma rota existente.
          </div>
        `;
      } else {
        stopsContainer.innerHTML = state.routeDraft.pontos
          .map((pt, idx) => {
            const isWaypoint = pt.tipo === 'WAYPOINT';
            if (!isWaypoint) stopCounter += 1;

            if (isWaypoint) {
              return `
                <div class="p-2 rounded-xl bg-amber-950/25 border border-dashed border-amber-500/40 flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">VIA / DESVIO</span>
                    <input type="text" data-stop-name="${idx}" value="${pt.nome || 'Desvio de Rua'}" class="input-field !py-1 !px-2 !text-xs flex-1" />
                  </div>
                  <div class="flex items-center gap-1">
                    <button type="button" data-stop-up="${idx}" class="text-slate-400 hover:text-white px-1 text-xs" title="Subir na ordem">↑</button>
                    <button type="button" data-stop-down="${idx}" class="text-slate-400 hover:text-white px-1 text-xs" title="Descer na ordem">↓</button>
                    <button type="button" data-stop-remove="${idx}" class="text-rose-400 hover:text-rose-300 px-1.5 text-xs" title="Remover Desvio">✕</button>
                  </div>
                </div>
              `;
            }

            return `
              <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-sky-500/20 text-sky-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">${stopCounter}</span>
                <input type="text" data-stop-name="${idx}" value="${pt.nome}" class="input-field !py-1 !px-2 !text-xs flex-1" placeholder="Nome do ponto" />
                <input type="time" data-stop-time="${idx}" value="${pt.horario || '06:30'}" class="input-field !py-1 !px-2 !text-xs !w-24 font-mono" />
                <button type="button" data-stop-up="${idx}" class="text-slate-400 hover:text-white px-1 text-xs" title="Subir">↑</button>
                <button type="button" data-stop-down="${idx}" class="text-slate-400 hover:text-white px-1 text-xs" title="Descer">↓</button>
                <button type="button" data-stop-remove="${idx}" class="text-rose-400 hover:text-rose-300 px-1.5" title="Remover Ponto">✕</button>
              </div>
            `;
          })
          .join('');

        stopsContainer.querySelectorAll('[data-stop-name]').forEach((inp) => {
          inp.addEventListener('input', (ev) => {
            const idx = Number(inp.getAttribute('data-stop-name'));
            if (state.routeDraft.pontos[idx]) {
              state.routeDraft.pontos[idx].nome = ev.target.value;
            }
          });
        });

        stopsContainer.querySelectorAll('[data-stop-time]').forEach((inp) => {
          inp.addEventListener('change', (ev) => {
            const idx = Number(inp.getAttribute('data-stop-time'));
            if (state.routeDraft.pontos[idx]) {
              state.routeDraft.pontos[idx].horario = ev.target.value;
              renderRouteBuilderStopsAndPolyline();
            }
          });
        });

        stopsContainer.querySelectorAll('[data-stop-up]').forEach((btn) => {
          btn.addEventListener('click', async () => {
            const idx = Number(btn.getAttribute('data-stop-up'));
            if (idx > 0) {
              const temp = state.routeDraft.pontos[idx - 1];
              state.routeDraft.pontos[idx - 1] = state.routeDraft.pontos[idx];
              state.routeDraft.pontos[idx] = temp;
              await recalculateBuilderOsrm();
              renderRouteBuilderStopsAndPolyline();
            }
          });
        });

        stopsContainer.querySelectorAll('[data-stop-down]').forEach((btn) => {
          btn.addEventListener('click', async () => {
            const idx = Number(btn.getAttribute('data-stop-down'));
            if (idx < state.routeDraft.pontos.length - 1) {
              const temp = state.routeDraft.pontos[idx + 1];
              state.routeDraft.pontos[idx + 1] = state.routeDraft.pontos[idx];
              state.routeDraft.pontos[idx] = temp;
              await recalculateBuilderOsrm();
              renderRouteBuilderStopsAndPolyline();
            }
          });
        });

        stopsContainer.querySelectorAll('[data-stop-remove]').forEach((btn) => {
          btn.addEventListener('click', async () => {
            const idx = Number(btn.getAttribute('data-stop-remove'));
            state.routeDraft.pontos.splice(idx, 1);
            await recalculateBuilderOsrm();
            renderRouteBuilderStopsAndPolyline();
          });
        });
      }
    }

    const map = state.maps.routeBuilder;
    if (!map) return;

    // Atualiza linha OSRM no mapa
    const src = map.getSource('builder-route-source');
    if (src) {
      src.setData({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: state.routeDraft.polyline || []
        }
      });
    }

    // Recria marcadores arrastáveis (Draggable) para Paradas e Desvios de Trajeto
    state.markers.builderStops.forEach((m) => m.remove());
    state.markers.builderStops = [];

    let markerStopNum = 0;
    state.routeDraft.pontos.forEach((pt, idx) => {
      const isWaypoint = pt.tipo === 'WAYPOINT';
      if (!isWaypoint) markerStopNum += 1;

      const el = document.createElement('div');
      if (isWaypoint) {
        el.className = 'cymi-waypoint-marker';
        el.innerHTML = `
          <div class="cymi-waypoint-badge">
            <span>Desvio Rua</span>
          </div>
          <div class="cymi-waypoint-dot"></div>
        `;
      } else {
        el.className = 'cymi-stop-marker';
        el.innerHTML = `
          <div class="cymi-stop-badge">
            <span>#${markerStopNum}</span>
            <span class="text-emerald-400 font-mono">${pt.horario || '--:--'}</span>
          </div>
          <div class="cymi-stop-pin"></div>
        `;
      }

      const marker = new maplibregl.Marker({
        element: el,
        draggable: true,
        anchor: 'bottom'
      })
        .setLngLat([Number(pt.lng), Number(pt.lat)])
        .addTo(map);

      marker.on('dragend', async () => {
        const lngLat = marker.getLngLat();
        state.routeDraft.pontos[idx].lat = Number(lngLat.lat.toFixed(6));
        state.routeDraft.pontos[idx].lng = Number(lngLat.lng.toFixed(6));
        await recalculateBuilderOsrm();
        renderRouteBuilderStopsAndPolyline();
      });

      state.markers.builderStops.push(marker);
    });
  }

  function loadRouteIntoBuilder(routeId) {
    const r = state.db.rotas.find((item) => item.id === routeId);
    if (!r) return;

    document.getElementById('route-form-title').textContent = `Editando: ${r.nome}`;
    document.getElementById('route-id').value = r.id;
    document.getElementById('route-name').value = r.nome;
    const dirEl = document.getElementById('route-direction');
    if (dirEl) {
      dirEl.value =
        r.tipoRota || (String(r.nome).toUpperCase().includes('VOLTA') ? 'VOLTA' : 'IDA');
    }
    document.getElementById('route-shift').value = r.turno || 'Manhã';
    document.getElementById('route-vehicle').value = r.veiculoId || '';
    document.getElementById('route-driver').value = r.motoristaId || '';

    state.routeDraft = {
      id: r.id,
      pontos: JSON.parse(JSON.stringify(r.pontos || [])),
      polyline: JSON.parse(JSON.stringify(r.polyline || [])),
      distanciaKm: r.distanciaKm || 0,
      duracaoMin: r.duracaoMin || 0
    };

    // Ao carregar uma rota existente, entra em modo "navigate" para permitir editar sem criar paradas acidentais
    setRouteBuilderClickMode('navigate');

    document.getElementById('route-metric-km').textContent = `${state.routeDraft.distanciaKm} km`;
    document.getElementById('route-metric-min').textContent = `${state.routeDraft.duracaoMin} min`;

    renderRouteBuilderStopsAndPolyline();

    if (state.maps.routeBuilder && state.routeDraft.pontos.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      state.routeDraft.pontos.forEach((pt) => bounds.extend([Number(pt.lng), Number(pt.lat)]));
      state.maps.routeBuilder.fitBounds(bounds, { padding: 65, maxZoom: 14.5 });
    }
  }

  function resetRouteBuilderForm() {
    document.getElementById('route-form-title').textContent = 'Nova Rota Corporativa';
    document.getElementById('route-id').value = '';
    document.getElementById('route-name').value = '';
    const dirEl = document.getElementById('route-direction');
    if (dirEl) dirEl.value = 'IDA';
    state.routeDraft = {
      id: '',
      pontos: [],
      polyline: [],
      distanciaKm: 0,
      duracaoMin: 0
    };
    setRouteBuilderClickMode('add_stop');
    document.getElementById('route-metric-km').textContent = '0.0 km';
    document.getElementById('route-metric-min').textContent = '0 min';
    renderRouteBuilderStopsAndPolyline();
  }

  async function handleSaveRouteBuilder(event) {
    event.preventDefault();
    if (state.routeDraft.pontos.length >= 2) {
      await recalculateBuilderOsrm();
    }

    const routeId = document.getElementById('route-id').value || `rota_${Date.now()}`;
    const existingRoute = state.db.rotas.find((r) => r.id === routeId);
    const tipoRota =
      document.getElementById('route-direction')?.value ||
      (String(document.getElementById('route-name').value).toUpperCase().includes('VOLTA')
        ? 'VOLTA'
        : 'IDA');

    const routeObj = {
      id: routeId,
      nome: document.getElementById('route-name').value.trim(),
      tipoRota,
      turno: document.getElementById('route-shift').value,
      veiculoId: document.getElementById('route-vehicle').value,
      motoristaId: document.getElementById('route-driver').value,
      status: existingRoute ? existingRoute.status : 'PARADA',
      pontos: state.routeDraft.pontos,
      polyline: state.routeDraft.polyline,
      distanciaKm: state.routeDraft.distanciaKm,
      duracaoMin: state.routeDraft.duracaoMin,
      updatedAt: new Date().toISOString()
    };

    const existingIdx = state.db.rotas.findIndex((r) => r.id === routeId);
    if (existingIdx >= 0) {
      state.db.rotas[existingIdx] = routeObj;
    } else {
      state.db.rotas.push(routeObj);
    }

    // Garante registro inicial de telemetria para a rota se não houver
    const hasTel = state.db.telemetria.some((t) => t.rotaId === routeId);
    if (!hasTel && routeObj.pontos.length > 0) {
      state.db.telemetria.push({
        rotaId: routeId,
        motoristaId: routeObj.motoristaId,
        veiculoId: routeObj.veiculoId,
        lat: routeObj.pontos[0].lat,
        lng: routeObj.pontos[0].lng,
        velocidade: 0,
        heading: 0,
        statusRota: routeObj.status,
        proximoPontoId: routeObj.pontos[0].id,
        updatedAt: new Date().toISOString()
      });
    }

    saveLocalDb();
    populateAdminSelectDropdowns();
    renderSavedRoutesListAdmin();
    renderTowerMapAndSidebar();
    showToast(`Rota "${routeObj.nome}" (${tipoRota}) salva com sucesso!`, 'success');

    await callGasApi({
      action: 'upsertEntity',
      sheet: 'Rotas',
      record: routeObj
    });
  }

  /**
   * Abre ou Fecha uma rota (IDA ou VOLTA).
   * Regra: quando um ônibus abre a rota de IDA, a rota de VOLTA desse mesmo ônibus é fechada automaticamente (e vice-versa),
   * para que os passageiros visualizem somente a rota que estiver aberta no momento!
   */
  async function toggleRouteOpenState(routeId, forceState) {
    const targetRoute = state.db.rotas.find((r) => r.id === routeId);
    if (!targetRoute) return;

    const currentlyOpen = targetRoute.status === 'EM_ANDAMENTO';
    const shouldOpen = typeof forceState === 'boolean' ? forceState : !currentlyOpen;
    const now = new Date().toISOString();

    const changedRoutes = [];

    if (shouldOpen) {
      // Se estiver abrindo esta rota, fecha a outra rota (IDA/VOLTA) que pertença ao mesmo ônibus ou motorista
      state.db.rotas.forEach((r) => {
        if (
          r.id !== targetRoute.id &&
          r.status === 'EM_ANDAMENTO' &&
          ((targetRoute.veiculoId && r.veiculoId === targetRoute.veiculoId) ||
            (targetRoute.motoristaId && r.motoristaId === targetRoute.motoristaId))
        ) {
          r.status = 'PARADA';
          r.updatedAt = now;
          changedRoutes.push(r);
          const telOther = state.db.telemetria.find((t) => t.rotaId === r.id);
          if (telOther) {
            telOther.statusRota = 'PARADA';
            telOther.velocidade = 0;
          }
        }
      });

      targetRoute.status = 'EM_ANDAMENTO';
      targetRoute.updatedAt = now;
      changedRoutes.push(targetRoute);

      let tel = state.db.telemetria.find((t) => t.rotaId === targetRoute.id);
      const initialLat =
        state.driverRuntime.hasRealGpsFix && state.driverRuntime.currentLat
          ? Number(state.driverRuntime.currentLat.toFixed(6))
          : targetRoute.pontos && targetRoute.pontos[0]
          ? Number(targetRoute.pontos[0].lat)
          : DEFAULT_LAT;
      const initialLng =
        state.driverRuntime.hasRealGpsFix && state.driverRuntime.currentLng
          ? Number(state.driverRuntime.currentLng.toFixed(6))
          : targetRoute.pontos && targetRoute.pontos[0]
          ? Number(targetRoute.pontos[0].lng)
          : DEFAULT_LNG;

      if (!tel) {
        tel = {
          rotaId: targetRoute.id,
          motoristaId: targetRoute.motoristaId,
          veiculoId: targetRoute.veiculoId,
          lat: initialLat,
          lng: initialLng,
          velocidade: Math.round(state.driverRuntime.currentSpeed || 0),
          heading: Math.round(state.driverRuntime.currentHeading || 0),
          statusRota: 'EM_ANDAMENTO',
          proximoPontoId: targetRoute.pontos && targetRoute.pontos[0] ? targetRoute.pontos[0].id : '',
          updatedAt: now
        };
        state.db.telemetria.push(tel);
      } else {
        if (state.driverRuntime.hasRealGpsFix) {
          tel.lat = initialLat;
          tel.lng = initialLng;
        }
        tel.statusRota = 'EM_ANDAMENTO';
        tel.updatedAt = now;
      }

      showToast(
        `Rota "${targetRoute.nome}" ABERTA! Os funcionários agora visualizam esta rota no painel.`,
        'success'
      );
    } else {
      targetRoute.status = 'PARADA';
      targetRoute.updatedAt = now;
      changedRoutes.push(targetRoute);

      const tel = state.db.telemetria.find((t) => t.rotaId === targetRoute.id);
      if (tel) {
        tel.statusRota = 'PARADA';
        tel.velocidade = 0;
        tel.updatedAt = now;
      }

      showToast(`Rota "${targetRoute.nome}" FECHADA.`, 'info');
    }

    saveLocalDb();
    renderAdminKpiCounts();
    renderTowerMapAndSidebar();
    renderSavedRoutesListAdmin();
    refreshActiveViews();

    for (const r of changedRoutes) {
      await callGasApi({
        action: 'upsertEntity',
        sheet: 'Rotas',
        record: r
      });
    }
  }

  /** Abre a rota (origem, paradas intermediárias e destino) no Google Maps. */
  function exportRouteToGoogleMaps(routeId) {
    const r = (state.db.rotas || []).find((x) => x.id === routeId);
    const pts = ((r && r.pontos) || []).filter((p) => isFinite(Number(p.lat)) && isFinite(Number(p.lng)));
    if (pts.length < 2) {
      showToast('A rota precisa de ao menos 2 pontos para abrir no Google Maps.', 'error');
      return;
    }
    const fmt = (p) => `${Number(p.lat).toFixed(6)},${Number(p.lng).toFixed(6)}`;
    let mid = pts.slice(1, -1);
    const MAX = 9; // limite de paradas intermediárias da URL do Google Maps
    if (mid.length > MAX) {
      const sampled = [];
      for (let i = 0; i < MAX; i++) sampled.push(mid[Math.round((i * (mid.length - 1)) / (MAX - 1))]);
      mid = sampled;
      showToast('Google Maps aceita até 9 paradas intermediárias; use o KML para todos os pontos.', 'info');
    }
    let url = `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${fmt(pts[0])}&destination=${fmt(
      pts[pts.length - 1]
    )}`;
    if (mid.length) url += `&waypoints=${mid.map(fmt).join('%7C')}`;
    window.open(url, '_blank', 'noopener');
  }

  /** Baixa um KML com todos os pontos e o trajeto (abre no Google Earth / Google Meus Mapas). */
  function exportRouteToKml(routeId) {
    const r = (state.db.rotas || []).find((x) => x.id === routeId);
    if (!r) return;
    const esc = (t) => String(t == null ? '' : t).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
    const marks = (r.pontos || [])
      .map(
        (p, i) =>
          `<Placemark><name>${i + 1}. ${esc(p.nome)}</name><description>${esc(p.horario || '')}</description><Point><coordinates>${Number(p.lng)},${Number(p.lat)},0</coordinates></Point></Placemark>`
      )
      .join('');
    const line = Array.isArray(r.polyline) && r.polyline.length > 1 ? r.polyline : (r.pontos || []).map((p) => [p.lng, p.lat]);
    const kml = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${esc(r.nome)}</name>${marks}<Placemark><name>Trajeto ${esc(r.nome)}</name><Style><LineStyle><color>ffe9a50e</color><width>4</width></LineStyle></Style><LineString><tessellate>1</tessellate><coordinates>${line.map((c) => `${c[0]},${c[1]},0`).join(' ')}</coordinates></LineString></Placemark></Document></kml>`;
    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${String(r.nome || 'rota').replace(/[^\w\-]+/g, '_')}.kml`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    showToast('KML baixado. Importe em mymaps.google.com ou abra no Google Earth.', 'success');
  }

  function renderSavedRoutesListAdmin() {
    const container = document.getElementById('admin-routes-saved-list');
    if (!container) return;

    container.innerHTML = state.db.rotas
      .map((r) => {
        const veh = state.db.veiculos.find((v) => v.id === r.veiculoId);
        const drv = state.db.motoristas.find((m) => m.id === r.motoristaId);
        const stopsCount = getBoardingStopsOnly(r).length;
        const waypointsCount = (r.pontos || []).filter((p) => p.tipo === 'WAYPOINT').length;
        const isLive = r.status === 'EM_ANDAMENTO';
        const sentido =
          r.tipoRota || (String(r.nome).toUpperCase().includes('VOLTA') ? 'VOLTA' : 'IDA');

        return `
          <div class="p-3 rounded-xl bg-slate-900/80 border ${
            isLive ? 'border-emerald-500/40' : 'border-slate-800'
          } flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="px-2 py-0.5 rounded text-[10px] font-extrabold font-mono ${
                  sentido === 'VOLTA'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                }">${sentido}</span>
                <span class="status-pill ${isLive ? 'live' : 'idle'}">${
                  isLive ? 'ABERTA' : 'FECHADA'
                }</span>
                <span class="text-xs font-bold text-white">${r.nome}</span>
              </div>
              <div class="text-[11px] text-slate-400 mt-1">
                ${r.turno} • ${stopsCount} paradas${
                  waypointsCount > 0 ? ` (+${waypointsCount} desvios)` : ''
                } • ${r.distanciaKm || 0} km • ${veh ? veh.prefixo : ''} (${drv ? drv.nome : ''})
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button type="button" data-builder-toggle-open="${r.id}" class="btn-secondary !py-1 !px-2.5 text-xs ${
                isLive ? 'text-rose-300 border-rose-500/40' : 'text-emerald-300 border-emerald-500/40'
              }">${isLive ? 'Fechar' : 'Abrir Rota'}</button>
              <button type="button" data-gmaps-route="${r.id}" class="btn-secondary !py-1 !px-2.5 text-xs text-sky-300 border-sky-500/40" title="Abrir rota e pontos no Google Maps">Google Maps</button>
              <button type="button" data-kml-route="${r.id}" class="btn-secondary !py-1 !px-2.5 text-xs text-amber-300 border-amber-500/40" title="Baixar KML (Google Earth / Meus Mapas)">KML</button>
              <button type="button" data-edit-route="${r.id}" class="btn-secondary !py-1 !px-2.5 text-xs">Editar</button>
              <button type="button" data-del-route="${r.id}" class="btn-secondary !py-1 !px-2.5 text-xs text-rose-400">Excluir</button>
            </div>
          </div>
        `;
      })
      .join('');

    container.querySelectorAll('[data-builder-toggle-open]').forEach((btn) => {
      btn.addEventListener('click', () =>
        toggleRouteOpenState(btn.getAttribute('data-builder-toggle-open'))
      );
    });

    container.querySelectorAll('[data-gmaps-route]').forEach((btn) => {
      btn.addEventListener('click', () => exportRouteToGoogleMaps(btn.getAttribute('data-gmaps-route')));
    });
    container.querySelectorAll('[data-kml-route]').forEach((btn) => {
      btn.addEventListener('click', () => exportRouteToKml(btn.getAttribute('data-kml-route')));
    });

    container.querySelectorAll('[data-edit-route]').forEach((btn) => {
      btn.addEventListener('click', () => loadRouteIntoBuilder(btn.getAttribute('data-edit-route')));
    });

    container.querySelectorAll('[data-del-route]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-del-route');
        state.db.rotas = state.db.rotas.filter((r) => r.id !== id);
        saveLocalDb();
        renderSavedRoutesListAdmin();
        showToast('Rota removida.', 'info');
        await callGasApi({ action: 'deleteEntity', sheet: 'Rotas', id });
      });
    });
  }

  /* --------------------------------------------------------------------------
   * 7.3 CRUD DE FUNCIONÁRIOS / PASSAGEIROS (ADMIN)
   * -------------------------------------------------------------------------- */
  function initAdminPaxPickerMap() {
    if (state.maps.paxPicker) {
      state.maps.paxPicker.resize();
      ensureSatelliteLayerOnMap(state.maps.paxPicker);
      return;
    }

    const lat = parseFloat(document.getElementById('pax-lat').value) || DEFAULT_LAT;
    const lng = parseFloat(document.getElementById('pax-lng').value) || DEFAULT_LNG;

    const map = new maplibregl.Map({
      container: 'map-pax-picker',
      style: VECTOR_MAP_STYLE,
      center: [lng, lat],
      zoom: 14
    });

    map.on('load', () => {
      ensureSatelliteLayerOnMap(map);
    });

    const marker = new maplibregl.Marker({ color: '#10b981', draggable: true })
      .setLngLat([lng, lat])
      .addTo(map);

    const updateCoordsInputs = async (lngLat) => {
      const la = Number(lngLat.lat.toFixed(6));
      const ln = Number(lngLat.lng.toFixed(6));
      document.getElementById('pax-lat').value = la;
      document.getElementById('pax-lng').value = ln;
      document.getElementById('pax-lat-display').textContent = la;
      document.getElementById('pax-lng-display').textContent = ln;

      const addrEl = document.getElementById('pax-address');
      if (addrEl) {
        const revAddr = await reverseGeocodeCoords(la, ln);
        if (revAddr) {
          addrEl.value = revAddr;
        }
      }
    };

    marker.on('dragend', () => updateCoordsInputs(marker.getLngLat()));
    map.on('click', (e) => {
      marker.setLngLat(e.lngLat);
      updateCoordsInputs(e.lngLat);
    });

    state.maps.paxPicker = map;
    state.markers.paxPickerMarker = marker;
  }

  async function handleSaveAdminPassenger(event) {
    event.preventDefault();
    const id = document.getElementById('pax-id').value || `usr_pax_${Date.now()}`;
    const existing = state.db.usuarios.find((u) => u.id === id);

    const record = {
      id,
      nome: document.getElementById('pax-name').value.trim(),
      email: document.getElementById('pax-email').value.trim().toLowerCase(),
      senha: document.getElementById('pax-password').value.trim(),
      perfil: 'PASSAGEIRO',
      telefone: document.getElementById('pax-phone').value.trim(),
      endereco: document.getElementById('pax-address').value.trim(),
      lat: parseFloat(document.getElementById('pax-lat').value) || DEFAULT_LAT,
      lng: parseFloat(document.getElementById('pax-lng').value) || DEFAULT_LNG,
      rotaId: document.getElementById('pax-route').value,
      pontoId: document.getElementById('pax-stop').value,
      statusEmbarque: existing ? existing.statusEmbarque : 'VOU',
      foto: state.tempAdminPaxPhoto || (existing ? existing.foto : ''),
      updatedAt: new Date().toISOString()
    };

    const idx = state.db.usuarios.findIndex((u) => u.id === id);
    if (idx >= 0) {
      state.db.usuarios[idx] = record;
    } else {
      state.db.usuarios.push(record);
    }

    saveLocalDb();
    renderAdminKpiCounts();
    renderAdminPassengersList();
    resetAdminPassengerForm();
    showToast(`Funcionário "${record.nome}" salvo com sucesso!`, 'success');

    await callGasApi({
      action: 'upsertEntity',
      sheet: 'Usuarios',
      record
    });
  }

  function resetAdminPassengerForm() {
    document.getElementById('pax-form-title').textContent = 'Cadastrar Funcionário (Passageiro)';
    document.getElementById('pax-id').value = '';
    document.getElementById('pax-name').value = '';
    document.getElementById('pax-phone').value = '';
    document.getElementById('pax-email').value = '';
    document.getElementById('pax-password').value = '';
    document.getElementById('pax-address').value = '';
    document.getElementById('pax-lat').value = DEFAULT_LAT;
    document.getElementById('pax-lng').value = DEFAULT_LNG;
    document.getElementById('pax-lat-display').textContent = DEFAULT_LAT;
    document.getElementById('pax-lng-display').textContent = DEFAULT_LNG;
    document.getElementById('pax-photo-preview').src = './icons/icon.svg';
    state.tempAdminPaxPhoto = '';
  }

  function renderAdminPassengersList() {
    const container = document.getElementById('admin-passengers-list');
    if (!container) return;

    const query = (document.getElementById('search-admin-pax')?.value || '').trim().toLowerCase();
    const list = state.db.usuarios
      .filter((u) => u.perfil === 'PASSAGEIRO')
      .filter((u) => {
        if (!query) return true;
        return (
          String(u.nome).toLowerCase().includes(query) ||
          String(u.email).toLowerCase().includes(query) ||
          String(u.endereco).toLowerCase().includes(query)
        );
      });

    if (list.length === 0) {
      container.innerHTML = `<div class="text-xs text-slate-400 p-4 text-center">Nenhum funcionário encontrado.</div>`;
      return;
    }

    container.innerHTML = list
      .map((u) => {
        const rota = state.db.rotas.find((r) => r.id === u.rotaId);
        const ponto = rota && Array.isArray(rota.pontos) ? rota.pontos.find((p) => p.id === u.pontoId) : null;
        const isGoing = u.statusEmbarque !== 'NAO_VOU';

        return `
          <div class="p-3.5 rounded-xl bg-slate-900/85 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <img src="${u.foto || './icons/icon.svg'}" alt="${u.nome}" class="w-11 h-11 rounded-full object-cover border border-sky-400/40 bg-slate-800 shrink-0" />
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-white">${u.nome}</span>
                  <span class="status-pill ${isGoing ? 'live' : 'idle'}">${isGoing ? 'Vai Embarcar' : 'Não Vai Hoje'}</span>
                </div>
                <div class="text-xs text-slate-400">${u.email} • ${u.telefone || ''}</div>
                <div class="text-[11px] text-sky-400 mt-0.5">
                  ${rota ? rota.nome : 'Sem rota'} ${ponto ? `• ${ponto.nome} (${ponto.horario})` : ''}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button type="button" data-edit-pax="${u.id}" class="btn-secondary !py-1.5 !px-3 text-xs">Editar</button>
              <button type="button" data-del-pax="${u.id}" class="btn-secondary !py-1.5 !px-3 text-xs text-rose-400">Excluir</button>
            </div>
          </div>
        `;
      })
      .join('');

    container.querySelectorAll('[data-edit-pax]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const u = state.db.usuarios.find((item) => item.id === btn.getAttribute('data-edit-pax'));
        if (!u) return;
        document.getElementById('pax-form-title').textContent = `Editando: ${u.nome}`;
        document.getElementById('pax-id').value = u.id;
        document.getElementById('pax-name').value = u.nome || '';
        document.getElementById('pax-phone').value = u.telefone || '';
        document.getElementById('pax-email').value = u.email || '';
        document.getElementById('pax-password').value = u.senha || '';
        document.getElementById('pax-address').value = u.endereco || '';
        document.getElementById('pax-lat').value = u.lat || DEFAULT_LAT;
        document.getElementById('pax-lng').value = u.lng || DEFAULT_LNG;
        document.getElementById('pax-lat-display').textContent = u.lat || DEFAULT_LAT;
        document.getElementById('pax-lng-display').textContent = u.lng || DEFAULT_LNG;
        document.getElementById('pax-route').value = u.rotaId || '';
        updatePaxStopsDropdown(u.rotaId, u.pontoId);
        document.getElementById('pax-photo-preview').src = u.foto || './icons/icon.svg';
        state.tempAdminPaxPhoto = u.foto || '';

        if (state.maps.paxPicker && state.markers.paxPickerMarker) {
          const coords = [Number(u.lng || DEFAULT_LNG), Number(u.lat || DEFAULT_LAT)];
          state.markers.paxPickerMarker.setLngLat(coords);
          state.maps.paxPicker.flyTo({ center: coords, zoom: 15 });
        }
      });
    });

    container.querySelectorAll('[data-del-pax]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-del-pax');
        state.db.usuarios = state.db.usuarios.filter((u) => u.id !== id);
        saveLocalDb();
        renderAdminKpiCounts();
        renderAdminPassengersList();
        showToast('Funcionário excluído.', 'info');
        await callGasApi({ action: 'deleteEntity', sheet: 'Usuarios', id });
      });
    });
  }

  /* --------------------------------------------------------------------------
   * 7.4 CRUD DE ÔNIBUS (FROTA)
   * -------------------------------------------------------------------------- */
  async function handleSaveAdminFleet(event) {
    event.preventDefault();
    const id = document.getElementById('fleet-id').value || `veic_${Date.now()}`;
    const record = {
      id,
      placa: document.getElementById('fleet-plate').value.trim().toUpperCase(),
      prefixo: document.getElementById('fleet-prefix').value.trim(),
      modelo: document.getElementById('fleet-model').value.trim(),
      capacidade: Number(document.getElementById('fleet-capacity').value || 44),
      status: document.getElementById('fleet-status').value,
      updatedAt: new Date().toISOString()
    };

    const idx = state.db.veiculos.findIndex((v) => v.id === id);
    if (idx >= 0) {
      state.db.veiculos[idx] = record;
    } else {
      state.db.veiculos.push(record);
    }

    saveLocalDb();
    renderAdminKpiCounts();
    renderAdminFleetList();
    populateAdminSelectDropdowns();
    resetAdminFleetForm();
    showToast(`Veículo ${record.prefixo} (${record.placa}) salvo!`, 'success');

    await callGasApi({ action: 'upsertEntity', sheet: 'Veiculos', record });
  }

  function resetAdminFleetForm() {
    document.getElementById('fleet-form-title').textContent = 'Cadastrar Ônibus / Veículo';
    document.getElementById('fleet-id').value = '';
    document.getElementById('fleet-plate').value = '';
    document.getElementById('fleet-prefix').value = '';
    document.getElementById('fleet-model').value = '';
    document.getElementById('fleet-capacity').value = '44';
    document.getElementById('fleet-status').value = 'Ativo';
  }

  function renderAdminFleetList() {
    const container = document.getElementById('admin-fleet-list');
    if (!container) return;

    container.innerHTML = state.db.veiculos
      .map((v) => {
        const isActive = v.status === 'Ativo';
        return `
          <div class="p-4 rounded-xl bg-slate-900/85 border border-slate-800 flex flex-col justify-between gap-3">
            <div>
              <div class="flex items-center justify-between">
                <span class="font-mono text-sm font-extrabold text-sky-400">${v.prefixo} • ${v.placa}</span>
                <span class="status-pill ${isActive ? 'live' : 'warning'}">${v.status}</span>
              </div>
              <div class="text-xs font-semibold text-white mt-1.5">${v.modelo}</div>
              <div class="text-xs text-slate-400 mt-1">Capacidade: <strong class="font-mono text-white">${v.capacidade} lugares</strong></div>
            </div>
            <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button type="button" data-edit-fleet="${v.id}" class="btn-secondary !py-1 !px-3 text-xs">Editar</button>
              <button type="button" data-del-fleet="${v.id}" class="btn-secondary !py-1 !px-3 text-xs text-rose-400">Excluir</button>
            </div>
          </div>
        `;
      })
      .join('');

    container.querySelectorAll('[data-edit-fleet]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const v = state.db.veiculos.find((item) => item.id === btn.getAttribute('data-edit-fleet'));
        if (!v) return;
        document.getElementById('fleet-form-title').textContent = `Editando: ${v.prefixo}`;
        document.getElementById('fleet-id').value = v.id;
        document.getElementById('fleet-plate').value = v.placa;
        document.getElementById('fleet-prefix').value = v.prefixo;
        document.getElementById('fleet-model').value = v.modelo;
        document.getElementById('fleet-capacity').value = v.capacidade;
        document.getElementById('fleet-status').value = v.status;
      });
    });

    container.querySelectorAll('[data-del-fleet]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-del-fleet');
        state.db.veiculos = state.db.veiculos.filter((v) => v.id !== id);
        saveLocalDb();
        renderAdminKpiCounts();
        renderAdminFleetList();
        populateAdminSelectDropdowns();
        showToast('Veículo removido da frota.', 'info');
        await callGasApi({ action: 'deleteEntity', sheet: 'Veiculos', id });
      });
    });
  }

  /* --------------------------------------------------------------------------
   * 7.5 CRUD DE MOTORISTAS
   * -------------------------------------------------------------------------- */
  async function handleSaveAdminDriver(event) {
    event.preventDefault();
    const id = document.getElementById('driver-id').value || `mot_${Date.now()}`;
    const record = {
      id,
      nome: document.getElementById('driver-name').value.trim(),
      cpf: document.getElementById('driver-cpf').value.trim(),
      cnh: document.getElementById('driver-cnh').value.trim(),
      telefone: document.getElementById('driver-phone').value.trim(),
      email: document.getElementById('driver-email').value.trim().toLowerCase(),
      senha: document.getElementById('driver-password').value.trim(),
      updatedAt: new Date().toISOString()
    };

    const idx = state.db.motoristas.findIndex((m) => m.id === id);
    if (idx >= 0) {
      state.db.motoristas[idx] = record;
    } else {
      state.db.motoristas.push(record);
    }

    saveLocalDb();
    renderAdminKpiCounts();
    renderAdminDriversList();
    populateAdminSelectDropdowns();
    resetAdminDriverForm();
    showToast(`Motorista "${record.nome}" salvo com acesso liberado!`, 'success');

    await callGasApi({ action: 'upsertEntity', sheet: 'Motoristas', record });
  }

  function resetAdminDriverForm() {
    document.getElementById('driver-form-title').textContent = 'Cadastrar Motorista';
    document.getElementById('driver-id').value = '';
    document.getElementById('driver-name').value = '';
    document.getElementById('driver-cpf').value = '';
    document.getElementById('driver-cnh').value = '';
    document.getElementById('driver-phone').value = '';
    document.getElementById('driver-email').value = '';
    document.getElementById('driver-password').value = '';
  }

  function renderAdminDriversList() {
    const container = document.getElementById('admin-drivers-list');
    if (!container) return;

    container.innerHTML = state.db.motoristas
      .map((m) => {
        const assignedRoute = state.db.rotas.find((r) => r.motoristaId === m.id);
        return `
          <div class="p-4 rounded-xl bg-slate-900/85 border border-slate-800 flex flex-col justify-between gap-3">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-sm font-bold text-white">${m.nome}</span>
                <span class="font-mono text-xs text-amber-400">CNH: ${m.cnh}</span>
              </div>
              <div class="text-xs text-slate-400 mt-1">CPF/Matrícula: <span class="font-mono text-slate-200">${m.cpf}</span> • ${m.telefone}</div>
              <div class="text-xs text-sky-400 mt-1">Login: ${m.email}</div>
              <div class="text-[11px] text-slate-400 mt-1">Rota atual: <strong>${assignedRoute ? assignedRoute.nome : 'Disponível'}</strong></div>
            </div>
            <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button type="button" data-edit-driver="${m.id}" class="btn-secondary !py-1 !px-3 text-xs">Editar</button>
              <button type="button" data-del-driver="${m.id}" class="btn-secondary !py-1 !px-3 text-xs text-rose-400">Excluir</button>
            </div>
          </div>
        `;
      })
      .join('');

    container.querySelectorAll('[data-edit-driver]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const m = state.db.motoristas.find((item) => item.id === btn.getAttribute('data-edit-driver'));
        if (!m) return;
        document.getElementById('driver-form-title').textContent = `Editando: ${m.nome}`;
        document.getElementById('driver-id').value = m.id;
        document.getElementById('driver-name').value = m.nome;
        document.getElementById('driver-cpf').value = m.cpf;
        document.getElementById('driver-cnh').value = m.cnh;
        document.getElementById('driver-phone').value = m.telefone;
        document.getElementById('driver-email').value = m.email;
        document.getElementById('driver-password').value = m.senha;
      });
    });

    container.querySelectorAll('[data-del-driver]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-del-driver');
        state.db.motoristas = state.db.motoristas.filter((m) => m.id !== id);
        saveLocalDb();
        renderAdminKpiCounts();
        renderAdminDriversList();
        populateAdminSelectDropdowns();
        showToast('Motorista removido.', 'info');
        await callGasApi({ action: 'deleteEntity', sheet: 'Motoristas', id });
      });
    });
  }

  /* ==========================================================================
   * 8. MÓDULO 2: TELA DO USUÁRIO / FUNCIONÁRIO (PASSAGEIRO + HAVERSINE)
   * ========================================================================== */
  function getRouteDirectionType(r) {
    if (!r) return 'IDA';
    return r.tipoRota || (String(r.nome || '').toUpperCase().includes('VOLTA') ? 'VOLTA' : 'IDA');
  }

  function startPassengerContinuousGps() {
    if (!('geolocation' in navigator)) return;

    const applyGpsCoords = (pos) => {
      if (!pos || !pos.coords) return;
      const lat = Number(pos.coords.latitude.toFixed(6));
      const lng = Number(pos.coords.longitude.toFixed(6));
      if (isLegacySaoPauloCoord(lat, lng)) return;

      const prevLat = state.passengerGps.lat;
      const prevLng = state.passengerGps.lng;
      const movedMeters = calculateHaversineMeters(prevLat, prevLng, lat, lng);

      state.passengerGps.lat = lat;
      state.passengerGps.lng = lng;
      state.passengerGps.accuracy = pos.coords.accuracy || 15;
      state.passengerGps.hasRealGpsFix = true;

      // Atualiza marcador da posição real do usuário imediatamente
      if (state.markers.passengerSelf) {
        state.markers.passengerSelf.setLngLat([lng, lat]);
      }

      if (movedMeters >= 3 || !prevLat) {
        renderPassengerLiveView();
      }
    };

    navigator.geolocation.getCurrentPosition(
      applyGpsCoords,
      () => {
        renderPassengerLiveView();
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 }
    );

    if (state.passengerGps.watchId !== null) {
      navigator.geolocation.clearWatch(state.passengerGps.watchId);
    }

    state.passengerGps.watchId = navigator.geolocation.watchPosition(
      applyGpsCoords,
      (err) => {
        console.warn('Aviso GPS contínuo do passageiro:', err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000
      }
    );
  }

  async function initPassengerModule() {
    // Atualiza referência do usuário a partir do banco
    const freshUser = state.db.usuarios.find((u) => u.id === state.currentUser.id) || state.currentUser;
    state.currentUser = freshUser;

    // Define localização inicial como a residência cadastrada até o GPS real do celular responder
    if (
      !state.passengerGps.hasRealGpsFix &&
      freshUser.lat &&
      freshUser.lng &&
      !isLegacySaoPauloCoord(freshUser.lat, freshUser.lng)
    ) {
      state.passengerGps.lat = Number(freshUser.lat);
      state.passengerGps.lng = Number(freshUser.lng);
    }

    // Se houver uma rota aberta no momento (IDA ou VOLTA), sincroniza o modo inicial com ela
    const openRoute = (state.db.rotas || []).find((r) => r.status === 'EM_ANDAMENTO');
    if (openRoute) {
      state.passengerShiftMode = getRouteDirectionType(openRoute);
    } else if (!state.passengerShiftMode) {
      state.passengerShiftMode = 'IDA';
    }

    // Inicia captura contínua de GPS em tempo real (watchPosition com maximumAge: 0)
    startPassengerContinuousGps();

    setTimeout(() => {
      initPassengerLiveMap();
      renderPassengerLiveView();
    }, 60);
  }

  function setPassengerShiftMode(mode) {
    state.passengerShiftMode = mode === 'VOLTA' ? 'VOLTA' : 'IDA';
    renderPassengerLiveView();
  }

  /**
   * Salva a escolha do usuário:
   * - Na IDA: Rota de IDA (`rotaIdaId` / `rotaId`) + Ponto onde SOBE (`pontoIdaId` / `pontoId`)
   * - Na VOLTA: Rota de VOLTA (`rotaVoltaId`) + Ponto onde DESCE (`pontoVoltaId`)
   */
  async function savePassengerStopChoice(mode, routeId, stopId) {
    if (!state.currentUser) return;
    const isVolta = mode === 'VOLTA';
    const routeObj = (state.db.rotas || []).find((r) => r.id === routeId);
    const stopObj = routeObj ? getBoardingStopsOnly(routeObj).find((p) => p.id === stopId) : null;

    const idx = state.db.usuarios.findIndex((u) => u.id === state.currentUser.id);
    if (idx < 0) return;

    const user = state.db.usuarios[idx];
    if (isVolta) {
      user.rotaVoltaId = routeId;
      user.pontoVoltaId = stopId;
      state.passengerSelectedRouteVolta = routeId;
    } else {
      user.rotaIdaId = routeId;
      user.pontoIdaId = stopId;
      user.rotaId = routeId;
      user.pontoId = stopId;
      state.passengerSelectedRouteIda = routeId;
    }
    user.updatedAt = new Date().toISOString();

    state.db.usuarios[idx] = user;
    state.currentUser = user;
    saveLocalDb();
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));

    renderPassengerLiveView();

    if (isVolta) {
      showToast(
        `Ponto de DESCIDA (Volta) salvo: ${stopObj ? stopObj.nome : 'Selecionado'}!`,
        'success'
      );
    } else {
      showToast(
        `Ponto de SUBIDA (Ida) salvo: ${stopObj ? stopObj.nome : 'Selecionado'}!`,
        'success'
      );
    }

    // Foca suavemente no ponto escolhido no mapa
    if (stopObj && state.maps.passengerLive) {
      state.maps.passengerLive.flyTo({
        center: [Number(stopObj.lng), Number(stopObj.lat)],
        zoom: 15.6,
        duration: 750
      });
    }

    await callGasApi({
      action: 'updatePassengerProfile',
      user
    });
  }

  function initPassengerLiveMap() {
    if (state.maps.passengerLive) {
      state.maps.passengerLive.resize();
      ensureSatelliteLayerOnMap(state.maps.passengerLive, 'pax-route-line');
      return;
    }

    const map = new maplibregl.Map({
      container: 'map-passenger-live',
      style: VECTOR_MAP_STYLE,
      center: [state.passengerGps.lng, state.passengerGps.lat],
      zoom: 13.8,
      pitch: 30,
      antialias: true
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    map.on('load', () => {
      // Fonte de Polylines de Múltiplas Rotas (FeatureCollection com cor por rota)
      map.addSource('pax-route-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.addLayer({
        id: 'pax-route-line',
        type: 'line',
        source: 'pax-route-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#0ea5e9'],
          'line-width': ['coalesce', ['get', 'width'], 4.5],
          'line-opacity': ['coalesce', ['get', 'opacity'], 0.9]
        }
      });

      // Fonte da Linha Pontilhada Verde até o Ponto Selecionado / Mais Próximo
      map.addSource('pax-nearest-dotted-source', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
      });

      map.addLayer({
        id: 'pax-nearest-dotted-layer',
        type: 'line',
        source: 'pax-nearest-dotted-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#10b981',
          'line-width': 3.5,
          'line-dasharray': [2, 2]
        }
      });

      ensureSatelliteLayerOnMap(map, 'pax-route-line');
      renderPassengerLiveView();
    });

    state.maps.passengerLive = map;
  }

  /** Navegação por abas do passageiro: mapa | ponto | horarios | perfil */
  function setPaxTab(name) {
    const tab = ['mapa', 'ponto', 'horarios', 'perfil'].includes(name) ? name : 'mapa';
    state.paxTab = tab;
    document.querySelectorAll('[data-pax-panel]').forEach((el) => {
      el.classList.toggle('hidden', el.getAttribute('data-pax-panel') !== tab);
    });
    document.getElementById('pax-tab-profile')?.classList.toggle('hidden', tab !== 'perfil');
    document.querySelectorAll('[data-pax-tab]').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-pax-tab') === tab);
    });
    if (tab === 'perfil') openPassengerSelfProfileModal();
    if (tab === 'mapa') {
      setTimeout(() => {
        if (state.maps.passengerLive) state.maps.passengerLive.resize();
      }, 60);
    }
    window.scrollTo({ top: 0 });
  }

  /** Navegação por abas do motorista: mapa | paradas | passageiros */
  function setDriverTab(name) {
    const tab = ['mapa', 'paradas', 'passageiros'].includes(name) ? name : 'mapa';
    state.driverTab = tab;
    document.querySelectorAll('[data-driver-panel]').forEach((el) => {
      el.classList.toggle('hidden', el.getAttribute('data-driver-panel') !== tab);
    });
    document.querySelectorAll('[data-driver-tab]').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-driver-tab') === tab);
    });
    if (tab === 'mapa') {
      setTimeout(() => {
        if (state.maps.driver3d) state.maps.driver3d.resize();
      }, 60);
    }
  }

  /**
   * Calcula o ETA de cada parada a partir da posição real do ônibus, medindo a distância
   * ao longo do trajeto (polyline). Retorna { [stopId]: { passed, minutes, label } }.
   */
  const etaProgress = {};
  const etaSpeed = {};
  function computeStopEtas(route, stops, tel) {
    const out = {};
    if (!route || !tel || !stops || stops.length === 0) return out;
    const busLat = Number(tel.lat);
    const busLng = Number(tel.lng);
    if (!isFinite(busLat) || !isFinite(busLng)) return out;

    let poly = Array.isArray(route.polyline) && route.polyline.length > 1 ? route.polyline : null;
    if (!poly) poly = stops.map((s) => [Number(s.lng), Number(s.lat)]);
    const cum = [0];
    for (let i = 1; i < poly.length; i++) {
      cum.push(cum[i - 1] + calculateHaversineMeters(poly[i - 1][1], poly[i - 1][0], poly[i][1], poly[i][0]));
    }
    const nearestIdx = (lat, lng, from) => {
      let best = from;
      let bd = Infinity;
      for (let i = from; i < poly.length; i++) {
        const d = calculateHaversineMeters(lat, lng, poly[i][1], poly[i][0]);
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      return best;
    };

    // Posição do ônibus no trajeto (nunca retrocede mais que alguns pontos)
    const prev = etaProgress[route.id] || 0;
    let busIdx = nearestIdx(busLat, busLng, Math.max(0, prev - 8));
    etaProgress[route.id] = busIdx;
    const busCum = cum[busIdx];

    // Velocidade média suavizada (km/h), com mínimo para não divergir quando parado
    const cur = Number(tel.velocidade || 0);
    const prevSpd = etaSpeed[route.id] || 30;
    const smooth = cur > 3 ? prevSpd * 0.7 + cur * 0.3 : prevSpd;
    etaSpeed[route.id] = smooth;
    const mps = Math.min(60, Math.max(20, smooth)) / 3.6;

    const now = Date.now();
    let from = 0;
    let ahead = 0;
    stops.forEach((s) => {
      const idx = nearestIdx(Number(s.lat), Number(s.lng), from);
      from = idx;
      const distAlong = cum[idx] - busCum;
      if (distAlong < -30) {
        out[s.id] = { passed: true };
        return;
      }
      const secs = Math.max(0, distAlong) / mps + ahead * 30;
      ahead += 1;
      const d = new Date(now + secs * 1000);
      out[s.id] = {
        passed: false,
        minutes: Math.max(0, Math.round(secs / 60)),
        label: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      };
    });
    return out;
  }

  function renderPassengerLiveView() {
    if (!state.currentUser) return;
    const user = state.db.usuarios.find((u) => u.id === state.currentUser.id) || state.currentUser;
    const allRoutes = state.db.rotas || [];

    const userLat = Number(state.passengerGps.lat || user.lat || DEFAULT_LAT);
    const userLng = Number(state.passengerGps.lng || user.lng || DEFAULT_LNG);

    // Destaca botão de status de embarque atual ("Vou utilizar hoje" vs "Não vou utilizar hoje")
    const isGoing = user.statusEmbarque !== 'NAO_VOU';
    const btnGoing = document.getElementById('btn-pax-status-going');
    const btnSkip = document.getElementById('btn-pax-status-skip');
    if (btnGoing && btnSkip) {
      btnGoing.classList.toggle('ring-2', isGoing);
      btnGoing.classList.toggle('ring-emerald-300', isGoing);
      btnSkip.classList.toggle('ring-2', !isGoing);
      btnSkip.classList.toggle('ring-rose-400', !isGoing);
    }

    const mode = state.passengerShiftMode === 'VOLTA' ? 'VOLTA' : 'IDA';
    const isVolta = mode === 'VOLTA';

    // Atualiza estilo dos botões de alternância IDA vs VOLTA
    const btnModeIda = document.getElementById('btn-pax-mode-ida');
    const btnModeVolta = document.getElementById('btn-pax-mode-volta');
    const voltaNoticeBanner = document.getElementById('pax-volta-notice-banner');
    const labelSelectRoute = document.getElementById('label-pax-select-route');
    const labelSelectStop = document.getElementById('label-pax-select-stop');
    const labelConfirmStop = document.getElementById('label-pax-confirm-stop');
    const headerDirLabel = document.getElementById('pax-header-direction-label');
    const cardStopLabel = document.getElementById('pax-card-stop-label');
    const timelineHeading = document.getElementById('pax-timeline-heading');

    if (btnModeIda && btnModeVolta) {
      btnModeIda.className = !isVolta
        ? 'px-3 py-2 rounded-lg text-xs font-extrabold bg-sky-500/20 text-sky-300 border border-sky-500/40 transition flex items-center justify-center gap-1.5 shadow'
        : 'px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5';
      btnModeVolta.className = isVolta
        ? 'px-3 py-2 rounded-lg text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 transition flex items-center justify-center gap-1.5 shadow'
        : 'px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5';
    }

    if (voltaNoticeBanner) {
      voltaNoticeBanner.classList.toggle('hidden', !isVolta);
    }

    if (labelSelectRoute) {
      labelSelectRoute.textContent = isVolta ? '1. Escolher Rota de VOLTA' : '1. Escolher Rota de IDA';
      labelSelectRoute.className = `block text-xs font-bold mb-1 ${isVolta ? 'text-amber-300' : 'text-sky-300'}`;
    }
    if (labelSelectStop) {
      labelSelectStop.textContent = isVolta
        ? '2. Selecionar Ponto onde você DESCE (Desembarque)'
        : '2. Selecionar Ponto onde você SOBE (Embarque)';
    }
    if (labelConfirmStop) {
      labelConfirmStop.textContent = isVolta ? 'Salvar Descida' : 'Salvar Subida';
    }
    if (headerDirLabel) {
      headerDirLabel.textContent = isVolta
        ? 'Turno de VOLTA — Embarque Único (Escolha onde Desce)'
        : 'Turno de IDA — Escolha a Rota e o Ponto onde Sobe';
      headerDirLabel.className = `text-xs uppercase tracking-wider font-mono ${
        isVolta ? 'text-amber-400' : 'text-sky-400'
      }`;
    }
    if (cardStopLabel) {
      cardStopLabel.innerHTML = isVolta
        ? '<i data-lucide="log-out" class="w-3.5 h-3.5"></i><span>Meu Ponto de Descida (Onde você DESCE)</span>'
        : '<i data-lucide="log-in" class="w-3.5 h-3.5"></i><span>Meu Ponto de Subida (Onde você SOBE)</span>';
    }
    if (timelineHeading) {
      timelineHeading.textContent = isVolta
        ? 'Paradas da Rota de VOLTA — Toque no ponto onde você DESCE'
        : 'Paradas da Rota de IDA — Toque no ponto onde você SOBE';
    }

    // Filtra rotas do turno selecionado (IDA ou VOLTA); caso só exista 1 rota cadastrada no sistema todo, exibe ela como fallback
    let modeRoutes = allRoutes.filter((r) => getRouteDirectionType(r) === mode);
    if (modeRoutes.length === 0) {
      modeRoutes = allRoutes;
    }

    // Determina a rota selecionada pelo usuário para este turno (priorizando rota aberta do mesmo turno ou a salva no perfil)
    const savedRouteId = isVolta
      ? state.passengerSelectedRouteVolta || user.rotaVoltaId
      : state.passengerSelectedRouteIda || user.rotaIdaId || user.rotaId;

    const openModeRoute = modeRoutes.find((r) => r.status === 'EM_ANDAMENTO');
    const selectedRoute =
      modeRoutes.find((r) => r.id === savedRouteId) ||
      openModeRoute ||
      modeRoutes[0] ||
      allRoutes[0];

    const cardsContainer = document.getElementById('pax-routes-cards-container');
    const timelineEl = document.getElementById('pax-stops-timeline');
    const routeSelectEl = document.getElementById('pax-select-route');
    const stopSelectEl = document.getElementById('pax-select-stop');
    const map = state.maps.passengerLive;

    if (!selectedRoute) {
      return;
    }

    if (isVolta) {
      state.passengerSelectedRouteVolta = selectedRoute.id;
    } else {
      state.passengerSelectedRouteIda = selectedRoute.id;
    }

    // Popula Select de Rotas do Turno (IDA ou VOLTA)
    if (routeSelectEl) {
      routeSelectEl.innerHTML = modeRoutes
        .map((r) => {
          const isOpen = r.status === 'EM_ANDAMENTO';
          const badge = isOpen ? '🟢 ABERTA AO VIVO' : '⚪ Programada';
          return `<option value="${r.id}" ${r.id === selectedRoute.id ? 'selected' : ''}>[${mode}] ${r.nome} — ${badge}</option>`;
        })
        .join('');
    }

    // Calcula distância Haversine de todas as paradas da rota selecionada
    const routeColor = isVolta ? '#f59e0b' : '#0ea5e9';
    const rawStops = getBoardingStopsOnly(selectedRoute);
    let nearestStop = null;
    let minDist = Infinity;

    const stopsWithDist = rawStops.map((pt, idx) => {
      const dist = calculateHaversineMeters(userLat, userLng, Number(pt.lat), Number(pt.lng));
      const item = {
        ...pt,
        index: idx + 1,
        distMeters: dist,
        routeId: selectedRoute.id,
        routeName: selectedRoute.nome,
        routeSentido: mode,
        routeColor
      };
      if (dist < minDist) {
        minDist = dist;
        nearestStop = item;
      }
      return item;
    });

    // Verifica qual parada o usuário escolheu como Ponto de Subida (IDA) ou Ponto de Descida (VOLTA)
    const savedStopId = isVolta ? user.pontoVoltaId : user.pontoIdaId || user.pontoId;
    const chosenStop =
      stopsWithDist.find((pt) => pt.id === savedStopId) || nearestStop || stopsWithDist[0] || null;

    // Popula Select de Paradas (Subida na IDA / Descida na VOLTA)
    if (stopSelectEl) {
      stopSelectEl.innerHTML =
        stopsWithDist
          .map((pt) => {
            const distText =
              pt.distMeters >= 1000
                ? `${(pt.distMeters / 1000).toFixed(2)} km`
                : `${pt.distMeters} m`;
            const isNearTag = nearestStop && nearestStop.id === pt.id ? ' ★ Mais próximo' : '';
            const actionLabel = isVolta ? 'Descer em' : 'Subir em';
            return `<option value="${pt.id}" ${
              chosenStop && chosenStop.id === pt.id ? 'selected' : ''
            }>P${pt.index} • ${actionLabel}: ${pt.nome} (${pt.horario}) — a ${distText}${isNearTag}</option>`;
          })
          .join('') || '<option value="">Sem paradas cadastradas</option>';
    }

    // Renderiza Cards das Rotas deste Turno (IDA ou VOLTA)
    if (cardsContainer) {
      cardsContainer.innerHTML = modeRoutes
        .map((r) => {
          const isSelected = r.id === selectedRoute.id;
          const isOpen = r.status === 'EM_ANDAMENTO';
          const rStops = getBoardingStopsOnly(r);
          let rNearest = null;
          let rMin = Infinity;
          rStops.forEach((pt) => {
            const d = calculateHaversineMeters(userLat, userLng, Number(pt.lat), Number(pt.lng));
            if (d < rMin) {
              rMin = d;
              rNearest = { ...pt, distMeters: d };
            }
          });
          const distText = rNearest
            ? rNearest.distMeters >= 1000
              ? `${(rNearest.distMeters / 1000).toFixed(2)} km`
              : `${rNearest.distMeters} m`
            : '--';

          return `
            <button type="button" data-pax-choose-route="${r.id}" class="${
              modeRoutes.length === 1 ? 'col-span-full' : ''
            } p-3 rounded-xl border text-left transition ${
              isSelected
                ? isVolta
                  ? 'bg-amber-500/15 border-amber-400 text-white shadow-md'
                  : 'bg-sky-500/15 border-sky-400 text-white shadow-md'
                : 'bg-slate-900/75 border-slate-800 text-slate-300 hover:border-slate-700'
            }">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-extrabold text-white truncate flex items-center gap-1.5">
                  <span class="px-2 py-0.5 rounded text-[10px] font-extrabold font-mono ${
                    isVolta
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  }">${mode}</span>
                  <span>${r.nome}</span>
                </span>
                <span class="status-pill ${isOpen ? 'live' : 'idle'} !text-[10px]">${
                  isOpen ? 'ABERTA AO VIVO' : 'PROGRAMADA'
                }</span>
              </div>
              <div class="text-xs text-emerald-400 font-semibold mt-1.5 truncate">
                ★ Ponto mais próximo: ${rNearest ? rNearest.nome : 'Sem paradas'} (${distText})
              </div>
              <div class="text-[11px] text-slate-300 mt-0.5">
                ${
                  isVolta
                    ? 'Turno de Volta: Todos sobem no mesmo local • Toque p/ escolher onde desce'
                    : `Horário previsto: <strong class="text-emerald-300 font-mono">${
                        rNearest ? rNearest.horario : '--:--'
                      }</strong>`
                }
              </div>
            </button>
          `;
        })
        .join('');

      cardsContainer.querySelectorAll('[data-pax-choose-route]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const rId = btn.getAttribute('data-pax-choose-route');
          if (isVolta) {
            state.passengerSelectedRouteVolta = rId;
          } else {
            state.passengerSelectedRouteIda = rId;
          }
          renderPassengerLiveView();
        });
      });
    }

    const isRouteOpen = selectedRoute.status === 'EM_ANDAMENTO';
    const veh = state.db.veiculos.find((v) => v.id === selectedRoute.veiculoId);
    const drv = state.db.motoristas.find((m) => m.id === selectedRoute.motoristaId);
    const tel = state.db.telemetria.find((t) => t.rotaId === selectedRoute.id) || {
      lat: selectedRoute.pontos[0]?.lat || DEFAULT_LAT,
      lng: selectedRoute.pontos[0]?.lng || DEFAULT_LNG,
      velocidade: isRouteOpen ? 34 : 0,
      heading: 0,
      statusRota: selectedRoute.status
    };

    // Cabeçalho da Rota do Passageiro (Regra: Turno de VOLTA não mostra qual ônibus subir, pois todos sobem no mesmo local)
    document.getElementById('pax-live-route-name').textContent = `[${mode}] ${selectedRoute.nome}`;
    if (isVolta) {
      document.getElementById('pax-live-vehicle-info').textContent = `Turno de Volta: Todos sobem no mesmo ponto de saída • Seu ponto de descida: ${
        chosenStop ? chosenStop.nome : 'Selecione abaixo'
      }`;
    } else {
      document.getElementById('pax-live-vehicle-info').textContent = `${
        veh ? `${veh.prefixo} (${veh.placa})` : 'Ônibus da Rota'
      } • Motorista: ${drv ? drv.nome : '—'} • Subida: ${
        chosenStop ? chosenStop.nome : 'Selecione abaixo'
      }`;
    }

    const statusBadge = document.getElementById('pax-live-route-status');
    if (isRouteOpen) {
      statusBadge.textContent = `ROTA DE ${mode} ABERTA AO VIVO`;
      statusBadge.className = 'status-pill live';
    } else {
      statusBadge.textContent = `ROTA DE ${mode} (ESCOLHA SEU PONTO)`;
      statusBadge.className = 'status-pill warning';
    }

    // Atualiza Card do Ponto Escolhido (Onde Sobe na IDA / Onde Desce na VOLTA)
    const suggestionEl = document.getElementById('pax-nearest-suggestion');
    if (chosenStop) {
      const isUserSaved = savedStopId && chosenStop.id === savedStopId;
      document.getElementById('pax-nearest-name').textContent = `${chosenStop.nome}`;
      const chosenEta = paxEta[chosenStop.id];
      document.getElementById('pax-nearest-eta').textContent = chosenEta
        ? chosenEta.passed
          ? 'Ônibus já passou'
          : `Chega ~${chosenEta.label} (${chosenEta.minutes} min)`
        : `${isVolta ? 'Descida' : 'Subida'} ${chosenStop.horario}`;
      document.getElementById('pax-nearest-distance').textContent =
        chosenStop.distMeters >= 1000
          ? `${(chosenStop.distMeters / 1000).toFixed(2)} km`
          : `${chosenStop.distMeters} m`;

      if (suggestionEl) {
        if (nearestStop && nearestStop.id !== chosenStop.id) {
          suggestionEl.textContent = `Dica GPS: O ponto mais próximo de você agora é "${nearestStop.nome}" (${nearestStop.distMeters} m).`;
        } else if (isUserSaved) {
          suggestionEl.textContent = isVolta
            ? '✓ Ponto de DESCIDA confirmado por você para a rota de Volta.'
            : '✓ Ponto de SUBIDA confirmado por você para a rota de Ida.';
        } else {
          suggestionEl.textContent = '★ Sugerido automaticamente pelo seu GPS (toque em Salvar para fixar).';
        }
      }
    }
    document.getElementById('pax-bus-speed').textContent = `${
      isRouteOpen ? Math.round(Number(tel.velocidade || 0)) : 0
    } km/h`;

    // Renderiza Timeline clicável para o usuário escolher onde SOBE (Ida) ou onde DESCE (Volta)
    if (timelineEl) {
      timelineEl.innerHTML = stopsWithDist
        .map((pt) => {
          const isChosen = chosenStop && chosenStop.id === pt.id;
          const isNearest = nearestStop && nearestStop.id === pt.id;
          const actionBtnText = isVolta
            ? isChosen
              ? '✓ Meu Ponto de Descida'
              : 'Descer Aqui'
            : isChosen
            ? '✓ Meu Ponto de Subida'
            : 'Subir Aqui';

          return `
            <div data-pax-pick-stop="${pt.id}" class="p-3 rounded-xl border transition cursor-pointer ${
              isChosen
                ? 'bg-emerald-950/50 border-emerald-400 shadow-md'
                : 'bg-slate-900/75 border-slate-800 hover:border-sky-500/40'
            } flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="w-6 h-6 rounded-full ${
                  isChosen ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-white'
                } text-xs font-bold font-mono flex items-center justify-center shrink-0" style="${
                  !isChosen ? `border: 2px solid ${pt.routeColor}` : ''
                }">${pt.index}</span>
                <div class="min-w-0">
                  <div class="text-xs font-bold text-white flex flex-wrap items-center gap-1.5">
                    <span class="truncate">${pt.nome}</span>
                    ${
                      isChosen
                        ? `<span class="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/25 text-emerald-300 font-extrabold">${
                            isVolta ? 'ONDE DESÇO' : 'ONDE SUBO'
                          }</span>`
                        : ''
                    }
                    ${
                      isNearest
                        ? '<span class="px-1.5 py-0.5 text-[10px] rounded bg-sky-500/20 text-sky-300 font-bold">★ MAIS PRÓXIMO</span>'
                        : ''
                    }
                  </div>
                  <div class="text-[11px] text-slate-400 mt-0.5">
                    Distância até você: <strong class="font-mono text-slate-200">${
                      pt.distMeters >= 1000 ? `${(pt.distMeters / 1000).toFixed(2)} km` : `${pt.distMeters} m`
                    }</strong> • ${
                      paxEta[pt.id]
                        ? paxEta[pt.id].passed
                          ? '<strong class="font-mono text-slate-500">Ônibus já passou</strong>'
                          : `Chega ~<strong class="font-mono text-emerald-300">${paxEta[pt.id].label}</strong> (${paxEta[pt.id].minutes} min) <span class="text-slate-500">prog. ${pt.horario}</span>`
                        : `Previsto <strong class="font-mono text-sky-300">${pt.horario}</strong>`
                    }
                  </div>
                </div>
              </div>
              <button type="button" class="px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold shrink-0 transition ${
                isChosen
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-sky-300 border border-slate-700 hover:border-sky-400'
              }">
                ${actionBtnText}
              </button>
            </div>
          `;
        })
        .join('');

      timelineEl.querySelectorAll('[data-pax-pick-stop]').forEach((row) => {
        row.addEventListener('click', () => {
          const stopId = row.getAttribute('data-pax-pick-stop');
          savePassengerStopChoice(mode, selectedRoute.id, stopId);
        });
      });
    }

    refreshIcons();

    // Atualiza Mapa ao Vivo do Passageiro
    if (!map || !map.getSource('pax-route-source')) return;

    map.getSource('pax-route-source').setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            color: routeColor,
            width: 5,
            opacity: 0.94
          },
          geometry: {
            type: 'LineString',
            coordinates: selectedRoute.polyline || []
          }
        }
      ]
    });

    if (chosenStop) {
      map.getSource('pax-nearest-dotted-source').setData({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [userLng, userLat],
            [Number(chosenStop.lng), Number(chosenStop.lat)]
          ]
        }
      });
    }

    // Limpa marcadores anteriores dos pontos
    state.markers.passengerStops.forEach((m) => m.remove());
    state.markers.passengerStops = [];

    stopsWithDist.forEach((pt) => {
      const isChosen = chosenStop && chosenStop.id === pt.id;
      const isNearest = nearestStop && nearestStop.id === pt.id;
      const badgeTitle = isChosen
        ? isVolta
          ? '★ ONDE DESÇO'
          : '★ ONDE SUBO'
        : isNearest
        ? '★ MAIS PRÓXIMO'
        : `P${pt.index}`;

      const el = document.createElement('div');
      el.className = `cymi-stop-marker ${isChosen ? 'is-nearest' : ''}`;
      el.innerHTML = `
        <div class="cymi-stop-badge" style="${!isChosen ? `border-color:${pt.routeColor}` : ''}">
          <span>${badgeTitle}</span>
          <span class="font-mono">${pt.horario}</span>
        </div>
        <div class="cymi-stop-pin" style="${!isChosen ? `background:${pt.routeColor}` : ''}"></div>
      `;

      const popupContent = document.createElement('div');
      popupContent.className = 'text-xs space-y-1';
      popupContent.innerHTML = `
        <div class="font-bold text-[11px]" style="color:${pt.routeColor}">[${pt.routeSentido}] ${pt.routeName}</div>
        <div class="font-bold ${isChosen ? 'text-emerald-400' : 'text-white'}">${pt.nome}</div>
        <div class="text-slate-300">Horário previsto: <strong class="font-mono">${pt.horario}</strong></div>
        <div class="text-slate-300">Distância de você: <strong class="font-mono">${pt.distMeters} m</strong></div>
        <button type="button" class="mt-1.5 w-full py-1 px-2 rounded bg-emerald-500 text-slate-950 font-extrabold text-[11px]">
          ${isVolta ? 'Escolher como Ponto de Descida' : 'Escolher como Ponto de Subida'}
        </button>
      `;

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([Number(pt.lng), Number(pt.lat)])
        .setPopup(new maplibregl.Popup({ offset: 18 }).setDOMContent(popupContent))
        .addTo(map);

      popupContent.querySelector('button')?.addEventListener('click', () => {
        savePassengerStopChoice(mode, selectedRoute.id, pt.id);
        marker.togglePopup();
      });

      state.markers.passengerStops.push(marker);
    });

    // Marcador da própria localização do passageiro (em tempo real via watchPosition)
    if (state.markers.passengerSelf) state.markers.passengerSelf.remove();
    const selfEl = document.createElement('div');
    selfEl.className = 'cymi-user-marker';
    selfEl.innerHTML = user.foto ? `<img src="${user.foto}" alt="Eu" />` : '<span>EU</span>';
    state.markers.passengerSelf = new maplibregl.Marker({ element: selfEl })
      .setLngLat([userLng, userLat])
      .setPopup(
        new maplibregl.Popup({ offset: 14 }).setHTML(
          `<div class="text-xs font-bold">Sua Localização GPS (${
            state.passengerGps.hasRealGpsFix ? 'Ao Vivo' : 'Residência'
          })</div>`
        )
      )
      .addTo(map);

    // Marcador do Ônibus em Tempo Real (com as coordenadas reais da telemetria da rota selecionada/aberta)
    if (state.markers.passengerBus) {
      state.markers.passengerBus.remove();
      state.markers.passengerBus = null;
    }
    if (Array.isArray(state.markers.passengerBuses)) {
      state.markers.passengerBuses.forEach((m) => m.remove());
    }
    state.markers.passengerBuses = [];

    const busLat = Number(tel.lat || selectedRoute.pontos[0]?.lat || DEFAULT_LAT);
    const busLng = Number(tel.lng || selectedRoute.pontos[0]?.lng || DEFAULT_LNG);

    const busEl = document.createElement('div');
    busEl.className = 'cymi-bus-marker';
    busEl.innerHTML = `
      <div class="cymi-bus-pulse"></div>
      <div class="cymi-bus-marker-inner" style="border-color:${routeColor}">🚌</div>
    `;
    const busPopupTitle = isVolta
      ? `Ônibus da Rota de Volta (${mode})`
      : `${veh ? veh.prefixo : 'Ônibus da Rota'} (${mode})`;

    const busMarker = new maplibregl.Marker({ element: busEl })
      .setLngLat([busLng, busLat])
      .setPopup(
        new maplibregl.Popup({ offset: 18 }).setHTML(`
          <div class="text-xs">
            <div class="font-bold" style="color:${routeColor}">${busPopupTitle}</div>
            <div class="text-white font-semibold">${selectedRoute.nome}</div>
            <div class="font-mono text-emerald-400 mt-1">${
              isRouteOpen ? `${Math.round(Number(tel.velocidade || 0))} km/h • GPS Ao Vivo` : 'Aguardando saída'
            }</div>
          </div>
        `)
      )
      .addTo(map);
    state.markers.passengerBuses.push(busMarker);
  }

  async function updatePassengerBoardingStatus(newStatus) {
    if (!state.currentUser) return;
    const idx = state.db.usuarios.findIndex((u) => u.id === state.currentUser.id);
    if (idx >= 0) {
      state.db.usuarios[idx].statusEmbarque = newStatus;
      state.db.usuarios[idx].lat = state.passengerGps.lat;
      state.db.usuarios[idx].lng = state.passengerGps.lng;
      state.currentUser = state.db.usuarios[idx];
      saveLocalDb();
    }

    renderPassengerLiveView();

    if (newStatus === 'VOU') {
      showToast('Confirmado! O motorista foi avisado que você VAI embarcar hoje.', 'success');
    } else {
      showToast('Registrado! O motorista foi avisado que você NÃO utilizará o transporte hoje.', 'warning');
    }

    await callGasApi({
      action: 'updatePassengerStatus',
      userId: state.currentUser.id,
      statusEmbarque: newStatus,
      lat: state.passengerGps.lat,
      lng: state.passengerGps.lng
    });
  }

  function openPassengerSelfProfileModal() {
    const user = state.db.usuarios.find((u) => u.id === state.currentUser.id) || state.currentUser;
    document.getElementById('self-pax-name').value = user.nome || '';
    document.getElementById('self-pax-phone').value = user.telefone || '';
    document.getElementById('self-pax-address').value = user.endereco || '';
    document.getElementById('self-pax-password').value = user.senha || '';
    document.getElementById('self-pax-lat').value = user.lat || DEFAULT_LAT;
    document.getElementById('self-pax-lng').value = user.lng || DEFAULT_LNG;
    document.getElementById('self-pax-lat-label').textContent = user.lat || DEFAULT_LAT;
    document.getElementById('self-pax-lng-label').textContent = user.lng || DEFAULT_LNG;
    document.getElementById('self-pax-photo-preview').src = user.foto || './icons/icon.svg';
    state.tempSelfPaxPhoto = user.foto || '';

    setTimeout(() => {
      const lat = parseFloat(document.getElementById('self-pax-lat').value) || DEFAULT_LAT;
      const lng = parseFloat(document.getElementById('self-pax-lng').value) || DEFAULT_LNG;

      if (!state.maps.selfPaxHome) {
        const map = new maplibregl.Map({
          container: 'map-self-pax-home',
          style: VECTOR_MAP_STYLE,
          center: [lng, lat],
          zoom: 14.5
        });

        map.on('load', () => {
          ensureSatelliteLayerOnMap(map);
        });

        const marker = new maplibregl.Marker({ color: '#0ea5e9', draggable: true })
          .setLngLat([lng, lat])
          .addTo(map);

        const setCoords = async (lngLat) => {
          const la = Number(lngLat.lat.toFixed(6));
          const ln = Number(lngLat.lng.toFixed(6));
          document.getElementById('self-pax-lat').value = la;
          document.getElementById('self-pax-lng').value = ln;
          document.getElementById('self-pax-lat-label').textContent = la;
          document.getElementById('self-pax-lng-label').textContent = ln;

          const addrEl = document.getElementById('self-pax-address');
          if (addrEl) {
            const revAddr = await reverseGeocodeCoords(la, ln);
            if (revAddr) {
              addrEl.value = revAddr;
            }
          }
        };

        marker.on('dragend', () => setCoords(marker.getLngLat()));
        map.on('click', (e) => {
          marker.setLngLat(e.lngLat);
          setCoords(e.lngLat);
        });

        state.maps.selfPaxHome = map;
        state.markers.selfHomeMarker = marker;
      } else {
        state.maps.selfPaxHome.resize();
        ensureSatelliteLayerOnMap(state.maps.selfPaxHome);
        state.markers.selfHomeMarker.setLngLat([lng, lat]);
        state.maps.selfPaxHome.setCenter([lng, lat]);
      }
    }, 60);
  }

  async function handleSavePassengerSelfProfile(event) {
    event.preventDefault();
    const idx = state.db.usuarios.findIndex((u) => u.id === state.currentUser.id);
    if (idx < 0) return;

    const updated = {
      ...state.db.usuarios[idx],
      nome: document.getElementById('self-pax-name').value.trim(),
      telefone: document.getElementById('self-pax-phone').value.trim(),
      endereco: document.getElementById('self-pax-address').value.trim(),
      senha: document.getElementById('self-pax-password').value.trim(),
      lat: parseFloat(document.getElementById('self-pax-lat').value) || DEFAULT_LAT,
      lng: parseFloat(document.getElementById('self-pax-lng').value) || DEFAULT_LNG,
      foto: state.tempSelfPaxPhoto || state.db.usuarios[idx].foto || '',
      updatedAt: new Date().toISOString()
    };

    state.db.usuarios[idx] = updated;
    state.currentUser = updated;
    state.passengerGps.lat = updated.lat;
    state.passengerGps.lng = updated.lng;

    saveLocalDb();
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updated));

    document.getElementById('header-user-name').textContent = updated.nome;
    if (updated.foto) {
      const av = document.getElementById('header-user-avatar');
      av.src = updated.foto;
      av.classList.remove('hidden');
    }

    setPaxTab('mapa');
    renderPassengerLiveView();
    showToast('Seu perfil e localização residencial foram atualizados!', 'success');

    await callGasApi({
      action: 'updatePassengerProfile',
      user: updated
    });
  }

  /* ==========================================================================
   * 9. MÓDULO 3: TELA DO MOTORISTA (COCKPIT 3D PITCH 65 + WAKE LOCK + TELEMETRIA)
   * ========================================================================== */
  function startDriverContinuousGpsWatcher() {
    if (!('geolocation' in navigator)) return;

    const handleDriverGpsPosition = (pos) => {
      if (!pos || !pos.coords) return;
      const newLat = Number(pos.coords.latitude.toFixed(6));
      const newLng = Number(pos.coords.longitude.toFixed(6));
      if (isLegacySaoPauloCoord(newLat, newLng)) return;

      const prevLat = state.driverRuntime.currentLat;
      const prevLng = state.driverRuntime.currentLng;
      const movedMeters = prevLat && prevLng ? calculateHaversineMeters(prevLat, prevLng, newLat, newLng) : 0;

      state.driverRuntime.currentLat = newLat;
      state.driverRuntime.currentLng = newLng;
      state.driverRuntime.hasRealGpsFix = true;

      if (pos.coords.speed !== null && !isNaN(pos.coords.speed) && pos.coords.speed >= 0) {
        state.driverRuntime.currentSpeed = Math.round(pos.coords.speed * 3.6);
      } else if (movedMeters > 3 && state.driverRuntime.lastTelemetryPushMs > 0) {
        const dtSec = Math.max(1, (Date.now() - state.driverRuntime.lastTelemetryPushMs) / 1000);
        const calcKmh = Math.min(110, Math.round((movedMeters / dtSec) * 3.6));
        state.driverRuntime.currentSpeed = calcKmh;
      }

      if (pos.coords.heading !== null && !isNaN(pos.coords.heading) && pos.coords.heading >= 0) {
        state.driverRuntime.currentHeading = Math.round(pos.coords.heading);
      } else if (movedMeters >= 2) {
        state.driverRuntime.currentHeading = calculateBearingDegrees(prevLat, prevLng, newLat, newLng);
      }

      updateDriver3dBusMarkerAndCamera(false);

      // Se a rota estiver aberta (EM_ANDAMENTO), transmite imediatamente a posição real do GPS (com throttle de 2.2s)
      const activeRoute = state.db.rotas.find((r) => r.id === state.driverRuntime.activeRouteId);
      const isRouteOpen = activeRoute && activeRoute.status === 'EM_ANDAMENTO';
      const nowMs = Date.now();
      if (
        (state.driverRuntime.isTripRunning || isRouteOpen) &&
        (nowMs - state.driverRuntime.lastTelemetryPushMs >= 2200 || movedMeters >= 5)
      ) {
        state.driverRuntime.lastTelemetryPushMs = nowMs;
        pushDriverTelemetrySnapshot('EM_ANDAMENTO');
      }
    };

    // Dispara leitura imediata sem usar cache antigo (maximumAge: 0)
    navigator.geolocation.getCurrentPosition(
      handleDriverGpsPosition,
      () => {},
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 12000
      }
    );

    if (state.driverRuntime.watchId !== null) {
      navigator.geolocation.clearWatch(state.driverRuntime.watchId);
    }

    state.driverRuntime.watchId = navigator.geolocation.watchPosition(
      handleDriverGpsPosition,
      (err) => {
        console.warn('Geolocation watchPosition do motorista aviso:', err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000
      }
    );
  }

  async function initDriverModule() {
    // Localiza as rotas vinculadas ao motorista logado (ou todas as rotas disponíveis)
    const driverId = state.currentUser.id;
    const driverRoutes = state.db.rotas.filter((r) => r.motoristaId === driverId);
    const candidateRoutes = driverRoutes.length > 0 ? driverRoutes : state.db.rotas;

    // Prioriza a rota que já estiver ABERTA (EM_ANDAMENTO)
    const assignedRoute =
      candidateRoutes.find((r) => r.status === 'EM_ANDAMENTO') ||
      candidateRoutes[0] ||
      state.db.rotas[0];

    if (assignedRoute) {
      state.driverRuntime.activeRouteId = assignedRoute.id;
      const existingTel = state.db.telemetria.find((t) => t.rotaId === assignedRoute.id);
      if (!state.driverRuntime.hasRealGpsFix) {
        if (existingTel && existingTel.lat && existingTel.lng) {
          state.driverRuntime.currentLat = Number(existingTel.lat);
          state.driverRuntime.currentLng = Number(existingTel.lng);
        } else if (assignedRoute.pontos && assignedRoute.pontos.length > 0) {
          state.driverRuntime.currentLat = Number(assignedRoute.pontos[0].lat);
          state.driverRuntime.currentLng = Number(assignedRoute.pontos[0].lng);
        }
      }
    }

    // Inicia rastreamento contínuo do GPS real do motorista imediatamente ao entrar na tela
    startDriverContinuousGpsWatcher();

    setTimeout(() => {
      initDriver3dMap();
      renderDriverCockpitView();
    }, 60);
  }

  function setDriverAutoFollowMode(enabled) {
    state.driverRuntime.autoFollowCamera = Boolean(enabled);
    const badge = document.getElementById('driver-camera-mode-badge');
    if (badge) {
      if (state.driverRuntime.autoFollowCamera) {
        badge.className = 'px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold';
        badge.textContent = 'Seguir Ônibus: ATIVO';
      } else {
        badge.className = 'px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px] font-bold';
        badge.textContent = 'Mapa Livre (Toque em Centralizar p/ seguir)';
      }
    }
  }

  function initDriver3dMap() {
    if (state.maps.driver3d) {
      state.maps.driver3d.resize();
      ensureSatelliteLayerOnMap(state.maps.driver3d, 'driver-route-glow');
      return;
    }

    const map = new maplibregl.Map({
      container: 'map-driver-3d',
      style: VECTOR_MAP_STYLE,
      center: [state.driverRuntime.currentLng, state.driverRuntime.currentLat],
      zoom: 16.2,
      pitch: 65, // Perspectiva 3D exigida
      bearing: state.driverRuntime.currentHeading || 330,
      antialias: true
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    // Libera automaticamente o mapa (destrava o foco no ônibus) quando o motorista arrastar, afastar ou der zoom com os dedos/mouse
    ['dragstart', 'wheel', 'touchstart', 'boxzoomstart'].forEach((evtName) => {
      map.on(evtName, (e) => {
        if (evtName === 'touchstart' && e.points && e.points.length < 2) {
          // Toque simples só destrava se realmente arrastar (dragstart cuidará disso)
          return;
        }
        if (e && e.originalEvent && state.driverRuntime.autoFollowCamera) {
          setDriverAutoFollowMode(false);
        }
      });
    });

    // Se o motorista clicar nos botões + / - nativos do controle do mapa, também libera o zoom livre
    const containerEl = document.getElementById('map-driver-3d');
    containerEl?.addEventListener('click', (ev) => {
      if (ev.target && ev.target.closest && ev.target.closest('.maplibregl-ctrl-group')) {
        setDriverAutoFollowMode(false);
      }
    });

    map.on('load', () => {
      map.addSource('driver-route-source', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
      });

      map.addLayer({
        id: 'driver-route-glow',
        type: 'line',
        source: 'driver-route-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#38bdf8',
          'line-width': 14,
          'line-opacity': 0.28
        }
      });

      map.addLayer({
        id: 'driver-route-main',
        type: 'line',
        source: 'driver-route-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#0ea5e9',
          'line-width': 6,
          'line-opacity': 0.96
        }
      });

      ensureSatelliteLayerOnMap(map, 'driver-route-glow');
      renderDriverCockpitView();
    });

    state.maps.driver3d = map;
  }

  function renderDriverCockpitView() {
    const rota =
      state.db.rotas.find((r) => r.id === state.driverRuntime.activeRouteId) ||
      state.db.rotas[0];
    if (!rota) return;

    const sentido = getRouteDirectionType(rota);
    const isVolta = sentido === 'VOLTA';
    const isRouteOpen = rota.status === 'EM_ANDAMENTO';

    // Popula o seletor de rota (IDA / VOLTA) do motorista
    const selectEl = document.getElementById('driver-select-route');
    if (selectEl) {
      selectEl.innerHTML = (state.db.rotas || [])
        .map((r) => {
          const rSentido = getRouteDirectionType(r);
          const rOpen = r.status === 'EM_ANDAMENTO' ? '🟢 ABERTA' : '⚪ FECHADA';
          return `<option value="${r.id}">[${rSentido}] ${r.nome} — ${rOpen}</option>`;
        })
        .join('');
      selectEl.value = rota.id;
    }

    // Botões visuais de IDA / VOLTA (substituem o seletor em texto)
    const btnsEl = document.getElementById('driver-route-buttons');
    if (btnsEl) {
      btnsEl.innerHTML = (state.db.rotas || [])
        .map((r) => {
          const volta = getRouteDirectionType(r) === 'VOLTA';
          const open = r.status === 'EM_ANDAMENTO';
          const active = r.id === rota.id;
          const color = volta ? 'amber' : 'sky';
          return `<button type="button" data-driver-pick-route="${r.id}" class="flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition ${
            active ? `bg-${color}-500/20 border-${color}-400 shadow-md` : 'bg-slate-900/80 border-slate-700 hover:border-slate-500'
          }">
            <span class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${volta ? 'bg-amber-500/25 text-amber-300' : 'bg-sky-500/25 text-sky-300'}">
              <i data-lucide="${volta ? 'corner-down-left' : 'arrow-right'}" class="w-5 h-5"></i>
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-[10px] font-extrabold uppercase tracking-wider ${volta ? 'text-amber-300' : 'text-sky-300'}">${volta ? 'VOLTA' : 'IDA'}</span>
              <span class="block text-xs font-bold text-white truncate">${r.nome}</span>
            </span>
            <span class="status-pill ${open ? 'live' : 'idle'} !text-[10px]">${open ? 'ABERTA' : 'FECHADA'}</span>
          </button>`;
        })
        .join('');
      btnsEl.querySelectorAll('[data-driver-pick-route]').forEach((b) => {
        b.addEventListener('click', () => {
          if (selectEl) {
            selectEl.value = b.getAttribute('data-driver-pick-route');
            selectEl.dispatchEvent(new Event('change'));
          }
        });
      });
      refreshIcons();
    }

    // Sincroniza botões ABRIR / INICIAR ROTA vs FECHAR / FINALIZAR ROTA com o status da rota selecionada
    const btnStart = document.getElementById('btn-driver-start-route');
    const btnFinish = document.getElementById('btn-driver-finish-route');
    const hudStatus = document.getElementById('driver-hud-status');
    if (isRouteOpen) {
      btnStart?.classList.add('hidden');
      btnFinish?.classList.remove('hidden');
      if (hudStatus) {
        hudStatus.className = 'status-pill live';
        hudStatus.textContent = `ROTA DE ${sentido} ABERTA (GPS AO VIVO)`;
      }
    } else {
      btnStart?.classList.remove('hidden');
      btnFinish?.classList.add('hidden');
      if (hudStatus) {
        hudStatus.className = 'status-pill idle';
        hudStatus.textContent = `ROTA DE ${sentido} FECHADA`;
      }
    }

    const veh = state.db.veiculos.find((v) => v.id === rota.veiculoId);
    const boardingStops = getBoardingStopsOnly(rota);

    // Vincula todos os passageiros ao ponto escolhido por eles (Subida na IDA / Descida na VOLTA) ou ao mais próximo via Haversine
    const allPassengers = state.db.usuarios.filter((u) => u.perfil === 'PASSAGEIRO');
    const passengers = allPassengers.map((p) => {
      const preferredStopId = isVolta ? p.pontoVoltaId || p.pontoId : p.pontoIdaId || p.pontoId;
      let chosenStopObj = boardingStops.find((pt) => pt.id === preferredStopId) || null;

      if (!chosenStopObj && p.lat && p.lng && boardingStops.length > 0) {
        let minD = Infinity;
        boardingStops.forEach((pt) => {
          const d = calculateHaversineMeters(Number(p.lat), Number(p.lng), Number(pt.lat), Number(pt.lng));
          if (d < minD) {
            minD = d;
            chosenStopObj = pt;
          }
        });
      }
      if (!chosenStopObj) {
        chosenStopObj = boardingStops[0] || null;
      }

      return {
        ...p,
        resolvedStopId: chosenStopObj ? chosenStopObj.id : preferredStopId,
        resolvedStopName: chosenStopObj ? chosenStopObj.nome : p.endereco
      };
    });

    const goingPassengers = passengers.filter((p) => p.statusEmbarque !== 'NAO_VOU');

    document.getElementById('driver-route-title').textContent = `[${sentido}] ${rota.nome}`;
    document.getElementById('driver-vehicle-subtitle').textContent = `${
      veh ? `${veh.prefixo} (${veh.placa}) • ${veh.modelo}` : 'Ônibus Corporativo'
    } • ${isVolta ? 'Turno de Volta (Embarque Único -> Descida nos Pontos)' : `Turno ${rota.turno} (Subida nos Pontos)`}`;

    document.getElementById('driver-hud-speed').textContent = Math.round(state.driverRuntime.currentSpeed || 0);
    document.getElementById('driver-hud-heading').textContent = Math.round(state.driverRuntime.currentHeading || 0);
    document.getElementById('driver-hud-pax-count').textContent = `${goingPassengers.length}/${passengers.length}`;

    const drvTel = state.db.telemetria.find((t) => t.rotaId === rota.id);
    const drvEta = isRouteOpen && drvTel ? computeStopEtas(rota, boardingStops, drvTel) : {};

    // Renderiza Lista de Pontos de Parada (indicando quantos sobem na IDA ou quantos descem na VOLTA)
    const stopsEl = document.getElementById('driver-stops-list');
    if (stopsEl) {
      stopsEl.innerHTML = boardingStops
        .map((pt, idx) => {
          const paxAtStop = goingPassengers.filter((p) => p.resolvedStopId === pt.id).length;
          const paxLabel = isVolta
            ? `${paxAtStop} colaborador(es) vão DESCER aqui`
            : `${paxAtStop} colaborador(es) vão SUBIR aqui`;
          return `
            <div class="p-2.5 rounded-xl bg-slate-900/85 border border-slate-800 flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <span class="w-6 h-6 rounded-full ${
                  isVolta ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'
                } font-mono text-xs font-bold flex items-center justify-center">${idx + 1}</span>
                <div>
                  <div class="text-xs font-bold text-white">${pt.nome}</div>
                  <div class="text-[11px] ${isVolta ? 'text-amber-300' : 'text-emerald-400'}">${paxLabel}</div>
                </div>
              </div>
              <span class="text-right font-mono text-xs font-bold ${drvEta[pt.id] && drvEta[pt.id].passed ? 'text-slate-500' : 'text-sky-400'}">${
                isVolta
                  ? ''
                  : drvEta[pt.id]
                  ? drvEta[pt.id].passed
                    ? 'Passou'
                    : `${drvEta[pt.id].label}<span class="block text-[10px] font-normal text-slate-400">~${drvEta[pt.id].minutes} min • prog. ${pt.horario}</span>`
                  : pt.horario
              }</span>
            </div>
          `;
        })
        .join('');
    }

    // Renderiza Lista de Passageiros da Rota (quem marcou "Não vou" aparece em vermelho, ao final)
    const sortedPax = [...passengers].sort(
      (x, y) => Number(x.statusEmbarque === 'NAO_VOU') - Number(y.statusEmbarque === 'NAO_VOU')
    );
    const paxHtml = sortedPax
      .map((p) => {
        const isGoing = p.statusEmbarque !== 'NAO_VOU';
        const stopActionPrefix = isVolta ? 'Desce em' : 'Sobe em';
        return `
            <div class="p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
              isGoing ? 'bg-slate-900/85 border-slate-800' : 'bg-rose-950/50 border-rose-500/60'
            }">
              <div class="flex items-center gap-2.5 min-w-0">
                <img src="${p.foto || './icons/icon.svg'}" alt="${p.nome}" class="w-8 h-8 rounded-full object-cover border ${
          isGoing ? 'border-slate-700' : 'border-rose-500 opacity-70'
        }" />
                <div class="min-w-0">
                  <div class="text-xs font-bold truncate ${isGoing ? 'text-white' : 'text-rose-300 line-through'}">${p.nome}</div>
                  <div class="text-[11px] text-slate-400 truncate">${stopActionPrefix}: <strong class="${
          isGoing ? 'text-slate-200' : 'text-rose-300'
        }">${p.resolvedStopName || p.endereco}</strong></div>
                </div>
              </div>
              <span class="status-pill shrink-0 ${isGoing ? 'live' : ''}" style="${
          isGoing ? '' : 'background:rgba(244,63,94,.2);color:#fda4af;border:1px solid rgba(244,63,94,.6)'
        }">${isGoing ? (isVolta ? 'VAI' : 'VAI SUBIR') : 'NÃO VAI'}</span>
            </div>
          `;
      })
      .join('');
    const paxEl = document.getElementById('driver-passengers-list');
    if (paxEl) paxEl.innerHTML = paxHtml;
    const paxSideEl = document.getElementById('driver-passengers-side-list');
    if (paxSideEl) paxSideEl.innerHTML = paxHtml;
    const paxSideCount = document.getElementById('driver-passengers-side-count');
    if (paxSideCount) paxSideCount.textContent = `${goingPassengers.length} vão • ${passengers.length - goingPassengers.length} não vão`;

    // Na VOLTA: lista de passageiros ao lado do mapa (sem horários); na IDA: mapa em largura total
    const sideCard = document.getElementById('driver-passengers-side');
    const mapCardEl = document.getElementById('driver-map-card');
    if (sideCard) sideCard.style.display = isVolta ? '' : 'none';
    if (mapCardEl) {
      mapCardEl.classList.toggle('lg:col-span-8', isVolta);
      mapCardEl.classList.toggle('lg:col-span-12', !isVolta);
    }

    const map = state.maps.driver3d;
    if (!map || !map.getSource('driver-route-source')) return;

    map.getSource('driver-route-source').setData({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: rota.polyline || []
      }
    });

    // Marcadores dos Pontos de Parada no Mapa 3D
    state.markers.driverStops.forEach((m) => m.remove());
    state.markers.driverStops = [];

    boardingStops.forEach((pt, idx) => {
      const el = document.createElement('div');
      el.className = 'cymi-stop-marker';
      el.innerHTML = `
        <div class="cymi-stop-badge">
          <span>P${idx + 1}</span>
          <span class="text-sky-400 font-mono">${pt.horario}</span>
        </div>
        <div class="cymi-stop-pin"></div>
      `;
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([Number(pt.lng), Number(pt.lat)])
        .addTo(map);
      state.markers.driverStops.push(marker);
    });

    // Marcadores dos Passageiros Aguardando no Mapa 3D
    state.markers.driverPax.forEach((m) => m.remove());
    state.markers.driverPax = [];

    passengers.forEach((p) => {
      if (!p.lat || !p.lng) return;
      const isGoing = p.statusEmbarque !== 'NAO_VOU';
      const el = document.createElement('div');
      el.className = `cymi-user-marker ${isGoing ? '' : 'is-skipping'}`;
      el.innerHTML = p.foto ? `<img src="${p.foto}" alt="${p.nome}" />` : `<span>${(p.nome || 'P')[0]}</span>`;
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([Number(p.lng), Number(p.lat)])
        .setPopup(
          new maplibregl.Popup({ offset: 14 }).setHTML(`
            <div class="text-xs">
              <div class="font-bold text-white">${p.nome}</div>
              <div class="${isGoing ? 'text-emerald-400' : 'text-slate-400'} font-semibold">
                ${
                  isGoing
                    ? isVolta
                      ? `Desce em: ${p.resolvedStopName}`
                      : `Sobe em: ${p.resolvedStopName}`
                    : 'Não embarca hoje'
                }
              </div>
            </div>
          `)
        )
        .addTo(map);
      state.markers.driverPax.push(marker);
    });

    updateDriver3dBusMarkerAndCamera(false);
  }

  function updateDriver3dBusMarkerAndCamera(forceRecenter = false) {
    const map = state.maps.driver3d;
    if (!map) return;

    const lngLat = [Number(state.driverRuntime.currentLng), Number(state.driverRuntime.currentLat)];

    if (!state.markers.driverBus) {
      const busEl = document.createElement('div');
      busEl.className = 'cymi-bus-marker';
      busEl.innerHTML = `
        <div class="cymi-bus-pulse"></div>
        <div class="cymi-bus-marker-inner">🚌</div>
      `;
      state.markers.driverBus = new maplibregl.Marker({ element: busEl })
        .setLngLat(lngLat)
        .addTo(map);
    } else {
      state.markers.driverBus.setLngLat(lngLat);
    }

    if (forceRecenter) {
      setDriverAutoFollowMode(true);
    }

    // Só move/centraliza a câmera automaticamente se o modo Seguir Ônibus estiver ATIVO
    if (forceRecenter || state.driverRuntime.autoFollowCamera) {
      map.easeTo({
        center: lngLat,
        pitch: 65,
        bearing: Number(state.driverRuntime.currentHeading || 0),
        zoom: forceRecenter ? 16.3 : Math.max(map.getZoom(), 15.2),
        duration: 850
      });
    }

    document.getElementById('driver-hud-speed').textContent = Math.round(state.driverRuntime.currentSpeed || 0);
    document.getElementById('driver-hud-heading').textContent = Math.round(state.driverRuntime.currentHeading || 0);
  }

  /**
   * Destrava a câmera do motorista e afasta o zoom para visualizar a rota inteira e todas as paradas
   */
  function zoomOutDriverFullRoute() {
    const map = state.maps.driver3d;
    if (!map) return;

    setDriverAutoFollowMode(false);

    const rota =
      state.db.rotas.find((r) => r.id === state.driverRuntime.activeRouteId) ||
      state.db.rotas[0];

    const bounds = new maplibregl.LngLatBounds();
    let count = 0;

    if (rota) {
      (rota.polyline || []).forEach((coord) => {
        if (Array.isArray(coord) && coord.length >= 2) {
          bounds.extend([Number(coord[0]), Number(coord[1])]);
          count++;
        }
      });
      (rota.pontos || []).forEach((pt) => {
        if (pt.lat && pt.lng) {
          bounds.extend([Number(pt.lng), Number(pt.lat)]);
          count++;
        }
      });
    }

    if (state.driverRuntime.currentLat && state.driverRuntime.currentLng) {
      bounds.extend([Number(state.driverRuntime.currentLng), Number(state.driverRuntime.currentLat)]);
      count++;
    }

    if (count > 1) {
      map.fitBounds(bounds, {
        padding: 70,
        pitch: 30,
        maxZoom: 14.5,
        duration: 850
      });
    } else {
      map.easeTo({
        zoom: Math.max(map.getZoom() - 2.5, 12.5),
        pitch: 30,
        duration: 700
      });
    }

    showToast('Mapa destravado e afastado! Você pode navegar livremente ou tocar em Centralizar.', 'info');
  }

  /**
   * Reativa o foco automático 3D no ônibus
   */
  function recenterDriver3dCamera() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          state.driverRuntime.currentLat = Number(pos.coords.latitude.toFixed(6));
          state.driverRuntime.currentLng = Number(pos.coords.longitude.toFixed(6));
          state.driverRuntime.hasRealGpsFix = true;
          updateDriver3dBusMarkerAndCamera(true);
        },
        () => {
          updateDriver3dBusMarkerAndCamera(true);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 6000 }
      );
    } else {
      updateDriver3dBusMarkerAndCamera(true);
    }
    showToast('Câmera 3D centralizada no ônibus (Seguir GPS ativo).', 'success');
  }

  /**
   * Alterna Tela Cheia no Mapa 3D do Motorista (compatível com Android, iPhone/iOS e Desktop)
   */
  async function toggleDriverMapFullscreen() {
    const card = document.getElementById('driver-map-card');
    const label = document.getElementById('label-driver-fullscreen');
    if (!card) return;

    const nextState = !state.driverRuntime.isFullscreen;
    state.driverRuntime.isFullscreen = nextState;

    card.classList.toggle('cymi-map-fullscreen', nextState);
    if (label) {
      label.textContent = nextState ? 'Sair da Tela Cheia' : 'Tela Cheia';
    }

    // Tenta também a Fullscreen API nativa em navegadores que suportam, mantendo o fallback CSS para iOS
    try {
      if (nextState && card.requestFullscreen && !document.fullscreenElement) {
        await card.requestFullscreen();
      } else if (!nextState && document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (e) {
      // Fallback CSS (.cymi-map-fullscreen) já garante 100vw x 100dvh
    }

    setTimeout(() => {
      if (state.maps.driver3d) state.maps.driver3d.resize();
    }, 60);
    setTimeout(() => {
      if (state.maps.driver3d) state.maps.driver3d.resize();
    }, 260);
  }

  /**
   * Solicita Wake Lock API para impedir que a tela do motorista apague durante a rota
   */
  async function requestDriverScreenWakeLock() {
    const badge = document.getElementById('driver-wakelock-badge');
    const text = document.getElementById('driver-wakelock-text');

    if ('wakeLock' in navigator) {
      try {
        state.driverRuntime.wakeLockSentinel = await navigator.wakeLock.request('screen');
        if (badge) badge.className = 'status-pill live text-[11px]';
        if (text) text.textContent = 'Wake Lock Ativo (TelaSempreLigada)';
        return;
      } catch (err) {
        console.warn('Wake Lock API aviso:', err);
      }
    }
    if (badge) badge.className = 'status-pill warning text-[11px]';
    if (text) text.textContent = 'Wake Lock Monitorado';
  }

  async function releaseDriverScreenWakeLock() {
    if (state.driverRuntime.wakeLockSentinel) {
      try {
        await state.driverRuntime.wakeLockSentinel.release();
      } catch (e) {}
      state.driverRuntime.wakeLockSentinel = null;
    }
    const badge = document.getElementById('driver-wakelock-badge');
    const text = document.getElementById('driver-wakelock-text');
    if (badge) badge.className = 'status-pill idle text-[11px]';
    if (text) text.textContent = 'Wake Lock Inativo';
  }

  /**
   * Abre e Inicia oficialmente a rota (IDA ou VOLTA) selecionada pelo motorista:
   * - Fecha automaticamente a rota oposta do mesmo veículo/motorista
   * - Ativa `navigator.geolocation.watchPosition` contínuo com `maximumAge: 0`
   * - Ativa `navigator.wakeLock.request('screen')`
   * - Envia telemetria rápida a cada 3 segundos (além do envio por movimento > 5m)
   */
  async function startDriverTripExecution() {
    const rota =
      state.db.rotas.find((r) => r.id === state.driverRuntime.activeRouteId) ||
      state.db.rotas[0];
    if (!rota) return;

    state.driverRuntime.isTripRunning = true;
    state.driverRuntime.tripId = `viagem_${Date.now()}`;

    // Garante que o watcher de GPS de alta precisão está ativo
    startDriverContinuousGpsWatcher();

    // Abre esta rota (EM_ANDAMENTO) e fecha automaticamente a rota oposta (IDA/VOLTA) do mesmo ônibus
    await toggleRouteOpenState(rota.id, true);

    await requestDriverScreenWakeLock();

    // Dispara envio contínuo de telemetria rápida a cada 3 segundos
    await pushDriverTelemetrySnapshot('EM_ANDAMENTO');
    if (state.driverRuntime.telemetryTimer) clearInterval(state.driverRuntime.telemetryTimer);
    state.driverRuntime.telemetryTimer = setInterval(() => {
      pushDriverTelemetrySnapshot('EM_ANDAMENTO');
    }, 3000);

    // Registra início no Histórico de Viagens e no Google Sheets
    const veh = state.db.veiculos.find((v) => v.id === rota.veiculoId);
    await callGasApi({
      action: 'startRouteTrip',
      tripId: state.driverRuntime.tripId,
      rotaId: rota.id,
      nomeRota: rota.nome,
      motoristaId: state.currentUser.id,
      nomeMotorista: state.currentUser.nome,
      veiculoId: rota.veiculoId,
      placaVeiculo: veh ? veh.placa : '',
      lat: state.driverRuntime.currentLat,
      lng: state.driverRuntime.currentLng,
      velocidade: state.driverRuntime.currentSpeed,
      heading: state.driverRuntime.currentHeading
    });

    renderDriverCockpitView();
  }

  async function stopDriverTripExecution(notify = true) {
    state.driverRuntime.isTripRunning = false;

    if (state.driverRuntime.telemetryTimer) {
      clearInterval(state.driverRuntime.telemetryTimer);
      state.driverRuntime.telemetryTimer = null;
    }

    if (state.driverRuntime.simInterval) {
      clearInterval(state.driverRuntime.simInterval);
      state.driverRuntime.simInterval = null;
      const lbl = document.getElementById('label-driver-sim');
      if (lbl) lbl.textContent = 'Simular Direção na Via';
    }

    await releaseDriverScreenWakeLock();

    state.driverRuntime.currentSpeed = 0;
    const rota = state.db.rotas.find((r) => r.id === state.driverRuntime.activeRouteId);
    if (rota) {
      await toggleRouteOpenState(rota.id, false);
      await pushDriverTelemetrySnapshot('PARADA');
      await callGasApi({
        action: 'finishRouteTrip',
        tripId: state.driverRuntime.tripId,
        rotaId: rota.id
      });
    }

    renderDriverCockpitView();

    if (notify) {
      showToast('Rota fechada e finalizada! Os usuários não visualizam mais esta rota.', 'info');
    }
  }

  async function pushDriverTelemetrySnapshot(statusRota = 'EM_ANDAMENTO') {
    const rota =
      state.db.rotas.find((r) => r.id === state.driverRuntime.activeRouteId) ||
      state.db.rotas[0];
    if (!rota) return;

    const snapshot = {
      rotaId: rota.id,
      motoristaId: state.currentUser ? state.currentUser.id : rota.motoristaId,
      veiculoId: rota.veiculoId,
      lat: Number(state.driverRuntime.currentLat.toFixed(6)),
      lng: Number(state.driverRuntime.currentLng.toFixed(6)),
      velocidade: Math.round(state.driverRuntime.currentSpeed || 0),
      heading: Math.round(state.driverRuntime.currentHeading || 0),
      statusRota,
      proximoPontoId: rota.pontos && rota.pontos[0] ? rota.pontos[0].id : '',
      updatedAt: new Date().toISOString()
    };

    const existingIdx = state.db.telemetria.findIndex((t) => t.rotaId === rota.id);
    if (existingIdx >= 0) {
      state.db.telemetria[existingIdx] = snapshot;
    } else {
      state.db.telemetria.push(snapshot);
    }

    saveLocalDb();
    await callGasApi({
      action: 'pushTelemetry',
      ...snapshot
    });
  }

  /**
   * Simulador de deslocamento 3D na polyline OSRM da rota para permitir testar a rotação 3D de câmera no PC
   */
  function toggleDriver3dRouteSimulation() {
    const labelEl = document.getElementById('label-driver-sim');
    if (state.driverRuntime.simInterval) {
      clearInterval(state.driverRuntime.simInterval);
      state.driverRuntime.simInterval = null;
      if (labelEl) labelEl.textContent = 'Simular Direção na Via';
      showToast('Simulação de direção 3D pausada.', 'info');
      return;
    }

    const rota =
      state.db.rotas.find((r) => r.id === state.driverRuntime.activeRouteId) ||
      state.db.rotas[0];
    if (!rota || !Array.isArray(rota.polyline) || rota.polyline.length < 2) {
      showToast('Rota sem coordenadas suficientes para simular.', 'warning');
      return;
    }

    if (!state.driverRuntime.isTripRunning) {
      startDriverTripExecution();
    }

    if (labelEl) labelEl.textContent = 'Pausar Simulação 3D';
    showToast('Simulando deslocamento 3D ao longo da via OSRM (Pitch 65° + Bearing dinâmico)!', 'success');

    state.driverRuntime.simInterval = setInterval(() => {
      const coords = rota.polyline;
      const currIdx = state.driverRuntime.simCoordIndex % coords.length;
      const nextIdx = (currIdx + 1) % coords.length;

      const [currLng, currLat] = coords[currIdx];
      const [nextLng, nextLat] = coords[nextIdx];

      const heading = calculateBearingDegrees(currLat, currLng, nextLat, nextLng);
      state.driverRuntime.currentLat = currLat;
      state.driverRuntime.currentLng = currLng;
      state.driverRuntime.currentHeading = heading;
      state.driverRuntime.currentSpeed = 42 + Math.round(Math.sin(currIdx) * 8);
      state.driverRuntime.simCoordIndex = nextIdx;

      updateDriver3dBusMarkerAndCamera();
      pushDriverTelemetrySnapshot('EM_ANDAMENTO');
    }, 1800);
  }

  /* ==========================================================================
   * 10. SIMULADOR DE MOVIMENTO NA TORRE DE CONTROLE (ADMIN)
   * ========================================================================== */
  function toggleTowerDemoSimulation() {
    const labelEl = document.getElementById('label-demo-sim');
    if (state.towerSimInterval) {
      clearInterval(state.towerSimInterval);
      state.towerSimInterval = null;
      if (labelEl) labelEl.textContent = 'Simular Ônibus em Movimento';
      showToast('Simulação da Torre pausada.', 'info');
      return;
    }

    if (labelEl) labelEl.textContent = 'Pausar Simulação Ao Vivo';
    showToast('Simulação ativa: ônibus percorrendo o trajeto OSRM em tempo real!', 'success');

    state.towerSimInterval = setInterval(() => {
      state.towerSimStep += 1;
      state.db.rotas.forEach((r) => {
        if (!Array.isArray(r.polyline) || r.polyline.length < 2) return;
        r.status = 'EM_ANDAMENTO';
        const idx = state.towerSimStep % r.polyline.length;
        const nextIdx = (idx + 1) % r.polyline.length;
        const [lng, lat] = r.polyline[idx];
        const [nLng, nLat] = r.polyline[nextIdx];
        const heading = calculateBearingDegrees(lat, lng, nLat, nLng);
        const speed = 35 + ((state.towerSimStep * 3) % 18);

        const telIdx = state.db.telemetria.findIndex((t) => t.rotaId === r.id);
        const telObj = {
          rotaId: r.id,
          motoristaId: r.motoristaId,
          veiculoId: r.veiculoId,
          lat,
          lng,
          velocidade: speed,
          heading,
          statusRota: 'EM_ANDAMENTO',
          proximoPontoId: r.pontos && r.pontos[0] ? r.pontos[0].id : '',
          updatedAt: new Date().toISOString()
        };

        if (telIdx >= 0) {
          state.db.telemetria[telIdx] = telObj;
        } else {
          state.db.telemetria.push(telObj);
        }
      });

      saveLocalDb();
      refreshActiveViews();
    }, 2000);
  }

  function refreshActiveViews() {
    if (!state.currentUser) return;
    if (state.currentUser.perfil === 'ADMIN') {
      renderAdminKpiCounts();
      if (state.activeAdminTab === 'tower') renderTowerMapAndSidebar();
    } else if (state.currentUser.perfil === 'PASSAGEIRO') {
      renderPassengerLiveView();
    } else if (state.currentUser.perfil === 'MOTORISTA') {
      renderDriverCockpitView();
    }
  }

  /* ==========================================================================
   * 11. COMPONENTE DE INSTALAÇÃO INTELIGENTE PWA (ANDROID + iOS + SERVICE WORKER)
   * ========================================================================== */
  function setupSmartPwaInstaller() {
    // Registra Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
          console.warn('Service Worker registro:', err);
        });
      });
    }

    const btnInstall = document.getElementById('btn-pwa-install');
    const btnNativeTrigger = document.getElementById('btn-trigger-native-install');
    const modalIos = document.getElementById('modal-ios-install');

    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isInStandaloneMode && btnInstall) {
      document.getElementById('label-pwa-install').textContent = 'App Instalado';
    }

    // Captura evento nativo do Android / Chrome Desktop
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      state.deferredInstallPrompt = e;
      if (btnNativeTrigger) btnNativeTrigger.classList.remove('hidden');
      if (btnInstall) {
        document.getElementById('label-pwa-install').textContent = 'Instalar Aplicativo';
      }
    });

    if (btnInstall) {
      btnInstall.addEventListener('click', async () => {
        if (state.deferredInstallPrompt) {
          state.deferredInstallPrompt.prompt();
          const { outcome } = await state.deferredInstallPrompt.userChoice;
          if (outcome === 'accepted') {
            showToast('Aplicativo RotaCYMI instalado com sucesso!', 'success');
          }
          state.deferredInstallPrompt = null;
          return;
        }

        // No iOS ou quando o prompt nativo já foi usado, exibe o modal instrutivo elegante
        if (modalIos) {
          modalIos.classList.remove('hidden');
          modalIos.classList.add('flex');
          if (isIos) {
            showToast('Siga os 3 passos para adicionar o RotaCYMI à Tela de Início do seu iPhone/iPad.', 'info');
          }
        }
      });
    }

    if (btnNativeTrigger) {
      btnNativeTrigger.addEventListener('click', async () => {
        if (state.deferredInstallPrompt) {
          state.deferredInstallPrompt.prompt();
          await state.deferredInstallPrompt.userChoice;
          state.deferredInstallPrompt = null;
          modalIos.classList.add('hidden');
        }
      });
    }

    ['btn-close-ios-install', 'btn-dismiss-ios-install'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', () => {
          modalIos.classList.add('hidden');
          modalIos.classList.remove('flex');
        });
      }
    });
  }

  /* ==========================================================================
   * 12. MODAL DE CONFIGURAÇÃO DO GOOGLE APPS SCRIPT (URL WEB APP)
   * ========================================================================== */
  function setupApiConfigModal() {
    const modal = document.getElementById('modal-api-config');
    const inputUrl = document.getElementById('input-gas-url');
    const feedback = document.getElementById('api-test-feedback');

    const openModal = () => {
      inputUrl.value = state.gasUrl || '';
      feedback.classList.add('hidden');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    };

    const closeModal = () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    };

    document.getElementById('btn-open-api-config')?.addEventListener('click', openModal);
    document.getElementById('btn-auth-open-api')?.addEventListener('click', openModal);
    document.getElementById('btn-close-api-config')?.addEventListener('click', closeModal);

    document.getElementById('btn-save-gas-url')?.addEventListener('click', async () => {
      state.gasUrl = inputUrl.value.trim();
      localStorage.setItem(STORAGE_KEYS.GAS_URL, state.gasUrl);
      updateConnectionBadge();
      closeModal();
      showToast('URL da API Google Apps Script salva com sucesso!', 'success');
      if (state.gasUrl) {
        await syncWithGoogleSheets(true);
      }
    });

    document.getElementById('btn-test-gas-url')?.addEventListener('click', async () => {
      const candidate = inputUrl.value.trim();
      if (!candidate) {
        feedback.className = 'p-3 rounded-xl text-xs font-mono border border-amber-500/40 bg-amber-950/40 text-amber-300';
        feedback.textContent = 'Informe uma URL terminando em /exec para testar a conexão.';
        feedback.classList.remove('hidden');
        return;
      }

      state.gasUrl = candidate;
      feedback.className = 'p-3 rounded-xl text-xs font-mono border border-sky-500/40 bg-sky-950/40 text-sky-300';
      feedback.textContent = 'Testando comunicação com Google Apps Script...';
      feedback.classList.remove('hidden');

      const res = await callGasApi({ action: 'ping' });
      if (res && res.ok) {
        feedback.className = 'p-3 rounded-xl text-xs font-mono border border-emerald-500/40 bg-emerald-950/40 text-emerald-300';
        feedback.textContent = `✓ Conexão bem-sucedida! Serviço: ${res.service || 'RotaCYMI API'} (${res.timestamp || 'OK'})`;
      } else {
        feedback.className = 'p-3 rounded-xl text-xs font-mono border border-rose-500/40 bg-rose-950/40 text-rose-300';
        feedback.textContent = `✕ Falha ao conectar: ${res?.error || 'Verifique se a implantação está como "Qualquer pessoa".'}`;
      }
    });

    document.getElementById('btn-push-seed-to-gas')?.addEventListener('click', async () => {
      const candidate = inputUrl.value.trim();
      if (!candidate) {
        showToast('Cole a URL do Web App do Google Apps Script primeiro.', 'warning');
        return;
      }
      state.gasUrl = candidate;
      localStorage.setItem(STORAGE_KEYS.GAS_URL, state.gasUrl);

      feedback.className = 'p-3 rounded-xl text-xs font-mono border border-sky-500/40 bg-sky-950/40 text-sky-300';
      feedback.textContent = 'Criando abas na planilha e sincronizando todos os registros...';
      feedback.classList.remove('hidden');

      const res = await callGasApi({
        action: 'syncBatch',
        data: state.db
      });

      if (res && res.ok) {
        feedback.className = 'p-3 rounded-xl text-xs font-mono border border-emerald-500/40 bg-emerald-950/40 text-emerald-300';
        feedback.textContent = `✓ Planilha inicializada e sincronizada em ${res.syncedAt}!`;
        showToast('Dados enviados para o Google Sheets com sucesso!', 'success');
      } else {
        feedback.className = 'p-3 rounded-xl text-xs font-mono border border-rose-500/40 bg-rose-950/40 text-rose-300';
        feedback.textContent = `✕ Erro ao sincronizar: ${res?.error || 'Verifique permissões do script.'}`;
      }
    });
  }

  /* ==========================================================================
   * 12.1 AUTOCADASTRO DE FUNCIONÁRIO POR LINK DE CONVITE (?cadastro=1)
   * ========================================================================== */
  function getPublicSignupInviteUrl() {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?cadastro=1`;
  }

  function updateSignupShareInputUrl() {
    const el = document.getElementById('input-signup-share-url');
    if (el) {
      el.value = getPublicSignupInviteUrl();
    }
  }

  function populateSelfSignupRouteAndStops(preferredRouteId) {
    const routeSelect = document.getElementById('signup-route');
    const stopSelect = document.getElementById('signup-stop');
    if (!routeSelect || !stopSelect) return;

    const routes = state.db.rotas || [];
    routeSelect.innerHTML =
      routes
        .map(
          (r) =>
            `<option value="${r.id}">${r.nome} (${r.turno || 'Turno'})</option>`
        )
        .join('') || `<option value="">Nenhuma rota cadastrada</option>`;

    if (preferredRouteId && routes.some((r) => r.id === preferredRouteId)) {
      routeSelect.value = preferredRouteId;
    }

    const updateStopsAndNearest = () => {
      const selectedRoute = routes.find((r) => r.id === routeSelect.value) || routes[0];
      const stops = selectedRoute ? getBoardingStopsOnly(selectedRoute) : [];
      const curLat = parseFloat(document.getElementById('signup-lat')?.value) || DEFAULT_LAT;
      const curLng = parseFloat(document.getElementById('signup-lng')?.value) || DEFAULT_LNG;

      let nearestStopId = '';
      let minDist = Infinity;

      const stopsWithDist = stops.map((pt) => {
        const d = calculateHaversineMeters(curLat, curLng, Number(pt.lat), Number(pt.lng));
        if (d < minDist) {
          minDist = d;
          nearestStopId = pt.id;
        }
        return { ...pt, dist: d };
      });

      stopSelect.innerHTML =
        stopsWithDist
          .map((pt) => {
            const distLabel = pt.dist >= 1000 ? `${(pt.dist / 1000).toFixed(1)} km` : `${pt.dist} m`;
            return `<option value="${pt.id}">${pt.nome} (${pt.horario}) — a ${distLabel}</option>`;
          })
          .join('') || `<option value="">Ponto definido automaticamente pelo GPS</option>`;

      if (nearestStopId) {
        stopSelect.value = nearestStopId;
      }
    };

    routeSelect.onchange = updateStopsAndNearest;
    updateStopsAndNearest();
  }

  function initSelfSignupMap() {
    const lat = parseFloat(document.getElementById('signup-lat')?.value) || DEFAULT_LAT;
    const lng = parseFloat(document.getElementById('signup-lng')?.value) || DEFAULT_LNG;

    if (state.maps.selfSignup) {
      state.maps.selfSignup.resize();
      ensureSatelliteLayerOnMap(state.maps.selfSignup);
      state.maps.selfSignup.setCenter([lng, lat]);
      if (state.markers.selfSignupMarker) {
        state.markers.selfSignupMarker.setLngLat([lng, lat]);
      }
      return;
    }

    const map = new maplibregl.Map({
      container: 'map-self-signup',
      style: VECTOR_MAP_STYLE,
      center: [lng, lat],
      zoom: 14
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      ensureSatelliteLayerOnMap(map);
    });

    const marker = new maplibregl.Marker({ color: '#10b981', draggable: true })
      .setLngLat([lng, lat])
      .addTo(map);

    const setSignupCoords = async (lngLat) => {
      const la = Number(lngLat.lat.toFixed(6));
      const ln = Number(lngLat.lng.toFixed(6));
      document.getElementById('signup-lat').value = la;
      document.getElementById('signup-lng').value = ln;
      document.getElementById('signup-lat-display').textContent = la;
      document.getElementById('signup-lng-display').textContent = ln;
      populateSelfSignupRouteAndStops(document.getElementById('signup-route')?.value);

      const addrEl = document.getElementById('signup-address');
      if (addrEl) {
        addrEl.placeholder = 'Buscando endereço da localização selecionada...';
        const revAddr = await reverseGeocodeCoords(la, ln);
        if (revAddr) {
          addrEl.value = revAddr;
          showToast(`Endereço preenchido: ${revAddr}`, 'success');
        }
      }
    };

    marker.on('dragend', () => setSignupCoords(marker.getLngLat()));
    map.on('click', (e) => {
      marker.setLngLat(e.lngLat);
      setSignupCoords(e.lngLat);
    });

    state.maps.selfSignup = map;
    state.markers.selfSignupMarker = marker;
  }

  function openSelfSignupModal(preferredRouteId) {
    const modal = document.getElementById('modal-self-signup');
    if (!modal) return;

    state.tempSelfSignupPhoto = '';
    document.getElementById('signup-photo-preview').src = './icons/icon.svg';
    document.getElementById('signup-lat').value = DEFAULT_LAT;
    document.getElementById('signup-lng').value = DEFAULT_LNG;
    document.getElementById('signup-lat-display').textContent = DEFAULT_LAT;
    document.getElementById('signup-lng-display').textContent = DEFAULT_LNG;

    populateSelfSignupRouteAndStops(preferredRouteId);

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    refreshIcons();

    setTimeout(() => {
      initSelfSignupMap();
    }, 90);
  }

  function closeSelfSignupModal() {
    const modal = document.getElementById('modal-self-signup');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  async function handleSelfSignupSubmit(event) {
    event.preventDefault();

    const nome = document.getElementById('signup-name').value.trim();
    const telefone = document.getElementById('signup-phone').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const senha = document.getElementById('signup-password').value.trim();
    const endereco = document.getElementById('signup-address').value.trim();
    const lat = parseFloat(document.getElementById('signup-lat').value) || DEFAULT_LAT;
    const lng = parseFloat(document.getElementById('signup-lng').value) || DEFAULT_LNG;

    // Descobre automaticamente a rota e o ponto de embarque mais próximo da casa do funcionário (via Haversine)
    let autoRotaId = state.db.rotas[0]?.id || '';
    let autoPontoId = '';
    let minD = Infinity;

    (state.db.rotas || []).forEach((r) => {
      getBoardingStopsOnly(r).forEach((pt) => {
        const d = calculateHaversineMeters(lat, lng, Number(pt.lat), Number(pt.lng));
        if (d < minD) {
          minD = d;
          autoRotaId = r.id;
          autoPontoId = pt.id;
        }
      });
    });

    const rotaId = document.getElementById('signup-route')?.value || autoRotaId;
    const pontoId = document.getElementById('signup-stop')?.value || autoPontoId;

    const existingUser = state.db.usuarios.find(
      (u) => String(u.email).trim().toLowerCase() === email
    );

    const id = existingUser ? existingUser.id : `usr_pax_${Date.now()}`;
    const record = {
      id,
      nome,
      email,
      senha,
      perfil: 'PASSAGEIRO',
      telefone,
      endereco,
      lat,
      lng,
      rotaId,
      pontoId,
      statusEmbarque: 'VOU',
      foto: state.tempSelfSignupPhoto || (existingUser ? existingUser.foto : ''),
      updatedAt: new Date().toISOString()
    };

    const idx = state.db.usuarios.findIndex((u) => u.id === id);
    if (idx >= 0) {
      state.db.usuarios[idx] = record;
    } else {
      state.db.usuarios.push(record);
    }

    saveLocalDb();
    renderAdminKpiCounts();
    renderAdminPassengersList();

    // Garante que ao entrar no painel do passageiro todas as rotas apareçam juntas com o ponto mais próximo destacado
    state.passengerViewRouteFilter = 'ALL';

    showToast('Cadastro concluído! Exibindo as rotas e seu ponto de parada mais próximo...', 'success');

    // Envia imediatamente para o Google Sheets
    await callGasApi({
      action: 'upsertEntity',
      sheet: 'Usuarios',
      record
    });

    closeSelfSignupModal();

    // Limpa query param ?cadastro=1 da URL sem recarregar
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Já autentica o funcionário automaticamente na tela da rota dele
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(record));
    loginSuccessRedirect(record, false);
  }

  function checkInviteLinkOnStartup() {
    updateSignupShareInputUrl();
    const params = new URLSearchParams(window.location.search);
    const isSignupLink =
      params.has('cadastro') ||
      params.get('mode') === 'cadastro' ||
      window.location.hash.includes('cadastro');

    if (isSignupLink) {
      const preferredRouteId = params.get('rota') || '';
      // Se estiver em link de convite, abre o modal de autocadastro imediatamente
      openSelfSignupModal(preferredRouteId);
      return true;
    }
    return false;
  }

  /* ==========================================================================
   * 13. BINDING DE EVENTOS GERAIS E INICIALIZAÇÃO
   * ========================================================================== */
  function bindEvents() {
    // Login & Quick Login Demo Buttons
    document.getElementById('form-login')?.addEventListener('submit', handleLoginSubmit);
    document.getElementById('btn-logout')?.addEventListener('click', handleLogout);

    document.getElementById('btn-toggle-login-pass')?.addEventListener('click', () => {
      const passEl = document.getElementById('login-password');
      passEl.type = passEl.type === 'password' ? 'text' : 'password';
    });

    document.querySelectorAll('[data-quick-login]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const role = btn.getAttribute('data-quick-login');
        const emailEl = document.getElementById('login-email');
        const passEl = document.getElementById('login-password');
        if (role === 'admin') {
          emailEl.value = 'jasantos@cymibr.com';
          passEl.value = 'Sabre0858';
        } else if (role === 'driver') {
          emailEl.value = 'carlos.mot@cymibr.com';
          passEl.value = 'cymi123';
        } else if (role === 'passenger') {
          emailEl.value = 'mariana.silva@cymibr.com';
          passEl.value = 'cymi123';
        }
        showToast('Credenciais preenchidas! Clique em Entrar no Sistema.', 'info');
      });
    });

    // Sincronizar Agora
    document.getElementById('btn-sync-now')?.addEventListener('click', () => syncWithGoogleSheets(true));

    // Alternar Modo Satélite em todos os mapas
    document.querySelectorAll('[data-toggle-satellite]').forEach((btn) => {
      btn.addEventListener('click', toggleAllMapsSatelliteMode);
    });

    // Foco rápido em Juazeiro - BA ou Petrolina - PE
    document.querySelectorAll('[data-focus-city]').forEach((btn) => {
      btn.addEventListener('click', () => {
        focusMapsOnCity(btn.getAttribute('data-focus-city'));
      });
    });

    // Alternador Rápido de Telas para o Administrador (Admin <-> Motorista 3D <-> Passageiro)
    document.querySelectorAll('[data-switch-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetRole = btn.getAttribute('data-switch-view');
        switchAdminPreviewMode(targetRole);
      });
    });

    // Sub-Abas do Admin
    document.querySelectorAll('[data-admin-tab]').forEach((btn) => {
      btn.addEventListener('click', () => switchAdminTab(btn.getAttribute('data-admin-tab')));
    });

    // Botões da Torre de Controle
    document.getElementById('btn-toggle-demo-sim')?.addEventListener('click', toggleTowerDemoSimulation);
    document.getElementById('btn-tower-fit-all')?.addEventListener('click', () => {
      if (!state.maps.tower) return;
      const bounds = new maplibregl.LngLatBounds();
      let count = 0;
      state.db.rotas.forEach((r) =>
        (r.pontos || []).forEach((pt) => {
          const lat = Number(pt.lat);
          const lng = Number(pt.lng);
          if (!isNaN(lat) && !isNaN(lng) && !isLegacySaoPauloCoord(lat, lng)) {
            bounds.extend([lng, lat]);
            count++;
          }
        })
      );
      if (count > 0) {
        state.maps.tower.fitBounds(bounds, { padding: 65, maxZoom: 14 });
      } else {
        state.maps.tower.flyTo({ center: [DEFAULT_LNG, DEFAULT_LAT], zoom: 13.2 });
      }
    });
    document.getElementById('btn-tower-toggle-3d')?.addEventListener('click', () => {
      if (!state.maps.tower) return;
      const nextPitch = state.maps.tower.getPitch() > 20 ? 0 : 60;
      state.maps.tower.easeTo({ pitch: nextPitch, duration: 600 });
    });

    // Construtor de Rotas & Modos de Clique no Mapa (Editar sem adicionar parada / Desviar Rua / Adicionar Parada)
    document.querySelectorAll('[data-builder-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-builder-mode');
        setRouteBuilderClickMode(mode);
      });
    });

    document.getElementById('form-route-builder')?.addEventListener('submit', handleSaveRouteBuilder);
    document.getElementById('btn-route-clear-form')?.addEventListener('click', resetRouteBuilderForm);
    document.getElementById('btn-recalc-osrm')?.addEventListener('click', async () => {
      await recalculateBuilderOsrm();
      renderRouteBuilderStopsAndPolyline();
      showToast('Trajeto nas ruas recalculado via OSRM!', 'success');
    });
    const triggerRouteMapSearch = async () => {
      const q = document.getElementById('route-map-search')?.value;
      const geo = await geocodeAddressString(q);
      if (geo && state.maps.routeBuilder) {
        state.maps.routeBuilder.flyTo({ center: [geo.lng, geo.lat], zoom: 15.5 });
        showToast(`Localizado: ${geo.displayName.split(',')[0]}`, 'success');
      } else {
        showToast('Endereço não encontrado em Juazeiro/Petrolina.', 'warning');
      }
    };
    document.getElementById('btn-route-map-search')?.addEventListener('click', triggerRouteMapSearch);
    document.getElementById('route-map-search')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerRouteMapSearch();
      }
    });

    // CRUD Funcionários / Passageiros
    document.getElementById('form-admin-passenger')?.addEventListener('submit', handleSaveAdminPassenger);
    document.getElementById('btn-pax-reset')?.addEventListener('click', resetAdminPassengerForm);
    document.getElementById('search-admin-pax')?.addEventListener('input', renderAdminPassengersList);
    document.getElementById('pax-route')?.addEventListener('change', (e) => updatePaxStopsDropdown(e.target.value));

    document.getElementById('pax-photo-input')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const b64 = await compressImageToBase64(file, 150, 0.72);
      state.tempAdminPaxPhoto = b64;
      document.getElementById('pax-photo-preview').src = b64;
      showToast('Foto comprimida para 150x150px Base64 (compatível com célula do Sheets)!', 'success');
    });

    document.getElementById('btn-pax-geocode')?.addEventListener('click', async () => {
      const addr = document.getElementById('pax-address').value;
      const geo = await geocodeAddressString(addr);
      if (geo) {
        document.getElementById('pax-lat').value = geo.lat.toFixed(6);
        document.getElementById('pax-lng').value = geo.lng.toFixed(6);
        document.getElementById('pax-lat-display').textContent = geo.lat.toFixed(6);
        document.getElementById('pax-lng-display').textContent = geo.lng.toFixed(6);
        if (state.maps.paxPicker && state.markers.paxPickerMarker) {
          state.markers.paxPickerMarker.setLngLat([geo.lng, geo.lat]);
          state.maps.paxPicker.flyTo({ center: [geo.lng, geo.lat], zoom: 15.5 });
        }
        showToast('Coordenadas GPS localizadas pelo endereço!', 'success');
      } else {
        showToast('Não foi possível encontrar o endereço. Clique diretamente no mapa.', 'warning');
      }
    });

    // CRUD Frota e Motoristas
    document.getElementById('form-admin-fleet')?.addEventListener('submit', handleSaveAdminFleet);
    document.getElementById('btn-fleet-reset')?.addEventListener('click', resetAdminFleetForm);
    document.getElementById('form-admin-driver')?.addEventListener('submit', handleSaveAdminDriver);
    document.getElementById('btn-driver-reset')?.addEventListener('click', resetAdminDriverForm);

    // Painel do Passageiro (Alternador IDA/VOLTA + Escolha de Rota e Ponto de Subida/Descida)
    document.getElementById('btn-pax-mode-ida')?.addEventListener('click', () => setPassengerShiftMode('IDA'));
    document.getElementById('btn-pax-mode-volta')?.addEventListener('click', () => setPassengerShiftMode('VOLTA'));

    document.getElementById('pax-select-route')?.addEventListener('change', (e) => {
      const routeId = e.target.value;
      if (state.passengerShiftMode === 'VOLTA') {
        state.passengerSelectedRouteVolta = routeId;
      } else {
        state.passengerSelectedRouteIda = routeId;
      }
      renderPassengerLiveView();
    });

    document.getElementById('pax-select-stop')?.addEventListener('change', (e) => {
      const routeId = document.getElementById('pax-select-route')?.value;
      const stopId = e.target.value;
      if (routeId && stopId) {
        savePassengerStopChoice(state.passengerShiftMode, routeId, stopId);
      }
    });

    document.getElementById('btn-pax-confirm-stop')?.addEventListener('click', () => {
      const routeId = document.getElementById('pax-select-route')?.value;
      const stopId = document.getElementById('pax-select-stop')?.value;
      if (routeId && stopId) {
        savePassengerStopChoice(state.passengerShiftMode, routeId, stopId);
      }
    });

    document.getElementById('btn-pax-status-going')?.addEventListener('click', () => updatePassengerBoardingStatus('VOU'));
    document.getElementById('btn-pax-status-skip')?.addEventListener('click', () => updatePassengerBoardingStatus('NAO_VOU'));
    document.getElementById('btn-pax-open-profile')?.addEventListener('click', () => setPaxTab('perfil'));
    document.getElementById('btn-pax-close-profile')?.addEventListener('click', () => setPaxTab('mapa'));
    document.querySelectorAll('[data-pax-tab]').forEach((btn) => {
      btn.addEventListener('click', () => setPaxTab(btn.getAttribute('data-pax-tab')));
    });
    document.querySelectorAll('[data-driver-tab]').forEach((btn) => {
      btn.addEventListener('click', () => setDriverTab(btn.getAttribute('data-driver-tab')));
    });

    document.getElementById('btn-pax-locate-me')?.addEventListener('click', () => {
      const flyToSelf = () => {
        if (state.maps.passengerLive) {
          state.maps.passengerLive.flyTo({
            center: [Number(state.passengerGps.lng), Number(state.passengerGps.lat)],
            zoom: 16.4,
            duration: 750
          });
        }
      };

      if ('geolocation' in navigator) {
        showToast('Atualizando seu GPS em tempo real...', 'info');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            state.passengerGps.lat = Number(pos.coords.latitude.toFixed(6));
            state.passengerGps.lng = Number(pos.coords.longitude.toFixed(6));
            state.passengerGps.hasRealGpsFix = true;
            renderPassengerLiveView();
            flyToSelf();
            showToast('Mapa centralizado na sua localização GPS atual!', 'success');
          },
          () => {
            flyToSelf();
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
        );
      } else {
        flyToSelf();
      }
    });

    document.getElementById('btn-pax-focus-bus')?.addEventListener('click', async () => {
      if (!state.maps.passengerLive) return;

      // Busca telemetria fresca imediatamente caso esteja online
      if (state.gasUrl && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
        try {
          const res = await callGasApi({ action: 'telemetry' });
          if (res && res.ok && Array.isArray(res.telemetria) && res.telemetria.length > 0) {
            state.db.telemetria = res.telemetria;
            saveLocalDb(false);
            renderPassengerLiveView();
          }
        } catch (e) {}
      }

      // Identifica a rota ativa ou a rota atualmente selecionada pelo usuário
      const selectedRouteId =
        document.getElementById('pax-select-route')?.value ||
        (state.passengerShiftMode === 'VOLTA'
          ? state.passengerSelectedRouteVolta
          : state.passengerSelectedRouteIda);

      const openRoute = (state.db.rotas || []).find((r) => r.status === 'EM_ANDAMENTO');
      const targetRoute =
        (state.db.rotas || []).find((r) => r.id === selectedRouteId) ||
        openRoute ||
        (state.db.rotas || [])[0];

      // Se o próprio motorista estiver rodando no mesmo navegador/dispositivo com GPS real, usa a posição ao vivo dele
      let busLat = null;
      let busLng = null;

      if (
        state.driverRuntime.hasRealGpsFix &&
        targetRoute &&
        state.driverRuntime.activeRouteId === targetRoute.id
      ) {
        busLat = Number(state.driverRuntime.currentLat);
        busLng = Number(state.driverRuntime.currentLng);
      } else {
        const tel =
          (targetRoute && state.db.telemetria.find((t) => t.rotaId === targetRoute.id)) ||
          (openRoute && state.db.telemetria.find((t) => t.rotaId === openRoute.id)) ||
          state.db.telemetria.find((t) => t.statusRota === 'EM_ANDAMENTO') ||
          state.db.telemetria[0];

        if (tel && tel.lat && tel.lng) {
          busLat = Number(tel.lat);
          busLng = Number(tel.lng);
        } else if (targetRoute && targetRoute.pontos && targetRoute.pontos[0]) {
          busLat = Number(targetRoute.pontos[0].lat);
          busLng = Number(targetRoute.pontos[0].lng);
        }
      }

      if (busLat !== null && busLng !== null && !isNaN(busLat) && !isNaN(busLng)) {
        state.maps.passengerLive.flyTo({
          center: [busLng, busLat],
          zoom: 16.2,
          duration: 800
        });
        if (Array.isArray(state.markers.passengerBuses) && state.markers.passengerBuses[0]) {
          const marker = state.markers.passengerBuses[0];
          marker.setLngLat([busLng, busLat]);
          const popup = marker.getPopup();
          if (popup && !popup.isOpen()) {
            marker.togglePopup();
          }
        }
        showToast(
          `Focado na localização atual do ônibus${targetRoute ? ` (${targetRoute.nome})` : ''}!`,
          'success'
        );
      } else {
        showToast('Aguardando sinal de GPS do ônibus desta rota.', 'warning');
      }
    });

    document.getElementById('self-pax-photo-input')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const b64 = await compressImageToBase64(file, 150, 0.72);
      state.tempSelfPaxPhoto = b64;
      document.getElementById('self-pax-photo-preview').src = b64;
      showToast('Foto comprimida em 150x150px pronta para salvar!', 'success');
    });

    document.getElementById('btn-self-pax-geocode')?.addEventListener('click', async () => {
      const addr = document.getElementById('self-pax-address').value;
      const geo = await geocodeAddressString(addr);
      if (geo) {
        document.getElementById('self-pax-lat').value = geo.lat.toFixed(6);
        document.getElementById('self-pax-lng').value = geo.lng.toFixed(6);
        document.getElementById('self-pax-lat-label').textContent = geo.lat.toFixed(6);
        document.getElementById('self-pax-lng-label').textContent = geo.lng.toFixed(6);
        if (state.maps.selfPaxHome && state.markers.selfHomeMarker) {
          state.markers.selfHomeMarker.setLngLat([geo.lng, geo.lat]);
          state.maps.selfPaxHome.flyTo({ center: [geo.lng, geo.lat], zoom: 15.5 });
        }
      }
    });

    document.getElementById('form-passenger-profile')?.addEventListener('submit', handleSavePassengerSelfProfile);

    // Autocadastro de Funcionários por Link (?cadastro=1) e Compartilhamento WhatsApp
    document.getElementById('btn-open-self-signup')?.addEventListener('click', () => openSelfSignupModal());
    document.getElementById('btn-close-self-signup')?.addEventListener('click', closeSelfSignupModal);
    document.getElementById('btn-cancel-self-signup')?.addEventListener('click', closeSelfSignupModal);
    document.getElementById('form-self-signup')?.addEventListener('submit', handleSelfSignupSubmit);

    document.getElementById('signup-photo-input')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const b64 = await compressImageToBase64(file, 150, 0.72);
      state.tempSelfSignupPhoto = b64;
      document.getElementById('signup-photo-preview').src = b64;
      showToast('Foto carregada e otimizada com sucesso!', 'success');
    });

    document.getElementById('btn-signup-geocode')?.addEventListener('click', async () => {
      const addr = document.getElementById('signup-address')?.value;
      const geo = await geocodeAddressString(addr);
      if (geo) {
        const la = Number(geo.lat.toFixed(6));
        const ln = Number(geo.lng.toFixed(6));
        document.getElementById('signup-lat').value = la;
        document.getElementById('signup-lng').value = ln;
        document.getElementById('signup-lat-display').textContent = la;
        document.getElementById('signup-lng-display').textContent = ln;
        if (state.maps.selfSignup && state.markers.selfSignupMarker) {
          state.markers.selfSignupMarker.setLngLat([ln, la]);
          state.maps.selfSignup.flyTo({ center: [ln, la], zoom: 16 });
        }
        populateSelfSignupRouteAndStops(document.getElementById('signup-route')?.value);
        showToast('Endereço localizado no mapa!', 'success');
      } else {
        showToast('Endereço não encontrado. Toque diretamente na sua rua no mapa.', 'warning');
      }
    });

    document.getElementById('btn-signup-my-gps')?.addEventListener('click', () => {
      if (!('geolocation' in navigator)) {
        showToast('GPS não suportado neste navegador.', 'warning');
        return;
      }
      const addrEl = document.getElementById('signup-address');
      if (addrEl) {
        addrEl.placeholder = 'Obtendo GPS e preenchendo seu endereço automaticamente...';
      }
      showToast('Obtendo localização GPS e endereço da sua rua...', 'info');
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const la = Number(pos.coords.latitude.toFixed(6));
          const ln = Number(pos.coords.longitude.toFixed(6));
          document.getElementById('signup-lat').value = la;
          document.getElementById('signup-lng').value = ln;
          document.getElementById('signup-lat-display').textContent = la;
          document.getElementById('signup-lng-display').textContent = ln;
          if (state.maps.selfSignup && state.markers.selfSignupMarker) {
            state.markers.selfSignupMarker.setLngLat([ln, la]);
            state.maps.selfSignup.flyTo({ center: [ln, la], zoom: 16.5 });
          }
          populateSelfSignupRouteAndStops(document.getElementById('signup-route')?.value);

          const revAddr = await reverseGeocodeCoords(la, ln);
          if (addrEl) {
            addrEl.value = revAddr || `Localização GPS (${la}, ${ln})`;
          }
          showToast(
            revAddr
              ? `Endereço preenchido automaticamente: ${revAddr}`
              : 'Sua localização GPS atual foi marcada e preenchida!',
            'success'
          );
        },
        () => {
          showToast('Permissão de GPS negada. Toque no mapa para marcar sua casa.', 'warning');
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
      );
    });

    document.querySelectorAll('[data-signup-city]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-signup-city');
        const city = CITY_COORDS[key] || CITY_COORDS.juazeiro;
        if (state.maps.selfSignup) {
          state.maps.selfSignup.flyTo({ center: [city.lng, city.lat], zoom: 14.2 });
        }
      });
    });

    document.getElementById('btn-copy-signup-link')?.addEventListener('click', async () => {
      const link = getPublicSignupInviteUrl();
      try {
        await navigator.clipboard.writeText(link);
        showToast('Link de cadastro copiado! Agora é só colar no WhatsApp.', 'success');
      } catch (e) {
        const input = document.getElementById('input-signup-share-url');
        if (input) {
          input.select();
          document.execCommand('copy');
        }
        showToast('Link copiado!', 'success');
      }
    });

    document.getElementById('btn-whatsapp-signup-link')?.addEventListener('click', () => {
      const link = getPublicSignupInviteUrl();
      const msg =
        `🚌 *Cadastro Transporte Corporativo — RotaCYMI*\n\n` +
        `Olá! Acesse o link abaixo pelo celular para se cadastrar na sua rota, marcar sua residência no mapa e acompanhar o ônibus ao vivo:\n\n` +
        `👉 ${link}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    });

    // Painel do Motorista 3D
    document.getElementById('driver-select-route')?.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      const targetRoute = state.db.rotas.find((r) => r.id === selectedId);
      if (targetRoute) {
        state.driverRuntime.activeRouteId = targetRoute.id;
        state.driverRuntime.simCoordIndex = 0;
        if (!state.driverRuntime.hasRealGpsFix && targetRoute.pontos && targetRoute.pontos.length > 0) {
          state.driverRuntime.currentLat = Number(targetRoute.pontos[0].lat);
          state.driverRuntime.currentLng = Number(targetRoute.pontos[0].lng);
        }
        renderDriverCockpitView();
      }
    });
    document.getElementById('btn-driver-start-route')?.addEventListener('click', startDriverTripExecution);
    document.getElementById('btn-driver-finish-route')?.addEventListener('click', () => stopDriverTripExecution(true));
    document.getElementById('btn-driver-simulate-gps')?.addEventListener('click', toggleDriver3dRouteSimulation);
    document.getElementById('btn-driver-zoom-out-route')?.addEventListener('click', zoomOutDriverFullRoute);
    document.getElementById('btn-driver-recenter-3d')?.addEventListener('click', recenterDriver3dCamera);
    document.getElementById('btn-driver-fullscreen')?.addEventListener('click', toggleDriverMapFullscreen);

    // Sincroniza saída da Tela Cheia caso o usuário pressione ESC no computador
    document.addEventListener('fullscreenchange', () => {
      const card = document.getElementById('driver-map-card');
      const label = document.getElementById('label-driver-fullscreen');
      if (!document.fullscreenElement && state.driverRuntime.isFullscreen) {
        state.driverRuntime.isFullscreen = false;
        card?.classList.remove('cymi-map-fullscreen');
        if (label) label.textContent = 'Tela Cheia';
        setTimeout(() => {
          if (state.maps.driver3d) state.maps.driver3d.resize();
        }, 60);
      }
    });

    // Listeners de Rede (Modo Offline <-> Online) para sincronização automática sem perda de dados
    window.addEventListener('online', async () => {
      updateConnectionBadge();
      showToast('Conexão com a internet restabelecida! Sincronizando dados offline...', 'success');
      await flushOfflineQueue();
      await syncWithGoogleSheets(false);
    });

    window.addEventListener('offline', () => {
      updateConnectionBadge();
      showToast('Você está sem internet. O RotaCYMI continuará funcionando em Modo Offline!', 'warning');
    });

    // Sincronização instantânea (0ms) entre abas/janelas abertas no mesmo dispositivo
    if (realtimeChannel) {
      realtimeChannel.onmessage = (ev) => {
        if (ev.data && ev.data.type === 'DB_UPDATED') {
          try {
            const raw = localStorage.getItem(STORAGE_KEYS.DB_CACHE);
            if (raw) {
              state.db = JSON.parse(raw);
              refreshActiveViews();
            }
          } catch (e) {}
        }
      };
    }

    window.addEventListener('storage', (ev) => {
      if (ev.key === STORAGE_KEYS.DB_CACHE && ev.newValue) {
        try {
          state.db = JSON.parse(ev.newValue);
          refreshActiveViews();
        } catch (e) {}
      }
    });
  }

  /* ==========================================================================
   * 14. BOOTSTRAP DA APLICAÇÃO
   * ========================================================================== */
  document.addEventListener('DOMContentLoaded', async () => {
    refreshIcons();
    updateConnectionBadge();
    setupSmartPwaInstaller();
    setupApiConfigModal();
    bindEvents();

    // Verifica se o funcionário abriu o Link de Convite de Autocadastro (?cadastro=1)
    const openedViaInviteLink = checkInviteLinkOnStartup();

    // Se não for link de cadastro e já houver sessão salva ("Lembrar-me"), entra direto no painel
    if (!openedViaInviteLink) {
      checkExistingSession();
    }

    // Sincronização em background com Google Sheets se a URL estiver configurada e houver internet
    if (state.gasUrl && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
      await syncWithGoogleSheets(false);
      // Atualiza lista de rotas no modal de autocadastro caso esteja aberto
      if (openedViaInviteLink) {
        const params = new URLSearchParams(window.location.search);
        populateSelfSignupRouteAndStops(params.get('rota') || '');
      }
    }

    // Polling em tempo real acelerado (a cada 3.5 segundos) quando online e conectado ao Google Sheets
    state.pollingInterval = setInterval(async () => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        updateConnectionBadge();
        return;
      }
      if (state.gasUrl && state.currentUser) {
        const res = await callGasApi({ action: 'telemetry' });
        if (res && res.ok) {
          if (Array.isArray(res.telemetria) && res.telemetria.length > 0) {
            state.db.telemetria = res.telemetria;
            // Sincroniza em tempo real quais rotas estão ABERTAS (EM_ANDAMENTO) ou FECHADAS (PARADA)
            res.telemetria.forEach((tel) => {
              const r = state.db.rotas.find((rt) => rt.id === tel.rotaId);
              // Telemetria antiga (>3 min sem atualizar) não mantém a rota aberta: o motorista precisa iniciar
              const isFresh = tel.updatedAt && Date.now() - new Date(tel.updatedAt).getTime() < 3 * 60 * 1000;
              if (r && tel.statusRota) {
                r.status = tel.statusRota === 'EM_ANDAMENTO' && isFresh ? 'EM_ANDAMENTO' : 'PARADA';
              }
            });
          }
          saveLocalDb(false);
          refreshActiveViews();
        }
      }
    }, 3500);
  });
})();
