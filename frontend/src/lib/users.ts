import { dbAccessorFetch } from "@/lib/db-accessor-client";
import type { User, UserWithPassword } from "@/types/user";

async function expectJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("Réponse inattendue du service db-accessor");
  }
  return (await response.json()) as T;
}

function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getUserByEmail(email: string): Promise<UserWithPassword | null> {
  const normalised = normaliseEmail(email);
  const response = await dbAccessorFetch(`/users?email=${encodeURIComponent(normalised)}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Impossible de récupérer l'utilisateur.");
  }

  return expectJson<UserWithPassword>(response);
}

export async function getUserById(id: string): Promise<User | null> {
  const response = await dbAccessorFetch(`/users/${encodeURIComponent(id)}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Impossible de récupérer l'utilisateur.");
  }

  return expectJson<User>(response);
}

interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const payload = {
    name: input.name.trim(),
    email: normaliseEmail(input.email),
    passwordHash: input.passwordHash,
  };

  const response = await dbAccessorFetch("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Impossible de créer l'utilisateur.");
  }

  return expectJson<User>(response);
}

export async function deleteUserSessions(userId: string) {
  const response = await dbAccessorFetch(`/users/${encodeURIComponent(userId)}/sessions`, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 404) {
    throw new Error("Impossible de révoquer les sessions de l'utilisateur.");
  }
}
