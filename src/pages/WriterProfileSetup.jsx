import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./WriterProfileSetup.css";

export default function WriterProfileSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    subjects: "",
    pricePerPage: "",
    bio: "",
    sampleWorks: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/writers/profile", {
        subjects: form.subjects.split(",").map((s) => s.trim()),
        pricePerPage: Number(form.pricePerPage),
        bio: form.bio,
        sampleWorks: form.sampleWorks,
      });

      setMessage(res.data.message || "Profile created successfully!");
      setTimeout(() => navigate("/writer/dashboard"), 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create profile.");
    }
  };

  return (
    <div className="writer-setup-container">

      <div className="writer-setup-card">

        {/* Logo */}
        <div className="writer-setup-logo">
          <i className="ri-share-line"></i>
          <span>AssignMate</span>
        </div>

        <h2 className="writer-setup-title">Complete Your Profile</h2>
        <p className="writer-setup-sub">Let students know your expertise</p>

        <form className="writer-setup-form" onSubmit={handleSubmit}>

          <label>Subjects (comma separated)</label>
          <input
            type="text"
            name="subjects"
            placeholder="Eg: English, Math, Science"
            value={form.subjects}
            onChange={handleChange}
            required
          />

          <label>Price per Page (₹)</label>
          <input
            type="number"
            name="pricePerPage"
            placeholder="Eg: 50"
            value={form.pricePerPage}
            onChange={handleChange}
            required
          />

          <label>Bio</label>
          <textarea
            name="bio"
            placeholder="Write a short description about your expertise"
            value={form.bio}
            onChange={handleChange}
          />

          <label>Sample Work (optional)</label>
          <textarea
            name="sampleWorks"
            placeholder="Paste a sample text or link (Drive, GitHub, etc.)"
            value={form.sampleWorks}
            onChange={handleChange}
          />

          <button type="submit" className="writer-setup-btn">
            Save Profile
          </button>
        </form>

        {message && <p className="writer-setup-msg">{message}</p>}
      </div>

    </div>
  );
}
