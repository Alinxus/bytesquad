import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";
import type { AppBindings } from "../bindings";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 16);
const encoder = new TextEncoder();

export const makeId = (prefix: string) => `${prefix}_${nanoid()}`;

export const nowIso = () => new Date().toISOString();

export const addMinutes = (value: string, minutes: number) =>
  new Date(new Date(value).getTime() + minutes * 60_000).toISOString();

export const addDays = (value: string, days: number) =>
  new Date(new Date(value).getTime() + days * 24 * 60 * 60_000).toISOString();

export const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const hashPassword = async (password: string) => bcrypt.hash(password, 10);

export const verifyPassword = async (password: string, hash: string) => bcrypt.compare(password, hash);

export const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const importHmacKey = (secret: string) =>
  crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign", "verify"],
  );

export const signHmacHex = async (payload: string, secret: string) => {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const getJwtSecret = (secret: string | undefined, fallback: string) =>
  encoder.encode(secret || fallback);

export const signAccessToken = async (bindings: AppBindings, userId: string, workspaceId: string) => {
  const ttl = Number(bindings.ACCESS_TOKEN_TTL_MINUTES ?? 15);
  const now = Math.floor(Date.now() / 1000);
  const exp = now + ttl * 60;
  const token = await new SignJWT({ sub: userId, workspaceId, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(getJwtSecret(bindings.JWT_SECRET, "nera-dev-jwt-secret"));

  return {
    token,
    expiresAt: new Date(exp * 1000).toISOString(),
  };
};

export const signRefreshToken = async (bindings: AppBindings, userId: string, workspaceId: string) => {
  const ttlDays = Number(bindings.REFRESH_TOKEN_TTL_DAYS ?? 30);
  const now = Math.floor(Date.now() / 1000);
  const exp = now + ttlDays * 24 * 60 * 60;
  const token = await new SignJWT({ sub: userId, workspaceId, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(getJwtSecret(bindings.REFRESH_TOKEN_SECRET, "nera-dev-refresh-secret"));

  return {
    token,
    expiresAt: new Date(exp * 1000).toISOString(),
  };
};

export const verifyAccessToken = async (bindings: AppBindings, token: string) => {
  const result = await jwtVerify(token, getJwtSecret(bindings.JWT_SECRET, "nera-dev-jwt-secret"));
  if (result.payload.type !== "access") {
    throw new Error("Invalid access token type.");
  }
  return result.payload;
};

export const verifyRefreshToken = async (bindings: AppBindings, token: string) => {
  const result = await jwtVerify(token, getJwtSecret(bindings.REFRESH_TOKEN_SECRET, "nera-dev-refresh-secret"));
  if (result.payload.type !== "refresh") {
    throw new Error("Invalid refresh token type.");
  }
  return result.payload;
};

const base64ToBytes = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
const bytesToBase64 = (value: Uint8Array) => btoa(String.fromCharCode(...value));

const importAesKey = (keyText: string) => {
  const keyBytes = encoder.encode(keyText.padEnd(32, "0").slice(0, 32));
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
};

export const encryptValue = async (bindings: AppBindings, value: string) => {
  const secret = bindings.DATA_ENCRYPTION_KEY ?? "nera-local-encryption-key";
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importAesKey(secret);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(value));
  return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`;
};

export const decryptValue = async (bindings: AppBindings, value: string) => {
  const [ivPart, cipherPart] = value.split(".");
  const secret = bindings.DATA_ENCRYPTION_KEY ?? "nera-local-encryption-key";
  const key = await importAesKey(secret);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(ivPart) },
    key,
    base64ToBytes(cipherPart),
  );
  return new TextDecoder().decode(decrypted);
};
