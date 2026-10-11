import { Link } from "react-router-dom";
import { useState } from "react";
import BookCatalogue from "../components/BookCatalogue";
import BookForm from "../components/BookForm";
import { createBook, updateBook } from "../services/bookService";

function AdminPage() {
  const [editingBook, setEditingBook] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(book) {
    setSaving(true);
    setError("");
    setSuccess("");
    const isEdit = Boolean(editingBook);
    try {
      if (isEdit) {
        await updateBook(editingBook._id, book);
      } else {
        await createBook(book);
      }
      setEditingBook(null);
      setRefreshKey((value) => value + 1);
      setSuccess(isEdit ? "Book updated successfully." : "Book added successfully.");
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="home-page">
      <div className="page-card home-card">
        <div className="page-toolbar">
          <div>
            <h1>Manage books</h1>
            <p>Admin-only catalogue management.</p>
          </div>
          <Link to="/issues" className="action-link">
            Manage Book Issues & Returns
          </Link>
        </div>
        {success && <p className="success-message">{success}</p>}
        <BookForm
          key={editingBook ? editingBook._id : `new-${refreshKey}`}
          book={editingBook}
          onSubmit={handleSubmit}
          onCancel={() => {
            setEditingBook(null);
            setError("");
          }}
          saving={saving}
          serverError={error}
        />
        <BookCatalogue
          canEdit
          onEdit={(book) => {
            setEditingBook(book);
            setError("");
            setSuccess("");
          }}
          refreshKey={refreshKey}
        />
        <Link to="/">Go back home</Link>
      </div>
    </div>
  );
}

export default AdminPage;
