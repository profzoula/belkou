import fs from "node:fs";

const articles = [
  {
    id: 31,
    category: "Linux",
    slug: "tmux-sessions-persistantes-linux",
    title: "Garder des sessions terminal persistantes avec tmux",
    seoTitle: "tmux : créer et rattacher une session (new -s / attach -t)",
    metaDescription:
      "Utilisez tmux new -s nom et tmux attach -t nom pour des sessions terminal qui survivent à une coupure SSH.",
    ogTitle: "tmux — sessions persistantes sous Linux",
    ogDescription: "Idéal en SSH : reprenez votre travail exactement où vous l’avez laissé.",
    primaryKeyword: "tmux session Linux",
    secondaryKeywords: ["tmux new -s", "tmux attach", "session SSH"],
    tags: ["Linux", "Terminal", "SSH"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 5,
    coverAlt: "Terminal Linux avec plusieurs volets tmux",
    introduction: [
      "tmux permet de multiplexer le terminal : plusieurs fenêtres/volets dans une seule session.",
      "Surtout utile en SSH : si la connexion tombe, la session continue sur le serveur et vous vous y rattachez plus tard.",
    ],
    whyUseful: [
      "Vous ne perdez plus une compilation longue à cause d’un réseau instable.",
      "Plusieurs tâches en parallèle dans une seule fenêtre.",
      "Standard sur les serveurs Linux.",
    ],
    prerequisites: ["Linux ou WSL avec tmux", "Paquet tmux installé", "Accès shell"],
    steps: [
      {
        title: "Créer une session nommée",
        body: "Lancez tmux new -s nom (ex. deploy).",
      },
      {
        title: "Travailler puis détacher",
        body: "Travaillez normalement. Pour quitter sans tuer la session : Ctrl+b puis d.",
      },
      {
        title: "Se rattacher",
        body: "Plus tard : tmux attach -t nom.",
      },
    ],
    code: "tmux new -s nom\ntmux attach -t nom",
    codeLang: "bash",
    codeExplanation: [
      "tmux new -s nom crée une session nommée.",
      "tmux attach -t nom s’y rattache.",
      "tmux ls liste les sessions actives.",
    ],
    tips: ["Nommez vos sessions par projet.", "Ctrl+b ? affiche l’aide."],
    commonErrors: [
      "command not found : installez tmux.",
      "no sessions : mauvais nom ou session fermée.",
    ],
    faq: [
      {
        q: "tmux vs screen ?",
        a: "Les deux persistent. tmux est souvent préféré aujourd’hui.",
      },
      { q: "Ça marche dans WSL ?", a: "Oui, si tmux est installé." },
      { q: "Comment tuer une session ?", a: "tmux kill-session -t nom." },
    ],
    relatedIds: [35, 37, 39, 33],
  },
  {
    id: 32,
    category: "Linux",
    slug: "trouver-fichiers-volumineux-find-linux",
    title: "Trouver rapidement les fichiers de plus de 100 Mo",
    seoTitle: "find / -size +100M : localiser les gros fichiers Linux",
    metaDescription:
      "Repérez les fichiers volumineux avec find / -size +100M -type f 2>/dev/null.",
    ogTitle: "Chasser les gros fichiers sous Linux",
    ogDescription: "Commande find classique pour le diagnostic d’espace disque.",
    primaryKeyword: "find fichiers volumineux Linux",
    secondaryKeywords: ["find -size +100M", "espace disque", "gros fichiers"],
    tags: ["Linux", "Disque", "Administration"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 4,
    coverAlt: "Recherche de gros fichiers avec find",
    introduction: [
      "Quand le disque est plein, il faut identifier les fichiers qui pèsent le plus.",
      "find avec -size +100M liste les fichiers de plus de 100 Mo ; 2>/dev/null masque les erreurs de permission.",
    ],
    whyUseful: [
      "Cible les vrais poids lourds (logs, ISOs, dumps).",
      "Fonctionne sans interface graphique.",
      "Combinable avec du et sort.",
    ],
    prerequisites: ["Shell Linux", "sudo utile pour scanner tout /"],
    steps: [
      {
        title: "Lancer la recherche",
        body: "Exécutez find depuis un terminal. Sur tout le système, préférez sudo si besoin.",
      },
      {
        title: "Lire les chemins",
        body: "Chaque ligne est un fichier > 100 Mo. Notez les chemins suspects.",
      },
      {
        title: "Agir avec prudence",
        body: "Ne supprimez que ce que vous identifiez clairement.",
      },
    ],
    code: "find / -size +100M -type f 2>/dev/null",
    codeLang: "bash",
    codeExplanation: [
      "find / part de la racine.",
      "-size +100M filtre les fichiers de plus de 100 Mo.",
      "-type f limite aux fichiers.",
      "2>/dev/null ignore Permission denied.",
    ],
    tips: [
      "Restreignez le départ (find /var …) pour aller plus vite.",
      "Ajoutez -exec ls -lh {} \\; pour des tailles lisibles.",
    ],
    commonErrors: [
      "Scan très long : limitez le chemin.",
      "Suppression agressive : vérifiez avant rm.",
    ],
    faq: [
      { q: "Puis-je chercher +1G ?", a: "Oui : -size +1G." },
      {
        q: "Pourquoi des erreurs sans 2>/dev/null ?",
        a: "Des répertoires ne sont pas lisibles par votre utilisateur.",
      },
      {
        q: "ncdu est-il mieux ?",
        a: "Pour l’exploration interactive, oui. find reste scriptable.",
      },
    ],
    relatedIds: [34, 40, 35, 33],
  },
  {
    id: 33,
    category: "Linux",
    slug: "suivre-logs-journalctl-grep-linux",
    title: "Suivre les logs système en temps réel avec journalctl",
    seoTitle: "journalctl -f | grep ERROR — logs Linux en live",
    metaDescription:
      "Surveillez journald en direct et filtrez les erreurs avec journalctl -f | grep ERROR.",
    ogTitle: "Logs Linux en temps réel",
    ogDescription: "Détection rapide d’erreurs sur systemd / services.",
    primaryKeyword: "journalctl temps réel",
    secondaryKeywords: ["journalctl -f", "grep ERROR", "logs systemd"],
    tags: ["Linux", "Logs", "Diagnostic"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 4,
    coverAlt: "Flux journalctl filtré sur ERROR",
    introduction: [
      "Sous systemd, journalctl interroge le journal système.",
      "L’option -f suit le flux en direct, et grep ERROR ne garde que les lignes d’erreur.",
    ],
    whyUseful: [
      "Vous voyez une panne au moment où elle apparaît.",
      "Filtrage simple sans outil lourd.",
      "Base du dépannage services.",
    ],
    prerequisites: ["Système avec systemd/journald", "sudo souvent requis"],
    steps: [
      {
        title: "Lancer le suivi filtré",
        body: "Exécutez journalctl -f | grep ERROR (avec sudo si besoin).",
      },
      {
        title: "Reproduire le problème",
        body: "Dans un autre terminal, relancez le service qui échoue.",
      },
      {
        title: "Arrêter le suivi",
        body: "Ctrl+C stoppe journalctl. Affinez avec journalctl -u service -n 100.",
      },
    ],
    code: "journalctl -f | grep ERROR",
    codeLang: "bash",
    codeExplanation: [
      "journalctl -f suit le journal en continu.",
      "grep ERROR filtre les lignes contenant ERROR.",
      "grep -i error ignore la casse.",
    ],
    tips: [
      "journalctl -p err -f filtre par priorité.",
      "Pour un service : journalctl -u ssh -f.",
    ],
    commonErrors: [
      "Aucune sortie : essayez -i error ou -p warning.",
      "Accès refusé : sudo ou groupe systemd-journal.",
    ],
    faq: [
      {
        q: "Sans systemd ?",
        a: "Utilisez tail -f /var/log/syslog ou messages.",
      },
      {
        q: "Limiter dans le temps ?",
        a: 'journalctl --since "10 min ago" -f.',
      },
      {
        q: "Logs persistants au reboot ?",
        a: "Selon Storage= dans journald.conf.",
      },
    ],
    relatedIds: [39, 31, 40, 34],
  },
  {
    id: 34,
    category: "Linux",
    slug: "analyser-espace-disque-du-linux",
    title: "Analyser l’espace disque par dossier avec du",
    seoTitle: "du -sh /* | sort -rh : qui mange le disque sous Linux ?",
    metaDescription:
      "Classez les plus gros répertoires avec du -sh /* 2>/dev/null | sort -rh | head -20.",
    ogTitle: "Occupants du disque Linux avec du",
    ogDescription: "Vue rapide des dossiers qui consomment le plus d’espace.",
    primaryKeyword: "du espace disque Linux",
    secondaryKeywords: ["du -sh", "sort -rh", "analyser disque"],
    tags: ["Linux", "Disque", "Administration"],
    difficulty: "Débutant",
    estimatedMinutes: 4,
    coverAlt: "Sortie de la commande du triée par taille",
    introduction: [
      "du estime l’espace utilisé par des répertoires. Combiné à sort, il montre où part le stockage.",
      "La commande proposée résume chaque entrée sous /, trie du plus gros au plus petit, et affiche le top 20.",
    ],
    whyUseful: [
      "Diagnostic disque plein en une ligne.",
      "Meilleure orientation qu’un simple df -h.",
      "Scriptable pour rapports périodiques.",
    ],
    prerequisites: ["Shell Linux", "sudo utile pour certains dossiers"],
    steps: [
      {
        title: "Exécuter du + sort",
        body: "Lancez la commande. Le premier scan peut prendre du temps.",
      },
      {
        title: "Identifier les coupables",
        body: "Regardez /var, /home, /usr… Puis descendez : du -sh /var/* | sort -rh | head.",
      },
      {
        title: "Nettoyer avec méthode",
        body: "Logs, caches paquets, images Docker : traitez dossier par dossier.",
      },
    ],
    code: "du -sh /* 2>/dev/null | sort -rh | head -20",
    codeLang: "bash",
    codeExplanation: [
      "du -sh /* résumé humain pour chaque entrée de /.",
      "sort -rh trie par taille décroissante.",
      "head -20 limite aux 20 premiers.",
    ],
    tips: [
      "df -h donne l’espace libre ; du explique le contenu.",
      "Sur NFS, ciblez un sous-arbre.",
    ],
    commonErrors: [
      "Tailles bizarres sur snapshots : outils spécifiques parfois mieux.",
      "Permission denied partout sans redirection d’erreur.",
    ],
    faq: [
      {
        q: "Pourquoi du ≠ df ?",
        a: "Fichiers ouverts effacés, réservations root, snapshots…",
      },
      { q: "Alternative interactive ?", a: "ncdu ou baobab." },
      {
        q: "Dossiers cachés de /home ?",
        a: "Affinez le chemin plutôt que d’expanser ..",
      },
    ],
    relatedIds: [32, 40, 35, 33],
  },
  {
    id: 35,
    category: "Linux",
    slug: "sauvegardes-incrementales-rsync-linux",
    title: "Faire des sauvegardes intelligentes avec rsync",
    seoTitle: "rsync -avz --progress : backup incrémental Linux",
    metaDescription:
      "Copiez efficacement avec rsync -avz --progress /src/ user@host:/dst/ — seuls les changements sont transférés.",
    ogTitle: "rsync — la référence des backups Linux",
    ogDescription: "Rapide, fiable, parfait en SSH vers un serveur ou un NAS.",
    primaryKeyword: "rsync backup Linux",
    secondaryKeywords: ["rsync -avz", "sauvegarde incrémentale", "sync SSH"],
    tags: ["Linux", "Sauvegarde", "Réseau"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 6,
    coverAlt: "Transfert rsync avec barre de progression",
    introduction: [
      "rsync synchronise des arborescences en ne recopiant que ce qui a changé.",
      "Via SSH, c’est l’outil roi pour pousser un dossier local vers un serveur distant.",
    ],
    whyUseful: [
      "Économise bande passante après le premier run.",
      "Options riches (exclude, delete, checksum).",
      "Disponible partout.",
    ],
    prerequisites: [
      "rsync des deux côtés",
      "Accès SSH",
      "Chemins source/destination corrects",
    ],
    steps: [
      {
        title: "Préparer source et destination",
        body: "Le slash final sur /src/ copie le contenu du dossier.",
      },
      {
        title: "Lancer rsync",
        body: "Exécutez rsync -avz --progress /src/ user@host:/dst/.",
      },
      {
        title: "Vérifier",
        body: "Relancez : le second passage doit être rapide sans changements.",
      },
    ],
    code: "rsync -avz --progress /src/ user@host:/dst/",
    codeLang: "bash",
    codeExplanation: [
      "-a mode archive, -v verbose, -z compression.",
      "--progress montre l’avancement.",
      "Remplacez /src/, user@host et /dst/.",
    ],
    tips: [
      "Testez avec --dry-run.",
      "Attention à --delete : miroir exact.",
    ],
    commonErrors: [
      "Permission denied SSH : clés / droits.",
      "Slash final mal compris : contenu vs dossier.",
    ],
    faq: [
      {
        q: "rsync chiffre-t-il ?",
        a: "Via SSH, le transport est chiffré.",
      },
      {
        q: "Backup versionné ?",
        a: "Ajoutez borg/restic ou des snapshots pour l’historique.",
      },
      { q: "Windows ?", a: "Via WSL ou outils compatibles." },
    ],
    relatedIds: [37, 38, 31, 34],
  },
  {
    id: 36,
    category: "Linux",
    slug: "chmod-masse-dossiers-fichiers-linux",
    title: "Appliquer chmod en masse : 755 dossiers, 644 fichiers",
    seoTitle: "find + chmod : normaliser les permissions Linux",
    metaDescription:
      "Remettez des permissions saines avec find … chmod 755 sur dossiers et 644 sur fichiers.",
    ogTitle: "Permissions Unix en lot",
    ogDescription: "Utile après un zip trop permissif ou un déploiement web.",
    primaryKeyword: "chmod 755 644 find",
    secondaryKeywords: ["permissions Linux", "chmod en masse", "find -exec"],
    tags: ["Linux", "Sécurité", "Fichiers"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 5,
    coverAlt: "Commandes find et chmod dans un terminal",
    introduction: [
      "Des archives peuvent laisser des permissions incohérentes.",
      "find + chmod remet souvent 755 sur les dossiers et 644 sur les fichiers.",
    ],
    whyUseful: [
      "Corrige un arbre entier en deux commandes.",
      "Réduit les bits d’exécution inutiles.",
      "Schéma classique pour sites web simples.",
    ],
    prerequisites: [
      "Droits d’écriture sur /path",
      "Ne pas appliquer aveuglément sur /usr",
    ],
    steps: [
      {
        title: "Choisir le chemin",
        body: "Remplacez /path (ex. /var/www/mon-site). Évitez / sans réflexion.",
      },
      {
        title: "Dossiers en 755",
        body: "find /path -type d -exec chmod 755 {} \\;",
      },
      {
        title: "Fichiers en 644",
        body: "find /path -type f -exec chmod 644 {} \\; puis +x seulement aux scripts nécessaires.",
      },
    ],
    code: "find /path -type d -exec chmod 755 {} \\;\nfind /path -type f -exec chmod 644 {} \\;",
    codeLang: "bash",
    codeExplanation: [
      "-type d dossiers, -type f fichiers.",
      "755 = rwxr-xr-x ; 644 = rw-r--r--.",
      "{} chemin trouvé ; \\; termine -exec.",
    ],
    tips: [
      "xargs -0 peut être plus rapide sur gros arbres.",
      "Les scripts .sh devront repasser en 755/750.",
    ],
    commonErrors: [
      "Casser des binaires en 644.",
      "Oublier l’échappement \\;.",
    ],
    faq: [
      {
        q: "775 / 664 ?",
        a: "Utiles si un groupe doit écrire.",
      },
      {
        q: "chmod -R 755 suffit ?",
        a: "Non : rend tous les fichiers exécutables.",
      },
      {
        q: "ACL / SELinux ?",
        a: "Parfois nécessaires au-delà de chmod.",
      },
    ],
    relatedIds: [37, 35, 40, 32],
  },
  {
    id: 37,
    category: "Linux",
    slug: "generer-cle-ssh-ed25519-linux",
    title: "Générer une clé SSH moderne (Ed25519)",
    seoTitle: "ssh-keygen -t ed25519 : créer une paire de clés SSH",
    metaDescription:
      "Créez une clé SSH Ed25519 avec ssh-keygen -t ed25519 -C 'email@exemple.com'.",
    ogTitle: "Clé SSH Ed25519 sous Linux",
    ogDescription: "Standard actuel, plus court et sûr que d’anciens RSA faibles.",
    primaryKeyword: "ssh-keygen ed25519",
    secondaryKeywords: ["clé SSH", "authentification SSH", "Ed25519"],
    tags: ["Linux", "SSH", "Sécurité"],
    difficulty: "Débutant",
    estimatedMinutes: 4,
    coverAlt: "Génération de clé SSH Ed25519",
    introduction: [
      "L’auth par clé SSH évite de taper un mot de passe à chaque connexion.",
      "Ed25519 est l’algorithme recommandé pour la plupart des usages.",
    ],
    whyUseful: [
      "Connexions serveur plus fluides et plus sûres.",
      "Base pour GitHub/GitLab et bastions.",
      "Une passphrase protège la clé privée au repos.",
    ],
    prerequisites: ["OpenSSH client", "Label / e-mail pour le commentaire"],
    steps: [
      {
        title: "Générer la paire",
        body: "Lancez ssh-keygen -t ed25519 -C 'email@ou.com'. Choisissez une passphrase forte.",
      },
      {
        title: "Vérifier les fichiers",
        body: "Privée locale (jamais partagée). La .pub va sur les serveurs.",
      },
      {
        title: "Agent SSH (optionnel)",
        body: "ssh-add ~/.ssh/id_ed25519 charge la clé pour la session.",
      },
    ],
    code: "ssh-keygen -t ed25519 -C 'email@ou.com'",
    codeLang: "bash",
    codeExplanation: [
      "-t ed25519 choisit l’algorithme.",
      "-C ajoute un commentaire d’identification.",
    ],
    tips: [
      "Une clé par machine / rôle.",
      "Ne committez jamais la clé privée.",
    ],
    commonErrors: [
      "Écraser une clé existante : lisez le prompt overwrite.",
      "Serveur trop vieux : rare refus Ed25519.",
    ],
    faq: [
      {
        q: "Passphrase obligatoire ?",
        a: "Fortement recommandée.",
      },
      { q: "Où est la publique ?", a: "~/.ssh/id_ed25519.pub." },
      { q: "Et après ?", a: "ssh-copy-id — astuce suivante." },
    ],
    relatedIds: [38, 35, 31, 36],
  },
  {
    id: 38,
    category: "Linux",
    slug: "installer-cle-ssh-ssh-copy-id-linux",
    title: "Copier sa clé SSH sur un serveur avec ssh-copy-id",
    seoTitle: "ssh-copy-id : déployer sa clé publique sur un serveur",
    metaDescription:
      "Installez votre clé publique avec ssh-copy-id user@192.168.1.10.",
    ogTitle: "ssh-copy-id — activer le login par clé",
    ogDescription: "Une commande pour remplir authorized_keys correctement.",
    primaryKeyword: "ssh-copy-id",
    secondaryKeywords: ["authorized_keys", "SSH sans mot de passe", "clé publique"],
    tags: ["Linux", "SSH", "Sécurité"],
    difficulty: "Débutant",
    estimatedMinutes: 4,
    coverAlt: "Copie de clé SSH vers un serveur distant",
    introduction: [
      "Après génération, placez la clé publique dans ~/.ssh/authorized_keys sur le serveur.",
      "ssh-copy-id automatise cette étape avec les bons droits.",
    ],
    whyUseful: [
      "Évite les erreurs de permissions.",
      "Plus simple qu’un collage manuel.",
      "Prépare la désactivation du mot de passe SSH.",
    ],
    prerequisites: [
      "Clé publique existante",
      "Accès SSH actuel",
      "ssh-copy-id disponible",
    ],
    steps: [
      {
        title: "Lancer ssh-copy-id",
        body: "ssh-copy-id user@192.168.1.10 — adaptez user et hôte.",
      },
      {
        title: "Saisir le mot de passe une dernière fois",
        body: "Le client ajoute la clé et configure les permissions.",
      },
      {
        title: "Tester",
        body: "ssh user@hôte doit ouvrir une session via la clé.",
      },
    ],
    code: "ssh-copy-id user@192.168.1.10",
    codeLang: "bash",
    codeExplanation: [
      "Déploie la clé publique par défaut vers le compte distant.",
      "ssh-copy-id -i ~/.ssh/autre.pub pour une clé précise.",
    ],
    tips: [
      "Gardez une session ouverte avant de couper PasswordAuthentication.",
      "Sous Windows natif, WSL reste souvent le plus simple.",
    ],
    commonErrors: [
      "Permission denied : mauvais user/mot de passe.",
      "authorized_keys trop permissif si collé à la main.",
    ],
    faq: [
      {
        q: "À la main ?",
        a: "Append .pub dans authorized_keys, chmod 700 ~/.ssh et 600 authorized_keys.",
      },
      { q: "Plusieurs clés ?", a: "Une ligne par clé." },
      {
        q: "IP 192.168.x ?",
        a: "Exemple local ; utilisez l’IP/hostname réel.",
      },
    ],
    relatedIds: [37, 35, 31, 36],
  },
  {
    id: 39,
    category: "Linux",
    slug: "monitorer-processus-htop-linux",
    title: "Surveiller CPU et RAM avec htop",
    seoTitle: "Installer et utiliser htop sous Linux (apt)",
    metaDescription:
      "Installez htop via sudo apt install htop && htop pour une vue interactive CPU/RAM.",
    ogTitle: "htop — moniteur de processus Linux",
    ogDescription: "Plus lisible que top pour tuer une tâche ou voir la charge.",
    primaryKeyword: "htop Linux",
    secondaryKeywords: ["sudo apt install htop", "monitorer CPU RAM", "processus Linux"],
    tags: ["Linux", "Performance", "Diagnostic"],
    difficulty: "Débutant",
    estimatedMinutes: 3,
    coverAlt: "Interface colorée htop",
    introduction: [
      "htop est un moniteur de processus interactif : CPU, mémoire, charge, arbre des processus.",
      "Sur Debian/Ubuntu, l’installation via apt est immédiate.",
    ],
    whyUseful: [
      "Identifier ce qui sature CPU ou RAM.",
      "Tuer un processus avec confirmation visuelle.",
      "Meilleure UX que top.",
    ],
    prerequisites: ["sudo pour installer", "Distro type apt (adaptez sinon)"],
    steps: [
      {
        title: "Installer et lancer",
        body: "sudo apt install htop && htop. Fedora : dnf ; Arch : pacman -S htop.",
      },
      {
        title: "Lire l’écran",
        body: "Barres CPU/RAM en haut. F6 pour trier, / pour chercher.",
      },
      {
        title: "Agir",
        body: "F9 envoie un signal (kill). q quitte.",
      },
    ],
    code: "sudo apt install htop && htop",
    codeLang: "bash",
    codeExplanation: [
      "apt install pose le paquet.",
      "&& htop lance l’outil si l’install réussit.",
    ],
    tips: ["F5 vue arbre.", "ps aux reste utile en script."],
    commonErrors: [
      "Unable to locate package : apt update d’abord.",
      "Kill process root : parfois sudo htop.",
    ],
    faq: [
      { q: "Consommation ?", a: "Négligeable en usage ponctuel." },
      { q: "Alternative ?", a: "btop, glances." },
      { q: "Sans install ?", a: "top ou ps." },
    ],
    relatedIds: [33, 34, 31, 40],
  },
  {
    id: 40,
    category: "Linux",
    slug: "nettoyer-paquets-apt-autoremove-clean",
    title: "Nettoyer les paquets inutiles avec apt autoremove et clean",
    seoTitle: "apt autoremove && apt clean : libérer de l’espace Debian/Ubuntu",
    metaDescription:
      "Supprimez orphelins et caches paquets avec sudo apt autoremove && sudo apt clean.",
    ogTitle: "Nettoyage apt sous Linux",
    ogDescription: "Deux commandes pour alléger le système après beaucoup d’installations.",
    primaryKeyword: "apt autoremove clean",
    secondaryKeywords: ["libérer espace Ubuntu", "paquets orphelins", "cache apt"],
    tags: ["Linux", "Maintenance", "Disque"],
    difficulty: "Débutant",
    estimatedMinutes: 3,
    coverAlt: "Nettoyage du cache apt",
    introduction: [
      "Après installs/suppressions, des dépendances orphelines et un cache .deb peuvent rester.",
      "autoremove retire les orphelins ; clean vide le cache téléchargé.",
    ],
    whyUseful: [
      "Récupère de l’espace facilement.",
      "Base de paquets plus saine.",
      "Sans toucher à vos documents.",
    ],
    prerequisites: ["Debian/Ubuntu ou dérivé", "sudo"],
    steps: [
      {
        title: "Lancer le nettoyage",
        body: "sudo apt autoremove && sudo apt clean. Lisez la liste avant de confirmer.",
      },
      {
        title: "Vérifier l’espace",
        body: "df -h ou du pour confirmer le gain sous /var/cache/apt.",
      },
      {
        title: "Aller plus loin (optionnel)",
        body: "apt autoclean ; journalctl --vacuum-time pour les logs.",
      },
    ],
    code: "sudo apt autoremove && sudo apt clean",
    codeLang: "bash",
    codeExplanation: [
      "autoremove désinstalle les dépendances devenues inutiles.",
      "clean efface le cache des paquets téléchargés.",
    ],
    tips: [
      "Lisez toujours la liste autoremove.",
      "Fedora : dnf autoremove ; Arch : pacman -Sc.",
    ],
    commonErrors: [
      "Verrou apt : un autre gestionnaire est ouvert.",
      "Réseau non requis pour clean.",
    ],
    faq: [
      { q: "Efface mes projets ?", a: "Non, seulement le cache paquets." },
      { q: "Chaque semaine ?", a: "De temps en temps suffit." },
      {
        q: "snap / flatpak ?",
        a: "Autres commandes de nettoyage dédiées.",
      },
    ],
    relatedIds: [34, 32, 39, 33],
  },
];

const target =
  "C:/Users/ZoulaTech/Desktop/1190-astuces-articles/data/prototype-031-040.mjs";
const body =
  "/**\n * Contenu éditorial FR — prototype articles 31–40 (Linux)\n */\nexport const prototypeArticles031040 = " +
  JSON.stringify(articles, null, 2) +
  ";\n";
fs.writeFileSync(target, body);
console.log("wrote", articles.length, "articles ->", target);
