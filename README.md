# WoningPrijsCheck.nl

AI-gedreven tool die beoordeelt of de vraagprijs van een woning reeel is op basis van de Nederlandse woningmarkt.

---

## Benodigdheden

- Node.js versie 18 of hoger  ->  https://nodejs.org
- Anthropic API key           ->  https://console.anthropic.com

---

## Projectstructuur

```
woningprijscheck/
├── index.html       <- De website
├── server.js        <- Node.js server + API proxy
├── package.json     <- Project configuratie
├── .env.example     <- Voorbeeld configuratie
└── .gitignore
```

---

## Installatie

### Stap 1 — Dependencies installeren

```bash
npm install
```

### Stap 2 — .env aanmaken

Mac / Linux:
```bash
cp .env.example .env
```

Windows:
```
copy .env.example .env
```

Open .env en vul je API key in:
```
ANTHROPIC_API_KEY=sk-ant-jouw-key-hier
PORT=3000
```

### Stap 3 — Server starten

```bash
npm start
```

Tijdens ontwikkeling (herstart automatisch bij wijzigingen):
```bash
npm run dev
```

### Stap 4 — Open de website

http://localhost:3000

---

## Productie (VPS / woningprijscheck.nl)

### PM2 (aanbevolen voor process management)

```bash
npm install -g pm2
pm2 start server.js --name woningprijscheck
pm2 save
pm2 startup
```

### Nginx reverse proxy met HTTPS

```nginx
server {
    listen 443 ssl;
    server_name woningprijscheck.nl www.woningprijscheck.nl;

    # SSL certificaat (bijv. via Let's Encrypt / Certbot)
    ssl_certificate     /etc/letsencrypt/live/woningprijscheck.nl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/woningprijscheck.nl/privkey.pem;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
    }
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name woningprijscheck.nl www.woningprijscheck.nl;
    return 301 https://$host$request_uri;
}
```

---

## Problemen oplossen

| Fout                              | Oplossing                                              |
|-----------------------------------|--------------------------------------------------------|
| node: command not found           | Installeer Node.js via nodejs.org                      |
| ANTHROPIC_API_KEY niet gevonden   | Controleer of .env bestaat en de key correct is        |
| Poort 3000 al in gebruik          | Zet PORT=3001 in .env                                  |
| CORS fout in browser              | Open via http://localhost:3000, niet het HTML bestand  |
