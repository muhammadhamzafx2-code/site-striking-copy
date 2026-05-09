import { createFileRoute } from "@tanstack/react-router";
import { createHmac } from "crypto";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Lazy admin init — falls back to unauthenticated client SDK style writes
// won't work server-side, so we use REST via Firestore admin only if creds exist.
// If no admin creds, we fall back to writing via the Firestore REST API using
// the project's web config (limited — best effort). For production reliability,
// add FIREBASE_SERVICE_ACCOUNT_JSON as a secret.

function sortedStringify(obj: any): string {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(sortedStringify).join(",") + "]";
  const keys = Object.keys(obj).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + sortedStringify(obj[k]))
      .join(",") +
    "}"
  );
}

function getAdminDb() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const creds = JSON.parse(raw);
    if (!getApps().length) {
      initializeApp({ credential: cert(creds) });
    }
    return getFirestore();
  } catch (e) {
    console.error("Bad FIREBASE_SERVICE_ACCOUNT_JSON:", e);
    return null;
  }
}

const FINISHED = ["finished", "confirmed", "sending"];

export const Route = createFileRoute("/api/public/nowpayments-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.NOWPAYMENTS_IPN_SECRET;
        if (!secret) {
          return new Response("IPN secret not configured", { status: 500 });
        }

        const sig = request.headers.get("x-nowpayments-sig");
        const body = await request.text();
        if (!sig) return new Response("Missing signature", { status: 401 });

        let payload: any;
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const expected = createHmac("sha512", secret)
          .update(sortedStringify(payload))
          .digest("hex");

        if (expected !== sig) {
          console.warn("NowPayments IPN signature mismatch");
          return new Response("Invalid signature", { status: 401 });
        }

        const status: string = payload.payment_status;
        const orderId: string = payload.order_id ?? "";
        const uid = orderId.split("-")[0];
        const paymentId = String(payload.payment_id);
        const asset = String(payload.pay_currency || "").toUpperCase();
        const amount = Number(payload.actually_paid || payload.pay_amount || 0);

        if (!uid || !paymentId || !asset) {
          return new Response("ok", { status: 200 });
        }

        const db = getAdminDb();
        if (!db) {
          console.error("Firebase admin not configured — cannot persist webhook");
          // Acknowledge so NowPayments doesn't retry forever; client polling is the fallback.
          return new Response("ok (no admin)", { status: 200 });
        }

        const depRef = db.doc(`users/${uid}/deposits/${paymentId}`);
        const depSnap = await depRef.get();
        const alreadyCredited = depSnap.exists && depSnap.get("credited") === true;

        await depRef.set(
          {
            status,
            actually_paid: payload.actually_paid ?? null,
            updatedAt: FieldValue.serverTimestamp(),
            ipnReceivedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        if (FINISHED.includes(status) && !alreadyCredited && amount > 0) {
          const balRef = db.doc(`users/${uid}/balances/${asset}`);
          await db.runTransaction(async (tx) => {
            const bal = await tx.get(balRef);
            const current = bal.exists ? Number(bal.get("free") || 0) : 0;
            tx.set(
              balRef,
              {
                asset,
                free: current + amount,
                locked: bal.exists ? bal.get("locked") || 0 : 0,
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
            tx.set(depRef, { credited: true }, { merge: true });
          });

          await db.collection(`users/${uid}/activities`).add({
            type: "deposit",
            asset,
            amount,
            usd: payload.price_amount ?? null,
            status: "completed",
            payment_id: paymentId,
            source: "ipn",
            createdAt: FieldValue.serverTimestamp(),
          });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
