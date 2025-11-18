import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "./WriterProfile.css";

export default function WriterProfile() {
  const { id } = useParams(); // writer userId
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [requestData, setRequestData] = useState({
    topic: "",
    subject: "",
    price: "",
    pages: "",
    notes: "",
  });
  const [message, setMessage] = useState("");
  const [showRequestBox, setShowRequestBox] = useState(false);

  // Fetch writer details
  const fetchProfile = async () => {
    try {
      const res = await API.get(`/writers/${id}`);
      setProfile(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      const res = await API.get(`/reviews/${id}`);
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchReviews();
    // eslint-disable-next-line
  }, [id]);

  const handleChange = (e) => {
    setRequestData({ ...requestData, [e.target.name]: e.target.value });
  };

  const sendRequest = async () => {
    try {
      await API.post("/requests", { writerId: id, ...requestData });
      setMessage("Request sent successfully!");
      setRequestData({ topic: "", subject: "", price: "", pages: "", notes: "" });
      setShowRequestBox(false);
    } catch (err) {
      console.error(err);
      setMessage("Failed to send request.");
    }
  };

  if (!profile) return <p style={{ padding: "20px" }}>Loading writer profile...</p>;

  const writer = profile.user;

  return (
    <div className="writer-profile-page">
      <div className="writer-header">
        <h2>{writer.name}</h2>
        <p><strong>Institute:</strong> {writer.institute}</p>
        <p><strong>Bio:</strong> {profile.bio || "No bio available"}</p>
      </div>

      <div className="writer-details">
        <p><strong>Subjects:</strong> {profile.subjects.join(", ")}</p>
        <p><strong>Price per Page:</strong> ₹{profile.pricePerPage}</p>
        <p><strong>Total Works:</strong> {profile.totalWorks}</p>
        <p><strong>Rating:</strong> ⭐ {profile.rating || "N/A"}</p>
      </div>

      <div className="sample-section">
        <h3>Sample Works</h3>
        {profile.sampleWorks && profile.sampleWorks.length > 0 ? (
          profile.sampleWorks.map((link, index) => (
            <p key={index}>
              <a href={link} target="_blank" rel="noreferrer">
                View Sample {index + 1}
              </a>
            </p>
          ))
        ) : (
          <p>No sample works uploaded.</p>
        )}
      </div>

      {user?.role === "student" && (
        <>
          <button className="request-btn" onClick={() => setShowRequestBox(true)}>
            Request This Writer
          </button>

          {showRequestBox && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Send Request to {writer.name}</h3>

                <input
                  type="text"
                  name="topic"
                  placeholder="Assignment Topic"
                  value={requestData.topic}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="subject"
                  placeholder="Subject"
                  value={requestData.subject}
                  onChange={handleChange}
                />
                <input
                  type="number"
                  name="price"
                  placeholder="Proposed Price"
                  value={requestData.price}
                  onChange={handleChange}
                />
                <input
                  type="number"
                  name="pages"
                  placeholder="Pages Count"
                  value={requestData.pages}
                  onChange={handleChange}
                />
                <textarea
                  name="notes"
                  placeholder="Additional Notes"
                  value={requestData.notes}
                  onChange={handleChange}
                ></textarea>

                {message && <p className="message">{message}</p>}

                <div className="modal-actions">
                  <button onClick={sendRequest}>Send</button>
                  <button onClick={() => setShowRequestBox(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="reviews-section">
        <h3>Student Reviews</h3>
        {reviews.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          reviews.map((rev) => (
            <div className="review-card" key={rev._id}>
              <p><strong>{rev.student.name}</strong> ({rev.student.institute})</p>
              <p>⭐ {rev.rating}</p>
              <p>{rev.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
