import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BookCatalogue from "../components/BookCatalogue";

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="home-page">
      <div className="page-card home-card">
        <h1>Library Management System</h1>
        <div className="page-toolbar"><p>Welcome, {user.name}! <span className="role-badge">{user.role === "admin" ? "Admin/Librarian" : "Student"}</span></p><button className="secondary-button" onClick={handleLogout}>Logout</button></div>
        {user.role === "admin" && (
          <p>
            <Link to="/admin">Manage books</Link>
          </p>
        )}
        <BookCatalogue />
      </div>
    </div>
  );
}

export default Home;
