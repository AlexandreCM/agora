import { randomBytes, scrypt as nodeScrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";

import { getDb } from "@/lib/mongodb";
import { getUserById, deleteUserSessions } from "@/lib/users";
import type { User } from "@/types/user";

const scrypt = promisify(nodeScrypt);

const SESSION_COOKIE_NAME = "agora_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface SessionDocument {
  _id?: string;
  tokenHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
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

function createSessionToken() {
  const token = randomBytes(48).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  return { token, tokenHash, expiresAt };
}

export async function createUserSession(userId: string) {
  const db = await getDb();
  const collection = db.collection<SessionDocument>("sessions");
  const { token, tokenHash, expiresAt } = createSessionToken();

  const session: SessionDocument = {
    tokenHash,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  await collection.insertOne(session);

  return { token, expiresAt };
}

export async function removeSessionByToken(token: string) {
  const db = await getDb();
  const collection = db.collection<SessionDocument>("sessions");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  await collection.deleteOne({ tokenHash });
}

export async function getCurrentUser(): Promise<User | null> {
  const sessionCookie = cookies().get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  const db = await getDb();
  const collection = db.collection<SessionDocument>("sessions");
  const tokenHash = createHash("sha256").update(sessionCookie.value).digest("hex");

  const session = await collection.findOne({ tokenHash });

  if (!session) {
    cookies().delete(SESSION_COOKIE_NAME);
    return null;
  }

  const isExpired = new Date(session.expiresAt).getTime() < Date.now();

  if (isExpired) {
    await collection.deleteOne({ tokenHash });
    cookies().delete(SESSION_COOKIE_NAME);
    return null;
  }

  const user = await getUserById(session.userId);

  if (!user) {
    await collection.deleteOne({ tokenHash });
    cookies().delete(SESSION_COOKIE_NAME);
    return null;
  }

  return user;
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
