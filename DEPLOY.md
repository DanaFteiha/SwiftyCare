# SwiftyCare — Production Deployment

Goal: replace the Cloudflare-Tunnel setup with real cloud hosting so the site stays up without your laptop.

Final architecture:

```
demo.swifty-care.com  ──►  Vercel              (static React build)
api.swifty-care.com   ──►  Render.com          (Node / Express)
                           │
                           └─►  MongoDB Atlas   (Cluster0, ap-northeast-1)
                           └─►  OpenAI API
```

---

## 1. Deploy the API to Render (~10 minutes, one-time)

The repo ships with a `render.yaml` Blueprint, so Render will pick up everything automatically.

### 1a. Create the service

1. Go to https://dashboard.render.com and sign up / log in with GitHub.
2. Click **New +** → **Blueprint**.
3. Choose the `DanaFteiha/SwiftyCare` repository.
4. Render reads `render.yaml` and proposes a service called `swiftycare-api`. Click **Apply**.

### 1b. Set the two secret environment variables

Render creates the service but leaves these blank on purpose (they're marked `sync: false`):

In the Render service dashboard → **Environment**, add:

| Key | Value |
|---|---|
| `MONGODB_URI` | the value from your local `apps/api/.env` (never commit this) |
| `OPENAI_API_KEY` | the value from your local `apps/api/.env` (never commit this) |

> Treat both values as secrets. Rotate the Atlas password and the OpenAI key immediately if either is ever committed to the repo or pasted into a shared document.

### 1c. Allow Render to reach Atlas

Atlas → **Network Access** → **+ Add IP Address** → choose **Allow Access from Anywhere** (`0.0.0.0/0`).
Render uses a large rotating IP pool, so allow-listing one IP doesn't work.

### 1d. Wait for the first deploy

- First build takes ~2–3 minutes.
- When it's green, open the URL Render gives you (something like `https://swiftycare-api-xxxx.onrender.com`).
- Hit `/health` — should return `{"status":"healthy","database":"connected",...}`.

### 1e. About the free plan

Render's free plan **sleeps after 15 minutes of no traffic**; the first request after sleep takes ~30–60 s to wake up. Our frontend uses a 90 s AI-request timeout, so it will still work, but the first click after a quiet period feels slow.

For live client demos, upgrade to the **Starter plan ($7/mo)** — no cold starts, same service.

---

## 2. Point api.swifty-care.com at Render

In Render → service → **Settings** → **Custom Domains** → **Add Custom Domain** → `api.swifty-care.com`. Render will show you a DNS target like `swiftycare-api-xxxx.onrender.com`.

Then in **Cloudflare DNS**:

1. Delete (or edit) the existing CNAME for `api` that points to the tunnel.
2. Create a new record:
   - Type: `CNAME`
   - Name: `api`
   - Target: the hostname Render gave you
   - **Proxy status: DNS only (grey cloud)** — Render issues its own TLS cert; the orange cloud breaks this unless you also switch SSL mode to *Full (strict)*.

DNS propagation takes 1–5 minutes. Back in Render, the custom-domain row will flip to **Verified** and issue a Let's Encrypt cert automatically.

Verify:

```bash
curl https://api.swifty-care.com/health
# → {"status":"healthy", ...}
```

---

## 3. Verify Vercel env vars for the web

Vercel → project → **Settings** → **Environment Variables** → confirm for the **Production** scope:

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://api.swifty-care.com` |

If it wasn't set before (or was empty), add it and redeploy (Deployments tab → latest → **⋯** → **Redeploy**).

Also make sure `demo.swifty-care.com` in **Settings → Domains** is pointing at Vercel (green check, not the Cloudflare tunnel).

---

## 4. Retire the Cloudflare tunnel

Once both custom domains are verified and working:

```bash
# Stop the running tunnel
pkill cloudflared 2>/dev/null || true

# (optional) remove the hostnames from the tunnel
cloudflared tunnel route dns --overwrite-dns swiftycare foo.invalid
#   (or delete it in Cloudflare Zero Trust dashboard)
```

You no longer need `cloudflared` running to keep the live site up.

---

## 5. Smoke test in production

1. Open https://demo.swifty-care.com in an incognito window.
2. Create a new case (`Yossi Cohen`, `123456789`, any hospital).
3. In the doctor window, confirm the case appears on the dashboard.
4. Open the case → **Generate AI Summary** — first run may take 30–60 s if Render was cold, subsequent ones are fast.
5. Order a test, generate the discharge report, finalize.

If step 2 fails with *"Database is not connected"*, revisit section **1b** (env vars) and **1c** (Atlas network access).

---

## 6. Ongoing: auto-deploy

Both Vercel and Render are wired to `origin/main`:
- Any push to `main` → Vercel rebuilds the web automatically.
- Any push to `main` that touches `apps/api/**` → Render rebuilds the API automatically.

No manual steps required after the first setup.
