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

export function getBooks(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search && typeof filters.search === "string" && filters.search.trim()) {
    params.set("search", filters.search.trim());
  }
  if (filters.category && typeof filters.category === "string" && filters.category.trim()) {
    params.set("category", filters.category.trim());
  }
  if (filters.available !== undefined && filters.available !== "") {
    params.set("available", String(filters.available));
  }
  const query = params.toString();
  return request(`/books${query ? `?${query}` : ""}`);
}

export function getBookById(id) {
  return request(`/books/${id}`);
}

export function createBook(book) {
  return request("/books", {
    method: "POST",
    body: JSON.stringify(book)
  });
}

export function updateBook(id, book) {
  return request(`/books/${id}`, {
    method: "PUT",
    body: JSON.stringify(book)
  });
}
