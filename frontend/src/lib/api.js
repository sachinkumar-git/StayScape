let csrfToken = "";

export function setCsrfToken(token) {
  csrfToken = token;
}

class ApiError extends Error {
  constructor(status, data) {
    super(data?.error || "Something went wrong on our side. Please try again.");
    this.status = status;
    this.errors = data?.errors || {};
  }
}

export async function api(path, { method = "GET", body, form } = {}) {
  const headers = { Accept: "application/json" };
  if (method !== "GET") headers["X-CSRF-Token"] = csrfToken;

  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const response = await fetch(`/api${path}`, { method, headers, body: payload, credentials: "same-origin" });
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;
  if (!response.ok) throw new ApiError(response.status, data);
  return data;
}
