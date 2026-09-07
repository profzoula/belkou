---
id: 5
category: IA
slug: prompt-engineering-comment-ecrire-de-meilleurs-prompts
title: Prompt Engineering : comment écrire de meilleurs prompts
seoTitle: Prompt engineering — écrire des prompts clairs pour l’IA
metaDescription: Apprenez à structurer un prompt : rôle, contexte, contraintes, format et critères de réussite pour des réponses IA plus utiles.
ogTitle: Des prompts qui marchent vraiment
ogDescription: Une méthode concrète pour passer du « aide-moi » au résultat livrable.
primaryKeyword: prompt engineering
secondaryKeywords:
  - écrire un prompt
  - instructions IA
  - bons prompts
tags:
  - IA
  - Productivité
  - Développement
difficulty: Débutant
estimatedMinutes: 9
coverAlt: Checklist d’un prompt structuré : rôle, objectif, format, contraintes
legalNotice: ""
---

## Introduction

Le prompt engineering, c’est l’art de formuler une demande que l’IA peut exécuter sans deviner. Ce n’est pas une formule magique : c’est de la clarté, de la structure et des exemples.

Un bon prompt réduit les allers-retours. Un mauvais prompt produit du texte long, poli… et inutile.

## Pourquoi cette astuce est utile ?

- Gagner du temps sur rédaction, étude et code
- Obtenir des formats prêts à coller (tableaux, étapes, checklists)
- Limiter les hallucinations en cadrant le périmètre
- Reproduire vos succès (bibliothèque de prompts)

## Prérequis

- Un assistant texte (ChatGPT, Claude, Gemini…)
- Un résultat mesurable (« un email de 120 mots », « 5 questions d’examen »)
- Un exemple du « bon » résultat si vous en avez un

## Comment faire ?

### Étape 1 — Commencer par le résultat

Écrivez d’abord la phrase : « À la fin, j’aurai ___ . » Si vous ne pouvez pas la finir, le prompt est trop flou.

### Étape 2 — Ajouter rôle + public

« Tu es formateur Windows pour débutants » n’est pas du théâtre : cela oriente le vocabulaire et le niveau de détail.

### Étape 3 — Imposer le format

Liste numérotée, tableau Markdown, JSON, email, script bash… Sans format, l’IA improvise une dissertation.

### Étape 4 — Donner un exemple (few-shot)

Montrez 1 entrée → 1 sortie attendue. Les modèles imitent mieux un modèle qu’une description abstraite.

### Étape 5 — Définir le succès et les interdits

« Succès = 5 étapes testables. Interdit = jargon, liens inventés, conseils médicaux. »

## Commande / Code

Langage : `text`

````text
Rôle : [expert / tuteur / relecteur]
Objectif : [résultat final]
Contexte : [faits utiles uniquement]
Exemples :
- Entrée : …
  Sortie : …
Contraintes : [longueur, langue, ton]
Format de sortie : [structure exacte]
Critères de réussite : [comment je jugerai]
Si ambigu, pose des questions avant de produire.
````

### Explication du code

- Les exemples ancrent le style
- Les critères de réussite orientent vers l’utile, pas le verbeux
- Les questions évitent le remplissage inventé

### Note

Pour le code, ajoutez : langage, version, OS, et « n’invente pas d’API ».

## Conseils

- Un prompt long et clair bat un prompt court et vague
- Découpez : plan → validation → rédaction
- Versionnez vos prompts comme du code (`prompt-email-v3.txt`)
- Testez le même prompt sur deux modèles si le sujet est critique

## Erreurs fréquentes

- **Tout mettre en une seule phrase** : structurez
- **Oublier le public** : le ton rate souvent à cause de ça
- **Demander « sois créatif » sans contraintes** : la créativité a besoin de rails

## FAQ

### Faut-il parler anglais à l’IA ?

Non. Un français précis fonctionne très bien. Restez cohérent (une langue par réponse).

### C’est réservé aux développeurs ?

Non. Les marketeurs, étudiants et formateurs gagnent autant à structurer leurs demandes.

### Combien d’exemples faut-il ?

Un bon exemple vaut mieux que cinq médiocres. Commencez par un.

## Articles liés (optionnel)

`relatedIds: 2, 9, 12`
