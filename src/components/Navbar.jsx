import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="nav">
      
      {/* LEFT */}
      <div className="nav-left">
        {/* <Link to="/" className="logo"> */}
  <i className="ri-book-open-line logo-icon"></i>
  <span className="logo-text">📝AssignMate</span>
{/* </Link> */}

      </div>

      <div className="nav-center"></div>

      {/* RIGHT */}
      <div className="nav-right">
        {!user ? (
          <>
            <Link className="nav-auth-btn" to="/login">Login</Link>
            <Link className="nav-auth-btn" to="/register">Register</Link>
          </>
        ) : (
          <>
            <button className="nav-icon-btn"><i className="ri-sun-line"></i></button>
            <button className="nav-icon-btn"><i className="ri-notification-3-line"></i></button>

            {/* Profile dropdown */}
            <div className="profile-dropdown" ref={menuRef}>
              <div
                className="profile-circle"
                onClick={() => setOpenMenu(!openMenu)}
              >
                {user?.name?.[0]}
              </div>

              {openMenu && (
                <div className="dropdown-menu">
                  <p className="dropdown-name">{user?.name}</p>

                  <Link
                    to={user.role === "student" ? "/student/dashboard" : "/writer/dashboard"}
                    className="dropdown-item"
                    onClick={() => setOpenMenu(false)}
                  >
                    Dashboard
                  </Link>

                  <button
                  className="dropdown-item logout"
                  onClick={() => {
                    logout();          // clears auth
                    navigate("/login"); // redirect user
                  }}
                >
                  Logout
                </button>

                </div>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
