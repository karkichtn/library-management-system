import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAllIssues,
  issueBook,
  returnBook,
  getBooks
} from "../services/issueService";

function IssueManagement() {
  const [issues, setIssues] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [selectedBook, setSelectedBook] = useState("");
  const [studentId, setStudentId] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const nextTwoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    return nextTwoWeeks.toISOString().split("T")[0];
  });
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [returningId, setReturningId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  async function fetchData() {
    setError("");
    setLoading(true);
    try {
      const [issuesRes, booksRes] = await Promise.all([
        getAllIssues(filterStatus),
        getBooks()
      ]);
      setIssues(issuesRes.issues || []);
      setBooks(booksRes.books || []);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  async function handleIssueSubmit(e) {
    e.preventDefault();
    setFormError("");
    setFormMessage("");
    setActionError("");
    setActionSuccess("");

    if (!selectedBook) {
      setFormError("Please select a book to issue");
      return;
    }

    if (!studentId.trim()) {
      setFormError("Please enter a valid student ID");
      return;
    }

    setSubmitting(true);
    try {
      const res = await issueBook({
        bookId: selectedBook,
        studentId: studentId.trim(),
        dueDate
      });
      setFormMessage(res.message || "Book issued successfully");
      setSelectedBook("");
      setStudentId("");
      fetchData();
    } catch (err) {
      setFormError(err.message || "Failed to issue book");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReturnBook(issueId) {
    setReturningId(issueId);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await returnBook(issueId);
      setActionSuccess(res.message || "Book returned successfully");
      fetchData();
    } catch (err) {
      setActionError(err.message || "Failed to process return");
    } finally {
      setReturningId(null);
    }
  }

  return (
    <div className="issues-container">
      <div className="issues-header">
        <div>
          <h2>Book Issue & Return Management</h2>
          <p className="subtitle">Issue books to students and manage active borrowing records</p>
        </div>
        <Link to="/" className="back-link">Back to Home</Link>
      </div>

      <div className="issue-form-card">
        <h3>Issue a Book</h3>
        {formMessage && <div className="success-banner">{formMessage}</div>}
        {formError && <div className="error-banner">{formError}</div>}

        <form onSubmit={handleIssueSubmit} className="issue-form">
          <div className="form-group">
            <label>Select Book</label>
            <select
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              disabled={submitting}
            >
              <option value="">-- Choose a book --</option>
              {books.map((b) => (
                <option
                  key={b._id}
                  value={b._id}
                  disabled={b.availableCopies <= 0}
                >
                  {b.title} by {b.author} ({b.availableCopies} available)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Student User ID</label>
            <input
              type="text"
              placeholder="e.g. 67a9d0f41b2c3d4e5f6a7b8c"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={submitting}
            />
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? "Issuing Book..." : "Issue Book"}
          </button>
        </form>
      </div>

      <div className="records-card">
        <div className="records-header">
          <h3>Borrowing Records</h3>
          <div className="filter-group">
            <label>Filter by Status: </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Records</option>
              <option value="ISSUED">Currently Issued</option>
              <option value="RETURNED">Returned</option>
            </select>
          </div>
        </div>

        {actionSuccess && <div className="success-banner">{actionSuccess}</div>}
        {actionError && <div className="error-banner">{actionError}</div>}

        {loading && <p className="status-text">Loading borrowing records...</p>}
        {error && (
          <div className="error-banner">
            {error} <button onClick={fetchData} className="retry-btn">Retry</button>
          </div>
        )}

        {!loading && !error && issues.length === 0 && (
          <p className="empty-state">No borrowing records found.</p>
        )}

        {!loading && !error && issues.length > 0 && (
          <div className="table-responsive">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Student</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <strong>{item.book?.title || "Unknown Book"}</strong>
                      <div className="meta-text">{item.book?.author} (ISBN: {item.book?.isbn})</div>
                    </td>
                    <td>
                      <div>{item.student?.name || "Unknown Student"}</div>
                      <div className="meta-text">{item.student?.email}</div>
                    </td>
                    <td>{new Date(item.issueDate).toLocaleDateString()}</td>
                    <td>{new Date(item.dueDate).toLocaleDateString()}</td>
                    <td>
                      {item.returnDate
                        ? new Date(item.returnDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      <span className={`status-pill ${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {item.status === "ISSUED" ? (
                        <button
                          className="return-btn"
                          disabled={returningId === item._id}
                          onClick={() => handleReturnBook(item._id)}
                        >
                          {returningId === item._id ? "Returning..." : "Mark Returned"}
                        </button>
                      ) : (
                        <span className="done-text">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default IssueManagement;
