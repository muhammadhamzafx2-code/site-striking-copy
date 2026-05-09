import { createFileRoute } from "@tanstack/react-router";
import { createHmac } from "crypto";

const FINISHED = ["finished", "confirmed", "sending"];

// ---------- NowPayments signature ----------
function sortedStringify(obj: any): string {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(sortedStringify).join(",") + "]";
  const keys = Object.keys(obj).sort();
  return (
    "{" +
    keys.map((k) => JSON.stringify(k) + ":" + sortedStringify(obj[k])).join(",") +
    "}"
  );
}

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
  if (Array.isArray(v))
    return { arrayValue: { values: v.map(toFsValue) } };
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
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values ?? []).map(fromFsValue);
  if ("mapValue" in v) {
    const out: any = {};
    for (const [k, val] of Object.entries(v.mapValue.fields ?? {})) out[k] = fromFsValue(val);
    return out;
  }
  return null;
}

function fieldsToObj(fields: Record<string, FsValue> | undefined): any {
  if (!fields) return {};
  const out: any = {};
  for (const [k, v] of Object.entries(fields)) out[k] = fromFsValue(v);
  return out;
}

function objToFields(obj: Record<string, any>): Record<string, FsValue> {
  const out: Record<string, FsValue> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = toFsValue(v);
  return out;
}

async function fsGet(projectId: string, token: string, path: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Firestore GET ${path} ${r.status}: ${await r.text()}`);
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
  if (!r.ok) throw new Error(`Firestore PATCH ${path} ${r.status}: ${await r.text()}`);
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
  if (!r.ok) throw new Error(`Firestore CREATE ${collectionPath} ${r.status}: ${await r.text()}`);
}

// ---------- Route ----------
export const Route = createFileRoute("/api/public/nowpayments-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.NOWPAYMENTS_IPN_SECRET;
        if (!secret) return new Response("IPN secret not configured", { status: 500 });

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
        if (!uid || !paymentId || !asset) return new Response("ok", { status: 200 });

        const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (!saRaw) {
          console.error("FIREBASE_SERVICE_ACCOUNT_JSON missing — IPN ack only");
          return new Response("ok (no admin)", { status: 200 });
        }
        let creds: { client_email: string; private_key: string; project_id: string };
        try {
          creds = JSON.parse(saRaw);
        } catch {
          console.error("Bad FIREBASE_SERVICE_ACCOUNT_JSON");
          return new Response("ok (bad creds)", { status: 200 });
        }

        const token = await getAccessToken(creds);
        const projectId = creds.project_id;

        const depPath = `users/${uid}/deposits/${paymentId}`;
        const dep = await fsGet(projectId, token, depPath);
        const alreadyCredited = dep?.credited === true;

        await fsPatch(projectId, token, depPath, {
          status,
          actually_paid: payload.actually_paid ?? null,
          ipnReceivedAt: new Date().toISOString(),
        });

        if (FINISHED.includes(status) && !alreadyCredited && amount > 0) {
          const balPath = `users/${uid}/balances/${asset}`;
          const bal = await fsGet(projectId, token, balPath);
          const current = Number(bal?.free ?? 0);
          await fsPatch(projectId, token, balPath, {
            asset,
            free: current + amount,
            locked: Number(bal?.locked ?? 0),
            updatedAt: new Date().toISOString(),
          });
          await fsPatch(projectId, token, depPath, { credited: true });
          await fsCreate(projectId, token, `users/${uid}/activities`, {
            type: "deposit",
            asset,
            amount,
            usd: payload.price_amount ?? null,
            status: "completed",
            payment_id: paymentId,
            source: "ipn",
            createdAt: new Date().toISOString(),
          });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
