# Add Apple Sign-In (Firebase)

This app uses Firebase Auth (not Lovable Cloud auth), so Apple sign-in will be wired through Firebase's `OAuthProvider("apple.com")` — the same pattern as the existing Google button.

## Changes

### 1. `src/lib/firebase.ts`
Export an Apple provider alongside the existing Google one:
```ts
import { OAuthProvider } from "firebase/auth";
export const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");
```

### 2. `src/routes/login.tsx`
- Add `onApple` handler mirroring `onGoogle` (uses `signInWithPopup(auth, appleProvider)`, then `ensureUserDoc`, `after(uid)`).
- Add an "Continue with Apple" button below the Google button (black bg, Apple logo SVG).

### 3. `src/routes/register.tsx`
- Same Apple button + handler as login (sign-up via Apple is the same popup call).

### 4. `src/routes/index.tsx` (Hero)
- Next to the round Google button (shown only when logged out), add a matching round Apple button that calls the same flow then navigates to `/wallets`.

## Firebase Console setup (user action required)
For the button to actually work, Apple must be enabled in the Firebase project:
1. Firebase Console → Authentication → Sign-in method → **Apple** → Enable.
2. In Apple Developer: create a Services ID, enable Sign In with Apple, add Firebase's OAuth callback URL (`https://wallet-db538.firebaseapp.com/__/auth/handler`) as the Return URL, create a Key (.p8) with Sign In with Apple, note Team ID + Key ID.
3. Paste Services ID, Team ID, Key ID, and private key into Firebase's Apple provider config.
4. Add the production domain (e.g. `xmvwallet.lovable.app`) under Authentication → Settings → Authorized domains (lovable.app subdomains usually pre-authorized).

No app rebuild needed after console changes — button works as soon as the provider is enabled.

## Notes
- Works on any browser (not iPhone-only), but iOS users get the native Apple sheet.
- Apple only returns the user's name on the **first** sign-in; `ensureUserDoc` already handles missing display names.
- No DB schema changes; Firestore user docs are keyed by `uid` regardless of provider.
