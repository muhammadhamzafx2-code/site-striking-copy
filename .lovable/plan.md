## Goal

Port the protected pages from `muhammadhamzafx2-code/xmvwallet` into our TanStack Start app, gate them behind Firebase Auth, and back them with per-user data in Firestore so every user has their own balances, activities, sessions, etc.

## What's in the GitHub repo

Static HTML/CSS/JS (Exonax dashboard). New pages to add (others like exchange/fees/vip/affiliate/referral/terms are already in our app):

- `wallets.html` → balances per coin, deposit/withdraw
- `profile.html` → name, email, phone, country, avatar
- `activities.html` → transaction/login activity log
- `sessions.html` → active login sessions
- `verification.html` → KYC submission state
- `2fa.html` → enable/disable 2FA (TOTP)
- `password.html` → change password
- `referrals.html` → user's referral code, invitees, earnings

Styling will be redone in our existing Tailwind/shadcn design system (XMV brand) — we're not copying the raw Exonax CSS. Layout/sections come from the HTML as reference.

## Plan

### 1. Route protection

- Create `src/routes/_authenticated.tsx` — pathless layout. `beforeLoad` waits for `useAuth` state via a small auth-state helper, redirects to `/login?redirect=...` if no user.
- Update `src/routes/login.tsx` to honor `?redirect=` and bounce back after sign-in.
- Add an "Account" sidebar layout under `_authenticated` (`src/routes/_authenticated/account.tsx`) with nav links to all dashboard pages, rendered around `<Outlet />`.

### 2. Protected route files

Create:

```
src/routes/_authenticated/
  wallets.tsx
  account.tsx              (sidebar layout)
  account.profile.tsx
  account.activities.tsx
  account.sessions.tsx
  account.verification.tsx
  account.2fa.tsx
  account.password.tsx
  account.referrals.tsx
```

Update header dropdown (`src/components/Layout.tsx`) to link to `/wallets` and `/account/profile`.

### 3. Firestore data model

All under `users/{uid}`:

```
users/{uid}                       { email, displayName, phone, country, avatarUrl,
                                     referralCode, referredBy, kycStatus, twoFAEnabled,
                                     createdAt, updatedAt }
users/{uid}/balances/{asset}      { asset, free, locked, updatedAt }      // BTC, ETH, USDT...
users/{uid}/activities/{id}       { type, amount, asset, status, ip, createdAt }
users/{uid}/sessions/{id}         { device, ip, location, lastSeen, current }
users/{uid}/verification/current  { level, idType, idNumber, status, submittedAt }
users/{uid}/referrals/{inviteeUid}{ inviteeEmail, joinedAt, earnings }
```

- On signup, seed `users/{uid}` plus zero-balance docs for BTC/ETH/USDT.
- On login, write a session doc and an `activities` "login" entry.

### 4. Page behavior

- **Wallets**: live `onSnapshot` of `balances` subcollection; "Deposit" shows generated address (mock per asset), "Withdraw" form writes a pending activity.
- **Profile**: form bound to `users/{uid}`, `updateDoc` on save; avatar upload to Firebase Storage `avatars/{uid}`.
- **Activities**: paginated `query(orderBy createdAt desc, limit 25)`.
- **Sessions**: list current sessions; "Revoke" deletes doc (and signs out if it's the current session).
- **Verification**: form to upload ID image to Storage `kyc/{uid}/`, sets `verification/current.status = 'pending'`.
- **2FA**: toggle flag + show TOTP secret/QR (using `otpauth` lib, secret stored in user doc — OK for now, no server).
- **Password**: `updatePassword(auth.currentUser, newPassword)` with re-auth via `reauthenticateWithCredential`.
- **Referrals**: show `referralCode`, list of invitees from `referrals` subcollection.

### 5. Firestore security rules (you paste in console)

```
rules_version='2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /{sub=**} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
    match /subscribers/{doc} {
      allow create: if request.resource.data.keys().hasOnly(['email','createdAt']);
      allow read, update, delete: if false;
    }
  }
}
```

Storage rules: only the owning user can read/write `avatars/{uid}/*` and `kyc/{uid}/*`.

### 6. New deps

- `firebase/storage` (already part of installed `firebase` SDK — just import)
- `otpauth` for 2FA TOTP generation
- `qrcode.react` to render the 2FA QR

### 7. Out of scope (call out to user)

- Real custodial balances / on-chain deposits — balances are app-level numbers in Firestore, not real crypto. Same for "deposit addresses".
- True session enforcement (revoking a Firebase session from another device requires a token-revocation backend; we'll mark them inactive in Firestore as a UX-level approximation).
- KYC verification approval workflow (no admin panel yet).

## What I need from you to proceed

Confirm the scope above, and especially:

1. OK that balances/deposits are simulated app numbers (not real crypto)?
2. OK that 2FA secret is stored in the user's Firestore doc (no server)?
3. Want me to also enable Firebase Storage now (for avatar + KYC uploads)?
