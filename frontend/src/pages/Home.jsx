import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyBorrowedBooks } from "../services/issueService";
import BookCatalogue from "../components/BookCatalogue";

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.role === "student") {
      setLoading(true);
      getMyBorrowedBooks()
        .then((res) => setBorrowedBooks(res.issues || []))
        .catch(() => setBorrowedBooks([]))
        .finally(() => setLoading(false));
    }
  }, [user]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="home-page">
      <div className="page-card home-card">
        <h1>Library Management System</h1>
        <div className="page-toolbar">
          <p>
            Welcome, {user?.name}!{" "}
            <span className="role-badge">
              {user?.role === "admin" ? "Admin/Librarian" : "Student"}
            </span>
          </p>
          <button className="secondary-button" onClick={handleLogout}>Logout</button>
        </div>

        {user?.role === "admin" && (
          <div className="admin-actions">
            <Link to="/issues" className="action-link">
              Manage Book Issues & Returns
            </Link>
            <Link to="/admin" className="sub-link">
              Manage Books
            </Link>
          </div>
        )}

        {user?.role === "student" && (
          <div className="student-loans">
            <h3>My Borrowed Books</h3>
            {loading && <p className="status-text">Loading your borrowed books...</p>}
            {!loading && borrowedBooks.length === 0 && (
              <p className="empty-text">You do not have any borrowed books.</p>
            )}
            {!loading && borrowedBooks.length > 0 && (
              <ul className="loans-list">
                {borrowedBooks.map((item) => (
                  <li key={item._id} className="loan-item">
                    <div>
                      <strong>{item.book?.title}</strong>
                      <div className="meta-text">By {item.book?.author}</div>
                      <div className="meta-text">Due: {new Date(item.dueDate).toLocaleDateString()}</div>
                    </div>
                    <span className={`status-pill ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <BookCatalogue />
      </div>
    </div>
  );
}

export default Home;
