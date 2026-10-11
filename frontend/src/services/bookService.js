const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.category) params.set("category", filters.category);

  const query = params.toString();
  return request(`/books${query ? `?${query}` : ""}`);
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
