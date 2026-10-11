# ZMusic

ZMusic is a static music-player website with serverless API handlers. It supports local development with Express and deployment to Vercel or Netlify.

## Deploy to Vercel

1. Upload this project to a GitHub repository.
2. Open Vercel and choose **Add New → Project**, then import the repository.
3. Keep the Root Directory as the project root. No build command is required; the site is static and API handlers are in `api/`.
4. Click **Deploy**.

`vercel.json` configures client-side routes such as `/play/...`, `/artist/...`, `/album/...` and `/playlist/...`. Files in `public/` are served as static assets; files in `api/` become Vercel Functions.

## Local development

```bash
npm install
npm run dev
```

## Netlify

The existing `netlify.toml`, `netlify/functions/`, and `netlify/edge-functions/` are retained for Netlify deployment.


## Open Graph preview (WhatsApp / Telegram)

- The OG tags are in `public/index.html` so they are present in the initial HTML response (not injected by client-side JavaScript).
- The preview image is `public/og-image.jpg` (1200 × 630) and is publicly served at `/og-image.jpg`.
- **Before sharing**, ensure `https://zmusic.zdv.web.id/` is the actual public HTTPS domain connected to this Vercel deployment. If you use a different domain, replace `https://zmusic.zdv.web.id/` in `public/index.html` with your real domain and redeploy.
- Test `https://YOUR-DOMAIN/og-image.jpg?v=2` in a private browser. It must show the banner without login. Then share the homepage URL (not the image URL).
- Messaging apps cache previews. To force a fresh fetch during testing, share a URL with a new query string, e.g. `https://YOUR-DOMAIN/?preview=3`. This helps testing but does not force every platform to clear an existing cached card.
- Preview rendering depends on each platform's crawler and cache; this configuration makes the metadata crawler-readable but cannot guarantee that every app displays a card in every chat.


## Banner dan OG thumbnail
- `public/banner.png` tetap menjadi banner yang tampil di dalam website.
- `public/og-image.jpg` adalah gambar terpisah khusus preview link (Open Graph) ketika URL dibagikan.

## Firebase Authentication, Firestore, devices and web push

This version adds Google sign-in through Firebase Authentication, a Firestore user profile, a per-account device management interface (up to five device records), and browser permission/token registration for Firebase Cloud Messaging. The existing music player and its local library are preserved. This source archive did not contain any JSONBin integration to remove.

### Firebase console setup

1. In **Authentication → Sign-in method**, enable Google.
2. In **Authentication → Settings → Authorized domains**, add the exact Vercel deployment domain (for example `your-project.vercel.app`) and any custom domain you use.
3. Publish the supplied `firestore.rules` in **Firestore Database → Rules**. Do not switch to public read/write rules.
4. In **Project settings → Cloud Messaging → Web Push certificates**, keep the VAPID public key configured in `public/firebase-auth.js` in sync with the project's key.

### Required Vercel environment variable for device management

The device API uses Firebase Admin SDK to verify Firebase ID tokens and enforce the five-device cap on the server. Create a Firebase service account for this project, download its JSON key, and add the **entire JSON object** as a Vercel environment variable named `FIREBASE_SERVICE_ACCOUNT_JSON` for Production and Preview as needed. Never put this service-account JSON in frontend files or commit it to Git. Redeploy after adding the variable. If the variable is absent, Google sign-in can still appear but device management will show a setup message.

### Deploy to Vercel

1. Push the contents of this folder to a GitHub repository (the `package.json`, `vercel.json`, `api/`, and `public/` folders must be at the repository root).
2. Import that repository at Vercel and deploy with the root directory set to this project. No build command is required.
3. Add `FIREBASE_SERVICE_ACCOUNT_JSON` in **Vercel → Project → Settings → Environment Variables**, then redeploy.
4. Add the deployed Vercel hostname in Firebase Authentication's authorized domains and test Google sign-in over HTTPS.

### Web push limitations

The site requests browser permission and registers an FCM token for the signed-in user. Browser/OS support and permission are required. The notification service worker displays messages delivered by FCM; a trusted backend using Firebase Admin SDK must send those messages. iOS web push also requires a compatible installed web app and supported OS/browser version. A notification cannot be guaranteed when the user disables notifications, the browser/OS blocks delivery, or the device is offline for too long.
