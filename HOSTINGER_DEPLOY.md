# Hostinger deployment (cottonunique.com + app.cottonunique.com)

## API URL architecture

| Who calls | URL in browser | Actually hits |
|-----------|----------------|---------------|
| **Storefront** (cottonunique.com) | `https://cottonunique.com/api/...` | PHP proxy → `app.cottonunique.com/api/...` |
| **Admin / uploads** | `https://app.cottonunique.com/api/...` | Node directly |

Do **not** point the storefront at `app.cottonunique.com` in JavaScript. When Node is down, Hostinger’s CDN returns **503 HTML without CORS headers**, and the browser shows a misleading CORS error. The same-origin `/api` proxy avoids that.

## Why you see 408 / 503 errors

If the Node app on **app.cottonunique.com** is **stopped or crashing**, Hostinger returns **408** or **503**.  
The site cannot load products or content until the Node app is running.

### Quick check

```bash
curl -s https://app.cottonunique.com/api/health
```

Expected: `{"status":"OK","timestamp":"..."}`  
If you get HTML with “408 Request Time-out”, the Node app is down.

---

## 1. Restart the Node.js app

1. Log in to **Hostinger hPanel**
2. Go to **Websites** → select **app.cottonunique.com** (or **Advanced** → **Node.js**)
3. Open your Node.js application
4. Click **Restart** (or **Deploy** if you just uploaded files)
5. Open **Logs** — you should see: `Server running on http://0.0.0.0:PORT`

### Node app settings

| Setting | Value |
|--------|--------|
| **Application root** | folder containing `package.json` and `dist/` |
| **Application startup file** | `dist/index.js` |
| **Node version** | 18 or 20 |
| **Run command** | `npm start` or `node dist/index.js` |

### Environment variables (Node app)

Set these in hPanel → Node.js → Environment variables (not in git):

```
NODE_ENV=production
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=u810591308_cottonunique
DB_USER=u810591308_cottonunique
DB_PASSWORD=<your MySQL password>
JWT_SECRET=<strong secret>
FRONTEND_URL=https://cottonunique.com,https://cottonunique.de
EMAIL_USER=cottoniq.co@gmail.com
INQUIRY_RECIPIENT_EMAIL=cottoniq.co@gmail.com
EMAIL_APP_PASSWORD=<Gmail app password>
GOOGLE_API_KEY=<optional, for chatbot>
```

`PORT` is assigned by Hostinger — **do not hardcode it**.

---

## 2. Deploy backend

On your machine:

```bash
cd backend
npm install
npm run build
```

Upload to the Node app folder on Hostinger:

- `dist/` (compiled JS)
- `package.json`, `package-lock.json`
- `uploads/` (if you have images)
- **Do not** upload `.env` with secrets to public folders — use hPanel env vars

Then **Restart** the Node app in hPanel.

---

## 3. Deploy frontend (cottonunique.com + cottonunique.de)

```bash
cd project
npm install
npm run build
```

Upload **everything** from `project/dist/` to each site’s `public_html`, including:

- `index.html`, `assets/`
- **`.htaccess`** (routes `/api/*` to PHP proxy)
- **`api-proxy.php`**
- **`api-backend.config.php`**
- **`uploads-proxy.php`**

---

## 4. Optional: internal fallback URL

If `app.cottonunique.com` returns 408 but Node is running on the same VPS, edit  
`public_html/api-backend.config.php`:

```php
return [
    'backend_origin' => 'https://app.cottonunique.com',
    'backend_fallback_origin' => 'http://127.0.0.1:YOUR_PORT',
];
```

`YOUR_PORT` is shown in hPanel → Node.js → your app.

---

## 5. Verify end-to-end

```bash
curl -s https://app.cottonunique.com/api/health
curl -s https://cottonunique.com/api/health
curl -s https://cottonunique.com/api/products | head -c 200
```

All should return JSON, not HTML 408.

In the browser DevTools → Network, requests should go to  
`https://cottonunique.com/api/...` with status **200**.
