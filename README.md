# 🚌 RotaCYMI — Gestão e Rastreamento de Transporte Corporativo em Tempo Real (2D/3D)

Plataforma **PWA (Progressive Web App)** responsiva (*Mobile-First*) para gestão de frotas, demarcação de rotas com cálculo de trajeto viário (**OSRM**), rastreamento GPS em tempo real (**MapLibre GL JS 2D e 3D**) e banco de dados serverless gratuito via **Google Sheets + Google Apps Script**, pronta para deploy imediato na **Vercel (via GitHub)**.

---

## ✨ Funcionalidades Implementadas

1. **Arquitetura PWA Instalável (Android & iOS):**
   - `manifest.json` completo (`display: standalone`, `orientation: portrait`, ícones dedicados).
   - `sw.js` (Service Worker) com cache inteligente e passthrough para APIs em tempo real.
   - **Instalador Inteligente**: Captura `beforeinstallprompt` nativo no Android/Desktop e detecta iOS (iPhone/iPad) exibindo um guia passo a passo para *"Compartilhar &rarr; Adicionar à Tela de Início"*.
2. **Autenticação e Persistência de Sessão ("Lembrar-me"):**
   - **Credencial Master Admin (Auto-Seed):**
     - **E-mail:** `jasantos@cymibr.com`
     - **Senha:** `Sabre0858`
     - **Perfil:** `ADMIN`
   - Persistência automática no `localStorage` com redirecionamento direto para o painel do perfil (`ADMIN`, `MOTORISTA` ou `PASSAGEIRO`).
3. **Módulo 1 — Painel Administrativo (`ADMIN`):**
   - **Torre de Controle (Monitoramento Ao Vivo):** Visão em tempo real com todos os ônibus ativos, velocidade atual, status da rota e passageiros aguardando.
   - **Construtor Visual de Rotas (OSRM):** Clique no mapa para adicionar Pontos de Parada com horário previsto, arraste os marcadores para ajuste fino e trace automaticamente a linha de trajeto nas ruas via OSRM.
   - **CRUD Completo de Funcionários (Passageiros):** Nome, E-mail, Senha, WhatsApp, Endereço com geocodificação automática + seleção no mapa, Rota/Ponto vinculados e Foto de perfil comprimida em `<canvas>` (`150x150px` Base64 leve).
   - **CRUD Completo de Frota (Ônibus) e Motoristas.**
4. **Módulo 2 — Painel do Funcionário (`PASSAGEIRO`):**
   - **Rastreamento ao Vivo:** Ônibus se movendo em tempo real, GPS do usuário e destaque automático (cor verde + linha tracejada) do **Ponto de Embarque Mais Próximo** calculado via **Fórmula de Haversine** (distância em metros + horário previsto).
   - **Status Rápido de Embarque:** Botões `"Vou embarcar hoje"` / `"Não vou utilizar hoje"`.
   - **Meu Perfil:** Atualização de telefone, endereço, senha, foto `150x150px` e pino da residência no mapa.
5. **Módulo 3 — Cockpit do Motorista (`MOTORISTA`):**
   - **Navegação 3D (`pitch: 65` + `bearing` dinâmico):** Câmera inclinada em 3D acompanhando o rumo do GPS.
   - **Wake Lock API (`navigator.wakeLock.request('screen')`):** Impede que a tela do celular apague durante a viagem.
   - **Telemetria Contínua (`watchPosition`):** Envia latitude, longitude, velocidade e direção a cada 6 segundos para a aba `Telemetria_TempoReal`.

---

## 🚀 Como Configurar a Planilha Google Sheets (`Code.gs`)

1. Crie uma nova planilha no [Google Sheets](https://sheets.google.com).
2. No menu superior, clique em **Extensões &rarr; Apps Script**.
3. Apague o código existente e cole todo o conteúdo do arquivo [`Code.gs`](./Code.gs).
4. Salve o projeto (`Ctrl+S`) e execute a função `setupDatabase` uma vez clicando em **Executar** (autorize as permissões da sua conta Google).
   - As abas `Usuarios`, `Rotas`, `Veiculos`, `Motoristas`, `Telemetria_TempoReal` e `Historico_Viagens` serão criadas automaticamente junto com o usuário Master `jasantos@cymibr.com`.
5. Clique em **Implantar &rarr; Nova implantação**:
   - **Tipo:** `App da Web`
   - **Executar como:** `Eu`
   - **Quem pode acessar:** `Qualquer pessoa` *(indispensável para permitir chamadas CORS vindas da Vercel)*
6. Copie a **URL do App da Web** gerada (termina em `/exec`), abra o RotaCYMI, clique no botão **"API Sheets"** no topo e cole a URL.
