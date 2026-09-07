import fs from "node:fs";

/** Batch 41–50 — Linux text tools, cron, network, archives */
const articles = [
  {
    id: 41,
    category: "Linux",
    slug: "analyser-colonnes-awk-linux",
    title: "Analyser des colonnes de texte avec awk",
    seoTitle: "awk '{print $1, $3}' : extraire des colonnes sous Linux",
    metaDescription:
      "Utilisez awk pour afficher ou transformer des colonnes dans un fichier CSV ou un log.",
    ogTitle: "awk — traitement de colonnes Linux",
    ogDescription: "Idéal pour logs, CSV et rapports en une ligne.",
    primaryKeyword: "awk colonnes Linux",
    secondaryKeywords: ["awk print", "CSV Linux", "traitement texte"],
    tags: ["Linux", "Terminal", "Données"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 5,
    coverAlt: "Commande awk sur un fichier CSV dans un terminal",
    introduction: [
      "awk lit un fichier ligne par ligne et découpe chaque ligne en champs (souvent séparés par des espaces).",
      "Vous pouvez afficher uniquement certaines colonnes, filtrer, ou calculer — sans ouvrir un tableur.",
    ],
    whyUseful: [
      "Extraire vite IP, codes HTTP ou colonnes CSV.",
      "Disponible sur presque toutes les distros.",
      "Parfait en pipeline avec grep, sort, uniq.",
    ],
    prerequisites: ["Shell Linux", "Un fichier texte / CSV de test"],
    steps: [
      {
        title: "Choisir le fichier",
        body: "Placez-vous dans le dossier du fichier (ex. fichye.csv) ou indiquez son chemin complet.",
      },
      {
        title: "Afficher des colonnes",
        body: "Lancez awk '{print $1, $3}' fichye.csv pour imprimer le 1er et le 3e champ de chaque ligne.",
      },
      {
        title: "Adapter le séparateur",
        body: "Pour un CSV à virgules : awk -F',' '{print $1, $3}' fichier.csv.",
      },
    ],
    code: "awk '{print $1, $3}' fichye.csv",
    codeLang: "bash",
    codeExplanation: [
      "$1, $2, $3… sont les champs de la ligne courante.",
      "Le séparateur par défaut est l’espace / tabulation.",
      "-F':' ou -F',' change le séparateur.",
    ],
    tips: [
      "awk 'NR>1 {print $1}' ignore l’en-tête.",
      "Pour du JSON complexe, préférez jq.",
    ],
    commonErrors: [
      "Mauvais numéro de colonne : comptez à partir de 1.",
      "CSV avec guillemets : awk basique peut être insuffisant.",
    ],
    faq: [
      {
        q: "awk vs cut ?",
        a: "cut est plus simple ; awk gère mieux conditions et calculs.",
      },
      {
        q: "Compter les lignes ?",
        a: "awk 'END{print NR}' fichier.",
      },
      {
        q: "Filtrer une valeur ?",
        a: "awk '$3==\"ERROR\" {print $0}' log.txt.",
      },
    ],
    relatedIds: [42, 46, 33, 41],
  },
  {
    id: 42,
    category: "Linux",
    slug: "remplacer-texte-sed-linux",
    title: "Remplacer du texte en masse avec sed",
    seoTitle: "sed -i 's/ancien/nouveau/g' : remplacement dans un fichier",
    metaDescription:
      "Modifiez un fichier directement avec sed -i pour remplacer toutes les occurrences d’un mot.",
    ogTitle: "sed — remplacement de texte sous Linux",
    ogDescription: "Éditez configs et scripts sans ouvrir un éditeur interactif.",
    primaryKeyword: "sed remplacer texte Linux",
    secondaryKeywords: ["sed -i", "substitution sed", "édition fichier"],
    tags: ["Linux", "Terminal", "Fichiers"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 4,
    coverAlt: "Commande sed de substitution dans un terminal",
    introduction: [
      "sed (stream editor) transforme du texte en flux. L’usage le plus courant : substituer une chaîne dans un fichier.",
      "Avec -i, la modification est écrite directement dans le fichier (attention aux backups).",
    ],
    whyUseful: [
      "Renommer une variable / URL dans plein de lignes d’un coup.",
      "Automatisable dans des scripts de déploiement.",
      "Léger et universel.",
    ],
    prerequisites: ["Shell Linux", "Sauvegarde conseillée avant -i"],
    steps: [
      {
        title: "Tester sans écrire",
        body: "sed 's/ansyen/nouvo/g' fichye.txt affiche le résultat sans modifier le fichier.",
      },
      {
        title: "Écrire dans le fichier",
        body: "sed -i 's/ansyen/nouvo/g' fichye.txt applique le remplacement global (g).",
      },
      {
        title: "Garder une copie (recommandé)",
        body: "Sur GNU sed : sed -i.bak 's/…/…/g' fichier crée une sauvegarde .bak.",
      },
    ],
    code: "sed -i 's/ansyen/nouvo/g' fichye.txt",
    codeLang: "bash",
    codeExplanation: [
      "s/ancien/nouveau/ est la substitution.",
      "g remplace toutes les occurrences par ligne.",
      "-i édite le fichier sur place (GNU/Linux).",
    ],
    tips: [
      "Échappez les / dans les chemins : s|ancien|nouveau|g.",
      "Pour plusieurs fichiers : sed -i 's/…/…/g' *.conf.",
    ],
    commonErrors: [
      "macOS sed -i exige un argument d’extension différent.",
      "Caractères spéciaux regex non échappés.",
    ],
    faq: [
      {
        q: "Annuler après -i ?",
        a: "Seulement si vous avez un .bak ou une copie Git.",
      },
      {
        q: "Une seule occurrence ?",
        a: "Retirez le g : s/ancien/nouveau/.",
      },
      {
        q: "sed vs awk ?",
        a: "sed brille en édition de flux ; awk en colonnes/logique.",
      },
    ],
    relatedIds: [41, 46, 47, 36],
  },
  {
    id: 43,
    category: "Linux",
    slug: "planifier-taches-cron-linux",
    title: "Automatiser des tâches avec cron",
    seoTitle: "crontab -e : planifier des commandes sous Linux",
    metaDescription:
      "Éditez votre crontab pour lancer automatiquement un script (ex. backup à 2 h du matin).",
    ogTitle: "cron — automatisation Linux",
    ogDescription: "Le planificateur classique des serveurs Unix/Linux.",
    primaryKeyword: "crontab Linux",
    secondaryKeywords: ["cron job", "planifier script", "crontab -e"],
    tags: ["Linux", "Automation", "Administration"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 6,
    coverAlt: "Édition de crontab dans un terminal",
    introduction: [
      "cron exécute des commandes selon un calendrier (minute, heure, jour…).",
      "Chaque utilisateur a une crontab ; root peut planifier des tâches système.",
    ],
    whyUseful: [
      "Backups, mises à jour, nettoyages sans intervention.",
      "Standard sur les VPS et serveurs.",
      "Simple une fois la syntaxe comprise.",
    ],
    prerequisites: ["Accès shell", "Chemin absolu vers le script recommandé"],
    steps: [
      {
        title: "Ouvrir la crontab",
        body: "Lancez crontab -e. Choisissez un éditeur si demandé (nano est simple).",
      },
      {
        title: "Ajouter une ligne",
        body: "Exemple : 0 2 * * * /path/backup.sh lance le script chaque jour à 02:00.",
      },
      {
        title: "Vérifier",
        body: "crontab -l liste vos tâches. Consultez les logs mail/syslog si rien ne part.",
      },
    ],
    code: "crontab -e\n# 0 2 * * * /path/backup.sh",
    codeLang: "bash",
    codeExplanation: [
      "crontab -e édite la table de l’utilisateur courant.",
      "Format : minute heure jour-mois mois jour-semaine commande.",
      "0 2 * * * = tous les jours à 2 h 00.",
    ],
    tips: [
      "Utilisez des chemins absolus et redirigez stdout/stderr vers un log.",
      "PATH dans cron est minimal : exportez PATH dans le script.",
    ],
    commonErrors: [
      "Script non exécutable (chmod +x).",
      "Variables d’environnement manquantes sous cron.",
    ],
    faq: [
      {
        q: "systemd timers ?",
        a: "Alternative moderne ; cron reste très répandu.",
      },
      {
        q: "Voir les jobs root ?",
        a: "sudo crontab -l ou fichiers sous /etc/cron.*.",
      },
      {
        q: "Fuseau horaire ?",
        a: "Celui du système (timedatectl).",
      },
    ],
    relatedIds: [47, 35, 31, 40],
  },
  {
    id: 44,
    category: "Linux",
    slug: "tester-ports-netcat-linux",
    title: "Tester l’ouverture d’un port avec netcat (nc)",
    seoTitle: "nc -zv : vérifier si un port réseau est ouvert",
    metaDescription:
      "Testez SSH ou HTTPS rapidement avec nc -zv hote 22 ou nc -zv google.com 443.",
    ogTitle: "netcat — test de ports Linux",
    ogDescription: "Diagnostic réseau minimaliste et efficace.",
    primaryKeyword: "netcat tester port",
    secondaryKeywords: ["nc -zv", "port ouvert", "diagnostic réseau"],
    tags: ["Linux", "Réseau", "Diagnostic"],
    difficulty: "Débutant",
    estimatedMinutes: 3,
    coverAlt: "Test de port avec nc dans un terminal",
    introduction: [
      "netcat (nc) envoie ou écoute des données TCP/UDP. En mode scan léger, -zv indique si un port répond.",
      "Utile pour vérifier SSH, HTTP(S) ou un service maison avant de fouiller les firewalls.",
    ],
    whyUseful: [
      "Réponse immédiate ouvert / refusé / timeout.",
      "Pas besoin d’nmap pour un test ponctuel.",
      "Fonctionne sur IP ou nom de domaine.",
    ],
    prerequisites: ["nc / netcat-openbsd ou nmap-ncat", "Réseau autorisé vers la cible"],
    steps: [
      {
        title: "Tester un port local/LAN",
        body: "nc -zv 192.168.1.1 22 vérifie le port 22 (SSH) sur l’hôte.",
      },
      {
        title: "Tester Internet",
        body: "nc -zv google.com 443 vérifie HTTPS. Succeeded / open = joignable.",
      },
      {
        title: "Interpréter l’échec",
        body: "Connection refused = hôte joignable mais port fermé. Timeout = filtrage / hôte injoignable.",
      },
    ],
    code: "nc -zv 192.168.1.1 22\nnc -zv google.com 443",
    codeLang: "bash",
    codeExplanation: [
      "-z scan sans envoyer de données utiles.",
      "-v mode verbeux.",
      "hôte puis numéro de port.",
    ],
    tips: [
      "ss -tlnp sur le serveur liste ce qui écoute localement.",
      "Respectez les politiques : ne scannez pas des réseaux sans autorisation.",
    ],
    commonErrors: [
      "nc: command not found : installez netcat.",
      "Différences d’options selon la variante (openbsd vs traditionnel).",
    ],
    faq: [
      {
        q: "nc vs telnet ?",
        a: "nc est plus flexible ; telnet disparaît souvent des distros.",
      },
      {
        q: "UDP ?",
        a: "nc -zvu hote port (interprétation plus délicate).",
      },
      {
        q: "Firewall cloud ?",
        a: "Ouvrez le security group / NSG en plus du service local.",
      },
    ],
    relatedIds: [49, 12, 38, 33],
  },
  {
    id: 45,
    category: "Linux",
    slug: "archiver-tar-gz-linux",
    title: "Compresser et extraire avec tar + gzip",
    seoTitle: "tar -czf / -xzf : archives .tar.gz sous Linux",
    metaDescription:
      "Créez une archive tar.gz avec tar -czf et extrayez-la avec tar -xzf.",
    ogTitle: "tar.gz — compression classique Linux",
    ogDescription: "Le format standard pour livrer dossiers et sauvegardes.",
    primaryKeyword: "tar gz Linux",
    secondaryKeywords: ["tar -czf", "tar -xzf", "archive compressée"],
    tags: ["Linux", "Fichiers", "Sauvegarde"],
    difficulty: "Débutant",
    estimatedMinutes: 3,
    coverAlt: "Création d’une archive tar.gz",
    introduction: [
      "tar regroupe des fichiers ; gzip les compresse. Ensemble, on obtient .tar.gz (ou .tgz).",
      "C’est le format le plus courant pour distribuer un dossier sous Linux.",
    ],
    whyUseful: [
      "Une seule commande pour archiver un projet.",
      "Préserve structure et (souvent) permissions.",
      "Universellement compris.",
    ],
    prerequisites: ["tar (presque toujours installé)"],
    steps: [
      {
        title: "Créer l’archive",
        body: "tar -czf archive.tar.gz /dossier/ crée une archive compressée du dossier.",
      },
      {
        title: "Extraire",
        body: "tar -xzf archive.tar.gz décompresse dans le répertoire courant.",
      },
      {
        title: "Lister sans extraire",
        body: "tar -tzf archive.tar.gz montre le contenu.",
      },
    ],
    code: "tar -czf archive.tar.gz /dossier/\ntar -xzf archive.tar.gz",
    codeLang: "bash",
    codeExplanation: [
      "-c crée, -x extrait, -z gzip, -f fichier archive.",
      "L’ordre met souvent le nom d’archive juste après -f.",
    ],
    tips: [
      "Ajoutez -v pour voir les fichiers défiler.",
      "Pour .tar.xz : -J au lieu de -z.",
    ],
    commonErrors: [
      "Chemins absolus dans l’archive : utilisez -C ou des chemins relatifs.",
      "Permission denied à l’extraction : droits du dossier cible.",
    ],
    faq: [
      {
        q: "zip vs tar.gz ?",
        a: "zip plus courant sous Windows ; tar.gz plus natif Linux/serveur.",
      },
      {
        q: "Conserver owner root ?",
        a: "Souvent besoin de sudo à la création/extraction.",
      },
      {
        q: "Exclure node_modules ?",
        a: "tar --exclude=node_modules -czf …",
      },
    ],
    relatedIds: [35, 34, 40, 32],
  },
  {
    id: 46,
    category: "Linux",
    slug: "chercher-texte-grep-r-linux",
    title: "Chercher du texte dans un dossier avec grep -r",
    seoTitle: "grep -r : recherche récursive dans les fichiers Linux",
    metaDescription:
      "Trouvez une chaîne dans tout un arbre de fichiers avec grep -r 'motCle' /chemin/.",
    ogTitle: "grep -r — recherche full-text locale",
    ogDescription: "Plus rapide qu’ouvrir chaque fichier à la main.",
    primaryKeyword: "grep récursif Linux",
    secondaryKeywords: ["grep -r", "chercher dans fichiers", "mot-clé code"],
    tags: ["Linux", "Terminal", "Productivité"],
    difficulty: "Débutant",
    estimatedMinutes: 3,
    coverAlt: "Recherche grep récursive dans un projet",
    introduction: [
      "grep filtre les lignes contenant un motif. Avec -r, il parcourt récursivement un répertoire.",
      "Indispensable pour retrouver une fonction, une URL ou un secret oublié dans un projet.",
    ],
    whyUseful: [
      "Navigation code / configs sans IDE.",
      "Combinable avec find, xargs, awk.",
      "Disponible partout.",
    ],
    prerequisites: ["Shell Linux"],
    steps: [
      {
        title: "Lancer la recherche",
        body: "grep -r 'motCle' /path/to/dir/ affiche fichier:ligne pour chaque match.",
      },
      {
        title: "Affiner",
        body: "grep -rnI 'motCle' . ajoute les numéros de ligne (-n) et ignore les binaires (-I).",
      },
      {
        title: "Exclure des dossiers",
        body: "grep -r --exclude-dir=node_modules 'motCle' .",
      },
    ],
    code: "grep -r 'motCle' /path/to/dir/",
    codeLang: "bash",
    codeExplanation: [
      "-r (ou -R) parcours récursif.",
      "Le motif est entre quotes pour protéger le shell.",
      "Le dernier argument est le dossier de départ.",
    ],
    tips: [
      "ripgrep (rg) est plus rapide sur gros repos.",
      "grep -i ignore la casse.",
    ],
    commonErrors: [
      "Trop de résultats dans .git : --exclude-dir=.git.",
      "Permissions : sudo si besoin, ou restreignez le chemin.",
    ],
    faq: [
      {
        q: "Regex ?",
        a: "Oui, grep -E ou egrep pour l’étendu.",
      },
      {
        q: "Compter les matches ?",
        a: "grep -rco 'mot' . | … ou grep -r 'mot' . | wc -l.",
      },
      {
        q: "Uniquement certains fichiers ?",
        a: "grep -r --include='*.js' 'mot' .",
      },
    ],
    relatedIds: [41, 42, 47, 33],
  },
  {
    id: 47,
    category: "Linux",
    slug: "creer-script-bash-shebang-linux",
    title: "Créer un script Bash fiable (shebang + set -e)",
    seoTitle: "Script Bash : #!/bin/bash, set -e et chmod +x",
    metaDescription:
      "Démarrez vos scripts avec #!/bin/bash et set -e, puis rendez-les exécutables.",
    ogTitle: "Bonnes pratiques script Bash",
    ogDescription: "La base pour automatiser sans mauvaises surprises.",
    primaryKeyword: "script bash shebang",
    secondaryKeywords: ["#!/bin/bash", "set -e", "chmod +x"],
    tags: ["Linux", "Bash", "Automation"],
    difficulty: "Débutant",
    estimatedMinutes: 5,
    coverAlt: "Script Bash avec shebang dans un éditeur",
    introduction: [
      "Un script Bash commence souvent par un shebang (#!/bin/bash) qui indique l’interpréteur.",
      "set -e interrompt le script si une commande échoue — utile pour éviter d’enchaîner après une erreur.",
    ],
    whyUseful: [
      "Comportement prévisible en automation / cron.",
      "Portabilité meilleure qu’un script sans shebang.",
      "Base pour backups, déploiements, hooks.",
    ],
    prerequisites: ["Éditeur de texte", "bash installé"],
    steps: [
      {
        title: "Créer le fichier",
        body: "Écrivez le shebang, set -e, puis vos commandes (ex. echo 'Kòmanse...').",
      },
      {
        title: "Rendre exécutable",
        body: "chmod +x mon-script.sh.",
      },
      {
        title: "Exécuter",
        body: "./mon-script.sh ou bash mon-script.sh.",
      },
    ],
    code: "#!/bin/bash\nset -e\necho 'Kòmanse...'",
    codeLang: "bash",
    codeExplanation: [
      "#!/bin/bash force Bash (pas sh POSIX minimal).",
      "set -e quitte dès qu’une commande retourne un code non nul.",
      "Adaptez le message echo à votre usage.",
    ],
    tips: [
      "Ajoutez set -u pour les variables non définies, et pipefail pour les pipelines.",
      "Préférez des chemins absolus dans les scripts cron.",
    ],
    commonErrors: [
      "Permission denied : oubli de chmod +x.",
      "Lignes Windows CRLF : dos2unix le fichier.",
    ],
    faq: [
      {
        q: "#!/usr/bin/env bash ?",
        a: "Plus portable si bash n’est pas dans /bin.",
      },
      {
        q: "set -e trop strict ?",
        a: "Oui parfois ; gérez les commandes attendues en échec avec || true.",
      },
      {
        q: "Où placer les scripts ?",
        a: "~/bin ou /usr/local/bin si dans le PATH.",
      },
    ],
    relatedIds: [43, 48, 35, 36],
  },
  {
    id: 48,
    category: "Linux",
    slug: "raccourcis-alias-bashrc-linux",
    title: "Créer des raccourcis de commandes avec alias",
    seoTitle: "alias dans ~/.bashrc : raccourcis shell persistants",
    metaDescription:
      "Ajoutez un alias dans ~/.bashrc (ex. maj pour apt update && upgrade) puis rechargez avec source.",
    ogTitle: "alias Bash — gagner du temps chaque jour",
    ogDescription: "Transformez vos longues commandes en mots courts.",
    primaryKeyword: "alias bashrc Linux",
    secondaryKeywords: ["alias apt", "source bashrc", "raccourci shell"],
    tags: ["Linux", "Productivité", "Bash"],
    difficulty: "Débutant",
    estimatedMinutes: 3,
    coverAlt: "Ajout d’alias dans le fichier bashrc",
    introduction: [
      "Un alias associe un nom court à une commande longue.",
      "Placé dans ~/.bashrc, il est disponible à chaque nouveau shell interactif.",
    ],
    whyUseful: [
      "Moins de frappe, moins d’erreurs.",
      "Standardise vos gestes de maintenance.",
      "Personnel : n’affecte pas les autres utilisateurs.",
    ],
    prerequisites: ["Bash", "Droit d’écrire ~/.bashrc"],
    steps: [
      {
        title: "Ajouter l’alias",
        body: "Ajoutez la ligne alias dans ~/.bashrc (exemple maj pour update + upgrade).",
      },
      {
        title: "Recharger",
        body: "source ~/.bashrc ou ouvrez un nouveau terminal.",
      },
      {
        title: "Utiliser",
        body: "Tapez maj (ou le nom choisi) pour lancer la commande complète.",
      },
    ],
    code: "echo \"alias maj='sudo apt update && sudo apt upgrade -y'\" >> ~/.bashrc\nsource ~/.bashrc",
    codeLang: "bash",
    codeExplanation: [
      ">> ajoute la ligne en fin de bashrc.",
      "source recharge la config dans la session courante.",
      "Adaptez le nom d’alias et la commande.",
    ],
    tips: [
      "alias seul liste les alias actuels.",
      "Pour fonctions plus riches, utilisez une function Bash.",
    ],
    commonErrors: [
      "Pas de guillemets autour de la commande avec espaces.",
      "Zsh : placez plutôt dans ~/.zshrc.",
    ],
    faq: [
      {
        q: "Scripts non interactifs ?",
        a: "Les alias ne sont souvent pas chargés ; utilisez des scripts.",
      },
      {
        q: "Supprimer un alias ?",
        a: "unalias nom et retirez la ligne du bashrc.",
      },
      {
        q: "Danger de -y sur upgrade ?",
        a: "Oui en prod : retirez -y si vous voulez confirmer.",
      },
    ],
    relatedIds: [47, 40, 43, 39],
  },
  {
    id: 49,
    category: "Linux",
    slug: "lister-ports-ecoute-ss-linux",
    title: "Voir les ports en écoute avec ss",
    seoTitle: "ss -tlnp : services et ports ouverts sous Linux",
    metaDescription:
      "Listez les sockets TCP en écoute et les processus associés avec ss -tlnp.",
    ogTitle: "ss — successeur moderne de netstat",
    ogDescription: "Qui écoute sur quel port, et quel binaire ?",
    primaryKeyword: "ss -tlnp Linux",
    secondaryKeywords: ["ports en écoute", "sockets Linux", "remplacer netstat"],
    tags: ["Linux", "Réseau", "Sécurité"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 4,
    coverAlt: "Sortie de ss -tlnp dans un terminal",
    introduction: [
      "ss interroge les sockets du noyau. C’est l’outil recommandé aujourd’hui à la place de netstat.",
      "-tlnp montre les ports TCP en écoute avec le processus associé.",
    ],
    whyUseful: [
      "Vérifier qu’un service écoute bien (80, 443, 22…).",
      "Repérer un process inattendu.",
      "Plus rapide/fiable que d’anciens netstat.",
    ],
    prerequisites: ["iproute2 (ss)", "sudo pour voir tous les process names"],
    steps: [
      {
        title: "Lister TCP listen",
        body: "ss -tlnp affiche adresses locales, ports et processus.",
      },
      {
        title: "Filtrer un port",
        body: "ss -tlnp | grep ':22' ou ss -tlnp sport = :22 selon la version.",
      },
      {
        title: "UDP si besoin",
        body: "ss -ulnp pour les ports UDP en écoute.",
      },
    ],
    code: "ss -tlnp",
    codeLang: "bash",
    codeExplanation: [
      "-t TCP, -l listening, -n numérique, -p processus.",
      "Sans root, certains noms de process peuvent être masqués.",
    ],
    tips: [
      "Combinez avec nc -zv depuis une autre machine.",
      "firewall-cmd / ufw / security groups doivent aussi autoriser le port.",
    ],
    commonErrors: [
      "Permission : relancez avec sudo pour -p complet.",
      "Rien sur 0.0.0.0 : le service écoute peut-être seulement sur 127.0.0.1.",
    ],
    faq: [
      {
        q: "ss vs netstat ?",
        a: "ss est maintenu ; netstat est legacy sur beaucoup de distros.",
      },
      {
        q: "Voir les connexions établies ?",
        a: "ss -tp ou ss -tan.",
      },
      {
        q: "Équivalent Windows ?",
        a: "netstat -ano / Get-NetTCPConnection.",
      },
    ],
    relatedIds: [44, 12, 33, 39],
  },
  {
    id: 50,
    category: "Linux",
    slug: "recuperer-partition-testdisk-linux",
    title: "Récupérer une partition effacée avec TestDisk",
    seoTitle: "TestDisk Linux : récupération de partitions perdues",
    metaDescription:
      "Installez et lancez TestDisk (sudo apt install testdisk && sudo testdisk) pour tenter de récupérer partitions et données.",
    ogTitle: "TestDisk — récupération de partitions",
    ogDescription: "Quand une partition a disparu : calme, backup, puis TestDisk.",
    primaryKeyword: "TestDisk récupération Linux",
    secondaryKeywords: ["partition effacée", "testdisk", "récupération données"],
    tags: ["Linux", "Disque", "Récupération"],
    difficulty: "Avancé",
    estimatedMinutes: 8,
    coverAlt: "Interface TestDisk en console Linux",
    introduction: [
      "TestDisk est un outil de récupération de partitions et de tables de partitions endommagées.",
      "Il peut parfois retrouver une partition « effacée » ou un boot sector endommagé — sans garantie miracle.",
    ],
    whyUseful: [
      "Dernière chance avant formatage définitif.",
      "Open source et éprouvé.",
      "Fonctionne depuis une live USB si le système ne boote plus.",
    ],
    prerequisites: [
      "Droits root",
      "Disque cible non écrasé si possible",
      "Idéalement cloner le disque avant (dd/rescue) sur un autre support",
    ],
    steps: [
      {
        title: "Installer",
        body: "sudo apt install testdisk (adaptez selon la distro).",
      },
      {
        title: "Lancer",
        body: "sudo testdisk. Créez un log, sélectionnez le disque, le type de table (Intel/EFI GPT…).",
      },
      {
        title: "Analyser et écrire avec prudence",
        body: "Analyse → recherche de partitions. N’écrivez la table que si le résultat est cohérent. PhotoDisk/PhotoRec pour fichiers individuels si besoin.",
      },
    ],
    code: "sudo apt install testdisk\nsudo testdisk",
    codeLang: "bash",
    codeExplanation: [
      "apt install pose le paquet.",
      "sudo testdisk ouvre l’assistant interactif.",
    ],
    tips: [
      "Travaillez sur une image disque plutôt que le disque original si les données sont critiques.",
      "PhotoRec (même projet) récupère des fichiers par signatures.",
    ],
    commonErrors: [
      "Mauvais disque sélectionné : vérifiez taille/modèle.",
      "Écriture prématurée de la table : peut aggraver — lisez chaque écran.",
    ],
    faq: [
      {
        q: "Garantie de récupération ?",
        a: "Non. Plus vous écrivez sur le disque, moins les chances sont bonnes.",
      },
      {
        q: "SSD chiffré ?",
        a: "BitLocker/LUKS changent totalement la donne.",
      },
      {
        q: "Windows aussi ?",
        a: "TestDisk existe multiplateforme ; les principes restent proches.",
      },
    ],
    relatedIds: [34, 32, 45, 19],
  },
];

const target =
  "C:/Users/ZoulaTech/Desktop/1190-astuces-articles/data/prototype-041-050.mjs";
fs.writeFileSync(
  target,
  "/**\n * Contenu éditorial FR — prototype articles 41–50 (Linux)\n */\nexport const prototypeArticles041050 = " +
    JSON.stringify(articles, null, 2) +
    ";\n",
);
console.log("wrote", articles.length, "->", target);
