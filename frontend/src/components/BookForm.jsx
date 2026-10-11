import { useEffect, useState } from "react";

const emptyBook = {
  title: "",
  author: "",
  isbn: "",
  category: "",
  publicationYear: "",
  totalCopies: "",
  availableCopies: ""
};

function BookForm({ book, onSubmit, onCancel, saving, serverError }) {
  const [formData, setFormData] = useState(emptyBook);
  const [error, setError] = useState("");

  useEffect(() => {
    setFormData(book ? {
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      publicationYear: book.publicationYear,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies
    } : emptyBook);
    setError("");
  }, [book]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const numericFields = ["publicationYear", "totalCopies", "availableCopies"];
    const payload = { ...formData };
    numericFields.forEach((field) => { payload[field] = Number(payload[field]); });

    if (Object.values(formData).some((value) => String(value).trim() === "")) {
      setError("Please complete every field.");
      return;
    }
    if (numericFields.some((field) => !Number.isInteger(payload[field]) || payload[field] < 0)) {
      setError("Publication year and copy quantities must be whole numbers.");
      return;
    }
    if (payload.availableCopies > payload.totalCopies) {
      setError("Available copies cannot exceed total copies.");
      return;
    }
    setError("");
    onSubmit(payload);
  }

  return (
    <form className="book-form" onSubmit={handleSubmit}>
      <div className="form-heading">
        <h2>{book ? "Edit book" : "Add a book"}</h2>
        {book && <button type="button" className="text-button" onClick={onCancel}>Cancel</button>}
      </div>
      {(error || serverError) && <p className="error-message">{error || serverError}</p>}
      <div className="form-grid">
        {[["title", "Title"], ["author", "Author"], ["isbn", "ISBN"], ["category", "Category"]].map(([name, label]) => (
          <label key={name}>{label}<input name={name} value={formData[name]} onChange={handleChange} required /></label>
        ))}
        <label>Publication year<input name="publicationYear" type="number" min="0" value={formData.publicationYear} onChange={handleChange} required /></label>
        <label>Total copies<input name="totalCopies" type="number" min="0" value={formData.totalCopies} onChange={handleChange} required /></label>
        <label>Available copies<input name="availableCopies" type="number" min="0" value={formData.availableCopies} onChange={handleChange} required /></label>
      </div>
      <button type="submit" disabled={saving}>{saving ? "Saving..." : book ? "Save changes" : "Add book"}</button>
    </form>
  );
}

export default BookForm;
