import { db } from "./firebase";
import {
  doc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import type { User } from "firebase/auth";

const DEFAULT_ASSETS = ["BTC", "ETH", "USDT"] as const;

function makeReferralCode(uid: string) {
  return uid.slice(0, 8).toUpperCase();
}

export async function ensureUserDoc(user: User, extra?: { referredBy?: string | null }) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    avatarUrl: user.photoURL ?? null,
    phone: null,
    country: null,
    referralCode: makeReferralCode(user.uid),
    referredBy: extra?.referredBy ?? null,
    kycStatus: "unverified",
    twoFAEnabled: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await Promise.all(
    DEFAULT_ASSETS.map((asset) =>
      setDoc(doc(db, "users", user.uid, "balances", asset), {
        asset,
        free: 0,
        locked: 0,
        updatedAt: serverTimestamp(),
      })
    )
  );
}

export async function logActivity(
  uid: string,
  type: string,
  data: Record<string, any> = {}
) {
  await addDoc(collection(db, "users", uid, "activities"), {
    type,
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function logSession(uid: string) {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
  await addDoc(collection(db, "users", uid, "sessions"), {
    device: ua,
    lastSeen: serverTimestamp(),
    current: true,
  });
}
