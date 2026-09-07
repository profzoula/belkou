import fs from "node:fs";

const articles = [
  {
    id: 61,
    category: "Linux",
    slug: "suivre-chemin-paquet-traceroute",
    title: "Suivre le chemin d’un paquet avec traceroute",
    seoTitle: "traceroute : voir chaque saut jusqu’à la destination",
    metaDescription:
      "Diagnostiquez latence et pertes en visualisant chaque routeur traversé avec traceroute (ou tracert sous Windows).",
    ogTitle: "traceroute — chemin réseau saut par saut",
    ogDescription: "Idéal quand un site « rame » et que vous voulez savoir où ça bloque.",
    primaryKeyword: "traceroute Linux",
    secondaryKeywords: ["tracert", "diagnostic réseau", "latence"],
    tags: ["Linux", "Réseau", "Diagnostic"],
    difficulty: "Débutant",
    estimatedMinutes: 4,
    coverAlt: "Terminal affichant une sortie traceroute",
    introduction: [
      "traceroute (ou tracert sous Windows) montre chaque saut IP entre vous et une cible.",
      "Utile pour localiser où la latence explose ou où le trafic s’arrête.",
    ],
    whyUseful: [
      "Sépare un problème local d’un problème provider / distant.",
      "Donne un RTT approximatif par saut.",
      "Fonctionne sans outil graphique.",
    ],
    prerequisites: [
      "Paquet traceroute (souvent déjà présent)",
      "Accès terminal",
      "Cible joignable (domaine ou IP)",
    ],
    steps: [
      {
        title: "Lancer vers un domaine",
        body: "traceroute google.com — observez les hops et les temps ms.",
      },
      {
        title: "Sous Windows",
        body: "Utilisez tracert google.com dans Invite de commandes ou PowerShell.",
      },
      {
        title: "Interpréter",
        body: "* * * signifie souvent filtrage ICMP ; un saut lent isolé n’est pas toujours « cassé ».",
      },
    ],
    code: "traceroute google.com\n# Windows :\ntracert google.com",
    codeLang: "bash",
    codeExplanation: [
      "Chaque ligne = un routeur (ou un hop) sur le chemin.",
      "Les trois valeurs ms sont des mesures répétées du RTT.",
    ],
    tips: [
      "mtr combine ping + traceroute en continu (souvent plus parlant).",
      "Certains firewalls bloquent ICMP : le tracé peut être incomplet sans être « mort ».",
    ],
    commonErrors: [
      "command not found : installez traceroute (apt/dnf).",
      "Tout en * * * : ICMP filtré — essayez TCP traceroute si disponible.",
    ],
    faq: [
      {
        q: "Différence avec ping ?",
        a: "ping teste la destination ; traceroute montre le chemin.",
      },
      {
        q: "IPv6 ?",
        a: "Souvent traceroute6 / tracert -6 selon l’OS.",
      },
      {
        q: "Droit root ?",
        a: "Pas toujours nécessaire ; certaines variantes raw sockets demandent des droits élevés.",
      },
    ],
    relatedIds: [49, 39, 64, 63],
  },
  {
    id: 62,
    category: "Linux",
    slug: "scanner-reseau-ports-nmap",
    title: "Scanner un réseau et ses ports ouverts avec Nmap",
    seoTitle: "Nmap : inventaire d’hôtes et de ports sur votre LAN",
    metaDescription:
      "Découvrez les machines actives et les services exposés avec nmap -sV sur un sous-réseau autorisé.",
    ogTitle: "Nmap — scan réseau contrôlé",
    ogDescription: "Un outil puissant : à n’utiliser que sur des réseaux dont vous avez la responsabilité.",
    primaryKeyword: "nmap scan réseau",
    secondaryKeywords: ["ports ouverts", "découverte hôtes", "-sV"],
    tags: ["Linux", "Réseau", "Sécurité"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 6,
    coverAlt: "Sortie Nmap listant des ports et services",
    introduction: [
      "Nmap cartographie hôtes et ports : idéal pour un inventaire LAN ou un audit de surface d’attaque.",
      "Scannez uniquement des réseaux que vous administrez ou pour lesquels vous avez une autorisation écrite.",
    ],
    whyUseful: [
      "Repère services exposés oubliés.",
      "Identifie versions (avec -sV) pour prioriser les correctifs.",
      "Standard de facto en admin / sécu.",
    ],
    prerequisites: [
      "nmap installé",
      "Droit de scanner la cible",
      "Connaissance du CIDR (ex. 192.168.1.0/24)",
    ],
    steps: [
      {
        title: "Installer",
        body: "sudo apt install nmap (ou équivalent).",
      },
      {
        title: "Scan sous-réseau",
        body: "nmap -sV -p- 192.168.1.0/24 — adaptez l’IP ; -p- = tous les ports TCP (plus long).",
      },
      {
        title: "Affiner",
        body: "Pour un host : nmap -sV 192.168.1.10. Pour aller plus vite, limitez les ports (-p 22,80,443).",
      },
    ],
    code: "nmap -sV -p- 192.168.1.0/24",
    codeLang: "bash",
    legalNotice:
      "Scanner sans autorisation peut être illégal. Réservez Nmap à vos machines / votre lab / missions cadrées.",
    codeExplanation: [
      "-sV tente d’identifier le service derrière chaque port ouvert.",
      "-p- balaie 1–65535 : long et bruyant — souvent trop pour un premier passage.",
    ],
    tips: [
      "Commencez par nmap -sn 192.168.1.0/24 (ping sweep) pour lister les hôtes.",
      "Exportez : -oN rapport.txt ou -oX pour un XML.",
    ],
    commonErrors: [
      "Permission denied / raw sockets : certains scans TCP SYN demandent root.",
      "Firewall qui drop : résultats trompeurs — croisez avec une autre méthode.",
    ],
    faq: [
      {
        q: "Scan UDP ?",
        a: "-sU — plus lent et plus ambigu ; à utiliser avec parcimonie.",
      },
      {
        q: "Alternative GUI ?",
        a: "Zenmap existe, mais la CLI reste plus scriptable.",
      },
      {
        q: "Cloud ?",
        a: "Respectez aussi les ToS du provider ; beaucoup interdisent les scans sortants agressifs.",
      },
    ],
    relatedIds: [65, 67, 49, 60],
  },
  {
    id: 63,
    category: "Linux",
    slug: "verifier-enregistrements-dns-dig-nslookup",
    title: "Vérifier les enregistrements DNS avec dig et nslookup",
    seoTitle: "dig / nslookup : contrôler A, MX, TXT d’un domaine",
    metaDescription:
      "Diagnostiquez propagation DNS, enregistrements A/MX/TXT et résolveurs avec dig +short et nslookup.",
    ogTitle: "DNS lookup avancé — dig & nslookup",
    ogDescription: "Quand un site « ne résout pas », commencez ici.",
    primaryKeyword: "dig DNS",
    secondaryKeywords: ["nslookup", "enregistrements DNS", "propagation"],
    tags: ["Linux", "Réseau", "DNS"],
    difficulty: "Débutant",
    estimatedMinutes: 4,
    coverAlt: "Terminal dig affichant une réponse DNS",
    introduction: [
      "dig et nslookup interrogent le DNS : IP (A/AAAA), mail (MX), validation (TXT), etc.",
      "Indispensables après un changement de zone ou un doute sur la propagation.",
    ],
    whyUseful: [
      "Sépare erreur DNS d’erreur serveur web.",
      "dig est précis et scriptable ; nslookup est partout.",
      "Permet de cibler un résolveur précis (@1.1.1.1).",
    ],
    prerequisites: [
      "dnsutils / bind-utils (dig) selon la distro",
      "Domaine à tester",
    ],
    steps: [
      {
        title: "Réponse courte",
        body: "dig +short exemple.com — affiche surtout les IP A/AAAA.",
      },
      {
        title: "Type d’enregistrement",
        body: "dig MX exemple.com ou dig TXT exemple.com pour mail et vérifs.",
      },
      {
        title: "nslookup",
        body: "nslookup exemple.com — interactif ou one-shot ; pratique aussi sous Windows.",
      },
    ],
    code: "dig +short google.com\nnslookup google.com",
    codeLang: "bash",
    codeExplanation: [
      "+short réduit le bruit pour un usage rapide.",
      "Sans +short, dig montre le détail (autorité, TTL, flags).",
    ],
    tips: [
      "dig @8.8.8.8 exemple.com compare avec un résolveur public.",
      "Surveillez le TTL pour estimer la fenêtre de propagation.",
    ],
    commonErrors: [
      "dig: command not found — installez dnsutils (Debian/Ubuntu).",
      "NXDOMAIN : le nom n’existe pas (ou mauvaise zone / typo).",
    ],
    faq: [
      {
        q: "dig vs host ?",
        a: "host est plus court ; dig offre plus de contrôle.",
      },
      {
        q: "DNSSEC ?",
        a: "dig +dnssec montre les signatures si présentes.",
      },
      {
        q: "Cache local ?",
        a: "systemd-resolved / navigateur peuvent cacher — testez aussi un résolveur externe.",
      },
    ],
    relatedIds: [70, 61, 49, 39],
  },
  {
    id: 64,
    category: "Linux",
    slug: "mesurer-debit-reseau-iperf3",
    title: "Mesurer le débit réseau entre deux machines avec iperf3",
    seoTitle: "iperf3 : tester bande passante LAN ou WAN",
    metaDescription:
      "Lancez un serveur iperf3 -s et un client iperf3 -c pour mesurer le débit réel entre deux hôtes.",
    ogTitle: "iperf3 — benchmark bande passante",
    ogDescription: "Plus honnête qu’un speedtest grand public quand vous contrôlez les deux bouts.",
    primaryKeyword: "iperf3 débit",
    secondaryKeywords: ["bande passante", "benchmark réseau", "LAN"],
    tags: ["Linux", "Réseau", "Performance"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 5,
    coverAlt: "Deux machines connectées pour un test iperf3",
    introduction: [
      "iperf3 mesure le débit TCP/UDP entre un serveur et un client que vous contrôlez.",
      "Parfait pour valider un switch, un Wi‑Fi, un VPN ou un lien cloud.",
    ],
    whyUseful: [
      "Chiffre le lien réel, pas seulement la pub FAI.",
      "Mode serveur/client simple.",
      "Options UDP, parallèle, durée, etc.",
    ],
    prerequisites: [
      "iperf3 sur les deux machines",
      "Connectivité IP (et firewall ouvert sur le port, souvent 5201)",
      "Autorisation d’utiliser le lien (charge le réseau)",
    ],
    steps: [
      {
        title: "Côté serveur",
        body: "Sur la machine « écoute » : iperf3 -s",
      },
      {
        title: "Côté client",
        body: "iperf3 -c 192.168.1.10 — remplacez par l’IP du serveur.",
      },
      {
        title: "Lire le résultat",
        body: "Observez le débit (Mbits/sec) et les retransmissions éventuelles.",
      },
    ],
    code: "# Serveur :\niperf3 -s\n# Client :\niperf3 -c 192.168.1.10",
    codeLang: "bash",
    codeExplanation: [
      "-s met le démon en écoute.",
      "-c IP lance le test vers ce serveur.",
    ],
    tips: [
      "iperf3 -c IP -t 30 allonge le test à 30 s.",
      "UDP : -u (interprétez perte et jitter, pas seulement le débit).",
    ],
    commonErrors: [
      "Connection refused : serveur arrêté ou port filtré.",
      "Débit ridiculement bas en Wi‑Fi : interférence / distance — testez aussi en filaire.",
    ],
    faq: [
      {
        q: "Remplace un speedtest internet ?",
        a: "Non : ici vous mesurez entre deux points choisis ; un speedtest vise un serveur distant du FAI.",
      },
      {
        q: "Multi-flux ?",
        a: "-P 4 lance plusieurs flux parallèles.",
      },
      {
        q: "Windows ?",
        a: "Des builds iperf3 existent ; le principe serveur/client est identique.",
      },
    ],
    relatedIds: [61, 51, 49, 66],
  },
  {
    id: 65,
    category: "Linux",
    slug: "capturer-paquets-tcpdump",
    title: "Capturer le trafic réseau avec tcpdump",
    seoTitle: "tcpdump : enregistrer un .pcap pour analyse",
    metaDescription:
      "Capturez le trafic d’une interface avec sudo tcpdump -i eth0 -w capture.pcap puis analysez-le (Wireshark).",
    ogTitle: "tcpdump — capture pcap en ligne de commande",
    ogDescription: "L’outil de base quand il faut prouver ce qui circule vraiment sur le fil.",
    primaryKeyword: "tcpdump Linux",
    secondaryKeywords: ["pcap", "capture paquet", "Wireshark"],
    tags: ["Linux", "Réseau", "Diagnostic"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 5,
    coverAlt: "Capture tcpdump sauvegardée en fichier pcap",
    introduction: [
      "tcpdump écoute une interface et peut écrire un fichier pcap pour analyse ultérieure.",
      "Essentiel pour debug HTTP/DNS, suspecter une boucle, ou fournir une preuve à un support.",
    ],
    whyUseful: [
      "Léger, présent partout, scriptable.",
      "Filtres BPF puissants (host, port, proto).",
      "Compatible Wireshark / tshark.",
    ],
    prerequisites: [
      "tcpdump installé",
      "sudo / CAP_NET_RAW",
      "Nom d’interface (ip a)",
    ],
    steps: [
      {
        title: "Choisir l’interface",
        body: "ip a pour trouver eth0, ens33, wlan0…",
      },
      {
        title: "Capturer vers un fichier",
        body: "sudo tcpdump -i eth0 -w capture.pcap — Ctrl+C pour arrêter.",
      },
      {
        title: "Filtrer (exemple)",
        body: "sudo tcpdump -i eth0 port 53 — DNS seulement ; ouvrez ensuite le pcap dans Wireshark.",
      },
    ],
    code: "sudo tcpdump -i eth0 -w capture.pcap",
    codeLang: "bash",
    legalNotice:
      "Ne capturez que le trafic que vous êtes autorisé à inspecter (données personnelles, secrets de session possibles).",
    codeExplanation: [
      "-i eth0 sélectionne l’interface.",
      "-w écrit le binaire pcap (mieux que -w - pour analyse GUI).",
    ],
    tips: [
      "-nn évite les résolutions DNS/noms de ports pendant la capture.",
      "-c 100 s’arrête après 100 paquets — pratique pour un échantillon.",
    ],
    commonErrors: [
      "No such device : mauvais nom d’interface.",
      "Disque plein : une capture non filtrée grossit vite.",
    ],
    faq: [
      {
        q: "Voir en direct sans fichier ?",
        a: "Omettez -w ; ajoutez -A pour du ASCII (HTTP clair).",
      },
      {
        q: "Conteneurs ?",
        a: "Capturez sur l’hôte ou dans le netns approprié.",
      },
      {
        q: "Remplace Wireshark ?",
        a: "Non : tcpdump capture ; Wireshark analyse confortablement.",
      },
    ],
    relatedIds: [51, 62, 49, 39],
  },
  {
    id: 66,
    category: "Linux",
    slug: "vpn-moderne-wireguard-linux",
    title: "Mettre en place WireGuard, un VPN moderne et rapide",
    seoTitle: "WireGuard sous Linux : clés et premiers pas",
    metaDescription:
      "Installez WireGuard, générez une paire de clés, et construisez un tunnel VPN léger et moderne.",
    ogTitle: "WireGuard — VPN simple et performant",
    ogDescription: "Moins de cérémonie qu’OpenVPN, excellent débit, crypto moderne.",
    primaryKeyword: "WireGuard Linux",
    secondaryKeywords: ["VPN", "wg genkey", "tunnel"],
    tags: ["Linux", "Réseau", "Sécurité"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 8,
    coverAlt: "Schéma simplifié d’un tunnel WireGuard",
    introduction: [
      "WireGuard est un protocole VPN moderne : peu de lignes de config, bon débit, crypto actuelle.",
      "On commence souvent par installer le paquet et générer une paire de clés.",
    ],
    whyUseful: [
      "Plus simple à raisonner qu’IPSec / OpenVPN classique.",
      "Intégré au kernel Linux (wg).",
      "Idéal lab, accès distant sécurisé, mesh léger.",
    ],
    prerequisites: [
      "Ubuntu/Debian ou distro équivalente",
      "sudo",
      "Accès aux deux extrémités (serveur + client) pour une config complète",
    ],
    steps: [
      {
        title: "Installer",
        body: "sudo apt install wireguard",
      },
      {
        title: "Générer les clés",
        body: "wg genkey | tee privatekey | wg pubkey > publickey — protégez privatekey (chmod 600).",
      },
      {
        title: "Configurer l’interface",
        body: "Créez /etc/wireguard/wg0.conf (Address, PrivateKey, Peer PublicKey/Endpoint/AllowedIPs) puis sudo wg-quick up wg0.",
      },
    ],
    code: "sudo apt install wireguard\nwg genkey | tee privatekey | wg pubkey > publickey",
    codeLang: "bash",
    codeExplanation: [
      "genkey produit la clé privée ; pubkey en dérive la publique.",
      "tee écrit la privée sur disque tout en la passant au pipe.",
    ],
    tips: [
      "Ne partagez jamais la clé privée ; seule la publique va chez le pair.",
      "AllowedIPs contrôle le routage (0.0.0.0/0 = full tunnel).",
    ],
    commonErrors: [
      "Handshake timeout : mauvais Endpoint, NAT/firewall UDP, ou clés inversées.",
      "Permissions trop ouvertes sur privatekey.",
    ],
    faq: [
      {
        q: "Port par défaut ?",
        a: "Souvent UDP 51820 — ouvrez-le sur le firewall du serveur.",
      },
      {
        q: "Mobile ?",
        a: "Apps officielles iOS/Android existent.",
      },
      {
        q: "Gratuit ?",
        a: "Le logiciel l’est ; un VPS ou un FAI pour l’héberger a un coût.",
      },
    ],
    relatedIds: [57, 52, 64, 67],
  },
  {
    id: 67,
    category: "Linux",
    slug: "bloquer-adresse-ip-iptables",
    title: "Bloquer une adresse IP avec iptables",
    seoTitle: "iptables : DROP une IP source indésirable",
    metaDescription:
      "Ajoutez une règle iptables -A INPUT -s IP -j DROP pour couper immédiatement un hôte hostile.",
    ogTitle: "iptables — bloquer une IP",
    ogDescription: "Geste d’urgence classique ; préférez nftables/ufw sur les stacks modernes si possible.",
    primaryKeyword: "iptables bloquer IP",
    secondaryKeywords: ["firewall Linux", "DROP", "INPUT"],
    tags: ["Linux", "Réseau", "Sécurité"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 4,
    coverAlt: "Règle firewall bloquant une adresse IP",
    introduction: [
      "iptables reste très répandu pour filtrer le trafic au niveau paquet.",
      "Bloquer une IP source en DROP est un réflexe d’urgence face à un scan ou un brute-force.",
    ],
    whyUseful: [
      "Effet immédiat sans redémarrer un service.",
      "Granularité fine (IP, port, interface).",
      "Base pour comprendre nftables / ufw ensuite.",
    ],
    prerequisites: [
      "Root / sudo",
      "iptables (ou compat iptables-nft)",
      "IP à bloquer clairement identifiée",
    ],
    steps: [
      {
        title: "Ajouter la règle",
        body: "sudo iptables -A INPUT -s 192.168.1.100 -j DROP",
      },
      {
        title: "Vérifier",
        body: "sudo iptables -L INPUT -n -v | head — confirmez la ligne DROP.",
      },
      {
        title: "Persistance",
        body: "Sans sauvegarde (netfilter-persistent / script boot), la règle disparaît au reboot.",
      },
    ],
    code: "iptables -A INPUT -s 192.168.1.100 -j DROP",
    codeLang: "bash",
    legalNotice:
      "Ne bloquez pas une IP sans diagnostic : un VPN, un CDN ou un NAT partagé peut toucher des innocents.",
    codeExplanation: [
      "-A INPUT ajoute en fin de chaîne entrante.",
      "-s cible la source ; -j DROP jette sans réponse (vs REJECT).",
    ],
    tips: [
      "Sur Ubuntu moderne, ufw deny from IP est souvent plus sûr à maintenir.",
      "Pour retirer : iptables -D INPUT -s IP -j DROP (règle identique).",
    ],
    commonErrors: [
      "Se bloquer soi-même hors d’un serveur distant.",
      "Règle ajoutée mais jamais persistée — le problème revient après reboot.",
    ],
    faq: [
      {
        q: "iptables vs nftables ?",
        a: "nftables est le successeur ; beaucoup de distros exposent encore la syntaxe iptables en compat.",
      },
      {
        q: "IPv6 ?",
        a: "Utilisez ip6tables (ou nft) — iptables seul ne couvre pas IPv6.",
      },
      {
        q: "Cloud ?",
        a: "Security groups / Network Firewall du provider restent souvent la première ligne.",
      },
    ],
    relatedIds: [60, 52, 62, 49],
  },
  {
    id: 68,
    category: "Linux",
    slug: "lire-table-arp-reseau-local",
    title: "Lire la table ARP du réseau local",
    seoTitle: "arp -a : voir IP et MAC du LAN",
    metaDescription:
      "Affichez les associations IP ↔ MAC connues avec arp -a pour diagnostiquer le voisinage Ethernet/Wi‑Fi.",
    ogTitle: "Table ARP — qui est sur le LAN ?",
    ogDescription: "Un coup d’œil rapide sur les voisins L2 déjà découverts.",
    primaryKeyword: "table ARP Linux",
    secondaryKeywords: ["arp -a", "adresse MAC", "réseau local"],
    tags: ["Linux", "Réseau", "Diagnostic"],
    difficulty: "Débutant",
    estimatedMinutes: 3,
    coverAlt: "Liste ARP d’adresses IP et MAC",
    introduction: [
      "La table ARP relie adresses IP et adresses MAC sur le segment local.",
      "arp -a (ou ip neigh) liste ce que votre machine a déjà appris.",
    ],
    whyUseful: [
      "Repère rapidement des hôtes déjà contactés.",
      "Aide à détecter un conflit IP / spoofing (avec d’autres outils).",
      "Disponible aussi sous Windows (arp -a).",
    ],
    prerequisites: [
      "Accès terminal",
      "Être sur le même L2 / VLAN pour des voisins utiles",
    ],
    steps: [
      {
        title: "Afficher",
        body: "arp -a — ou préférer ip neigh show sur les systèmes modernes.",
      },
      {
        title: "Relier à une IP",
        body: "Cherchez l’IP suspecte et notez la MAC ; croisez avec le switch / DHCP si besoin.",
      },
      {
        title: "Rafraîchir le voisinage",
        body: "Pinguez une IP (ping -c1) puis relisez arp / ip neigh.",
      },
    ],
    code: "arp -a",
    codeLang: "bash",
    codeExplanation: [
      "Chaque entrée montre une IP et, si connue, sa MAC.",
      "Incomplete signifie que la résolution ARP a échoué ou est en cours.",
    ],
    tips: [
      "ip -s neigh est souvent plus à jour que l’ancien arp.",
      "Sur Wi‑Fi client, vous ne voyez pas tout le LAN comme sur un switch miroir.",
    ],
    commonErrors: [
      "Table quasi vide : pas encore de trafic vers ces hôtes.",
      "MAC inattendue : possible spoofing — investiguez avant de conclure.",
    ],
    faq: [
      {
        q: "Remplace Nmap ?",
        a: "Non : ARP montre le cache local ; Nmap explore activement.",
      },
      {
        q: "IPv6 ?",
        a: "Voisinage NDP : ip -6 neigh.",
      },
      {
        q: "Windows ?",
        a: "Même commande arp -a dans cmd/PowerShell.",
      },
    ],
    relatedIds: [62, 61, 69, 49],
  },
  {
    id: 69,
    category: "Linux",
    slug: "configurer-ip-statique-netplan-linux",
    title: "Configurer une IP statique avec Netplan sous Linux",
    seoTitle: "Netplan : adresse IP fixe sur Ubuntu",
    metaDescription:
      "Définissez une IP fixe dans /etc/netplan puis appliquez avec netplan apply — idéal pour serveurs et lab.",
    ogTitle: "IP statique — Netplan Ubuntu",
    ogDescription: "Fini le bail DHCP qui change au mauvais moment.",
    primaryKeyword: "IP statique Netplan",
    secondaryKeywords: ["Ubuntu réseau", "netplan apply", "YAML"],
    tags: ["Linux", "Réseau", "Administration"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 6,
    coverAlt: "Fichier YAML Netplan avec adresse IP statique",
    introduction: [
      "Sur Ubuntu Server (et certaines Desktop), Netplan pilote le réseau via des YAML dans /etc/netplan/.",
      "Une IP statique évite les surprises DHCP sur un serveur, NAS ou lab.",
    ],
    whyUseful: [
      "Adresse prévisible pour SSH, DNS, reverse proxy.",
      "Config déclarative versionnable.",
      "Standard Ubuntu moderne.",
    ],
    prerequisites: [
      "Ubuntu (ou distro Netplan)",
      "sudo",
      "Plan d’adressage (IP, masque, gateway, DNS)",
      "Accès console / hors-bande si possible (évite lock-out)",
    ],
    steps: [
      {
        title: "Éditer le YAML",
        body: "Ouvrez /etc/netplan/01-config.yaml (le nom varie) et définissez addresses, routes/gateway4, nameservers.",
      },
      {
        title: "Exemple minimal",
        body: "Sous ethernets.<iface>.addresses : [192.168.1.50/24] + gateway et DNS selon votre réseau.",
      },
      {
        title: "Appliquer",
        body: "sudo netplan try puis confirmez, ou sudo netplan apply — gardez une session ouverte.",
      },
    ],
    code: "# /etc/netplan/01-config.yaml (extrait)\naddresses: [192.168.1.50/24]",
    codeLang: "yaml",
    codeExplanation: [
      "addresses attend CIDR (IP/masque), pas seulement l’IP nue.",
      "Le fichier complet doit aussi lier l’interface (eth0, ens…) et souvent la gateway.",
    ],
    tips: [
      "netplan try annule automatiquement si vous ne confirmez pas — filet de sécurité.",
      "Validez le YAML (indentation) avant apply.",
    ],
    commonErrors: [
      "Mauvaise indentation YAML → apply échoue.",
      "Gateway oubliée → IP OK en local, pas d’Internet.",
    ],
    faq: [
      {
        q: "NetworkManager ?",
        a: "Sur Desktop, NM peut coexister ; suivez la doc de votre variante Ubuntu.",
      },
      {
        q: "Debian sans Netplan ?",
        a: "Souvent /etc/network/interfaces ou systemd-networkd directement.",
      },
      {
        q: "DHCP + IP réservée ?",
        a: "Alternative propre côté routeur si vous préférez centraliser.",
      },
    ],
    relatedIds: [68, 63, 52, 49],
  },
  {
    id: 70,
    category: "Linux",
    slug: "dns-over-https-confidentialite",
    title: "Chiffrer vos requêtes DNS avec le DNS-over-HTTPS",
    seoTitle: "DNS-over-HTTPS (DoH) : plus de confidentialité DNS",
    metaDescription:
      "Activez le DNS-over-HTTPS (ex. 1.1.1.1) pour chiffrer les résolutions DNS hors du chemin clair classique.",
    ogTitle: "DoH — DNS chiffré",
    ogDescription: "Moins de fuites de noms de domaines vers le réseau local / le FAI.",
    primaryKeyword: "DNS-over-HTTPS",
    secondaryKeywords: ["DoH", "1.1.1.1", "confidentialité DNS"],
    tags: ["Linux", "Réseau", "Sécurité", "Vie privée"],
    difficulty: "Intermédiaire",
    estimatedMinutes: 5,
    coverAlt: "Requêtes DNS chiffrées via HTTPS",
    introduction: [
      "Le DNS classique voyage souvent en clair : votre FAI (ou le Wi‑Fi public) voit les noms résolus.",
      "Le DNS-over-HTTPS (DoH) encapsule ces requêtes dans du TLS, par exemple via 1.1.1.1.",
    ],
    whyUseful: [
      "Réduit la visibilité des domaines visités sur le chemin local.",
      "Complète HTTPS (qui ne cache pas le SNI / le DNS amont).",
      "Support navigateur et OS de plus en plus large.",
    ],
    prerequisites: [
      "Navigateur moderne ou OS supportant DoH",
      "Ou un stub résolveur local (cloudflared, systemd-resolved selon setup)",
    ],
    steps: [
      {
        title: "Via le navigateur",
        body: "Firefox / Chrome : activez DoH dans les réglages réseau / confidentialité et choisissez un fournisseur (Cloudflare, NextDNS…).",
      },
      {
        title: "Via le système (exemple)",
        body: "Configurez un résolveur DoH/DoT de confiance dans systemd-resolved ou un client dédié — suivez la doc de votre distro.",
      },
      {
        title: "Vérifier",
        body: "Testez sur la page de vérification du fournisseur (ex. 1.1.1.1/help) ou dig @résolveur après bascule.",
      },
    ],
    code: null,
    codeLang: "text",
    codeExplanation: [],
    tips: [
      "DoH ≠ anonymat total : le fournisseur DoH voit encore vos requêtes.",
      "En entreprise, DoH navigateur peut contourner le filtrage DNS interne — politiques à clarifier.",
    ],
    commonErrors: [
      "DoH actif dans le navigateur mais apps système encore en DNS clair.",
      "Résolveur DoH bloqué par un firewall d’entreprise.",
    ],
    faq: [
      {
        q: "DoH vs DoT ?",
        a: "DoT = DNS sur TLS (port 853) ; DoH = DNS dans HTTPS (443). Même idée de chiffrement, chemins différents.",
      },
      {
        q: "1.1.1.1 obligatoire ?",
        a: "Non — choisissez un opérateur de confiance (ou auto-hébergé).",
      },
      {
        q: "Remplace un VPN ?",
        a: "Non. DoH chiffre le DNS ; un VPN chiffre (souvent) tout le trafic vers un autre point de sortie.",
      },
    ],
    relatedIds: [63, 66, 61, 49],
  },
];

const target =
  "C:/Users/ZoulaTech/Desktop/1190-astuces-articles/data/prototype-061-070.mjs";
fs.writeFileSync(
  target,
  "/**\n * Contenu éditorial FR — prototype articles 61–70 (Réseau / Linux)\n */\nexport const prototypeArticles061070 = " +
    JSON.stringify(articles, null, 2) +
    ";\n",
);
console.log("wrote", articles.length, "->", target);
