# Sistema de Câmeras — Buffet Bora Bora

Sistema interno de monitoramento (NVR) que roda **100% na rede local do buffet**,
sem nuvem e sem depender do aplicativo Yoosee. Feito para câmeras **CA-1003**
(lâmpada E27 com Wi-Fi, firmware Yoosee/Gwell), que são baratas, mas caem
bastante — por isso o sistema foi montado para **se recuperar sozinho**.

```
   Câmeras CA-1003 (Wi-Fi)
            │  RTSP
            ▼
        ┌────────┐   RTSP   ┌─────────┐   grava em disco
        │ go2rtc │ ───────▶ │ Frigate │ ──────────────▶  HD de gravações
        └────────┘          └─────────┘
            │ WebRTC/MSE          │ API
            ▼                     ▼
        ┌──────────────────────────────┐        ┌──────────┐
        │  Painel Bora Bora (login)    │ ◀───── │ Watchdog │ ──▶ ONVIF (reinicia a câmera)
        └──────────────────────────────┘        └──────────┘
            ▲
            │ celular / PC dentro da rede do buffet
```

| Serviço | Para que serve |
|---|---|
| **go2rtc** | Único que fala com as câmeras. Reconecta sozinho e reparte o vídeo para o painel e para o gravador. |
| **Frigate** | Grava 24h por dia e marca os trechos em que aparece **pessoa**. |
| **Watchdog** | A cada 60s confere se a câmera responde e se tem vídeo. Se ficar 3 minutos sem imagem, manda a câmera **reiniciar** via ONVIF. |
| **Painel** | A tela que a equipe usa: ao vivo, status, gravações e espaço em disco. Tem login. |

---

## 1. Pré-requisitos

### Servidor (o PC que fica ligado 24h)

**Opção A — Linux (Ubuntu 22.04+) — recomendado**
```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2 git
sudo usermod -aG docker $USER      # depois saia e entre na sessão de novo
sudo systemctl enable --now docker # sobe o Docker junto com o PC
```

**Opção B — Windows 11**
1. Instale o **Docker Desktop** (https://www.docker.com/products/docker-desktop/).
2. Em *Settings → General*, deixe marcado **Start Docker Desktop when you log in**.
3. Em *Settings → Resources → File sharing*, libere a pasta do projeto e a pasta das gravações.
4. Configure o Windows para **entrar na conta automaticamente** depois de um reinício
   (senão o Docker Desktop não sobe sozinho). Em `netplwiz`, desmarque
   "Os usuários devem digitar um nome de usuário e senha".

### Câmeras
- Já conectadas no Wi-Fi **2.4 GHz** (as CA-1003 não pegam 5 GHz).
- Com **IP fixo** (reserve o IP no roteador pelo endereço MAC — é o jeito mais confiável).
- Com **senha trocada** no app Yoosee (a senha padrão é conhecida por qualquer um).
- Com **RTSP e ONVIF ligados** no app Yoosee.

### Disco
Reserve um HD só para as gravações. Estimativa grosseira, por câmera:

| Qualidade do stream principal | Por dia | 7 dias |
|---|---|---|
| 1280x720 a 15 fps (~1,5 Mbps) | ~16 GB | ~112 GB |
| 640x360 a 10 fps (~0,5 Mbps) | ~5 GB | ~37 GB |

Com 4 câmeras em 720p e 7 dias de retenção contínua, conte com **~450 GB**.

---

## 2. Instalação passo a passo

```bash
# 1. Baixe o projeto no servidor
git clone <endereço-do-repositório> borabora-app
cd borabora-app

# 2. Crie o arquivo de segredos
cp .env.example .env

# 3. Gere as senhas do painel (uma para o admin, outra para a equipe)
python3 scripts/gerar_hash.py
#   ...ou, se não tiver Python instalado:
#   docker compose run --rm gerador python scripts/gerar_hash.py
```

Abra o `.env` e preencha:

| Variável | O que colocar |
|---|---|
| `CAMERAS_FILE` | `cameras.yaml` (instalação de verdade) ou `cameras.teste.yaml` (modo de teste) |
| `CAM_SENHA_PADRAO` | a senha que você definiu nas câmeras |
| `PASTA_GRAVACOES` | a pasta do HD de gravações (ex.: `/mnt/hd-cameras` ou `D:/cameras`) |
| `PAINEL_SEGREDO` | uma frase aleatória longa (assina o cookie de login) |
| `PAINEL_ADMIN_HASH` / `PAINEL_VISUALIZADOR_HASH` | os hashes gerados no passo 3, **entre aspas simples** |
| `GO2RTC_CANDIDATE` | o IP do servidor na rede local (ex.: `192.168.0.10`) |
| `BIND_IP` | `0.0.0.0` (toda a rede local) ou o IP do servidor, para fechar mais |

> **Por que aspas simples nos hashes?** O hash do bcrypt começa com `$2b$12$...`, e o
> Docker entende `$` como começo de variável. Com aspas simples ele copia o texto como está.
> Se der problema mesmo assim (costuma acontecer no Windows), use a forma em base64:
> ```bash
> python3 -c "import base64;print(base64.b64encode(open('hash.txt','rb').read().strip()).decode())"
> # e no .env:  PAINEL_ADMIN_HASH_B64=<resultado>
> ```

Agora cadastre as câmeras no `cameras.yaml` (veja a seção 5) e suba tudo:

```bash
docker compose up -d --build
docker compose ps           # todos devem aparecer como "running"/"healthy"
docker compose logs -f      # acompanhe a primeira subida
```

Abra o painel no navegador: **http://IP-DO-SERVIDOR:8080**

A primeira gravação aparece depois de alguns minutos, e o Frigate leva ~2 minutos
para ficar "healthy" na primeira vez.

---

## 3. Modo de teste (sem nenhuma câmera de verdade)

Serve para conhecer o sistema, treinar a equipe ou conferir se o servidor aguenta.
São três câmeras falsas geradas por ffmpeg, com serviço ONVIF simulado.

```bash
# no .env:  CAMERAS_FILE=cameras.teste.yaml   (é o padrão do .env.example)
docker compose --profile teste up --build
```

Entre no painel (usuário `admin`, senha `admin123` se você não trocou os hashes de
exemplo) e você verá três câmeras com o padrão de teste em movimento.

**Simular uma câmera caindo:**
```bash
docker compose stop cam-teste-2
```
Em até 60 segundos a câmera aparece como **offline** no painel e a queda entra no
histórico da aba *Status*. Três minutos depois o watchdog manda um reinício ONVIF
(que o serviço falso registra no log). Para trazer de volta:
```bash
docker compose start cam-teste-2
docker compose logs -f watchdog     # mostra a queda e a recuperação
```

Para desligar o modo de teste:
```bash
docker compose --profile teste down
```

---

## 4. Testar uma câmera no VLC

É o primeiro teste a fazer quando uma câmera nova chega, **antes** de cadastrar.

1. Descubra as URLs prontas:
   ```bash
   python3 scripts/gerar_configs.py --urls --com-senha
   #   ...ou, sem Python instalado:
   #   docker compose run --rm gerador python scripts/gerar_configs.py --urls --com-senha
   ```
2. Abra o VLC → **Mídia → Abrir Fluxo de Rede** (`Ctrl+N`).
3. Cole a URL do stream principal:
   ```
   rtsp://admin:SUA-SENHA@192.168.0.101:554/onvif1
   ```
4. Clique em **Reproduzir**. Deve aparecer a imagem em alguns segundos.

Se o VLC não abrir:
- Confira o IP: `ping 192.168.0.101`
- Teste o substream: troque `/onvif1` por `/onvif2`
- Se a senha tiver `@`, `:`, `/` ou espaço, troque a senha da câmera por uma só com
  letras e números — é o jeito mais simples de evitar dor de cabeça com URL.
- Sem imagem no VLC, o sistema também não vai conseguir: resolva a câmera primeiro.

Também dá para testar pelo próprio go2rtc, que já está rodando:
**http://IP-DO-SERVIDOR:1984** → clique no nome da câmera.

---

## 5. Adicionar uma câmera

Tudo fica em **um arquivo só**: `cameras.yaml`.

```yaml
cameras:
  - id: bar                    # só minúsculas, números e "_" (vira o nome no sistema)
    nome: "Bar"                # é o que a equipe vê no painel
    local: "Área do bar"
    ip: 192.168.0.105
```

Depois:
```bash
docker compose up -d           # regera as configs e reinicia o necessário
```

Opcionais por câmera (quando alguma for diferente das outras):

```yaml
  - id: deposito
    nome: "Depósito"
    ip: 192.168.0.106
    senha_env: CAM_DEPOSITO_SENHA   # senha própria, definida no .env
    porta_rtsp: 554
    porta_onvif: 5000
    detectar: false                 # não procurar pessoas nessa câmera
    onvif: false                    # não tentar reiniciar essa câmera
    retencao:
      continuo_dias: 3
      eventos_dias: 30
```

Os padrões de todas as câmeras (usuário, portas, retenção, tamanho da detecção)
ficam no bloco `padroes:`, no topo do mesmo arquivo.

---

## 6. Segurança: deixar tudo dentro de casa

O sistema **não** abre nada para a internet. Ainda assim, faça estes três ajustes:

**a) Bloquear a saída das câmeras para a internet (no roteador).**
As câmeras Yoosee ficam conversando com servidores na China o tempo todo. Como o
sistema usa RTSP local, elas não precisam de internet nenhuma.

- **Roteador com controle de acesso / firewall por dispositivo** (TP-Link, Intelbras,
  Archer, Deco): crie uma regra para cada IP de câmera bloqueando **todo o tráfego de
  saída para a internet (WAN)**, mantendo a rede local (LAN) liberada.
- **Mikrotik / pfSense / OPNsense**: regra de firewall `src = IP da câmera`,
  `dst = !192.168.0.0/24`, ação `drop`.
- **Roteador simples que não tem essa opção**: no DHCP reservado da câmera, coloque
  um **gateway inválido** (ex.: `192.168.0.254`, que não existe) e **sem DNS**. A
  câmera continua acessível na rede local, mas não sai para a internet.
- Também vale desligar **UPnP** no roteador (é por ele que a câmera tenta abrir portas sozinha).

**b) Não redirecionar portas.** Nunca crie "port forwarding" para 8080, 1984, 5000 ou 554.
Para assistir de fora do buffet, use **VPN** (o WireGuard do próprio roteador, por exemplo).

**c) Fechar o painel ao IP do servidor.** No `.env`, troque `BIND_IP=0.0.0.0` pelo IP
da placa de rede local (ex.: `BIND_IP=192.168.0.10`).

> **Detalhe honesto:** o painel exige login, mas o vídeo **ao vivo** vem direto do
> go2rtc (porta 1984), que fica aberto na rede local sem senha — é o que garante o
> vídeo fluido no celular. Quem já estiver dentro da rede do buffet consegue acessar
> essa porta. As **gravações** passam obrigatoriamente pelo painel, com login.
> Se quiser fechar também o ao vivo, tire a publicação da porta `1984` no
> `docker-compose.yml` (o painel passa a não mostrar vídeo ao vivo) ou use uma
> rede Wi-Fi separada para as câmeras e para o pessoal.

---

## 7. Backup

O que realmente importa salvar são **as configurações**, não as gravações (que se
renovam sozinhas a cada 7 dias).

```bash
# backup das configurações (faça depois de cada mudança)
tar czf backup-cameras-$(date +%F).tar.gz .env cameras.yaml docker-compose.yml

# backup do banco do Frigate (histórico de eventos)
docker compose stop frigate
tar czf backup-frigate-$(date +%F).tar.gz config/frigate
docker compose start frigate
```

Guarde o `.tar.gz` num pen drive ou no Google Drive do buffet. **Atenção:** o `.env`
tem as senhas — não mande para lugar público.

Para salvar um vídeo específico (ex.: um incidente), baixe o clipe pelo painel na
aba *Gravações* (botão direito no vídeo → "Salvar vídeo como"), ou copie direto da
pasta de gravações: `PASTA_GRAVACOES/recordings/AAAA-MM-DD/HH/nome-da-camera/`.

**Restaurar num PC novo:** instale o Docker, clone o projeto, descompacte o backup
por cima e rode `docker compose up -d --build`.

---

## 8. Problemas mais comuns

### Câmera aparece offline no painel
1. Veja o motivo na aba **Status** (ele diz se a câmera não responde na rede ou se
   responde mas não manda vídeo) e no log:
   ```bash
   docker compose logs --tail 50 watchdog
   ```
2. `ping IP-DA-CAMERA` do servidor. Sem resposta:
   - A lâmpada está energizada? (o interruptor da parede desliga a câmera!)
   - O Wi-Fi 2.4 GHz chega até lá? A CA-1003 tem antena fraca.
   - O IP mudou? Confirme a reserva de IP no roteador.
3. Responde o ping mas não tem vídeo: a câmera travou. Reinicie pelo painel
   (aba *Status* → **Reiniciar câmera**, só para o perfil admin) ou desligue e
   ligue a energia por 10 segundos.
4. Câmera que cai várias vezes por dia quase sempre é **sinal de Wi-Fi fraco**.
   Um repetidor perto dela resolve mais do que qualquer ajuste no software.

### Stream travado (imagem congelada)
```bash
docker compose restart go2rtc     # resolve na maioria das vezes
docker compose logs --tail 80 go2rtc
```
Se travar sempre na mesma câmera, no mesmo horário, é rede: veja se tem micro-ondas,
forno ou outro Wi-Fi no caminho. O watchdog já reinicia a câmera sozinho depois de
3 minutos sem imagem (`WATCHDOG_REINICIAR_APOS` no `.env`).

### Disco cheio
O Frigate apaga o mais antigo sozinho, mas se o HD encher por outro motivo:
1. Veja o espaço no painel, aba **Sistema**.
2. Reduza a retenção no `cameras.yaml` (`continuo_dias: 3`, por exemplo) e rode
   `docker compose up -d`.
3. Baixe a qualidade do stream principal no app Yoosee (720p/15fps já é bom).
4. Desligue a gravação contínua de câmeras menos importantes: em `cameras.yaml`
   coloque `continuo_dias: 0` para guardar só os trechos com pessoas.
5. Emergência (apaga gravações antigas de verdade):
   ```bash
   ls PASTA_GRAVACOES/recordings/          # confira as datas
   rm -rf PASTA_GRAVACOES/recordings/2026-01-*
   docker compose restart frigate
   ```

### O painel não abre
```bash
docker compose ps                  # algum container "exited"?
docker compose logs --tail 50 painel
```
- "NENHUM USUÁRIO CONFIGURADO" no log: faltou `PAINEL_ADMIN_HASH` no `.env`.
- Abre no servidor mas não no celular: firewall do PC. No Windows, libere a porta 8080
  no Firewall do Windows Defender; no Ubuntu, `sudo ufw allow from 192.168.0.0/24 to any port 8080`.

### Entro no painel mas o vídeo ao vivo não aparece
1. Confirme que `GO2RTC_CANDIDATE` no `.env` tem o **IP do servidor** e reinicie:
   `docker compose up -d go2rtc`.
2. Teste o go2rtc direto: `http://IP-DO-SERVIDOR:1984` — se lá também não aparecer, o
   problema é a câmera, não o painel.
3. O player tenta **WebRTC → MSE → MJPEG** nessa ordem, sozinho. A etiqueta no canto
   da imagem mostra qual está em uso. Se só o MJPEG funciona, alguma coisa está
   bloqueando as portas 8555 (TCP/UDP) entre o celular e o servidor.

### Esqueci a senha do painel
Gere um hash novo e troque no `.env`:
```bash
python3 scripts/gerar_hash.py
docker compose up -d painel
```

### Depois de reiniciar o PC, nada voltou
- **Linux**: `sudo systemctl enable docker` e confirme com `docker compose ps`.
- **Windows**: o Docker Desktop precisa estar marcado para iniciar com o login, e o
  Windows precisa entrar na conta automaticamente.
- Todos os containers usam `restart: unless-stopped`: se você parou algum com
  `docker compose stop`, ele **não** volta sozinho — use `docker compose up -d`.

---

## 9. Mapa do projeto

```
borabora-app/
├── cameras.yaml            # CADASTRO DAS CÂMERAS (edite este arquivo)
├── cameras.teste.yaml      # câmeras falsas do modo de teste
├── .env                    # senhas e segredos (não vai para o git)
├── .env.example            # modelo do .env
├── docker-compose.yml      # todos os serviços
├── comum/cameras.py        # leitura do cameras.yaml (usado pelos três serviços)
├── scripts/
│   ├── gerar_configs.py    # cameras.yaml -> configs do go2rtc e do Frigate
│   └── gerar_hash.py       # gera o hash bcrypt das senhas do painel
├── watchdog/               # vigia as câmeras e reinicia por ONVIF
├── painel/                 # site do painel (FastAPI + HTML/CSS/JS)
├── teste/                  # câmeras falsas (ffmpeg) + ONVIF simulado
├── config/                 # GERADO automaticamente - não edite
├── gravacoes/              # gravações (ou a pasta do HD definida no .env)
└── index.html              # app de gestão antigo do buffet (não faz parte do NVR)
```

### Portas usadas (todas só na rede local)

| Porta | Serviço | Para quem |
|---|---|---|
| 8080 | Painel Bora Bora | equipe (navegador/celular) |
| 1984 | go2rtc (vídeo ao vivo) | navegador |
| 8555 | WebRTC (TCP e UDP) | navegador |
| 8554 | RTSP redistribuído | uso interno / VLC |
| 5000 | Frigate | interno (não publicado) |
| 8080 (interno) | API do watchdog | interno (não publicado) |

### Comandos do dia a dia

```bash
docker compose up -d              # ligar
docker compose down               # desligar
docker compose restart go2rtc     # reiniciar só o vídeo
docker compose logs -f watchdog   # acompanhar as quedas
docker compose ps                 # ver o que está de pé
docker compose pull && docker compose up -d --build   # atualizar
```

---

## 10. Ajustes finos

| No `.env` | Padrão | Para que serve |
|---|---|---|
| `WATCHDOG_INTERVALO` | 60 | de quantos em quantos segundos checar cada câmera |
| `WATCHDOG_REINICIAR_APOS` | 180 | segundos sem vídeo antes de reiniciar a câmera |
| `WATCHDOG_ESPERA_REBOOT` | 600 | espera mínima entre dois reinícios da mesma câmera |
| `WATCHDOG_MAX_REBOOTS_HORA` | 3 | trava de segurança contra reinício em loop |
| `PAINEL_HORAS_SESSAO` | 12 | quanto tempo o login dura |
| `FRIGATE_SHM` | 256mb | memória compartilhada do Frigate (aumente se tiver mais de 6 câmeras) |

A detecção de pessoas roda **na CPU**. Com muitas câmeras num PC fraco, diminua o
`fps` da detecção no bloco `padroes.deteccao` do `cameras.yaml` (3 fps já resolve
para um buffet) ou coloque `detectar: false` nas câmeras menos importantes.
