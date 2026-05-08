# Hi Tom Fleet — Things you need to do

This file contains everything that requires human action (credentials, external services, accounts) to get the app fully live. The code is complete and ready; you just need to wire up the services below.

---

## 1. Supabase project (backend + database)

**Create a project** at https://supabase.com/dashboard → New project.

After creation:
1. Go to **Project Settings → API** and copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
2. Create `apps/web/.env.local` from the template:
   ```
   cp apps/web/.env.local.example apps/web/.env.local
   # then fill in your URL and anon key
   ```

**Run all migrations** (from the Supabase project root):
```bash
cd nyp
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```
This applies every file in `supabase/migrations/` to your live database.

**Set up row-level security (RLS)**: All tables have `enable_row_level_security` in the migrations. Verify RLS is active in the Supabase dashboard under each table → Authentication → Row Level Security.

**Create a storage bucket** called `fault-photos`:
- Go to Storage → New bucket → name: `fault-photos`, public: OFF
- The bucket config is already in `supabase/config.toml`

---

## 2. Deploy Supabase Edge Functions

The two edge functions (`send-notification`, `admin-user`) need to be deployed:

```bash
cd nyp
supabase functions deploy send-notification
supabase functions deploy admin-user
```

**Set function secrets** (environment variables for the edge functions):

```bash
supabase secrets set SITE_URL=https://your-production-domain.com
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
supabase secrets set FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com"}'
```

The `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by Supabase into every edge function — you do not need to set those.

---

## 3. Set up DB webhooks (to trigger send-notification)

In Supabase dashboard → Database → Webhooks → Create:

| Webhook name | Table | Events | URL |
|---|---|---|---|
| on-fault-change | faults | INSERT, UPDATE | `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification` |
| on-pickup-change | pickup_schedules | INSERT, UPDATE | `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification` |
| on-chat-message | chat_messages | INSERT | `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification` |

For each webhook, add an **Authorization** header:
```
Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY
```

---

## 4. Firebase project (push notifications)

**Create a Firebase project** at https://console.firebase.google.com → Add project.

1. Add a **Web app** to the project
2. Enable **Firebase Cloud Messaging** (FCM)
3. Go to Project Settings → Service accounts → Generate new private key
   - This downloads a JSON file — this is `FIREBASE_SERVICE_ACCOUNT_JSON` (the secret you set in step 2 above)
4. Go to Project Settings → Cloud Messaging → Web configuration → Generate a VAPID key pair
   - Copy the **VAPID key** (public key)
5. Update `apps/web/public/firebase-messaging-sw.js` with your Firebase config:

```js
// Replace the placeholder config object in firebase-messaging-sw.js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

6. In `apps/web/src/context/AuthContext.tsx` (or wherever FCM is initialized in the frontend), set your VAPID key and Firebase config. Search the codebase for `VAPID_KEY` or `firebaseConfig` to find where to plug these in.

---

## 5. Resend account (transactional email)

**Create an account** at https://resend.com.

1. Add your sending domain (e.g., `hitomfleet.nl`) and verify DNS records
2. Create an **API key** with full access
3. Use this key as `RESEND_API_KEY` in step 2 above
4. The `from` address in `send-notification/index.ts` is currently `noreply@hitomfleet.nl` — update if your domain differs

---

## 6. Set up Supabase Auth

In Supabase dashboard → Authentication → Providers → Email:
- Enable email provider
- Confirm email: **OFF** (already set in `config.toml` for local; verify in dashboard for prod)

In Supabase dashboard → Authentication → URL Configuration:
- **Site URL**: `https://your-production-domain.com`
- **Redirect URLs**: add `https://your-production-domain.com/login`

**Create the first supervisor user manually** (you cannot invite yourself because the invite function requires an existing supervisor):
1. Supabase dashboard → Authentication → Users → Invite user
2. Set a password for the user
3. Manually insert a row in the `users` table:
   ```sql
   INSERT INTO users (id, full_name, role, location_id)
   VALUES ('<auth-user-uuid>', 'Jouw naam', 'supervisor', NULL);
   ```
   Use the UUID shown in the Authentication → Users list.

After that, the supervisor can invite all other users from the Admin → Users screen in the app.

---

## 7. Deploy the frontend

**Option A — Vercel (recommended, free tier works):**
1. Push this repo to GitHub
2. Go to https://vercel.com → New Project → Import your GitHub repo
3. Set build settings:
   - Framework: Vite
   - Root directory: `apps/web`
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add environment variables (from Project Settings → Environment Variables):
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_MOCK_MODE=false
   ```
5. Deploy → get your `.vercel.app` URL → add it as Site URL in Supabase and as `SITE_URL` in edge function secrets

**Option B — Netlify:**
1. Same as Vercel but in Netlify: New site → Import from Git
2. Base directory: `apps/web`, Build command: `npm run build`, Publish directory: `dist`
3. Set the same env vars in Site settings → Environment variables

**Option C — Self-hosted (nginx/Caddy):**
```bash
cd apps/web
npm install
npm run build
# Copy dist/ to your web server root
```

---

## 8. PWA icons (required for install prompt)

The manifest references `/icon-192.png` and `/icon-512.png` in `apps/web/public/`. These files do not exist yet — the install prompt will show but the app will be missing icons.

Create them:
1. Make a 512×512 PNG of the Hi Tom Fleet logo
2. Save as `apps/web/public/icon-512.png`
3. Resize to 192×192 → save as `apps/web/public/icon-192.png`
4. Create a 72×72 PNG for FCM badge → save as `apps/web/public/badge-72.png`

Online tool: https://favicon.io or https://realfavicongenerator.net

---

## 9. Run tests (after installing deps)

```bash
cd apps/web
npm install        # installs vitest added to package.json
npm test           # runs the unit test suite
```

---

## 10. Checklist summary

- [ ] Supabase project created
- [ ] `.env.local` filled in with URL + anon key
- [ ] `supabase db push` run (migrations applied)
- [ ] Storage bucket `fault-photos` created
- [ ] Edge functions deployed (`send-notification`, `admin-user`)
- [ ] Edge function secrets set (`SITE_URL`, `RESEND_API_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON`)
- [ ] DB webhooks configured (faults, pickup_schedules, chat_messages)
- [ ] Firebase project created + service account key downloaded
- [ ] `firebase-messaging-sw.js` updated with Firebase config
- [ ] VAPID key set in frontend FCM initialization
- [ ] Resend account created + domain verified + API key set
- [ ] Supabase Auth configured (Site URL, redirect URL)
- [ ] First supervisor user created manually
- [ ] Frontend deployed to Vercel/Netlify
- [ ] Production Site URL added to Supabase Auth and edge function secrets
- [ ] PWA icons created (icon-192.png, icon-512.png, badge-72.png)
- [ ] `npm install && npm test` passes
