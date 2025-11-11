const DEFAULT_BASE_URL = "http://localhost:8080";

function getBaseUrl() {
  return process.env.DB_ACCESSOR_API_URL?.replace(/\/$/, "") ?? DEFAULT_BASE_URL;
}

function buildUrl(path: string) {
  const baseUrl = getBaseUrl();
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith("/")) {
    return `${baseUrl}${path}`;
  }
  return `${baseUrl}/${path}`;
}

export interface DbAccessorRequestOptions extends RequestInit {
  skipJsonContentType?: boolean;
}

export async function dbAccessorFetch(
  path: string,
  { skipJsonContentType = false, ...init }: DbAccessorRequestOptions = {},
): Promise<Response> {
  const headers = new Headers(init.headers ?? {});

  if (!skipJsonContentType && init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (!headers.has("accept")) {
    headers.set("accept", "application/json");
  }

  const response = await fetch(buildUrl(path), {
    cache: "no-store",
    ...init,
    headers,
  });

  return response;
}
