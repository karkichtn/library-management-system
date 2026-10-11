const rawApiUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:5000/api";
const API_URL = rawApiUrl.replace(/\/+$/, "");

async function request(path, options = {}) {
  const headers = { ...options.headers };
  if (options.body) {
    headers["Content-Type"] = "application/json";
  }
  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export function registerUser(formData) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(formData)
  });
}

export function loginUser(formData) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(formData)
  });
}

export function getCurrentUser() {
  return request("/auth/me");
}
