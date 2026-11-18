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
    GAS_URL: 'rotacymi_gas_webapp_url_v1'
  };

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
          nome: 'Rota 01 — Juazeiro (BA) / Petrolina (PE) / Sede CYMI',
          turno: 'Manhã',
          veiculoId: 'veic_101',
          motoristaId: 'mot_01',
          status: 'EM_ANDAMENTO',
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
          statusRota: 'EM_ANDAMENTO',
          proximoPontoId: 'pto_03',
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
      watchId: null
    },

    // Estado de Viagem, WakeLock, WatchPosition e Simulador do Motorista 3D
    driverRuntime: {
      activeRouteId: 'rota_01',
      isTripRunning: false,
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
      dbObj.rotas.forEach((r) => {
        if (Array.isArray(r.pontos) && r.pontos.length > 0 && isLegacySaoPauloCoord(r.pontos[0].lat, r.pontos[0].lng)) {
          const seedRoute = createInitialSeedData().rotas[0];
          r.nome = seedRoute.nome;
          r.pontos = seedRoute.pontos;
          r.polyline = seedRoute.polyline;
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

  function saveLocalDb() {
    ensureMasterAdminInDb(state.db);
    migrateLegacySaoPauloCoords(state.db);
    localStorage.setItem(STORAGE_KEYS.DB_CACHE, JSON.stringify(state.db));
  }

  /**
   * Chama o Google Apps Script usando `text/plain;charset=utf-8` no POST
   * para evitar bloqueios de CORS Preflight OPTIONS do Google Apps Script.
   */
  async function callGasApi(payload) {
    const url = (state.gasUrl || '').trim();
    if (!url) {
      return { ok: true, localOnly: true };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
      const json = await response.json();
      return json;
    } catch (err) {
      console.warn('Aviso na comunicação com Google Apps Script:', err);
      return { ok: false, error: err.message || String(err) };
    }
  }

  async function syncWithGoogleSheets(showToastFeedback = false) {
    const spinIcon = document.getElementById('icon-sync-spin');
    if (spinIcon) spinIcon.classList.add('animate-spin');

    updateConnectionBadge();

    if (!state.gasUrl) {
      if (spinIcon) setTimeout(() => spinIcon.classList.remove('animate-spin'), 350);
      if (showToastFeedback) {
        showToast('Dados sincronizados no armazenamento local. Configure a URL do Apps Script quando desejar conectar à planilha.', 'info');
      }
      refreshActiveViews();
      return;
    }

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
      showToast('Operando com cache local (verifique a URL do Google Apps Script).', 'warning');
    }
  }

  function updateConnectionBadge() {
    const textEl = document.getElementById('text-connection-mode');
    if (!textEl) return;
    if (state.gasUrl) {
      textEl.textContent = 'Sheets Cloud Ativo';
    } else {
      textEl.textContent = 'Tempo Real (Local + OSRM)';
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
        ? 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 transition'
        : 'px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white transition';
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
        switcherEl.classList.add('flex');
      } else {
        switcherEl.classList.add('hidden');
        switcherEl.classList.remove('flex');
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

    document.getElementById('header-user-box').classList.add('hidden');
    document.getElementById('admin-view-switcher')?.classList.add('hidden');
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

    // Renderiza lista lateral de rotas na Torre
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

          return `
            <div class="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 transition cursor-pointer" data-focus-route="${r.id}">
              <div class="flex items-center justify-between gap-2">
                <span class="status-pill ${isLive ? 'live' : 'idle'}">${isLive ? 'EM ROTA' : r.status || 'PARADA'}</span>
                <span class="font-mono-num text-xs font-bold text-sky-400">${speed} km/h</span>
              </div>
              <h4 class="text-sm font-bold text-white mt-2">${r.nome}</h4>
              <p class="text-xs text-slate-400 mt-0.5">${veh ? `${veh.prefixo} (${veh.placa})` : 'Sem veículo'} • ${drv ? drv.nome : 'Sem motorista'}</p>
              <div class="flex items-center justify-between text-[11px] text-slate-300 mt-3 pt-2 border-t border-slate-800/80">
                <span>Turno: <strong>${r.turno}</strong></span>
                <span class="text-emerald-400 font-semibold">${paxGoing}/${paxInRoute.length} embarcando hoje</span>
              </div>
            </div>
          `;
        })
        .join('');

      listContainer.querySelectorAll('[data-focus-route]').forEach((card) => {
        card.addEventListener('click', () => {
          const rId = card.getAttribute('data-focus-route');
          const rObj = state.db.rotas.find((r) => r.id === rId);
          if (rObj && Array.isArray(rObj.pontos) && rObj.pontos.length > 0 && state.maps.tower) {
            const bounds = new maplibregl.LngLatBounds();
            rObj.pontos.forEach((pt) => bounds.extend([Number(pt.lng), Number(pt.lat)]));
            state.maps.tower.fitBounds(bounds, { padding: 65, maxZoom: 14.8, duration: 850 });
          }
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

    const routeObj = {
      id: routeId,
      nome: document.getElementById('route-name').value.trim(),
      turno: document.getElementById('route-shift').value,
      veiculoId: document.getElementById('route-vehicle').value,
      motoristaId: document.getElementById('route-driver').value,
      status: existingRoute ? existingRoute.status : 'EM_ANDAMENTO',
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
        statusRota: 'EM_ANDAMENTO',
        proximoPontoId: routeObj.pontos[0].id,
        updatedAt: new Date().toISOString()
      });
    }

    saveLocalDb();
    populateAdminSelectDropdowns();
    renderSavedRoutesListAdmin();
    showToast(`Rota "${routeObj.nome}" atualizada e salva com sucesso!`, 'success');

    await callGasApi({
      action: 'upsertEntity',
      sheet: 'Rotas',
      record: routeObj
    });
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
        return `
          <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
            <div>
              <div class="text-xs font-bold text-white">${r.nome}</div>
              <div class="text-[11px] text-slate-400">
                ${r.turno} • ${stopsCount} paradas${waypointsCount > 0 ? ` (+${waypointsCount} desvios)` : ''} • ${r.distanciaKm || 0} km • ${veh ? veh.prefixo : ''} (${drv ? drv.nome : ''})
              </div>
            </div>
            <div class="flex items-center gap-1.5">
              <button type="button" data-edit-route="${r.id}" class="btn-secondary !py-1 !px-2.5 text-xs">Editar</button>
              <button type="button" data-del-route="${r.id}" class="btn-secondary !py-1 !px-2.5 text-xs text-rose-400">Excluir</button>
            </div>
          </div>
        `;
      })
      .join('');

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
  async function initPassengerModule() {
    // Atualiza referência do usuário a partir do banco
    const freshUser = state.db.usuarios.find((u) => u.id === state.currentUser.id) || state.currentUser;
    state.currentUser = freshUser;

    // Define localização inicial como a residência cadastrada até o GPS responder
    if (freshUser.lat && freshUser.lng && !isLegacySaoPauloCoord(freshUser.lat, freshUser.lng)) {
      state.passengerGps.lat = Number(freshUser.lat);
      state.passengerGps.lng = Number(freshUser.lng);
    }

    // Inicia captura de GPS do celular do passageiro
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          state.passengerGps.lat = pos.coords.latitude;
          state.passengerGps.lng = pos.coords.longitude;
          renderPassengerLiveView();
        },
        () => {
          // Mantém coordenadas da residência caso o usuário negue permissão no navegador desktop
          renderPassengerLiveView();
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }

    setTimeout(() => {
      initPassengerLiveMap();
      renderPassengerLiveView();
    }, 60);
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
      // Fonte da Polyline da Rota do Ônibus
      map.addSource('pax-route-source', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
      });

      map.addLayer({
        id: 'pax-route-line',
        type: 'line',
        source: 'pax-route-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#0ea5e9',
          'line-width': 4.5,
          'line-opacity': 0.9
        }
      });

      // Fonte da Linha Pontilhada Verde até o Ponto Mais Próximo (Haversine)
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

  function renderPassengerLiveView() {
    if (!state.currentUser) return;
    const user = state.db.usuarios.find((u) => u.id === state.currentUser.id) || state.currentUser;
    const rota =
      state.db.rotas.find((r) => r.id === user.rotaId) ||
      state.db.rotas[0];

    if (!rota) return;

    const veh = state.db.veiculos.find((v) => v.id === rota.veiculoId);
    const drv = state.db.motoristas.find((m) => m.id === rota.motoristaId);
    const tel = state.db.telemetria.find((t) => t.rotaId === rota.id) || {
      lat: rota.pontos[0]?.lat || DEFAULT_LAT,
      lng: rota.pontos[0]?.lng || DEFAULT_LNG,
      velocidade: 34,
      heading: 0,
      statusRota: rota.status
    };

    // Cabeçalho da Rota do Passageiro
    document.getElementById('pax-live-route-name').textContent = rota.nome;
    document.getElementById('pax-live-vehicle-info').textContent = `${
      veh ? `${veh.prefixo} (${veh.placa})` : 'Ônibus Corporativo'
    } • Motorista: ${drv ? drv.nome : '—'} • Turno ${rota.turno}`;

    const statusBadge = document.getElementById('pax-live-route-status');
    statusBadge.textContent = rota.status === 'EM_ANDAMENTO' ? 'ÔNIBUS EM ROTA' : rota.status;
    statusBadge.className = `status-pill ${rota.status === 'EM_ANDAMENTO' ? 'live' : 'idle'}`;

    // Destaca botão de status de embarque atual ("Vou embarcar hoje" vs "Não vou utilizar hoje")
    const isGoing = user.statusEmbarque !== 'NAO_VOU';
    const btnGoing = document.getElementById('btn-pax-status-going');
    const btnSkip = document.getElementById('btn-pax-status-skip');
    if (btnGoing && btnSkip) {
      btnGoing.classList.toggle('ring-2', isGoing);
      btnGoing.classList.toggle('ring-emerald-300', isGoing);
      btnSkip.classList.toggle('ring-2', !isGoing);
      btnSkip.classList.toggle('ring-rose-400', !isGoing);
    }

    // Cálculo via Fórmula de Haversine para encontrar o Ponto de Embarque Mais Próximo
    const userLat = Number(state.passengerGps.lat || user.lat || DEFAULT_LAT);
    const userLng = Number(state.passengerGps.lng || user.lng || DEFAULT_LNG);

    let nearestStop = null;
    let minDistanceMeters = Infinity;

    const boardingStops = getBoardingStopsOnly(rota);
    const stopsWithDist = boardingStops.map((pt, idx) => {
      const dist = calculateHaversineMeters(userLat, userLng, Number(pt.lat), Number(pt.lng));
      if (dist < minDistanceMeters) {
        minDistanceMeters = dist;
        nearestStop = { ...pt, index: idx + 1, distMeters: dist };
      }
      return { ...pt, index: idx + 1, distMeters: dist };
    });

    // Atualiza Card do Ponto Mais Próximo
    if (nearestStop) {
      document.getElementById('pax-nearest-name').textContent = nearestStop.nome;
      document.getElementById('pax-nearest-eta').textContent = `Previsto ${nearestStop.horario}`;
      document.getElementById('pax-nearest-distance').textContent =
        nearestStop.distMeters >= 1000
          ? `${(nearestStop.distMeters / 1000).toFixed(2)} km`
          : `${nearestStop.distMeters} m`;
    }
    document.getElementById('pax-bus-speed').textContent = `${Math.round(Number(tel.velocidade || 0))} km/h`;

    // Renderiza Timeline de todos os pontos da rota
    const timelineEl = document.getElementById('pax-stops-timeline');
    if (timelineEl) {
      timelineEl.innerHTML = stopsWithDist
        .map((pt) => {
          const isNearest = nearestStop && nearestStop.id === pt.id;
          return `
            <div class="p-3 rounded-xl border transition ${
              isNearest
                ? 'bg-emerald-950/40 border-emerald-500/50'
                : 'bg-slate-900/75 border-slate-800'
            } flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <span class="w-6 h-6 rounded-full ${
                  isNearest ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-sky-400'
                } text-xs font-bold font-mono flex items-center justify-center shrink-0">${pt.index}</span>
                <div>
                  <div class="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>${pt.nome}</span>
                    ${
                      isNearest
                        ? '<span class="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-300 font-bold">MAIS PRÓXIMO</span>'
                        : ''
                    }
                  </div>
                  <div class="text-[11px] text-slate-400">Distância: <strong class="font-mono text-slate-200">${pt.distMeters} m</strong></div>
                </div>
              </div>
              <div class="font-mono text-xs font-bold ${isNearest ? 'text-emerald-400' : 'text-sky-400'}">${pt.horario}</div>
            </div>
          `;
        })
        .join('');
    }

    // Atualiza Mapa ao Vivo do Passageiro
    const map = state.maps.passengerLive;
    if (!map || !map.getSource('pax-route-source')) return;

    map.getSource('pax-route-source').setData({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: rota.polyline || []
      }
    });

    if (nearestStop) {
      map.getSource('pax-nearest-dotted-source').setData({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [userLng, userLat],
            [Number(nearestStop.lng), Number(nearestStop.lat)]
          ]
        }
      });
    }

    // Limpa marcadores anteriores dos pontos
    state.markers.passengerStops.forEach((m) => m.remove());
    state.markers.passengerStops = [];

    stopsWithDist.forEach((pt) => {
      const isNearest = nearestStop && nearestStop.id === pt.id;
      const el = document.createElement('div');
      el.className = `cymi-stop-marker ${isNearest ? 'is-nearest' : ''}`;
      el.innerHTML = `
        <div class="cymi-stop-badge">
          <span>${isNearest ? '★ MAIS PRÓXIMO' : `P${pt.index}`}</span>
          <span class="font-mono">${pt.horario}</span>
        </div>
        <div class="cymi-stop-pin"></div>
      `;

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([Number(pt.lng), Number(pt.lat)])
        .setPopup(
          new maplibregl.Popup({ offset: 18 }).setHTML(`
            <div class="text-xs">
              <div class="font-bold ${isNearest ? 'text-emerald-400' : 'text-sky-400'}">${pt.nome}</div>
              <div class="text-slate-300 mt-1">Horário previsto: <strong class="font-mono">${pt.horario}</strong></div>
              <div class="text-slate-300">Distância de você: <strong class="font-mono">${pt.distMeters} m</strong></div>
            </div>
          `)
        )
        .addTo(map);
      state.markers.passengerStops.push(marker);
    });

    // Marcador da própria localização do passageiro
    if (state.markers.passengerSelf) state.markers.passengerSelf.remove();
    const selfEl = document.createElement('div');
    selfEl.className = 'cymi-user-marker';
    selfEl.innerHTML = user.foto ? `<img src="${user.foto}" alt="Eu" />` : '<span>EU</span>';
    state.markers.passengerSelf = new maplibregl.Marker({ element: selfEl })
      .setLngLat([userLng, userLat])
      .setPopup(new maplibregl.Popup({ offset: 14 }).setHTML('<div class="text-xs font-bold">Sua Localização Atual</div>'))
      .addTo(map);

    // Marcador do Ônibus em Tempo Real
    if (state.markers.passengerBus) state.markers.passengerBus.remove();
    const busEl = document.createElement('div');
    busEl.className = 'cymi-bus-marker';
    busEl.innerHTML = `
      <div class="cymi-bus-pulse"></div>
      <div class="cymi-bus-marker-inner">🚌</div>
    `;
    state.markers.passengerBus = new maplibregl.Marker({ element: busEl })
      .setLngLat([Number(tel.lng), Number(tel.lat)])
      .setPopup(
        new maplibregl.Popup({ offset: 18 }).setHTML(`
          <div class="text-xs">
            <div class="font-bold text-sky-400">${veh ? veh.prefixo : 'Ônibus da Rota'}</div>
            <div class="text-white font-semibold">${rota.nome}</div>
            <div class="font-mono text-emerald-400 mt-1">${Math.round(Number(tel.velocidade || 0))} km/h</div>
          </div>
        `)
      )
      .addTo(map);
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
    document.getElementById('pax-tab-map').classList.add('hidden');
    document.getElementById('pax-tab-profile').classList.remove('hidden');

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

    document.getElementById('pax-tab-profile').classList.add('hidden');
    document.getElementById('pax-tab-map').classList.remove('hidden');
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
  async function initDriverModule() {
    // Localiza a rota vinculada ao motorista logado
    const driverId = state.currentUser.id;
    const assignedRoute =
      state.db.rotas.find((r) => r.motoristaId === driverId) ||
      state.db.rotas[0];

    if (assignedRoute) {
      state.driverRuntime.activeRouteId = assignedRoute.id;
      if (assignedRoute.pontos && assignedRoute.pontos.length > 0) {
        state.driverRuntime.currentLat = Number(assignedRoute.pontos[0].lat);
        state.driverRuntime.currentLng = Number(assignedRoute.pontos[0].lng);
      }
    }

    setTimeout(() => {
      initDriver3dMap();
      renderDriverCockpitView();
    }, 60);
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

    const veh = state.db.veiculos.find((v) => v.id === rota.veiculoId);
    const passengers = state.db.usuarios.filter(
      (u) => u.perfil === 'PASSAGEIRO' && u.rotaId === rota.id
    );
    const goingPassengers = passengers.filter((p) => p.statusEmbarque !== 'NAO_VOU');

    document.getElementById('driver-route-title').textContent = rota.nome;
    document.getElementById('driver-vehicle-subtitle').textContent = `${
      veh ? `${veh.prefixo} (${veh.placa}) • ${veh.modelo}` : 'Ônibus Corporativo'
    } • Turno ${rota.turno}`;

    document.getElementById('driver-hud-speed').textContent = Math.round(state.driverRuntime.currentSpeed || 0);
    document.getElementById('driver-hud-heading').textContent = Math.round(state.driverRuntime.currentHeading || 0);
    document.getElementById('driver-hud-pax-count').textContent = `${goingPassengers.length}/${passengers.length}`;

    const boardingStops = getBoardingStopsOnly(rota);

    // Renderiza Lista de Pontos de Parada
    const stopsEl = document.getElementById('driver-stops-list');
    if (stopsEl) {
      stopsEl.innerHTML = boardingStops
        .map((pt, idx) => {
          const paxAtStop = goingPassengers.filter((p) => p.pontoId === pt.id).length;
          return `
            <div class="p-2.5 rounded-xl bg-slate-900/85 border border-slate-800 flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <span class="w-6 h-6 rounded-full bg-sky-500/20 text-sky-300 font-mono text-xs font-bold flex items-center justify-center">${idx + 1}</span>
                <div>
                  <div class="text-xs font-bold text-white">${pt.nome}</div>
                  <div class="text-[11px] text-emerald-400">${paxAtStop} colaborador(es) aguardando</div>
                </div>
              </div>
              <span class="font-mono text-xs font-bold text-sky-400">${pt.horario}</span>
            </div>
          `;
        })
        .join('');
    }

    // Renderiza Lista de Passageiros da Rota
    const paxEl = document.getElementById('driver-passengers-list');
    if (paxEl) {
      paxEl.innerHTML = passengers
        .map((p) => {
          const isGoing = p.statusEmbarque !== 'NAO_VOU';
          const stopObj = boardingStops.find((pt) => pt.id === p.pontoId);
          return `
            <div class="p-2.5 rounded-xl bg-slate-900/85 border border-slate-800 flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <img src="${p.foto || './icons/icon.svg'}" alt="${p.nome}" class="w-8 h-8 rounded-full object-cover border border-slate-700" />
                <div>
                  <div class="text-xs font-bold text-white">${p.nome}</div>
                  <div class="text-[11px] text-slate-400">${stopObj ? stopObj.nome : p.endereco}</div>
                </div>
              </div>
              <span class="status-pill ${isGoing ? 'live' : 'idle'}">${isGoing ? 'AGUARDANDO' : 'NÃO VAI'}</span>
            </div>
          `;
        })
        .join('');
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
                ${isGoing ? 'Aguardando embarque' : 'Não embarca hoje'}
              </div>
            </div>
          `)
        )
        .addTo(map);
      state.markers.driverPax.push(marker);
    });

    updateDriver3dBusMarkerAndCamera();
  }

  function updateDriver3dBusMarkerAndCamera() {
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

    map.easeTo({
      center: lngLat,
      pitch: 65,
      bearing: Number(state.driverRuntime.currentHeading || 0),
      zoom: 16.3,
      duration: 850
    });

    document.getElementById('driver-hud-speed').textContent = Math.round(state.driverRuntime.currentSpeed || 0);
    document.getElementById('driver-hud-heading').textContent = Math.round(state.driverRuntime.currentHeading || 0);
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
   * Inicia oficialmente a rota do motorista:
   * - Ativa `navigator.geolocation.watchPosition` com alta precisão
   * - Ativa `navigator.wakeLock.request('screen')`
   * - Envia telemetria a cada 6 segundos (entre 5 e 8s) para `Telemetria_TempoReal`
   */
  async function startDriverTripExecution() {
    const rota =
      state.db.rotas.find((r) => r.id === state.driverRuntime.activeRouteId) ||
      state.db.rotas[0];
    if (!rota) return;

    state.driverRuntime.isTripRunning = true;
    state.driverRuntime.tripId = `viagem_${Date.now()}`;
    rota.status = 'EM_ANDAMENTO';

    document.getElementById('btn-driver-start-route').classList.add('hidden');
    document.getElementById('btn-driver-finish-route').classList.remove('hidden');

    const hudStatus = document.getElementById('driver-hud-status');
    hudStatus.className = 'status-pill live';
    hudStatus.textContent = 'EM ROTA — TRANSMITINDO GPS (6s)';

    await requestDriverScreenWakeLock();

    // Ativa geolocation.watchPosition de alta precisão
    if ('geolocation' in navigator) {
      state.driverRuntime.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const prevLat = state.driverRuntime.currentLat;
          const prevLng = state.driverRuntime.currentLng;
          const newLat = pos.coords.latitude;
          const newLng = pos.coords.longitude;

          state.driverRuntime.currentLat = newLat;
          state.driverRuntime.currentLng = newLng;
          state.driverRuntime.currentSpeed =
            pos.coords.speed !== null && pos.coords.speed >= 0
              ? Math.round(pos.coords.speed * 3.6)
              : state.driverRuntime.currentSpeed || 36;

          if (pos.coords.heading !== null && !isNaN(pos.coords.heading) && pos.coords.heading >= 0) {
            state.driverRuntime.currentHeading = Math.round(pos.coords.heading);
          } else if (prevLat !== newLat || prevLng !== newLng) {
            state.driverRuntime.currentHeading = calculateBearingDegrees(prevLat, prevLng, newLat, newLng);
          }

          updateDriver3dBusMarkerAndCamera();
        },
        (err) => {
          console.warn('Geolocation watchPosition aviso (use o botão Simular Direção se estiver no Desktop):', err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 2000,
          timeout: 8000
        }
      );
    }

    // Dispara envio contínuo de telemetria a cada 6 segundos (intervalo entre 5 e 8 segundos)
    await pushDriverTelemetrySnapshot('EM_ANDAMENTO');
    if (state.driverRuntime.telemetryTimer) clearInterval(state.driverRuntime.telemetryTimer);
    state.driverRuntime.telemetryTimer = setInterval(() => {
      pushDriverTelemetrySnapshot('EM_ANDAMENTO');
    }, 6000);

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

    showToast('Rota iniciada! Telemetria GPS 3D e Wake Lock ativados.', 'success');
  }

  async function stopDriverTripExecution(notify = true) {
    state.driverRuntime.isTripRunning = false;

    if (state.driverRuntime.watchId !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(state.driverRuntime.watchId);
      state.driverRuntime.watchId = null;
    }

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

    const btnStart = document.getElementById('btn-driver-start-route');
    const btnFinish = document.getElementById('btn-driver-finish-route');
    if (btnStart) btnStart.classList.remove('hidden');
    if (btnFinish) btnFinish.classList.add('hidden');

    const hudStatus = document.getElementById('driver-hud-status');
    if (hudStatus) {
      hudStatus.className = 'status-pill idle';
      hudStatus.textContent = 'ROTA FINALIZADA';
    }

    state.driverRuntime.currentSpeed = 0;
    const rota = state.db.rotas.find((r) => r.id === state.driverRuntime.activeRouteId);
    if (rota) {
      rota.status = 'FINALIZADA';
      await pushDriverTelemetrySnapshot('FINALIZADA');
      await callGasApi({
        action: 'finishRouteTrip',
        tripId: state.driverRuntime.tripId,
        rotaId: rota.id
      });
    }

    if (notify) {
      showToast('Viagem finalizada e registrada no Histórico de Viagens!', 'info');
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
    const rotaId = document.getElementById('signup-route').value || (state.db.rotas[0]?.id || '');
    const pontoId = document.getElementById('signup-stop').value || '';
    const lat = parseFloat(document.getElementById('signup-lat').value) || DEFAULT_LAT;
    const lng = parseFloat(document.getElementById('signup-lng').value) || DEFAULT_LNG;

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

    showToast('Cadastro concluído! Sincronizando com a planilha e abrindo sua rota...', 'success');

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

    // Painel do Passageiro
    document.getElementById('btn-pax-status-going')?.addEventListener('click', () => updatePassengerBoardingStatus('VOU'));
    document.getElementById('btn-pax-status-skip')?.addEventListener('click', () => updatePassengerBoardingStatus('NAO_VOU'));
    document.getElementById('btn-pax-open-profile')?.addEventListener('click', openPassengerSelfProfileModal);
    document.getElementById('btn-pax-close-profile')?.addEventListener('click', () => {
      document.getElementById('pax-tab-profile').classList.add('hidden');
      document.getElementById('pax-tab-map').classList.remove('hidden');
      if (state.maps.passengerLive) state.maps.passengerLive.resize();
    });

    document.getElementById('btn-pax-locate-me')?.addEventListener('click', () => {
      if (state.maps.passengerLive) {
        state.maps.passengerLive.flyTo({
          center: [state.passengerGps.lng, state.passengerGps.lat],
          zoom: 15.5,
          duration: 800
        });
      }
    });

    document.getElementById('btn-pax-focus-bus')?.addEventListener('click', () => {
      const tel = state.db.telemetria[0];
      if (tel && state.maps.passengerLive) {
        state.maps.passengerLive.flyTo({
          center: [Number(tel.lng), Number(tel.lat)],
          zoom: 15,
          duration: 800
        });
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
        { enableHighAccuracy: true, timeout: 8000 }
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
    document.getElementById('btn-driver-start-route')?.addEventListener('click', startDriverTripExecution);
    document.getElementById('btn-driver-finish-route')?.addEventListener('click', () => stopDriverTripExecution(true));
    document.getElementById('btn-driver-simulate-gps')?.addEventListener('click', toggleDriver3dRouteSimulation);
    document.getElementById('btn-driver-recenter-3d')?.addEventListener('click', updateDriver3dBusMarkerAndCamera);
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

    // Sincronização em background com Google Sheets se a URL estiver configurada
    if (state.gasUrl) {
      await syncWithGoogleSheets(false);
      // Atualiza lista de rotas no modal de autocadastro caso esteja aberto
      if (openedViaInviteLink) {
        const params = new URLSearchParams(window.location.search);
        populateSelfSignupRouteAndStops(params.get('rota') || '');
      }
    }

    // Polling periódico leve (a cada 7 segundos) quando conectado ao Google Sheets
    state.pollingInterval = setInterval(async () => {
      if (state.gasUrl && state.currentUser) {
        const res = await callGasApi({ action: 'telemetry' });
        if (res && res.ok) {
          if (Array.isArray(res.telemetria) && res.telemetria.length > 0) {
            state.db.telemetria = res.telemetria;
          }
          saveLocalDb();
          refreshActiveViews();
        }
      }
    }, 7000);
  });
})();
