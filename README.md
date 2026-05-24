# Divora Technology Backend

Node.js + TypeScript + Express backend exposing a contact form endpoint that sends email via Gmail SMTP.

## Tech stack

- **Runtime**: Node.js (>= 20)
- **Language**: TypeScript
- **Framework**: Express
- **Mail**: nodemailer over Gmail SMTP (App Password auth)
- **Config**: dotenv for local dev; platform env vars in production

## Project structure

```
src/
  index.ts              Server bootstrap, mounts routes
  config/
    mailer.ts           Nodemailer transporter (reads process.env)
  routes/
    email.ts            POST /api/contact handler
  scripts/
    verify-smtp.ts      Standalone SMTP credential check
.env.example            Template for required env vars
.env                    Local secrets (gitignored, never committed)
tsconfig.json           strict TypeScript config, outputs to dist/
```

## Setup

```bash
git clone <repo-url>
cd divoratechnology-backend
npm install
cp .env.example .env
```

Then fill in `.env` with real values (see **Environment variables** below).

### Generating the Gmail App Password

`SMTP_PASS` must be a Google **App Password**, not your Gmail login password. Google has not accepted account passwords over SMTP since May 2022.

1. Enable 2-Step Verification on the Google account: <https://myaccount.google.com/security>
2. Create an App Password: <https://myaccount.google.com/apppasswords>
3. Copy the 16-character value into `SMTP_PASS` in `.env`

If the account is a Google Workspace user (custom domain), the Workspace admin may need to allow App Passwords on the account first.

## Environment variables

| Name | Required | Example | Purpose |
|---|---|---|---|
| `PORT` | no | `3000` | HTTP port (defaults to 3000) |
| `SMTP_USER` | **yes** | `support@divoratechnology.com` | Gmail address that authenticates to SMTP |
| `SMTP_PASS` | **yes** | `abcdwxyzefghijkl` | Google App Password for that account |
| `MAIL_FROM` | recommended | `Divora Technology <support@divoratechnology.com>` | `From` header on outgoing mail |
| `MAIL_TO` | recommended | `support@divoratechnology.com` | Inbox that receives contact form submissions (defaults to `SMTP_USER`) |
| `CORS_ORIGINS` | **yes (in prod)** | `https://divoratechnology.com,https://www.divoratechnology.com` | Comma-separated list of frontend origins allowed to call this API. Requests from other origins are blocked. |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Run with `tsx watch` — hot reload on file change |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled JS from `dist/` |
| `npm run typecheck` | Type-check without emitting files |

## API

### Health check

```
GET /health
200 OK
{ "status": "ok" }
```

### Submit contact form

```
POST /api/contact
Content-Type: application/json
```

**Request body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1 555 0100",
  "helpWith": "Web development",
  "message": "We need a customer portal..."
}
```

All five fields are required. `email` is validated against a basic regex.

**Success — 200:**

```json
{ "success": true, "messageId": "<...@gmail.com>" }
```

**Validation error — 400:**

```json
{
  "success": false,
  "errors": {
    "email": "Email is not valid.",
    "phone": "Phone is required."
  }
}
```

**SMTP error — 500:**

```json
{ "success": false, "error": "Invalid login: 535-5.7.8 ..." }
```

The outgoing email sets `Reply-To` to the customer's address, so replying in Gmail goes directly to them.

## Verifying SMTP credentials in isolation

If sending fails, test the credentials without the API in the loop:

```bash
npx tsx src/scripts/verify-smtp.ts <user> <app-password>
```

The script prints the full SMTP conversation, including the exact server response on auth failure.

## Secrets

`.env` is gitignored. **Never commit it.** Before every commit, run `git status` and confirm `.env` is not in the staged list.

For production, do not deploy a `.env` file. Set the same variables in your hosting platform's environment-variable UI:

- **Vercel**: Project Settings → Environment Variables (mark `SMTP_PASS` as Sensitive)
- **Render / Railway / Fly.io**: equivalent dashboards
- **VPS**: systemd `EnvironmentFile=` pointing at a file with `chmod 600`

Code reads `process.env.*` regardless of source.

If a secret is ever pasted into source or committed by mistake, treat it as leaked: revoke the App Password at <https://myaccount.google.com/apppasswords> and generate a new one. GitHub's secret scanning will also flag it automatically.

## Deployment notes

### Render / Railway / Fly.io / VPS

Deploys as-is. Build with `npm run build`, start with `npm start`. Set env vars in the platform dashboard.

### Vercel

Vercel runs each request as a serverless function rather than a long-running listener, so the current `app.listen(...)` setup in `src/index.ts` needs a small adapter: export the Express app, add an `api/index.ts` handler that re-exports it, and add a `vercel.json` rewrite. This is not currently wired up — add it before deploying to Vercel.

## Local development tips

- The dev server runs on `http://localhost:3000` by default.
- Use the `/health` endpoint as a quick liveness check before debugging mail issues.
- Real mail goes out for every successful `POST /api/contact` — for testing without sending, point `SMTP_USER` at an Ethereal account (<https://ethereal.email>) or comment out the `sendMail` call.
