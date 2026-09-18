/* Painel de câmeras - Buffet Bora Bora */
(function () {
  'use strict';

  const estado = { eu: null, cameras: [], players: {}, playerModal: null, baseGo2rtc: '' };

  const $ = (seletor) => document.querySelector(seletor);
  const $$ = (seletor) => Array.from(document.querySelectorAll(seletor));

  // ------------------------------------------------------------- utilidades
  async function api(caminho, opcoes) {
    const resposta = await fetch(caminho, Object.assign({ credentials: 'same-origin' }, opcoes || {}));
    if (resposta.status === 401) { window.location.href = '/login'; throw new Error('sessão expirada'); }
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.erro || ('erro ' + resposta.status));
    return dados;
  }

  function horario(ts) {
    if (!ts) return '-';
    return new Date(ts * 1000).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function duracaoCurta(segundos) {
    if (!segundos && segundos !== 0) return '-';
    const s = Math.round(segundos);
    if (s < 60) return s + 's';
    if (s < 3600) return Math.floor(s / 60) + 'min';
    if (s < 86400) return Math.floor(s / 3600) + 'h' + String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    return Math.floor(s / 86400) + ' dias';
  }

  function dataDeHoje() {
    const agora = new Date();
    const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  // ------------------------------------------------------------------ abas
  function trocarAba(nome) {
    $$('.aba').forEach((a) => a.classList.toggle('ativa', a.id === 'aba-' + nome));
    $$('.menu button').forEach((b) => b.classList.toggle('ativo', b.dataset.aba === nome));
    if (nome === 'status') { carregarEventos(); }
    if (nome === 'sistema') { carregarDisco(); }
  }

  // --------------------------------------------------------------- ao vivo
  function cartaoCamera(camera) {
    const cartao = document.createElement('div');
    cartao.className = 'camera';
    cartao.innerHTML =
      '<div class="tela" id="tela-' + camera.id + '">' +
        '<div class="selo"><span class="ponto" id="ponto-' + camera.id + '"></span><span id="selo-' + camera.id + '">...</span></div>' +
        '<div class="modo" id="modo-' + camera.id + '"></div>' +
        '<div class="mensagem" id="msg-' + camera.id + '">conectando...</div>' +
      '</div>' +
      '<div class="rodape">' +
        '<div><div class="nome">' + camera.nome + '</div><div class="local">' + (camera.local || '') + '</div></div>' +
        '<button class="btn pequeno secundario" data-tela-cheia="' + camera.id + '">Ampliar</button>' +
      '</div>';
    cartao.querySelector('[data-tela-cheia]').addEventListener('click', (e) => {
      e.stopPropagation();
      abrirAoVivoAmpliado(camera);
    });
    cartao.querySelector('.tela').addEventListener('click', () => abrirAoVivoAmpliado(camera));
    return cartao;
  }

  function montarAoVivo() {
    const grade = $('#grade-cameras');
    grade.innerHTML = '';
    Object.values(estado.players).forEach((p) => p.parar());
    estado.players = {};

    if (!estado.cameras.length) {
      $('#aviso-ao-vivo').textContent = 'Nenhuma câmera cadastrada no cameras.yaml.';
      return;
    }
    $('#aviso-ao-vivo').textContent = '';

    estado.cameras.forEach((camera) => {
      grade.appendChild(cartaoCamera(camera));
      const player = new PlayerCamera({
        tela: $('#tela-' + camera.id),
        base: estado.baseGo2rtc,
        stream: camera.stream_sub,          // substream: leve para a grade
        aoMudarEstado: (situacao, texto, modo) => {
          const msg = $('#msg-' + camera.id);
          const etiqueta = $('#modo-' + camera.id);
          if (etiqueta) etiqueta.textContent = situacao === 'ao-vivo' ? (modo || '') : '';
          if (!msg) return;
          msg.style.display = situacao === 'ao-vivo' ? 'none' : 'flex';
          msg.textContent = texto || '';
        }
      });
      estado.players[camera.id] = player;
      player.iniciar();
    });
  }

  function pintarStatusAoVivo() {
    estado.cameras.forEach((camera) => {
      const ponto = $('#ponto-' + camera.id);
      const selo = $('#selo-' + camera.id);
      if (!ponto || !selo) return;
      if (camera.online === true) { ponto.className = 'ponto online'; selo.textContent = 'ONLINE'; }
      else if (camera.online === false) { ponto.className = 'ponto offline'; selo.textContent = 'OFFLINE'; }
      else { ponto.className = 'ponto'; selo.textContent = 'VERIFICANDO'; }
    });
  }

  // ---------------------------------------------------------------- status
  function montarStatus() {
    const lista = $('#lista-status');
    lista.innerHTML = '';
    estado.cameras.forEach((camera) => {
      const bloco = document.createElement('div');
      bloco.className = 'item-status';
      const etiqueta = camera.online === true ? '<span class="tag online">online</span>'
                     : camera.online === false ? '<span class="tag offline">offline</span>'
                     : '<span class="tag">verificando</span>';
      bloco.innerHTML =
        '<div class="cabecalho"><span class="ponto ' + (camera.online === true ? 'online' : camera.online === false ? 'offline' : '') + '"></span>' +
        '<strong>' + camera.nome + '</strong>' + etiqueta + '</div>' +
        '<div class="linha"><span>Situação</span><span>' + (camera.detalhe || '-') + '</span></div>' +
        '<div class="linha"><span>Endereço</span><span>' + camera.ip + '</span></div>' +
        '<div class="linha"><span>Última vez com vídeo</span><span>' + horario(camera.ultimo_ok) + '</span></div>' +
        '<div class="linha"><span>Última queda</span><span>' + horario(camera.ultima_queda) + '</span></div>' +
        '<div class="linha"><span>Quedas / reinícios</span><span>' + (camera.total_quedas || 0) + ' / ' + (camera.reinicios || 0) + '</span></div>' +
        '<div class="linha"><span>Última checagem</span><span>' + horario(camera.ultima_checagem) + '</span></div>';

      if (estado.eu && estado.eu.admin) {
        const botao = document.createElement('button');
        botao.className = 'btn pequeno secundario';
        botao.style.marginTop = '10px';
        botao.textContent = 'Reiniciar câmera';
        botao.addEventListener('click', () => reiniciarCamera(camera, botao));
        bloco.appendChild(botao);
      }
      lista.appendChild(bloco);
    });
  }

  async function reiniciarCamera(camera, botao) {
    if (!confirm('Reiniciar a câmera "' + camera.nome + '"? Ela fica cerca de 1 minuto fora do ar.')) return;
    botao.disabled = true;
    botao.textContent = 'Reiniciando...';
    try {
      const resposta = await api('/api/reiniciar/' + camera.id, { method: 'POST' });
      alert(resposta.ok ? 'Comando enviado: ' + resposta.mensagem : 'Não deu certo: ' + resposta.mensagem);
    } catch (e) {
      alert('Não deu certo: ' + e.message);
    }
    botao.disabled = false;
    botao.textContent = 'Reiniciar câmera';
    carregarEventos();
  }

  async function carregarEventos() {
    const alvo = $('#lista-eventos');
    try {
      const dados = await api('/api/eventos?limite=60');
      if (!dados.eventos || !dados.eventos.length) {
        alvo.innerHTML = '<p class="vazio">Nada registrado ainda.</p>';
        return;
      }
      alvo.innerHTML = dados.eventos.map((evento) =>
        '<div class="evento ' + evento.tipo + '">' +
          '<span class="quando">' + horario(evento.quando) + '</span>' +
          '<span class="tipo">' + evento.tipo + '</span>' +
          '<span>' + (evento.camera !== '-' ? '<strong>' + evento.camera + '</strong> ' : '') + evento.mensagem + '</span>' +
        '</div>').join('');
    } catch (e) {
      alvo.innerHTML = '<p class="vazio">Não consegui falar com o watchdog (' + e.message + ').</p>';
    }
  }

  // ------------------------------------------------------------- gravações
  async function buscarGravacoes() {
    const camera = $('#filtro-camera').value;
    const data = $('#filtro-data').value;
    const horas = $('#lista-horas');
    const clipes = $('#lista-clipes');
    const aviso = $('#aviso-clipes');
    if (!camera || !data) return;

    horas.innerHTML = '<p class="vazio">buscando...</p>';
    clipes.innerHTML = '';
    aviso.textContent = '';

    let dados;
    try {
      dados = await api('/api/gravacoes/' + camera + '?data=' + data);
    } catch (e) {
      horas.innerHTML = '<p class="vazio">Não consegui falar com o gravador (' + e.message + ').</p>';
      return;
    }

    if (!dados.horas.length) {
      horas.innerHTML = '<p class="vazio">Sem gravação contínua neste dia.</p>';
    } else {
      horas.innerHTML = '';
      dados.horas.forEach((hora) => {
        const botao = document.createElement('button');
        botao.className = 'hora';
        botao.innerHTML = hora.hora + 'h<small>' + duracaoCurta(hora.duracao) + '</small>';
        botao.addEventListener('click', () => tocarHora(camera, data, hora.hora));
        horas.appendChild(botao);
      });
    }

    if (!dados.eventos.length) {
      aviso.textContent = 'Nenhuma pessoa detectada neste dia.';
      return;
    }
    dados.eventos.forEach((evento) => {
      const botao = document.createElement('button');
      botao.className = 'clipe';
      const hora = new Date(evento.inicio * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      botao.innerHTML =
        '<img loading="lazy" src="/midia/evento/' + evento.id + '/foto.jpg" alt="">' +
        '<div class="info"><div class="hora-clipe">' + hora + '</div>' +
        '<small>' + (evento.objeto || 'movimento') + ' · ' + duracaoCurta(evento.duracao) + '</small></div>';
      botao.addEventListener('click', () => tocarClipe(evento, hora));
      clipes.appendChild(botao);
    });
  }

  function inicioFimDaHora(data, hora) {
    const inicio = new Date(data + 'T' + hora + ':00:00');
    return [Math.floor(inicio.getTime() / 1000), Math.floor(inicio.getTime() / 1000) + 3600];
  }

  function tocarHora(camera, data, hora) {
    const [inicio, fim] = inicioFimDaHora(data, hora);
    const url = '/midia/hora/' + camera + '/' + inicio + '/' + fim + '/index.m3u8';
    const video = abrirModalVideo(camera + ' · ' + data + ' ' + hora + 'h');

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;                       // Safari / iPhone tocam HLS direto
    } else if (!window.HLS_INDISPONIVEL && window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({ maxBufferLength: 20 });
      hls.loadSource(url);
      hls.attachMedia(video);
      video.dataset.hls = '1';
      estado.hls = hls;
    } else {
      fecharModal();
      alert('Este navegador não consegue tocar a gravação contínua. Use os clipes de movimento, ou abra pelo Chrome/Safari.');
    }
  }

  function tocarClipe(evento, hora) {
    const video = abrirModalVideo(evento.camera + ' · ' + hora + ' · ' + (evento.objeto || ''));
    video.src = '/midia/evento/' + evento.id + '/video.mp4';
  }

  // ----------------------------------------------------------------- modal
  function abrirModalVideo(titulo) {
    fecharModal();
    $('#modal-titulo').textContent = titulo;
    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    $('#modal-palco').appendChild(video);
    $('#modal').classList.add('aberto');
    return video;
  }

  function abrirAoVivoAmpliado(camera) {
    fecharModal();
    $('#modal-titulo').textContent = camera.nome + ' · ao vivo';
    const palco = $('#modal-palco');
    const tela = document.createElement('div');
    tela.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center';
    palco.appendChild(tela);
    $('#modal').classList.add('aberto');

    estado.playerModal = new PlayerCamera({
      tela: tela,
      base: estado.baseGo2rtc,
      stream: camera.stream,                 // ampliado usa o stream principal
      aoMudarEstado: (situacao, texto) => {
        if (situacao !== 'ao-vivo' && texto) $('#modal-titulo').textContent = camera.nome + ' · ' + texto;
        else $('#modal-titulo').textContent = camera.nome + ' · ao vivo';
      }
    });
    estado.playerModal.iniciar();

    const modal = $('#modal');
    if (modal.requestFullscreen) modal.requestFullscreen().catch(() => {});
  }

  function fecharModal() {
    if (estado.playerModal) { estado.playerModal.parar(); estado.playerModal = null; }
    if (estado.hls) { try { estado.hls.destroy(); } catch (e) {} estado.hls = null; }
    $('#modal-palco').innerHTML = '';
    $('#modal').classList.remove('aberto');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }
  window.fecharModal = fecharModal;

  // ---------------------------------------------------------------- sistema
  async function carregarDisco() {
    const alvo = $('#disco');
    try {
      const disco = await api('/api/disco');
      if (!disco.ok) { alvo.innerHTML = '<p class="vazio">' + disco.mensagem + '</p>'; return; }
      alvo.innerHTML =
        '<div class="barra-disco"><div class="' + disco.alerta + '" style="width:' + disco.percentual + '%"></div></div>' +
        '<div class="linha"><span>Usado</span><span>' + disco.usado_gb + ' GB (' + disco.percentual + '%)</span></div>' +
        '<div class="linha"><span>Livre</span><span>' + disco.livre_gb + ' GB</span></div>' +
        '<div class="linha"><span>Total</span><span>' + disco.total_gb + ' GB</span></div>' +
        '<div class="linha"><span>Pasta</span><span>' + disco.caminho + '</span></div>' +
        (disco.alerta !== 'ok' ? '<p class="vazio" style="color:var(--alerta)">Disco quase cheio: veja o README (seção "disco cheio").</p>' : '');
    } catch (e) {
      alvo.innerHTML = '<p class="vazio">Não consegui ler o disco (' + e.message + ').</p>';
    }
  }

  function montarSistema(dados) {
    $('#info-sistema').innerHTML =
      '<div class="linha"><span>Usuário</span><span>' + estado.eu.usuario + ' (' + estado.eu.perfil + ')</span></div>' +
      '<div class="linha"><span>Câmeras cadastradas</span><span>' + dados.total + '</span></div>' +
      '<div class="linha"><span>Online agora</span><span>' + dados.online + ' de ' + dados.total + '</span></div>' +
      '<div class="linha"><span>Watchdog</span><span>' + (dados.watchdog_ok ? 'respondendo' : 'SEM RESPOSTA') + '</span></div>' +
      '<div class="linha"><span>Última verificação</span><span>' + horario(dados.atualizado_em) + '</span></div>' +
      '<div class="linha"><span>Vídeo ao vivo</span><span>' + estado.baseGo2rtc + '</span></div>';
  }

  // ------------------------------------------------------------------ carga
  async function carregarCameras(primeiraVez) {
    let dados;
    try {
      dados = await api('/api/cameras');
    } catch (e) {
      $('#resumo').textContent = 'erro ao carregar câmeras: ' + e.message;
      return;
    }
    const mudou = primeiraVez ||
      dados.cameras.length !== estado.cameras.length ||
      dados.cameras.some((c, i) => c.id !== estado.cameras[i].id);

    estado.cameras = dados.cameras;
    $('#resumo').textContent = dados.online + ' de ' + dados.total + ' câmeras online' +
      (dados.watchdog_ok ? '' : ' · watchdog sem resposta');

    if (mudou) {
      montarAoVivo();
      const seletor = $('#filtro-camera');
      seletor.innerHTML = estado.cameras.map((c) => '<option value="' + c.id + '">' + c.nome + '</option>').join('');
    }
    pintarStatusAoVivo();
    montarStatus();
    montarSistema(dados);
  }

  async function iniciar() {
    try {
      estado.eu = await api('/api/eu');
    } catch (e) {
      window.location.href = '/login';
      return;
    }
    document.title = 'Câmeras · ' + estado.eu.titulo;
    $('#usuario-logado').textContent = estado.eu.usuario;
    estado.baseGo2rtc = estado.eu.go2rtc || (window.location.protocol + '//' + window.location.hostname + ':1984');

    $$('.menu button').forEach((b) => b.addEventListener('click', () => trocarAba(b.dataset.aba)));
    $('#botao-buscar').addEventListener('click', buscarGravacoes);
    $('#filtro-data').value = dataDeHoje();
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModal(); });

    await carregarCameras(true);
    carregarEventos();
    carregarDisco();

    setInterval(() => carregarCameras(false), 15000);
    setInterval(() => { if ($('#aba-status').classList.contains('ativa')) carregarEventos(); }, 30000);

    // Economiza banda quando o celular fica com a tela apagada.
    document.addEventListener('visibilitychange', () => {
      Object.values(estado.players).forEach((p) => {
        if (document.hidden) p.parar(); else p.iniciar();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
