import { ObjectId } from "mongodb";

import { getDb } from "@/lib/mongodb";
import type { User, UserWithPassword } from "@/types/user";

interface UserDocument {
  _id?: string | ObjectId;
  id?: string;
  name?: string;
  email?: string;
  passwordHash?: string;
  createdAt?: string;
}

const COLLECTION_NAME = "users";

function mapUser(document: UserDocument): User {
  const idSource = document.id ?? document._id ?? "";
  const id = idSource instanceof ObjectId ? idSource.toHexString() : String(idSource);
  const createdAtDate = document.createdAt ? new Date(document.createdAt) : new Date();
  const createdAt = Number.isNaN(createdAtDate.getTime())
    ? new Date().toISOString()
    : createdAtDate.toISOString();

  return {
    id,
    name: document.name ? String(document.name) : "",
    email: document.email ? String(document.email).toLowerCase() : "",
    createdAt,
  };
}

function mapUserWithPassword(document: UserDocument): UserWithPassword {
  const user = mapUser(document);
  const passwordHash = document.passwordHash ? String(document.passwordHash) : "";

  return {
    ...user,
    passwordHash,
  };
}

export async function getUserCollection() {
  const db = await getDb();
  return db.collection<UserDocument>(COLLECTION_NAME);
}

export async function getUserByEmail(email: string): Promise<UserWithPassword | null> {
  const collection = await getUserCollection();
  const document = await collection.findOne({ email: email.toLowerCase() });
  return document ? mapUserWithPassword(document) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const collection = await getUserCollection();
  const filters: Record<string, unknown>[] = [{ id }];

  if (ObjectId.isValid(id)) {
    filters.push({ _id: new ObjectId(id) });
  }

  const document = await collection.findOne({ $or: filters });
  return document ? mapUser(document) : null;
}

interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const collection = await getUserCollection();

  const now = new Date().toISOString();
  const user: UserWithPassword = {
    id: new ObjectId().toHexString(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    passwordHash: input.passwordHash,
    createdAt: now,
  };

  await collection.insertOne({
    ...user,
    _id: new ObjectId(user.id),
  });

  return mapUser(user);
}

export async function deleteUserSessions(userId: string) {
  const db = await getDb();
  await db.collection("sessions").deleteMany({ userId });
}
