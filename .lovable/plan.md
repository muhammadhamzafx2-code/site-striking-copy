## 1. Rebrand Exonax → XMV (full rename)

Sweep every route/component and replace brand strings:
- `src/components/Layout.tsx` — logo wordmark `EXONAX` → `XMV`, footer tagline.
- `src/routes/index.tsx` — page `<title>`, meta description, hero copy, FAQ answers, CTA, community handles (`@xmv_crypto`, `@xmv_exchange`, `@xmv_world`).
- `src/routes/{exchange,prices,buy-crypto,fees,vip,about-us,affiliate,referral,blog.index,blog.$slug,login,register,help.terms}.tsx` — every `head().meta` title/description, page copy, and any inline "Exonax" string.
- Footer copyright → `© {year} XMV. All rights reserved.`

After rename: `rg -i exonax` should return zero hits.

## 2. Firebase setup

Once you paste the config (apiKey, authDomain, projectId, appId, etc.), I'll:

- `bun add firebase`
- Create `src/lib/firebase.ts` exporting `app`, `auth`, `db`, `googleProvider`. Web API keys are public, so the config is hardcoded here — safe and standard for Firebase web.
- Create `src/hooks/useAuth.tsx` — a context provider wrapping `onAuthStateChanged`, exposing `user`, `loading`, `signOut`. Mounted in `src/routes/__root.tsx`.

## 3. Auth pages

**`src/routes/register.tsx`**
- Zod-validated form (email, password ≥8, optional referral code).
- `createUserWithEmailAndPassword` → on success: write `users/{uid}` doc `{ email, createdAt: serverTimestamp(), referralCode }` via Firestore `setDoc`.
- "Continue with Google" button → `signInWithPopup(googleProvider)` → upsert profile doc with `setDoc({...}, { merge: true })`.
- Redirect to `/` on success; toast errors with `sonner`.

**`src/routes/login.tsx`**
- Email/password via `signInWithEmailAndPassword` + Google button.
- "Forgot password?" link → `/forgot-password`.

**New `src/routes/forgot-password.tsx`**
- Email input → `sendPasswordResetEmail(auth, email, { url: window.location.origin + '/login' })`.
- Success toast: "Check your inbox."

(No separate reset page needed — Firebase hosts the reset form and redirects back to `/login`.)

## 4. Header auth state

In `src/components/Layout.tsx`:
- Read `user` from `useAuth()`.
- If signed in: replace Log In / Sign Up buttons with avatar initial + dropdown (`Account`, `Sign out`).
- If signed out: keep current buttons.

## 5. Newsletter capture (hero email form)

In `src/routes/index.tsx` `Hero`:
- Convert form to controlled input with zod email validation.
- On submit → `addDoc(collection(db, 'subscribers'), { email, createdAt: serverTimestamp() })`.
- Show sonner toast on success/error; clear input.

## 6. Firestore security rules (you paste into Firebase console)

I'll include the rules text in chat:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /subscribers/{doc} {
      allow create: if request.resource.data.keys().hasOnly(['email','createdAt'])
        && request.resource.data.email is string
        && request.resource.data.email.size() < 255;
      allow read, update, delete: if false;
    }
  }
}
```

Plus: in Firebase console enable **Email/Password** and **Google** providers, and add `localhost` + your Lovable preview/published domains to Authorized domains.

## What I need from you

Paste your Firebase web config object (the `firebaseConfig = { apiKey: "...", ... }` snippet from Project settings → Your apps → Web app). I'll wire everything up after that.
