import { useEffect, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "./Requests.css";

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [uploadData, setUploadData] = useState({ docs: "", deadline: "" });
  const [meetingPoint, setMeetingPoint] = useState("");
  const [message, setMessage] = useState("");

  const fetchRequests = async () => {
  try {
    const res = await API.get("/requests/student");
    console.log("Fetched Requests:", res.data);
    setRequests(res.data);
  } catch (err) {
    console.error("Failed to fetch requests:", err);
  }
};


  const handleNegotiation = async (id, action) => {
  try {
    await API.put(`/requests/${id}/respond`, { action });
    setMessage(`Negotiation ${action}ed successfully.`);
    fetchRequests();
  } catch (err) {
    console.error(err);
    setMessage("Action failed. Try again.");
  }
};


  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUploadChange = (e) => {
    setUploadData({ ...uploadData, [e.target.name]: e.target.value });
  };

  const uploadDocs = async (id) => {
    try {
      await API.put(`/requests/${id}/upload`, uploadData);
      setMessage("Documents uploaded successfully!");
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      console.error(err);
      setMessage("Upload failed. Try again.");
    }
  };

  const confirmSubmission = async (id) => {
    try {
      await API.put(`/requests/${id}/submit`, { meetingPoint });
      setMessage("Submission confirmed successfully!");
      fetchRequests();
    } catch (err) {
      console.error(err);
      setMessage("Failed to confirm submission.");
    }
  };

  return (
    <div className="requests-page">
      <h2>My Assignment Requests</h2>
      <p>Track all your requests, upload files, and confirm submission.</p>

      {message && <p className="status-msg">{message}</p>}

      {requests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        <div className="requests-grid">
          {requests.map((req) => (
            <div className="request-card" key={req._id}>
              <h3>{req.topic}</h3>
              <p><strong>Writer:</strong> {req.writer?.name}</p>
              <p><strong>Subject:</strong> {req.subject}</p>
              <p><strong>Price:</strong> ₹{req.price}</p>
              <p><strong>Pages:</strong> {req.pages}</p>
              <p><strong>Status:</strong> {req.status}</p>

              {/* Status actions */}
              {req.status === "Confirmed" && (
                <button onClick={() => setSelectedRequest(req)}>
                  Upload Docs & Set Deadline
                </button>
              )}

              {req.status === "Completed" && (
                <div className="meeting-confirm">
                  <input
                    type="text"
                    placeholder="Meeting point (e.g. library)"
                    value={meetingPoint}
                    onChange={(e) => setMeetingPoint(e.target.value)}
                  />
                  <button onClick={() => confirmSubmission(req._id)}>
                    Confirm Submission
                  </button>
                </div>
              )}
              {/* Negotiation Section */}
            <p><strong>Status:</strong> {req.status}</p>

            {req.status === "Negotiation" && (
              <div className="negotiation-box">
                <p><strong>Writer Proposed:</strong> ₹{req.negotiation?.proposedPrice}</p>
                <p><em>{req.negotiation?.message}</em></p>
                {req.negotiation?.status === "Pending" && (
                  <div className="negotiation-actions">
                    <button onClick={() => handleNegotiation(req._id, "accept")}>Accept</button>
                    <button onClick={() => handleNegotiation(req._id, "reject")}>Reject</button>
                  </div>
                )}
              </div>
            )}

            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {selectedRequest && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Upload Docs for {selectedRequest.topic}</h3>

            <input
              type="text"
              name="docs"
              placeholder="Enter document link (PDF URL or Drive link)"
              value={uploadData.docs}
              onChange={handleUploadChange}
            />
            <input
              type="date"
              name="deadline"
              value={uploadData.deadline}
              onChange={handleUploadChange}
            />

            <div className="modal-actions">
              <button onClick={() => uploadDocs(selectedRequest._id)}>
                Submit
              </button>
              <button onClick={() => setSelectedRequest(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
