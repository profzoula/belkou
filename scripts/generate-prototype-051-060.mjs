import fs from "node:fs";

const articles = [
  {
    id: 51,
    category: "Linux",
    slug: "surveiller-bande-passante-nethogs-linux",
    title: "Surveiller la bande passante par processus avec nethogs",
    seoTitle: "nethogs : qui consomme le réseau sous Linux ?",
    metaDescription:
      "Identifiez les processus gourmands en réseau avec sudo nethogs eth0.",
    ogTitle: "nethogs — trafic réseau par process",
    ogDescription: "Plus parlant qu’un simple iftop quand vous voulez le PID coupable.",
    primaryKeyword: "nethogs Linux",
    secondaryKeywords: ["bande passante processus", "trafic réseau", "eth0"],
    tags: ["Linux", "Réseau", "Diagnostic"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 4,
    coverAlt: "Interface nethogs listant le trafic par processus",
    introduction: [
      "nethogs affiche, par processus, la bande passante montante et descendante.",
      "Utile quand le réseau rame et que vous voulez savoir quel binaire tire le plus.",
    ],
    whyUseful: [
      "Relie directement le trafic à un PID / nom de programme.",
      "Lecture temps réel dans le terminal.",
      "Complète ss / iftop.",
    ],
    prerequisites: [
      "Paquet nethogs installé",
      "sudo",
      "Nom d’interface (eth0, ens33, wlan0… via ip a)",
    ],
    steps: [
      {
        title: "Installer si besoin",
        body: "sudo apt install nethogs (ou équivalent dnf/pacman).",
      },
      {
        title: "Lancer sur l’interface",
        body: "sudo nethogs eth0 — remplacez eth0 par votre interface réelle.",
      },
      {
        title: "Lire et quitter",
        body: "Observez les colonnes SENT/RECEIVED. q quitte. Investigating un PID suspect ensuite via ps ou htop.",
      },
    ],
    code: "sudo nethogs eth0",
    codeLang: "bash",
    codeExplanation: [
      "nethogs regroupe le trafic IP par process.",
      "eth0 est un exemple d’interface — adaptez (ip link).",
    ],
    tips: [
      "Sans argument, nethogs tente de choisir une interface.",
      "En conteneur/cloud, le nom d’interface varie souvent (ens*, eth*).",
    ],
    commonErrors: [
      "Device not found : mauvais nom d’interface.",
      "Permission denied : oubli de sudo.",
    ],
    faq: [
      {
        q: "nethogs vs iftop ?",
        a: "iftop parle plutôt flux/hôtes ; nethogs parle processus.",
      },
      {
        q: "Wi‑Fi portable ?",
        a: "Souvent wlan0 ou wlp… — vérifiez avec ip a.",
      },
      {
        q: "Sans install root ?",
        a: "Des alternatives existent, mais nethogs demande en général des droits élevés.",
      },
    ],
    relatedIds: [49, 39, 44, 33],
  },
  {
    id: 52,
    category: "Linux",
    slug: "securiser-permissions-cle-ssh-linux",
    title: "Sécuriser les permissions des clés SSH",
    seoTitle: "chmod 600 / 700 : droits corrects pour ~/.ssh",
    metaDescription:
      "Appliquez chmod 600 sur la clé privée et chmod 700 sur ~/.ssh pour éviter les refus SSH.",
    ogTitle: "Permissions SSH indispensables",
    ogDescription: "OpenSSH refuse souvent une clé trop lisible — corrigez en deux commandes.",
    primaryKeyword: "chmod clé SSH",
    secondaryKeywords: ["chmod 600 id_ed25519", "chmod 700 .ssh", "permissions SSH"],
    tags: ["Linux", "SSH", "Sécurité"],
    difficulty: "Débutant",
    estimatedMinutes: 3,
    coverAlt: "Dossier .ssh avec permissions restreintes",
    introduction: [
      "OpenSSH exige des permissions strictes sur le dossier .ssh et la clé privée.",
      "Si le groupe ou « others » peuvent lire la clé, la connexion par clé peut être refusée.",
    ],
    whyUseful: [
      "Corrige l’erreur classique « UNPROTECTED PRIVATE KEY FILE ».",
      "Réduit le risque de fuite locale de clé.",
      "Geste rapide après copie de fichiers.",
    ],
    prerequisites: ["Clé déjà générée", "Accès à votre home"],
    steps: [
      {
        title: "Restreindre la clé privée",
        body: "chmod 600 ~/.ssh/id_ed25519 (adaptez le nom si RSA/autre).",
      },
      {
        title: "Restreindre le dossier",
        body: "chmod 700 ~/.ssh.",
      },
      {
        title: "Vérifier",
        body: "ls -la ~/.ssh doit montrer drwx------ pour .ssh et -rw------- pour la privée.",
      },
    ],
    code: "chmod 600 ~/.ssh/id_ed25519\nchmod 700 ~/.ssh",
    codeLang: "bash",
    codeExplanation: [
      "600 = rw------- pour le propriétaire uniquement.",
      "700 = rwx------ sur le dossier .ssh.",
      "La .pub peut rester en 644.",
    ],
    tips: [
      "authorized_keys côté serveur : souvent 600, dossier .ssh en 700.",
      "Ne stockez jamais la privée dans un repo Git.",
    ],
    commonErrors: [
      "Mauvais chemin de clé (id_rsa vs id_ed25519).",
      "ACL / montage qui ignore chmod — rare mais possible.",
    ],
    faq: [
      {
        q: "Et la publique ?",
        a: "chmod 644 ~/.ssh/id_ed25519.pub suffit.",
      },
      {
        q: "Windows OpenSSH ?",
        a: "Même idée : ACL restreintes sur la clé privée.",
      },
      {
        q: "Après scp depuis une clé USB ?",
        a: "Reappliquez toujours ces chmod.",
      },
    ],
    relatedIds: [37, 38, 36, 57],
  },
  {
    id: 53,
    category: "Linux",
    slug: "commande-plusieurs-serveurs-ssh-loop-linux",
    title: "Exécuter une commande sur plusieurs serveurs en SSH",
    seoTitle: "Boucle SSH : uptime sur s1, s2, s3",
    metaDescription:
      "Lancez la même commande sur plusieurs hôtes avec une boucle for et ssh.",
    ogTitle: "SSH en boucle — admin multi-serveurs",
    ogDescription: "Petit one-liner avant d’adopter Ansible.",
    primaryKeyword: "ssh boucle plusieurs serveurs",
    secondaryKeywords: ["for ssh uptime", "admin multi-host", "shell loop"],
    tags: ["Linux", "SSH", "Administration"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 4,
    coverAlt: "Boucle for lançant ssh sur plusieurs hôtes",
    introduction: [
      "Quand vous avez quelques serveurs, une boucle Bash + SSH suffit pour un check rapide.",
      "Exemple classique : récupérer uptime sur s1, s2, s3.",
    ],
    whyUseful: [
      "Pas besoin d’outil lourd pour 3–10 machines.",
      "Idéal pour un health-check ponctuel.",
      "S’appuie sur vos clés SSH déjà en place.",
    ],
    prerequisites: [
      "Accès SSH par clé (recommandé)",
      "Noms d’hôtes résolus ou IPs",
      "Même utilisateur distant ou adaptez user@",
    ],
    steps: [
      {
        title: "Lister les hôtes",
        body: "Remplacez s1 s2 s3 par vos hostnames/IPs.",
      },
      {
        title: "Lancer la boucle",
        body: "for h in s1 s2 s3; do ssh user@$h 'uptime'; done",
      },
      {
        title: "Sécuriser / améliorer",
        body: "Ajoutez -o ConnectTimeout=5 et un echo === $h === pour lire la sortie.",
      },
    ],
    code: "for h in s1 s2 s3; do ssh user@$h 'uptime'; done",
    codeLang: "bash",
    codeExplanation: [
      "for parcourt chaque hôte.",
      "ssh user@$h exécute la commande distante entre quotes.",
      "uptime est un exemple — remplacez par df -h, systemctl status, etc.",
    ],
    tips: [
      "Pour + de machines : Ansible, Salt, ou pssh.",
      "ControlMaster SSH accélère les connexions répétées.",
    ],
    commonErrors: [
      "Prompt mot de passe bloquant la boucle : passez aux clés.",
      "Host key verification failed : vérifiez known_hosts.",
    ],
    faq: [
      {
        q: "Paralléliser ?",
        a: "xargs -P ou outils dédiés ; la boucle for est séquentielle.",
      },
      {
        q: "Fichier d’hôtes ?",
        a: "for h in $(cat hosts.txt); do …; done",
      },
      {
        q: "User différent par hôte ?",
        a: "Stockez user@host complets dans la liste.",
      },
    ],
    relatedIds: [37, 38, 57, 31],
  },
  {
    id: 54,
    category: "Linux",
    slug: "limiter-priorite-cpu-nice-cpulimit-linux",
    title: "Limiter l’impact CPU d’un processus (nice / cpulimit)",
    seoTitle: "nice -n 19 et cpulimit : réduire la charge CPU Linux",
    metaDescription:
      "Lancez une tâche lourde en basse priorité avec nice, ou plafonnez un PID avec cpulimit.",
    ogTitle: "Contrôler la priorité CPU sous Linux",
    ogDescription: "Gardez le serveur réactif pendant un batch lourd.",
    primaryKeyword: "nice cpulimit Linux",
    secondaryKeywords: ["nice -n 19", "cpulimit", "priorité processus"],
    tags: ["Linux", "Performance", "Administration"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 5,
    coverAlt: "Processus lancé avec nice dans un terminal",
    introduction: [
      "nice ajuste la priorité d’ordonnancement : une valeur haute (jusqu’à 19) rend le process plus « poli ».",
      "cpulimit peut plafonner le pourcentage CPU d’un PID déjà lancé (paquet séparé).",
    ],
    whyUseful: [
      "Compilations / conversions sans figer le desktop ou le serveur.",
      "Contrôle simple sans cgroups avancés.",
      "Deux approches complémentaires.",
    ],
    prerequisites: [
      "Shell",
      "cpulimit installé si vous utilisez la 2e commande",
    ],
    steps: [
      {
        title: "Lancer en nice",
        body: "nice -n 19 commande démarre la commande avec la plus basse priorité utilisateur habituelle.",
      },
      {
        title: "Limiter un PID existant",
        body: "Repérez le PID (htop/ps) puis cpulimit -l 30 -p PID pour viser ~30 % CPU (selon options/version).",
      },
      {
        title: "Vérifier",
        body: "Observez la charge dans htop : le process ne devrait plus monopoliser autant.",
      },
    ],
    code: "nice -n 19 commande\ncpulimit -l 30 -p PID",
    codeLang: "bash",
    codeExplanation: [
      "nice -n 19 = priorité basse.",
      "cpulimit -l 30 limite autour de 30 % (outil tiers).",
      "Remplacez commande et PID.",
    ],
    tips: [
      "renice change la priorité d’un process déjà lancé.",
      "Pour un contrôle moderne : systemd CPUQuota= ou cgroups v2.",
    ],
    commonErrors: [
      "nice sans effet visible sur machine idle.",
      "cpulimit absent : installez le paquet.",
    ],
    faq: [
      {
        q: "nice négatif ?",
        a: "Priorité plus haute — souvent réservé à root.",
      },
      {
        q: "I/O aussi ?",
        a: "ionice pour la priorité disque.",
      },
      {
        q: "Conteneurs ?",
        a: "Limitez plutôt via Docker/K8s resources.",
      },
    ],
    relatedIds: [39, 43, 31, 51],
  },
  {
    id: 55,
    category: "Linux",
    slug: "installer-fzf-fuzzy-finder-linux",
    title: "Installer fzf pour une recherche floue ultra-rapide",
    seoTitle: "fzf : fuzzy finder pour fichiers et historique shell",
    metaDescription:
      "Installez fzf depuis GitHub (~/.fzf/install) pour chercher fichiers et commandes en fuzzy matching.",
    ogTitle: "fzf — le fuzzy finder indispensable",
    ogDescription: "Ctrl+R et navigation fichiers transformés.",
    primaryKeyword: "fzf Linux",
    secondaryKeywords: ["fuzzy finder", "fzf install", "historique shell"],
    tags: ["Linux", "Productivité", "Terminal"],
    difficulty: "Débutant",
    estimatedMinutes: 5,
    coverAlt: "Interface fzf de sélection floue",
    introduction: [
      "fzf est un filtre interactif en ligne de commande : vous tapez quelques lettres, il propose les meilleurs matches.",
      "Branché sur l’historique shell et find, il accélère énormément le quotidien.",
    ],
    whyUseful: [
      "Retrouver une vieille commande en secondes.",
      "Ouvrir un fichier profond sans tout retaper.",
      "Écosystème de scripts (git, vim, etc.).",
    ],
    prerequisites: ["git", "shell Bash/Zsh"],
    steps: [
      {
        title: "Cloner",
        body: "git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf",
      },
      {
        title: "Installer",
        body: "~/.fzf/install — acceptez les bindings shell proposés.",
      },
      {
        title: "Recharger et tester",
        body: "Ouvrez un nouveau terminal. Ctrl+R (souvent) pour l’historique flou ; essayez aussi find . | fzf.",
      },
    ],
    code: "git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf\n~/.fzf/install",
    codeLang: "bash",
    codeExplanation: [
      "clone --depth 1 récupère le dépôt sans tout l’historique.",
      "install configure binaires et intégrations shell.",
    ],
    tips: [
      "Aussi installable via apt/dnf sur beaucoup de distros.",
      "Exportez FZF_DEFAULT_OPTS pour le thème/hauteur.",
    ],
    commonErrors: [
      "Bindings absents : source ~/.bashrc après install.",
      "git non installé.",
    ],
    faq: [
      {
        q: "Sans GitHub ?",
        a: "Paquets distro ou binaire release.",
      },
      {
        q: "fzf vs Ctrl+R natif ?",
        a: "fzf est incrémental et beaucoup plus confortable.",
      },
      {
        q: "Windows ?",
        a: "Via WSL ou builds communautaires.",
      },
    ],
    relatedIds: [46, 48, 47, 32],
  },
  {
    id: 56,
    category: "Linux",
    slug: "surveiller-fichier-watch-linux",
    title: "Surveiller un fichier en temps réel avec watch",
    seoTitle: "watch -n 2 cat : rafraîchir une commande périodiquement",
    metaDescription:
      "Observez les changements d’un fichier ou d’une commande avec watch -n 2 cat /etc/hosts.",
    ogTitle: "watch — monitoring simple en terminal",
    ogDescription: "Idéal pour suivre une config ou une taille de log.",
    primaryKeyword: "watch Linux",
    secondaryKeywords: ["watch -n", "surveiller fichier", "rafraîchir commande"],
    tags: ["Linux", "Diagnostic", "Terminal"],
    difficulty: "Débutant",
    estimatedMinutes: 3,
    coverAlt: "Commande watch rafraîchissant l’affichage",
    introduction: [
      "watch exécute une commande à intervalle régulier et réaffiche le résultat.",
      "Pratique pour voir un fichier de config évoluer ou une métrique simple sans dashboard.",
    ],
    whyUseful: [
      "Zéro setup.",
      "Parfait pendant un debug en live.",
      "Fonctionne avec n’importe quelle commande shell.",
    ],
    prerequisites: ["procps/watch installé (souvent déjà là)"],
    steps: [
      {
        title: "Choisir l’intervalle",
        body: "watch -n 2 … rafraîchit toutes les 2 secondes.",
      },
      {
        title: "Surveiller un fichier",
        body: "watch -n 2 cat /etc/hosts (adaptez le chemin).",
      },
      {
        title: "Quitter",
        body: "Ctrl+C. Pour du diff highlight : watch -d …",
      },
    ],
    code: "watch -n 2 cat /etc/hosts",
    codeLang: "bash",
    codeExplanation: [
      "-n 2 fixe l’intervalle en secondes.",
      "cat /etc/hosts est un exemple — df -h, wc -l log, etc.",
    ],
    tips: [
      "Pour des logs append-only, tail -f est souvent mieux.",
      "inotifywait pour des événements filesystem précis.",
    ],
    commonErrors: [
      "Commande avec pipes : watch 'cmd | other' (quotes).",
      "Fichier sans droit de lecture.",
    ],
    faq: [
      {
        q: "watch vs tail -f ?",
        a: "tail -f suit la fin d’un log ; watch réexécute une commande.",
      },
      {
        q: "Couleurs ?",
        a: "Selon la commande ; watch -c parfois.",
      },
      {
        q: "Intervalle décimal ?",
        a: "Certaines versions acceptent -n 0.5.",
      },
    ],
    relatedIds: [33, 46, 39, 51],
  },
  {
    id: 57,
    category: "Linux",
    slug: "tunnel-ssh-local-forward-linux",
    title: "Créer un tunnel SSH (redirection de port local)",
    seoTitle: "ssh -L 8080:localhost:80 : tunnel SSH local",
    metaDescription:
      "Exposez un service distant sur votre machine via ssh -L 8080:localhost:80 user@serveur.",
    ogTitle: "Tunnel SSH — accéder à un service distant en toute sécurité",
    ogDescription: "Admin DB, UI interne, ou HTTP distant sans ouvrir le firewall public.",
    primaryKeyword: "tunnel SSH -L",
    secondaryKeywords: ["SSH local forward", "port forwarding", "ssh -L"],
    tags: ["Linux", "SSH", "Réseau"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 5,
    coverAlt: "Schéma de redirection de port SSH",
    introduction: [
      "Un tunnel SSH -L fait suivre un port local vers un hôte/port joignable depuis le serveur SSH.",
      "Exemple : ouvrir http://localhost:8080 chez vous pour atteindre le port 80 du serveur distant.",
    ],
    whyUseful: [
      "Accès chiffré à des services internes.",
      "Pas besoin d’exposer le service sur Internet.",
      "Standard ops / dev.",
    ],
    prerequisites: [
      "Accès SSH au serveur",
      "Service distant qui écoute (ex. :80 sur le serveur)",
    ],
    steps: [
      {
        title: "Ouvrir le tunnel",
        body: "ssh -L 8080:localhost:80 user@serveur — laissez la session ouverte.",
      },
      {
        title: "Utiliser le service",
        body: "Sur votre PC : navigateur ou curl http://127.0.0.1:8080.",
      },
      {
        title: "Fermer",
        body: "Ctrl+D / exit sur la session SSH coupe le tunnel.",
      },
    ],
    code: "ssh -L 8080:localhost:80 user@serveur",
    codeLang: "bash",
    codeExplanation: [
      "-L localPort:destHost:destPort",
      "localhost:80 est vu depuis le serveur SSH.",
      "Remplacez user@serveur et les ports.",
    ],
    tips: [
      "ssh -N -L … pour tunnel sans shell interactif.",
      "Autossh pour reconnecter automatiquement.",
    ],
    commonErrors: [
      "bind: Address already in use : port local 8080 pris.",
      "Connection refused au bout : service distant down ou mauvais port.",
    ],
    faq: [
      {
        q: "Tunnel inverse (-R) ?",
        a: "Expose un port local vers le serveur — autre scénario.",
      },
      {
        q: "SOCKS ?",
        a: "ssh -D 1080 user@serveur pour un proxy dynamique.",
      },
      {
        q: "GUI Windows ?",
        a: "OpenSSH Windows / PuTTY / WSL supportent -L.",
      },
    ],
    relatedIds: [37, 38, 53, 58],
  },
  {
    id: 58,
    category: "Linux",
    slug: "shell-conteneur-docker-exec-linux",
    title: "Ouvrir un shell dans un conteneur Docker",
    seoTitle: "docker exec -it : entrer dans un conteneur en cours",
    metaDescription:
      "Connectez-vous à un conteneur actif avec docker exec -it nom_conteneur /bin/bash.",
    ogTitle: "docker exec — debug dans le conteneur",
    ogDescription: "Inspectez fichiers, logs et process sans rebuild.",
    primaryKeyword: "docker exec -it",
    secondaryKeywords: ["shell conteneur", "debug Docker", "/bin/bash"],
    tags: ["Linux", "Docker", "DevOps"],
    difficulty: "Débutant",
    estimatedMinutes: 3,
    coverAlt: "Session docker exec dans un terminal",
    introduction: [
      "docker exec lance une commande dans un conteneur déjà démarré.",
      "Avec -it et un shell, vous obtenez une session interactive pour diagnostiquer.",
    ],
    whyUseful: [
      "Vérifier configs, paquets, DNS depuis l’intérieur.",
      "Plus sûr qu’un rebuild juste pour regarder.",
      "Geste quotidien DevOps.",
    ],
    prerequisites: [
      "Docker installé + droits (groupe docker ou sudo)",
      "Conteneur en running (docker ps)",
    ],
    steps: [
      {
        title: "Trouver le nom/ID",
        body: "docker ps liste les conteneurs actifs.",
      },
      {
        title: "Ouvrir un shell",
        body: "docker exec -it nom_conteneur /bin/bash — ou /bin/sh si bash absent.",
      },
      {
        title: "Sortir",
        body: "exit quitte le shell sans arrêter le conteneur.",
      },
    ],
    code: "docker exec -it nom_conteneur /bin/bash",
    codeLang: "bash",
    codeExplanation: [
      "-i stdin ouvert, -t TTY.",
      "nom_conteneur = NAME ou ID court.",
      "/bin/sh sur images Alpine souvent.",
    ],
    tips: [
      "docker logs -f nom pour les logs applicatifs.",
      "Évitez de stocker des secrets « à la main » dans un conteneur éphémère.",
    ],
    commonErrors: [
      "No such container : nom incorrect / stopped.",
      "executable file not found : pas de bash — essayez sh.",
    ],
    faq: [
      {
        q: "exec vs attach ?",
        a: "attach se colle au process principal ; exec lance une nouvelle commande.",
      },
      {
        q: "Rootless ?",
        a: "Selon la config Docker rootless / podman.",
      },
      {
        q: "Kubernetes ?",
        a: "kubectl exec -it pod -- /bin/sh.",
      },
    ],
    relatedIds: [57, 39, 33, 31],
  },
  {
    id: 59,
    category: "Linux",
    slug: "backup-mysql-mysqldump-linux",
    title: "Créer un backup MySQL avec mysqldump",
    seoTitle: "mysqldump : exporter une base MySQL en .sql",
    metaDescription:
      "Sauvegardez une base avec mysqldump -u root -p nomBase > backup.sql.",
    ogTitle: "mysqldump — backup logique MySQL",
    ogDescription: "Export SQL portable pour restauration ou migration.",
    primaryKeyword: "mysqldump backup",
    secondaryKeywords: ["backup MySQL", "export SQL", "mysqldump -u"],
    tags: ["Linux", "MySQL", "Sauvegarde"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 5,
    coverAlt: "Export mysqldump vers un fichier SQL",
    introduction: [
      "mysqldump produit un dump logique (instructions SQL) d’une base ou de tables.",
      "C’est la méthode la plus courante pour un backup simple ou un export de migration.",
    ],
    whyUseful: [
      "Fichier .sql lisible et restaurable.",
      "Scriptable (cron + rotation).",
      "Fonctionne avec MySQL / MariaDB en général.",
    ],
    prerequisites: [
      "Client mysql/mysqldump",
      "Identifiants avec droits SELECT (et LOCK selon options)",
      "Espace disque pour le dump",
    ],
    steps: [
      {
        title: "Lancer le dump",
        body: "mysqldump -u root -p nomBazDone > backup.sql — saisissez le mot de passe quand demandé.",
      },
      {
        title: "Vérifier le fichier",
        body: "ls -lh backup.sql et regardez les premières lignes (HEAD).",
      },
      {
        title: "Restaurer (si besoin)",
        body: "mysql -u root -p nomBazDone < backup.sql sur une base cible.",
      },
    ],
    code: "mysqldump -u root -p nomBazDone > backup.sql",
    codeLang: "bash",
    codeExplanation: [
      "-u utilisateur, -p demande le mot de passe.",
      "nomBazDone = nom de la base.",
      "> backup.sql redirige la sortie vers un fichier.",
    ],
    tips: [
      "Ajoutez --single-transaction pour InnoDB cohérent.",
      "Compressez : mysqldump … | gzip > backup.sql.gz.",
    ],
    commonErrors: [
      "Access denied : droits ou mauvais user.",
      "Dump énorme / disque plein : libérez de l’espace ou dump par table.",
    ],
    faq: [
      {
        q: "Mot de passe en clair dans la commande ?",
        a: "Évitez -ppassword visible ; préférez -p interactif ou un fichier defaults-extra.",
      },
      {
        q: "Toutes les bases ?",
        a: "mysqldump -u … -p --all-databases.",
      },
      {
        q: "Backup physique ?",
        a: "Autre approche (snapshots, Percona XtraBackup…).",
      },
    ],
    relatedIds: [35, 43, 45, 52],
  },
  {
    id: 60,
    category: "Linux",
    slug: "restreindre-ssh-hosts-allow-linux",
    title: "Limiter l’accès SSH par IP avec hosts.allow",
    seoTitle: "hosts.allow : restreindre sshd à un réseau de confiance",
    metaDescription:
      "Autorisez SSH seulement depuis un subnet via /etc/hosts.allow (ex. sshd: 192.168.1.0/24).",
    ogTitle: "Restreindre SSH avec TCP Wrappers",
    ogDescription: "Couche simple en complément du firewall et des clés.",
    primaryKeyword: "hosts.allow sshd",
    secondaryKeywords: ["TCP Wrappers", "restreindre SSH IP", "hosts.deny"],
    tags: ["Linux", "SSH", "Sécurité"],
    difficulty: "Avancé",
    estimatedMinutes: 6,
    coverAlt: "Fichier hosts.allow configurant sshd",
    introduction: [
      "Sur certaines configurations, TCP Wrappers (hosts.allow / hosts.deny) filtre les services avant acceptation complète.",
      "Vous pouvez limiter sshd à un réseau local de confiance — en complément de fail2ban, firewall et clés SSH.",
    ],
    whyUseful: [
      "Réduit la surface d’attaque Internet.",
      "Règle lisible pour un petit LAN.",
      "Défense en profondeur.",
    ],
    prerequisites: [
      "sshd qui honore encore TCP Wrappers (selon distro/build)",
      "Accès console/IPMI au cas où vous vous bloqueriez",
      "Connaître votre subnet légitime",
    ],
    steps: [
      {
        title: "Éditer hosts.allow",
        body: "Ajoutez une ligne du type sshd: 192.168.1.0/24 (adaptez le réseau).",
      },
      {
        title: "Compléter hosts.deny si besoin",
        body: "Souvent sshd: ALL dans hosts.deny puis allow explicite — testez avant de fermer votre session.",
      },
      {
        title: "Vérifier",
        body: "Rechargez/redémarrez sshd si nécessaire et testez depuis une IP autorisée et une refusée.",
      },
    ],
    code: "# /etc/hosts.allow\nsshd: 192.168.1.0/24",
    codeLang: "text",
    codeExplanation: [
      "sshd: cible le démon SSH.",
      "192.168.1.0/24 est un exemple de réseau autorisé.",
      "La syntaxe exacte peut varier ; validez sur votre système.",
    ],
    tips: [
      "Préférez souvent firewalld/ufw/nftables + AllowUsers + clés uniquement.",
      "Gardez une session root ouverte pendant les tests.",
    ],
    commonErrors: [
      "Se verrouiller soi-même hors du serveur.",
      "Distro où sshd ignore TCP Wrappers : la règle n’a aucun effet — vérifiez la doc.",
    ],
    faq: [
      {
        q: "Remplace un firewall ?",
        a: "Non. C’est une couche optionnelle / legacy selon l’environnement.",
      },
      {
        q: "Plusieurs réseaux ?",
        a: "sshd: 10.0.0.0/8, 192.168.1.0/24",
      },
      {
        q: "Cloud ?",
        a: "Security groups / Network ACL restent prioritaires.",
      },
    ],
    relatedIds: [52, 37, 38, 49],
  },
];

const target =
  "C:/Users/ZoulaTech/Desktop/1190-astuces-articles/data/prototype-051-060.mjs";
fs.writeFileSync(
  target,
  "/**\n * Contenu éditorial FR — prototype articles 51–60 (Linux)\n */\nexport const prototypeArticles051060 = " +
    JSON.stringify(articles, null, 2) +
    ";\n",
);
console.log("wrote", articles.length, "->", target);
