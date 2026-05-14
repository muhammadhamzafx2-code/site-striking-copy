import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

// ---------- Google service-account JWT (Web Crypto) ----------
function b64url(buf: ArrayBuffer | Uint8Array | string): string {
  const bytes =
    typeof buf === "string"
      ? new TextEncoder().encode(buf)
      : buf instanceof Uint8Array
        ? buf
        : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

let cachedToken: { token: string; exp: number } | null = null;

async function getAccessToken(creds: {
  client_email: string;
  private_key: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.token;
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(creds.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${b64url(sig)}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const json = (await res.json()) as { access_token: string; expires_in: number };
  if (!json.access_token) throw new Error("Failed to mint Google access token");
  cachedToken = { token: json.access_token, exp: now + json.expires_in };
  return json.access_token;
}

// ---------- Firestore REST helpers ----------
type FsValue = any;
function toFsValue(v: any): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number")
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "string") return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFsValue) } };
  if (typeof v === "object")
    return {
      mapValue: {
        fields: Object.fromEntries(Object.entries(v).map(([k, val]) => [k, toFsValue(val)])),
      },
    };
  return { stringValue: String(v) };
}
function fromFsValue(v: FsValue): any {
  if (!v) return null;
  if ("nullValue" in v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("arrayValue" in v) return (v.arrayValue.values ?? []).map(fromFsValue);
  if ("mapValue" in v) {
    const out: any = {};
    for (const [k, val] of Object.entries(v.mapValue.fields ?? {})) out[k] = fromFsValue(val);
    return out;
  }
  return null;
}
function fieldsToObj(fields: Record<string, FsValue> | undefined) {
  if (!fields) return {};
  const out: any = {};
  for (const [k, v] of Object.entries(fields)) out[k] = fromFsValue(v);
  return out;
}
function objToFields(obj: Record<string, any>) {
  const out: Record<string, FsValue> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = toFsValue(v);
  return out;
}
async function fsGet(projectId: string, token: string, path: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Firestore GET ${path} ${r.status}`);
  const json = (await r.json()) as { fields?: Record<string, FsValue> };
  return fieldsToObj(json.fields);
}
async function fsPatch(
  projectId: string,
  token: string,
  path: string,
  data: Record<string, any>,
) {
  const fieldPaths = Object.keys(data)
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join("&");
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}?${fieldPaths}`;
  const r = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: objToFields(data) }),
  });
  if (!r.ok) throw new Error(`Firestore PATCH ${path} ${r.status}`);
}
async function fsCreate(
  projectId: string,
  token: string,
  collectionPath: string,
  data: Record<string, any>,
) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: objToFields(data) }),
  });
  if (!r.ok) throw new Error(`Firestore CREATE ${collectionPath} ${r.status}`);
}

// ---------- Signature verification ----------
function safeEqualHex(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

function verifySignature(body: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  // header may be raw hex, "sha256=...", or "t=...,v1=..."
  if (header === expected) return true;
  if (safeEqualHex(header.replace(/^sha256=/, ""), expected)) return true;
  for (const part of header.split(",")) {
    const [, val] = part.split("=");
    if (val && safeEqualHex(val, expected)) return true;
  }
  return false;
}

// ---------- Route ----------
export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = url.searchParams.get("env") === "live" ? "live" : "sandbox";
        const secret =
          env === "live"
            ? process.env.PAYMENTS_LIVE_WEBHOOK_SECRET
            : process.env.PAYMENTS_SANDBOX_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook secret missing", { status: 500 });

        const body = await request.text();
        const sig =
          request.headers.get("x-webhook-signature") ??
          request.headers.get("stripe-signature") ??
          request.headers.get("x-signature");

        if (!verifySignature(body, sig, secret)) {
          console.warn("Payments webhook bad signature", { env, sig });
          return new Response("Invalid signature", { status: 401 });
        }

        let event: any;
        try {
          event = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        // Normalize: support both Lovable-managed events (e.g. transaction.completed)
        // and raw Stripe events (checkout.session.completed).
        const type: string = event.type ?? "";
        const data: any =
          event.data?.object ?? event.data ?? event.transaction ?? event.object ?? event;
        const meta: Record<string, string> = data?.metadata ?? {};

        if (
          type === "transaction.completed" ||
          type === "checkout.session.completed" ||
          type === "payment_intent.succeeded"
        ) {
          const uid = meta.uid;
          const symbol = meta.coin;
          const coinAmount = Number(meta.coin_amount || 0);
          const usdAmount = Number(meta.usd_amount || 0);
          const sessionId: string =
            data.id ?? data.session_id ?? data.payment_id ?? event.id ?? "";

          if (uid && symbol && coinAmount > 0) {
            const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
            if (!saRaw) {
              console.error("FIREBASE_SERVICE_ACCOUNT_JSON missing");
              return new Response("ok (no admin)", { status: 200 });
            }
            let creds: { client_email: string; private_key: string; project_id: string };
            try {
              creds = JSON.parse(saRaw);
            } catch {
              return new Response("ok (bad creds)", { status: 200 });
            }
            const token = await getAccessToken(creds);
            const projectId = creds.project_id;

            const depPath = `users/${uid}/deposits/${sessionId}`;
            const dep = await fsGet(projectId, token, depPath);
            if (dep?.credited === true) return new Response("ok", { status: 200 });

            const balPath = `users/${uid}/balances/${symbol}`;
            const bal = await fsGet(projectId, token, balPath);
            const current = Number(bal?.free ?? 0);
            await fsPatch(projectId, token, balPath, {
              asset: symbol,
              free: current + coinAmount,
              locked: Number(bal?.locked ?? 0),
              updatedAt: new Date().toISOString(),
            });
            await fsPatch(projectId, token, depPath, {
              status: "completed",
              credited: true,
              method: "card",
              asset: symbol,
              amount: coinAmount,
              usd: usdAmount,
              session_id: sessionId,
              updatedAt: new Date().toISOString(),
            });
            await fsCreate(projectId, token, `users/${uid}/activities`, {
              type: "deposit",
              asset: symbol,
              amount: coinAmount,
              usd: usdAmount,
              status: "completed",
              payment_id: sessionId,
              source: "card",
              createdAt: new Date().toISOString(),
            });
          }
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
