const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:5000/api";

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

export function getAllIssues(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return request(`/issues/all${query}`);
}

export function getMyBorrowedBooks() {
  return request("/issues/my-borrowed");
}

export function issueBook(payload) {
  return request("/issues/issue", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function returnBook(issueId) {
  return request(`/issues/return/${encodeURIComponent(issueId)}`, {
    method: "POST"
  });
}

export function getBooks() {
  return request("/books");
}
