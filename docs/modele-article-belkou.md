# Modèle d’article BelKou (astuce / tutoriel)

> Remplis **un fichier `.md` par article** en suivant exactement cette structure.  
> Langue : **français uniquement** (pas de créole sur le site public).  
> Remplace les textes entre `« … »` et les exemples.

---

```yaml
---
id: 71
category: Linux
slug: mon-slug-unique-en-minuscules
title: Titre clair de l’article (max ~70 caractères)
seoTitle: Titre SEO un peu plus descriptif
metaDescription: Résumé 140–160 caractères pour Google et la carte blog.
ogTitle: Titre court pour le partage social
ogDescription: Une phrase d’accroche pour Facebook / WhatsApp.
primaryKeyword: mot-clé principal
secondaryKeywords:
  - mot-clé 2
  - mot-clé 3
  - mot-clé 4
tags:
  - Linux
  - Réseau
  - Diagnostic
difficulty: Débutant
estimatedMinutes: 5
coverAlt: Description accessible de l’image de couverture
legalNotice: ""
---
```

## Valeurs autorisées

| Champ | Valeurs |
| --- | --- |
| `category` | `Windows` · `Linux` · (autres catégories blog si besoin) |
| `difficulty` | `Débutant` · `Intermédiaire` · `Avancé` |
| `slug` | minuscules, tirets, sans accents, unique |
| `id` | numéro d’astuce source (1–1190) si applicable |
| `legalNotice` | laisser vide `""` sauf avertissement légal / sécurité |
| `tags` | 2–5 étiquettes courtes en français |

---

## Introduction

1–3 paragraphes courts. Un paragraphe = une ligne (ou un bloc séparé par une ligne vide).

« Premier paragraphe : contexte + promesse. »

« Deuxième paragraphe : pour qui / dans quel cas. »

---

## Pourquoi cette astuce est utile ?

- Point 1
- Point 2
- Point 3

---

## Prérequis

- Prérequis 1
- Prérequis 2
- Prérequis 3

---

## Comment faire ?

### Étape 1 — Titre de l’étape

Corps de l’étape : actions concrètes, une idée par phrase.

### Étape 2 — Titre de l’étape

Corps de l’étape.

### Étape 3 — Titre de l’étape

Corps de l’étape.

*(Ajoute autant d’étapes que nécessaire : `### Étape N — …`)*

---

## Commande / Code

Langage : `bash` (ou `powershell` · `cmd` · `yaml` · `text`)

````text
# Colle ici la commande ou le code exact
commande --exemple
````

### Explication du code

- Ligne / option 1 : à quoi ça sert
- Ligne / option 2 : à quoi ça sert

### Note (optionnel)

Note courte si le code source a été adapté / simplifié.

---

## Conseils

- Conseil 1
- Conseil 2

---

## Erreurs fréquentes

- Erreur 1 : cause / solution
- Erreur 2 : cause / solution

---

## FAQ

### Question 1 ?

Réponse claire en 1–3 phrases.

### Question 2 ?

Réponse.

### Question 3 ?

Réponse.

---

## Articles liés (optionnel)

Liste d’`id` d’astuces déjà publiées, séparés par des virgules :

`relatedIds: 49, 39, 64, 63`

---

## Checklist avant envoi

- [ ] Français uniquement
- [ ] `slug` unique
- [ ] `metaDescription` ~150 caractères
- [ ] Au moins 3 étapes
- [ ] Code testé (ou marqué comme exemple)
- [ ] 2–3 FAQ
- [ ] Pas d’info inventée sur BelKou (cours, prix, services)

---

## Exemple minimal rempli

```yaml
---
id: 71
category: Windows
slug: vider-cache-dns-windows
title: Vider le cache DNS sous Windows
seoTitle: ipconfig /flushdns — vider le cache DNS Windows
metaDescription: Résolvez des sites qui ne chargent pas en vidant le cache DNS avec ipconfig /flushdns.
ogTitle: Vider le cache DNS Windows
ogDescription: Une commande rapide quand un site refuse de s’ouvrir correctement.
primaryKeyword: flushdns Windows
secondaryKeywords:
  - cache DNS
  - ipconfig
  - résolution DNS
tags:
  - Windows
  - Réseau
  - Diagnostic
difficulty: Débutant
estimatedMinutes: 3
coverAlt: Invite de commandes Windows avec ipconfig /flushdns
legalNotice: ""
---
```

## Introduction

Quand un site a changé d’adresse IP, Windows peut encore utiliser une ancienne valeur en cache.

Vider le cache DNS force une nouvelle résolution.

## Pourquoi cette astuce est utile ?

- Corrige souvent « site introuvable » après un changement DNS
- Rapide, sans redémarrer
- Utile aussi après un VPN ou un changement de réseau

## Prérequis

- Windows 10 ou 11
- Invite de commandes ou PowerShell

## Comment faire ?

### Étape 1 — Ouvrir le terminal

Ouvre Invite de commandes ou PowerShell (pas besoin d’admin dans la plupart des cas).

### Étape 2 — Lancer la commande

Exécute `ipconfig /flushdns` puis Entrée.

### Étape 3 — Vérifier

Recharge le site (Ctrl+F5). Si besoin, teste aussi `nslookup domaine.com`.

## Commande / Code

Langage : `cmd`

````text
ipconfig /flushdns
````

### Explication du code

- `ipconfig` : outil réseau Windows
- `/flushdns` : vide le cache de résolution DNS local

## Conseils

- Sur certains postes d’entreprise, un proxy DNS peut encore servir d’anciennes réponses
- Complète avec `ipconfig /registerdns` si un admin te le demande

## Erreurs fréquentes

- « Accès refusé » : relance en administrateur
- Le site échoue encore : ce n’est peut‑être pas le DNS (pare-feu, HTTPS, serveur distant)

## FAQ

### Ça marche sur Mac ?

Non. Sur macOS, la commande équivalente dépend de la version (souvent `sudo dscacheutil -flushcache`).

### Faut-il redémarrer le PC ?

Non. La commande suffit dans la plupart des cas.

### Différence avec vider le cache du navigateur ?

Le cache navigateur stocke des pages/fichiers ; le cache DNS stocke des noms → IP.

## Articles liés (optionnel)

`relatedIds: 63, 61, 1`
