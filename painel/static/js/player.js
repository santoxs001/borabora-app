/* Player de câmera ao vivo falando direto com o go2rtc.
 *
 * Ordem de tentativa (cai para a próxima sozinho):
 *   1. WebRTC  - menor atraso, é o modo principal
 *   2. MSE     - quando o WebRTC não fecha conexão (rede/navegador)
 *   3. MJPEG   - último recurso: sempre funciona, gasta mais banda
 */
(function (global) {
  'use strict';

  const CODECS = [
    'avc1.640029', 'avc1.64002A', 'avc1.640033', 'hvc1.1.6.L153.B0',
    'mp4a.40.2', 'mp4a.40.5', 'flac', 'opus'
  ];

  function codecsSuportados() {
    if (!('MediaSource' in global)) return '';
    return CODECS.filter((c) => {
      const tipo = c.indexOf('vc1') >= 0 || c.indexOf('hvc') >= 0
        ? 'video/mp4; codecs="' + c + '"'
        : 'audio/mp4; codecs="' + c + '"';
      try { return MediaSource.isTypeSupported(tipo); } catch (e) { return false; }
    }).join();
  }

  class PlayerCamera {
    /** @param {{tela:HTMLElement, base:string, stream:string, aoMudarEstado?:Function}} opcoes */
    constructor(opcoes) {
      this.tela = opcoes.tela;
      this.base = opcoes.base.replace(/\/$/, '');
      this.stream = opcoes.stream;
      this.aoMudarEstado = opcoes.aoMudarEstado || function () {};
      this.modo = null;
      this.parado = false;
      this.tentativas = 0;
      this.ws = null;
      this.pc = null;
      this.video = null;
      this.img = null;
      this.temporizador = null;
    }

    get wsBase() {
      return this.base.replace(/^http/, 'ws');
    }

    // ------------------------------------------------------------ controle
    iniciar() {
      this.parado = false;
      this._tentarWebRTC();
    }

    parar() {
      this.parado = true;
      this._limpar();
      this._estado('parado', '');
    }

    _limpar() {
      clearTimeout(this.temporizador);
      this.temporizador = null;
      if (this.ws) { try { this.ws.onclose = null; this.ws.close(); } catch (e) {} this.ws = null; }
      if (this.pc) { try { this.pc.close(); } catch (e) {} this.pc = null; }
      if (this.video) { try { this.video.srcObject = null; this.video.removeAttribute('src'); this.video.load(); } catch (e) {} }
      this.tela.innerHTML = '';
      this.video = null;
      this.img = null;
    }

    _estado(estado, texto) {
      this.aoMudarEstado(estado, texto, this.modo);
    }

    _novoVideo() {
      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.controls = false;
      video.preload = 'none';
      this.tela.appendChild(video);
      this.video = video;
      return video;
    }

    _aoFalhar(proximo, motivo) {
      if (this.parado) return;
      console.warn('[' + this.stream + '] ' + motivo);
      this._limpar();
      proximo.call(this);
    }

    _reagendar() {
      if (this.parado) return;
      this.tentativas += 1;
      const espera = Math.min(30000, 2000 * this.tentativas);
      this._estado('reconectando', 'sem vídeo - tentando de novo em ' + Math.round(espera / 1000) + 's');
      this.temporizador = setTimeout(() => { this._limpar(); this._tentarWebRTC(); }, espera);
    }

    // -------------------------------------------------------------- WebRTC
    _tentarWebRTC() {
      if (this.parado) return;
      this.modo = 'webrtc';
      this._estado('conectando', 'conectando (WebRTC)...');

      if (!('RTCPeerConnection' in global)) { this._tentarMSE(); return; }

      const video = this._novoVideo();
      let pronto = false;

      let ws;
      try { ws = new WebSocket(this.wsBase + '/api/ws?src=' + encodeURIComponent(this.stream)); }
      catch (e) { this._aoFalhar(this._tentarMSE, 'WebSocket indisponível: ' + e); return; }
      this.ws = ws;

      const pc = new RTCPeerConnection({ iceServers: [], bundlePolicy: 'max-bundle' });
      this.pc = pc;

      pc.ontrack = (evento) => {
        if (evento.streams && evento.streams[0]) video.srcObject = evento.streams[0];
      };
      pc.onicecandidate = (evento) => {
        if (evento.candidate && ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'webrtc/candidate', value: evento.candidate.candidate }));
        }
      };

      video.onplaying = () => {
        pronto = true;
        this.tentativas = 0;
        this._estado('ao-vivo', '');
      };

      ws.onopen = async () => {
        try {
          pc.addTransceiver('video', { direction: 'recvonly' });
          pc.addTransceiver('audio', { direction: 'recvonly' });
          const oferta = await pc.createOffer();
          await pc.setLocalDescription(oferta);
          ws.send(JSON.stringify({ type: 'webrtc/offer', value: pc.localDescription.sdp }));
        } catch (e) {
          this._aoFalhar(this._tentarMSE, 'falha ao montar a oferta WebRTC: ' + e);
        }
      };

      ws.onmessage = async (evento) => {
        if (typeof evento.data !== 'string') return;
        let msg;
        try { msg = JSON.parse(evento.data); } catch (e) { return; }
        try {
          if (msg.type === 'webrtc/candidate' && msg.value) {
            await pc.addIceCandidate({ candidate: msg.value, sdpMid: '0' });
          } else if (msg.type === 'webrtc/answer') {
            await pc.setRemoteDescription({ type: 'answer', sdp: msg.value });
          } else if (msg.type === 'error') {
            this._aoFalhar(this._tentarMSE, 'go2rtc respondeu erro: ' + msg.value);
          }
        } catch (e) {
          this._aoFalhar(this._tentarMSE, 'erro na negociação WebRTC: ' + e);
        }
      };

      ws.onerror = () => { if (!pronto) this._aoFalhar(this._tentarMSE, 'WebSocket com erro'); };
      ws.onclose = () => { if (!pronto && !this.parado) this._aoFalhar(this._tentarMSE, 'WebSocket fechou'); };

      // Se em 10s não tiver imagem, tenta o próximo modo.
      this.temporizador = setTimeout(() => {
        if (!pronto) this._aoFalhar(this._tentarMSE, 'WebRTC sem vídeo em 10s');
      }, 10000);
    }

    // ----------------------------------------------------------------- MSE
    _tentarMSE() {
      if (this.parado) return;
      this.modo = 'mse';
      this._estado('conectando', 'conectando (MSE)...');

      const codecs = codecsSuportados();
      if (!codecs) { this._tentarMJPEG(); return; }

      const video = this._novoVideo();
      const fonte = new MediaSource();
      video.src = URL.createObjectURL(fonte);
      let buffer = null;
      const fila = [];
      let pronto = false;

      let ws;
      try { ws = new WebSocket(this.wsBase + '/api/ws?src=' + encodeURIComponent(this.stream)); }
      catch (e) { this._aoFalhar(this._tentarMJPEG, 'WebSocket indisponível: ' + e); return; }
      ws.binaryType = 'arraybuffer';
      this.ws = ws;

      const esvaziar = () => {
        if (!buffer || buffer.updating || !fila.length) return;
        try { buffer.appendBuffer(fila.shift()); } catch (e) { /* buffer cheio: descarta */ fila.length = 0; }
      };

      fonte.onsourceopen = () => {
        URL.revokeObjectURL(video.src);
        if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'mse', value: codecs }));
      };

      ws.onopen = () => {
        if (fonte.readyState === 'open') ws.send(JSON.stringify({ type: 'mse', value: codecs }));
      };

      ws.onmessage = (evento) => {
        if (typeof evento.data === 'string') {
          let msg;
          try { msg = JSON.parse(evento.data); } catch (e) { return; }
          if (msg.type === 'mse' && !buffer) {
            try {
              buffer = fonte.addSourceBuffer(msg.value);
              buffer.mode = 'segments';
              buffer.onupdateend = () => {
                esvaziar();
                // mantém o player colado no ao vivo
                if (!buffer.updating && video.buffered.length) {
                  const fim = video.buffered.end(video.buffered.length - 1);
                  if (fim - video.currentTime > 5) video.currentTime = fim - 0.4;
                }
              };
            } catch (e) {
              this._aoFalhar(this._tentarMJPEG, 'navegador recusou o codec (' + msg.value + ')');
            }
          } else if (msg.type === 'error') {
            this._aoFalhar(this._tentarMJPEG, 'go2rtc respondeu erro: ' + msg.value);
          }
          return;
        }
        fila.push(evento.data);
        if (fila.length > 60) fila.splice(0, fila.length - 30);
        esvaziar();
      };

      video.onplaying = () => { pronto = true; this.tentativas = 0; this._estado('ao-vivo', ''); };
      ws.onerror = () => { if (!pronto) this._aoFalhar(this._tentarMJPEG, 'WebSocket (MSE) com erro'); };
      ws.onclose = () => { if (!pronto && !this.parado) this._aoFalhar(this._tentarMJPEG, 'WebSocket (MSE) fechou'); };

      this.temporizador = setTimeout(() => {
        if (!pronto) this._aoFalhar(this._tentarMJPEG, 'MSE sem vídeo em 10s');
      }, 10000);
    }

    // --------------------------------------------------------------- MJPEG
    _tentarMJPEG() {
      if (this.parado) return;
      this.modo = 'mjpeg';
      this._estado('conectando', 'conectando (MJPEG)...');

      const img = document.createElement('img');
      img.className = 'quadro';
      img.alt = 'Câmera ' + this.stream;
      img.src = this.base + '/api/stream.mjpeg?src=' + encodeURIComponent(this.stream);
      img.onload = () => { this.tentativas = 0; this._estado('ao-vivo', ''); };
      img.onerror = () => { this._estado('erro', 'sem vídeo'); this._reagendar(); };
      this.tela.appendChild(img);
      this.img = img;

      this.temporizador = setTimeout(() => {
        if (!img.complete || !img.naturalWidth) { this._estado('erro', 'sem vídeo'); this._reagendar(); }
      }, 12000);
    }
  }

  global.PlayerCamera = PlayerCamera;
})(window);
