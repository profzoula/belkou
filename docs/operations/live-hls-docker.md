# Live BelKou — OBS + HLS (Docker local)

BelKou jwe yon URL **`.m3u8`** (provider `hls`). Sit la pa gen sèvè RTMP entegre : OBS voye videyo a nan Docker (SRS oswa MediaMTX), YouTube, Vimeo, Mux, oswa Cloudflare.

## Admin BelKou

Deux onglets :

1. **Live Payant** — formulaire complet (date, prix, titre, thumbnail, OBS, description).
2. **Live Free** — seulement **Titre**, **Source OBS**, **Lien de diffusion** (prix `$0` auto). Dès la création, le live s’ouvre en player YouTube (vidéo + chat) sur `/live` — jamais en carte.

## Chemin lokal — SRS (sa ki ap mache kounye a)

Kontenè `belkou` = `ossrs/srs:6`.

| Pò sou PC ou | Itilizasyon |
|--------------|-------------|
| `1935` | RTMP — sa OBS itilize |
| `8081` | HLS — sa BelKou bezwen (`.m3u8`) |
| `1985` | API SRS |

`8888` se pou MediaMTX. **Ou pa gen MediaMTX** — pa itilize 8888.

### OBS

- Service : Custom…
- Serveur : `rtmp://127.0.0.1:1935/live`
- Clé : `stream`
- **Démarrer la diffusion**

### BelKou Admin → Live Free

- Source : HLS
- Lien : `http://127.0.0.1:8081/live/stream.m3u8`  
  (si kle OBS te `cours1` → `http://127.0.0.1:8081/live/cours1.m3u8`)

Pa kole `…:1935/…` — 1935 se RTMP, pa HLS.

Lanse SRS (segman HLS 1s — mwens reta) :

```bat
docker stop belkou
docker rm belkou
docker run -d --name belkou -p 1935:1935 -p 1985:1985 -p 8081:8080 -v C:/Project/belkou/deploy/srs/srs.conf:/usr/local/srs/conf/srs.conf ossrs/srs:6
```

Nan OBS → Sortie → Encodage : **Keyframe 1 seconde** (sinon HLS rete an reta).

## Altènatif MediaMTX

```bat
docker run --rm -it -p 1935:1935 -p 8888:8888 bluenviron/mediamtx:latest
```

HLS MediaMTX : `http://127.0.0.1:8888/live/stream/index.m3u8` — **pa melanje ak SRS.**

### Limit lokal

- `127.0.0.1:8081` jwe si w ouvri sit la **sou menm PC** (`localhost`). Sou **belkou.online** li bloke.
- Lè ou **Terminer** yon live HLS, manisfè `.m3u8` live a mouri — pa gen replay otomatik.

## HLS sou belkou.online (toujou HLS, pa YouTube)

Docker rete sou PC ou. Ekspoze pò 8081 an HTTPS ak Cloudflare Tunnel, epi kole lyen sa a nan Admin.

```bat
cloudflared tunnel --url http://127.0.0.1:8081
```

Kopiye URL `https://xxxxx.trycloudflare.com` epi nan BelKou mete:

`https://xxxxx.trycloudflare.com/live/stream.m3u8`

BelKou proxye HLS sa a (`/api/hls-proxy`) pou CSP / CORS pa bloke player la.

OBS dwe deja ap diffuse. Altènatif: Mux / Cloudflare Stream (`.m3u8` HTTPS yo ba ou).

## Chemin pwodiksyon (rekòmande)

1. Kreye yon live sou **Mux** oswa **Cloudflare Stream**.
2. OBS → Custom RTMP ak URL + stream key yo ba ou.
3. Kopiye **Playback HLS** (`https://….m3u8`).
4. Admin BelKou → kole URL → **Démarrer**.

Altènatif san HLS : **YouTube Live (non répertorié)** oswa **Vimeo Live** — OBS → platfòm → kole lien piblik la nan Admin (provider YouTube/Vimeo).

## Relanse yon live

- Status **Programmé** → bouton **Démarrer**.
- Status **Terminé** → pa ka relanse menm sesyon an ; kreye yon **nouvo** live (oswa mete lien replay).

## Referans kòd

- Aksè gratis `$0` : `src/lib/fns/live.ts` (`resolveLiveAccess`)
- Admin Live : `src/components/admin/AdminLiveTab.tsx`
- Player HLS : `src/components/live/LiveStreamPlayer.tsx`
