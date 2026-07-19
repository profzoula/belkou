## Session 1 — Prompt Engineering

Lè w ap bati aplikasyon ak **Cursor**, **Claude Code** oswa lòt zouti IA, sa ki pi enpòtan se pa sèlman konnen kote pou klike — se **kijan ou mande** (prompt) pou AI a bay bon rezilta. Yon move prompt fè w pèdi tan, kreye erè, epi fòse w refè menm travay la plizyè fwa.

**Prompt Engineering** se atizay pou fòmile demann ou yo klè, konplè, ak estriktire — pou AI a konprann egzakteman sa w vle, nan ki langaj, ak ki estil.

Nan modil sa a, ou pral aprann fondasyon yo pou travay pi vit ak mwens erè pandan w ap devlope **Frontend**, **Backend** ak **MVP** ou yo avèk VibeCoding.

**Objektif chapit la :**

- Konprann kisa yon bon prompt gen ladan
- Ekri prompt ki pwodui kòd ki fonksione depi premye fwa
- Itilize kontèks pwojè a (fichye, stack, konvansyon)
- Deboge ak refaktore avèk AI san kreye plis pwoblèm
- Evite erè komen ki fè anpil debutan abandone

---

### 1.1 Kisa Prompt Engineering ye?

Yon **prompt** se tout mesaj ou voye bay yon modèl IA (Claude, GPT, elatriye) pou li reponn ou — ekri kòd, eksplike, korije erè, elatriye.

**Prompt Engineering** se pratik pou :

- Chwazi **mo ki klè** olye de fraz vague
- Bay **kontèks** (pwojè, fichye, objektif biznis)
- Mete **limit** (pa modifye sa ou pa mande, pa ajoute depandans initil)
- Defini **fòma repons** (sèlman kòd, oswa kòd + eksplikasyon kout)

San sa, AI a devine — epi devinasyon sou kòd se sous erè.

### Poukisa li enpòtan nan VibeCoding?

Nan VibeCoding, ou pa sèlman ap mande « ekri yon sit ». Ou ap bati :

- Yon **MVP** ki gen UI, routing, fòm, API
- Yon stack espesifik (**React**, **TypeScript**, **TanStack**, **Supabase**, elatriye)
- Yon pwojè ki deja gen **konvansyon** (non fichye, estil, estrikti dossye)

Yon prompt ki pa respeye sa ap :

- Kreye fichye nan move kote
- Itilize bibliyotèk ou pa vle
- Kraze kòd ki deja mache
- Bay solisyon ki twò konplike pou bezwen ou

**Bon nouvèl :** ou pa bezwen vin ekspè an anglè teknik. Ou bezwen yon **fòm** ki repete — e nou pral montre w li anba a.

---

### 1.2 Estrikti yon bon prompt — RTFC

Itilize fòmil **RTFC** pou chak demann enpòtan :

| Let | Sa li vle di | Egzanp |
|-----|--------------|--------|
| **R** — Rôle | Ki wòl AI a jwe | « Ou se yon dev React senior… » |
| **T** — Tach | Sa pou fè egzakteman | « Kreye yon kompozan `LoginForm`… » |
| **F** — Fòma | Ki kalite repons | « Sèlman kòd TypeScript, san eksplikasyon » |
| **C** — Kontèks | Enfòmasyon pwojè | « Pwojè a itilize Tailwind, fichye yo nan `src/components/`… » |

**Règ lò :** yon prompt = **yon objektif prensipal**. Si ou gen 5 bagay pou fè, separe yo an 5 prompt oswa lis nimewote.

---

### 1.3 Kontèks pwojè — sa ki fè diferans lan

Nan **Cursor** oswa **Claude Code**, toujou bay AI a :

- **Non pwojè a** ak stack (React 19, Vite, elatriye)
- **Fichye ki gen rapò** (`@` mention nan Cursor)
- **Sa ki deja egziste** (pa rekreye sa ki la deja)
- **Sa ou pa vle** (pa ajoute Redux si pwojè a pa itilize l)

**Move egzanp :**

> Fè yon paj login.

**Bon egzanp :**

> Ou se yon dev React/TypeScript. Nan pwojè BelKou (`src/routes/login.tsx` pa egziste), kreye yon paj login ak email + modpas, Tailwind, konpozan `Button` nan `@/components/ui/button`. Pa ajoute nouvo depandans. Sèlman kòd fichye a.

Kontèks = mwens iterasyon, mwens erè.

---

### 1.4 Egzanp prompt pou kreye yon paj (Frontend)

Lè w ap kreye yon nouvo ekran nan MVP ou :

```text
Rôle: Dev React senior, stack TanStack Router + Tailwind.
Tach: Kreye paj `/dashboard` ki montre lis kou yo (tit + thumbnail) nan yon grid responsif.
Kontèks: Gade estil `@/components/dashboard/MyCoursesSection.tsx`. Itilize menm konvansyon non ak espas.
Fòma: Yon sèl fichye route `src/routes/dashboard.tsx`. Pa modifye lòt fichye.
Limit: Pa enstale bibliyotèk nouvo. Pa mete done mock hardcode — itilize props placeholder.
```

Apre AI a reponn :

1. **Li kòd la** anvan ou aksepte
2. **Teste** nan navigatè (Chrome DevTools si gen erè)
3. Si gen erè, voye yon **nouvo prompt debogaj** (gade 1.5)

---

### 1.5 Egzanp prompt pou debogaj ak refaktore

**Debogaj** — bay erè a ak fichye a :

```text
Nan `@/components/course/CoursePlayer.tsx`, mwen gen erè TypeScript:
"Property 'vimeoUrl' does not exist on type CourseLesson".

Tach: Korije tip la san chanje lòt fichye. Eksplike kout ki chanjman ou fè.
Kontèks: Nou ajoute sipò Vimeo sou leçon yo.
```

**Refaktore** — limite chanjman an :

```text
Refaktore fonksyon `loadPlayback` nan CoursePlayer.tsx pou li pi lis,
men PA chanje konpòtman aksè preview/paid.
Pa rename export yo. Pa deplase fichye.
Montre sèlman diff ki nesesè.
```

**Règ debogaj :** toujou mete **mesaj erè konplè** + **fichye** + **sa ou te atann**.

---

### 1.6 Teknik ki ogmante kalite repons yo

**Chain of thought (kout)** — mande AI a planifye anvan li kode :

> Anvan ou ekri kòd, bay yon plan 3 etap. Apre mwen valide, ekri kòd la.

**Few-shot** — montre yon egzanp ou renmen :

> Swiv menm estrikti ak `@/components/forum/ForumPostCard.tsx` pou kreye `CoursePostCard`.

**Iterasyon kontwole** — pa mande « refè tout app la » ; mande « ajoute bouton X sou paj Y ».

**Verifye** — mande AI a :

> Li fichye X epi konfime li konpatib ak Y avan ou modifye.

---

### 1.7 Erè komen — evite yo

| Erè | Poukisa li move | Sa pou fè olye |
|-----|-----------------|----------------|
| Prompt twò kout | AI devine stack ou | Ajoute RTFC |
| Twòp demann nan yon sèl mesaj | Repons enkonplè oswa move | Separe an plizyè prompt |
| Pa mansyone fichye ki egziste | Duplikasyon, konfli | `@` fichye oswa path |
| « Fè li pi bèl » san kritè | Rezilta aleatwa | Pale koulè, espas, egzanp |
| Aksepte tout san li | Erè ak sekirite | Li + teste + commit piti |
| Pa mete limit | AI ajoute lib inutil | « Pa ajoute depandans » |

---

### 1.8 Checklist anvan ou voye yon prompt

Verifye lis sa a :

- [ ] Mwen di **ki fichye** oswa ki pati pwojè a konsène
- [ ] Mwen di **stack** ak konvansyon (TypeScript, Tailwind, elatriye)
- [ ] Mwen gen **yon sèl objektif** klè
- [ ] Mwen di **fòma repons** (kòd sèl, oswa kòd + plan)
- [ ] Mwen mete **limit** (pa touche lòt fichye, pa nouvo pakè)
- [ ] Si debogaj : mwen mete **mesaj erè** konplè
- [ ] Mwen pare pou **teste** apre repons lan

Kenbe checklist sa a bò kote w pandan tout fòmasyon an.

---

## Apre ou fini li

Lè ou fin li modil sa a :

1. Louvri **Cursor** oswa **Claude Code** sou pwojè MVP ou a
2. Ekri **yon prompt RTFC** pou yon ti chanjman (eg. ajoute yon tit, yon bouton)
3. Teste rezilta a nan Chrome DevTools
4. Mark leçon sa a kòm **terminée** epi kontinye devlopman Frontend la

**Souke :** Si yon prompt pa bay bon rezilta, pa abandone — **refine** li ak plis kontèks olye de repete menm fraz la. Se konsa pwofesyonèl yo travay ak IA chak jou.

Poze kesyon ou yo nan **forum** kou a si yon egzanp pa klè.

---

### 1.9 Quiz — Session 1: Prompt Engineering

Reponn tout kesyon yo kòrèkteman (5/5) pou kontinye.
