import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";
import { useEffect } from "react";

export default function Login() {
  
  useEffect(() => {
  document.body.classList.add("hide-navbar");
  return () => document.body.classList.remove("hide-navbar");
}, []);

  const [formData, setFormData] = useState({ email: "", password: "" });
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
      const res = await API.post("/auth/login", formData);
      login(res.data);

      if (res.data.role === "writer") navigate("/writer/dashboard");
      else navigate("/student/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="login-wrapper">

      {/* LEFT SIDE */}
      <div className="login-left">
        <div className="login-left-logo">
          <i className="ri-share-line"></i>
          <span>AssignMate</span>
        </div>

        <img
          src="https://img.freepik.com/premium-vector/circle-style-block-chain-night-background_1302-8576.jpg?w=360"
          alt="design"
          className="login-hero-img"
        />

        <h1 className="login-left-title">Collaborate Smarter.</h1>
        <p className="login-left-sub">
          Your AI-Powered Academic Partner.
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className="login-right">

        <div className="login-right-content">

          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Log in to AssignMate to continue</p>

          <form onSubmit={handleSubmit} className="login-form">

            <div className="login-input-group">
              <Mail className="login-input-icon" />
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="login-input-group">
              <Lock className="login-input-icon" />
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn">Login</button>
          </form>

          <p className="login-bottom-text">
            Don’t have an account?{" "}
            <Link to="/register" className="login-link">Register</Link>
          </p>

        </div>

      </div>

    </div>
  );
}
