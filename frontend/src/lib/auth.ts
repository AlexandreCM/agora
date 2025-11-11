import { randomBytes, scrypt as nodeScrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";

import { dbAccessorFetch } from "@/lib/db-accessor-client";
import { deleteUserSessions } from "@/lib/users";
import type { User } from "@/types/user";

const scrypt = promisify(nodeScrypt);

const SESSION_COOKIE_NAME = "agora_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface SessionCreationResult {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

function expectJsonContent<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error("Réponse inattendue du service db-accessor");
  }

  return response.json() as Promise<T>;
}

function encodePasswordHash(salt: Buffer, derivedKey: Buffer): string {
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return encodePasswordHash(salt, derivedKey);
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(":");

  if (!saltHex || !hashHex) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const storedKey = Buffer.from(hashHex, "hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

  return timingSafeEqual(storedKey, derivedKey);
}

function createSessionToken(): SessionCreationResult {
  const token = randomBytes(48).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  return { token, tokenHash, expiresAt };
}

export async function createUserSession(userId: string) {
  const { token, tokenHash, expiresAt } = createSessionToken();

  const response = await dbAccessorFetch("/sessions", {
    method: "POST",
    body: JSON.stringify({
      userId,
      tokenHash,
      expiresAt: expiresAt.toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error("Impossible de créer la session utilisateur.");
  }

  return { token, expiresAt };
}

export async function removeSessionByToken(token: string) {
  const tokenHash = createHash("sha256").update(token).digest("hex");

  await dbAccessorFetch(`/sessions/${tokenHash}`, {
    method: "DELETE",
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const sessionCookie = cookies().get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  const tokenHash = createHash("sha256").update(sessionCookie.value).digest("hex");

  const response = await dbAccessorFetch("/sessions/validate", {
    method: "POST",
    body: JSON.stringify({ tokenHash }),
  });

  if (response.status === 404) {
    clearSessionCookie();
    return null;
  }

  if (!response.ok) {
    throw new Error("Impossible de valider la session utilisateur.");
  }

  return expectJsonContent<User>(response);
}

export function setSessionCookie(token: string, expiresAt: Date) {
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE_NAME);
}

export async function resetUserSessions(userId: string) {
  await deleteUserSessions(userId);
}
