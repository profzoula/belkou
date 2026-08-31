# Live BelKou — OBS + HLS (Docker local)

BelKou jwe yon URL **HTTPS `.m3u8`** (provider `hls`). Sit la pa gen sèvè RTMP entegre : ou voye stream lan soti nan **OBS** vè YouTube, Vimeo, Mux, Cloudflare, oswa yon **MediaMTX** lokal (Docker).

## Admin BelKou

Deux onglets :

1. **Live Payant** — formulaire complet (date, prix, titre, thumbnail, OBS, description).
2. **Live Free** — seulement **Titre**, **Source OBS**, **Lien de diffusion** (prix `$0` auto). Puis **Démarrer** dans la liste.

## Chemin lokal (MediaMTX + Docker)

### 1. Lanse sèvè a (CMD / PowerShell)

Asire **Docker Desktop** ap mache, epi:

```bat
docker run --rm -it -p 1935:1935 -p 8554:8554 -p 8888:8888 -p 8889:8889 bluenviron/mediamtx:latest
```

| Pò | Itilizasyon |
|----|-------------|
| `1935` | RTMP (OBS) |
| `8888` | HLS (player / BelKou) |
| `8554` | RTSP (opsyonèl) |
| `8889` | WebRTC (opsyonèl) |

### 2. OBS

- **Paramètres → Diffusion → Service :** Custom…
- **Serveur :** `rtmp://127.0.0.1:1935/live`
- **Clé de diffusion :** `stream` (oswa nenpòt non san espas)
- Klike **Démarrer la diffusion**

### 3. BelKou Admin → Live

- **Source OBS :** `HLS (.m3u8 Mux / Cloudflare)`
- **URL :** `http://127.0.0.1:8888/live/stream/index.m3u8`  
  (si kle a te `cours1` → `…/live/cours1/index.m3u8`)
- Pri `0` = gratis san kont (gade + replay lè gen recording)
- **Créer**, lè ou pare : **Démarrer**

Elèv yo louvri `/live/{sessionId}` — player anlè + chat (ekri = login).

### Limit lokal

- `127.0.0.1` mache **sèlman** sou PC kote Docker ap kouri.
- Pou spektatè sou internet / **belkou.online**, itilize Mux, Cloudflare Stream, oswa yon MediaMTX piblik ak **HTTPS**.
- Lè ou **Terminer** yon live HLS, manisfè `.m3u8` live a mouri — pa gen replay otomatik ; kole yon nouvo URL (`.m3u8` / YouTube / Vimeo) pou replay.

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
