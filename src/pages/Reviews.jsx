import { useEffect, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "./Reviews.css";

export default function Reviews() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [selectedWriter, setSelectedWriter] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: "",
    comment: "",
    requestId: "",
  });
  const [message, setMessage] = useState("");

  const fetchRequests = async () => {
    try {
      const res = await API.get("/requests/student");
      // Filter only submitted ones
      const submitted = res.data.filter((r) => r.status === "Submitted");
      setRequests(submitted);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleChange = (e) => {
    setReviewData({ ...reviewData, [e.target.name]: e.target.value });
  };

  const submitReview = async () => {
    if (!reviewData.rating || !reviewData.comment) {
      setMessage("Please fill both rating and comment.");
      return;
    }
    try {
      await API.post("/reviews", {
        writerId: selectedWriter._id,
        rating: Number(reviewData.rating),
        comment: reviewData.comment,
        requestId: reviewData.requestId,
      });
      setMessage("Review submitted successfully!");
      setSelectedWriter(null);
      fetchRequests();
    } catch (err) {
      console.error(err);
      setMessage("Failed to submit review. Try again.");
    }
  };

  return (
    <div className="reviews-page">
      <h2>Submit Reviews</h2>
      <p>Rate the writers after completing your assignments.</p>

      {message && <p className="status-msg">{message}</p>}

      {requests.length === 0 ? (
        <p>No completed requests pending review.</p>
      ) : (
        <div className="requests-grid">
          {requests.map((req) => (
            <div className="request-card" key={req._id}>
              <h3>{req.topic}</h3>
              <p><strong>Writer:</strong> {req.writer?.name}</p>
              <p><strong>Subject:</strong> {req.subject}</p>
              <p><strong>Price:</strong> ₹{req.price}</p>
              <p><strong>Status:</strong> {req.status}</p>

              <button
                onClick={() => {
                  setSelectedWriter(req.writer);
                  setReviewData({ rating: "", comment: "", requestId: req._id });
                }}
              >
                Review Writer
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedWriter && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Rate {selectedWriter.name}</h3>

            <select
              name="rating"
              value={reviewData.rating}
              onChange={handleChange}
            >
              <option value="">Select Rating</option>
              <option value="5">⭐ 5 - Excellent</option>
              <option value="4">⭐ 4 - Good</option>
              <option value="3">⭐ 3 - Average</option>
              <option value="2">⭐ 2 - Poor</option>
              <option value="1">⭐ 1 - Bad</option>
            </select>

            <textarea
              name="comment"
              placeholder="Write your feedback..."
              value={reviewData.comment}
              onChange={handleChange}
            ></textarea>

            <div className="modal-actions">
              <button onClick={submitReview}>Submit</button>
              <button onClick={() => setSelectedWriter(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
