import { useEffect, useState } from "react";
import BookCard from "./BookCard";
import { getBooks } from "../services/bookService";

function BookCatalogue({ canEdit = false, refreshKey = 0, onEdit }) {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: "", category: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getBooks(filters)
      .then((result) => {
        if (!active) return;
        const fetched = result.books || [];
        setBooks(fetched);
        if (fetched.length > 0) {
          setCategories((prev) => {
            const combined = new Set([...prev, ...fetched.map((b) => b.category).filter(Boolean)]);
            return [...combined].sort();
          });
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters, refreshKey]);

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function clearFilters() {
    setFilters({ search: "", category: "" });
  }

  return (
    <section className="catalogue" aria-labelledby="catalogue-title">
      <div className="catalogue-heading">
        <div>
          <h2 id="catalogue-title">Book catalogue</h2>
          <p>Browse the library collection.</p>
        </div>
        <span className="book-count">
          {books.length} {books.length === 1 ? "book" : "books"}
        </span>
      </div>
      <div className="filters" aria-label="Book filters">
        <label className="search-field">
          Search
          <input
            name="search"
            value={filters.search}
            onChange={updateFilter}
            placeholder="Title, author, or ISBN"
          />
        </label>
        <label>
          Category
          <select name="category" value={filters.category} onChange={updateFilter}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="secondary-button"
          onClick={clearFilters}
          disabled={!filters.search && !filters.category}
        >
          Clear
        </button>
      </div>
      {loading && <p className="message">Loading books...</p>}
      {!loading && error && <p className="error-message">Unable to load books: {error}</p>}
      {!loading && !error && books.length === 0 && (
        <p className="message">No books match your search.</p>
      )}
      {!loading && !error && books.length > 0 && (
        <div className="book-grid">
          {books.map((book) => (
            <BookCard
              key={book._id}
              book={book}
              onEdit={canEdit ? onEdit : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default BookCatalogue;
