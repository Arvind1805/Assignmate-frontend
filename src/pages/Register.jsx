import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// import { UserPlus, Mail, Lock, GraduationCap } from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    institute: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await API.post("/auth/register", formData);
      login(res.data);

      if (res.data.role === "writer") navigate("/writer/profile-setup");
      else navigate("/student/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
  <div className="register-wrapper">

    <div className="register-card">

      {/* Logo + Title */}
      <div className="register-header">
        <i className="ri-share-line register-logo"></i>
        <h1>AssignMate</h1>
        <h2>Join AssignMate</h2>
        <p>Your AI-powered academic partner</p>
      </div>

      <form onSubmit={handleSubmit} className="register-form">

        {/* Name */}
        <div className="reg-input-group">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Email */}
        <div className="reg-input-group">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="reg-input-group">
          <input
            type="text"
            name="institute"
            placeholder="Institute/College"
            value={formData.institute}
            onChange={handleChange}
            required
          />
        </div>

        {/* Password */}
        <div className="reg-input-group">
          <input
            type="password"
            name="password"
            placeholder="Enter a secure password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        {/* Confirm Password */}
        <div className="reg-input-group">
          <input
            type="password"
            placeholder="Confirm your password"
            required
          />
        </div>

        {/* Role Toggle */}
        <label className="role-label">I am a...</label>

        <div className="role-toggle">
          <button
            type="button"
            className={formData.role === "student" ? "role-btn active" : "role-btn"}
            onClick={() => setFormData({ ...formData, role: "student" })}
          >
            Student
          </button>

          <button
            type="button"
            className={formData.role === "writer" ? "role-btn active" : "role-btn"}
            onClick={() => setFormData({ ...formData, role: "writer" })}
          >
            Writer
          </button>
        </div>

        {error && <p className="reg-error">{error}</p>}

        {/* Submit */}
        <button type="submit" className="reg-btn">
          Register
        </button>

      </form>

      {/* Bottom Link */}
      <p className="reg-footer">
        Already have an account?{" "}
        <Link to="/login" className="reg-link">Log in</Link>
      </p>
    </div>

  </div>
  );
}
