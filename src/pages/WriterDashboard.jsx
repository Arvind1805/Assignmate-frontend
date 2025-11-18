import { useEffect, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "./WriterDashboard.css";
import { getSocket } from "../socket";

export default function WriterDashboard() {
  const { user } = useAuth();
  const socket = getSocket();

  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [negotiation, setNegotiation] = useState({ price: "", notes: "" });
  const [message, setMessage] = useState("");
  const [newNote, setNewNote] = useState("");
  const [showNegotiation, setShowNegotiation] = useState(false);
  const [unreadNotes, setUnreadNotes] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [writerProfile, setWriterProfile] = useState(null);


  // Fetch Requests
  const fetchProfile = async () => {
  try {
    const res = await API.get("/writers/profile/me");
    setWriterProfile(res.data);
  } catch (e) {
    console.error(e);
  }
};

useEffect(() => {
  fetchProfile();
}, []);


  const fetchRequests = async () => {
    try {
      const res = await API.get("/requests/writer");
      const all = res.data;

      const active = all.filter(
        (r) => !["Completed", "Submitted", "Reviewed"].includes(r.status)
      );
      const hist = all.filter((r) =>
        ["Completed", "Submitted", "Reviewed"].includes(r.status)
      );

      setRequests(active);
      setHistory(hist);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // SOCKET HANDLING
  useEffect(() => {
    if (!user || requests.length === 0) return;

    const active = requests.filter((r) =>
      ["Confirmed", "In Progress", "Submitted", "Completed"].includes(r.status)
    );

    active.forEach((req) => socket.emit("joinRoom", req._id));

    const handleReceiveNote = (data) => {
      setUnreadNotes((prev) => new Set(prev).add(data.roomId));
      setToast(`📝 New note from student on "${data.topic}"`);
      setTimeout(() => setToast(null), 4000);

      setRequests((prev) =>
        prev.map((r) =>
          r._id === data.roomId
            ? {
                ...r,
                notes: [
                  ...(r.notes || []),
                  {
                    from: data.from,
                    message: data.message,
                    timestamp: new Date(),
                  },
                ],
              }
            : r
        )
      );
    };

    socket.on("receiveNote", handleReceiveNote);
    socket.on("receiveNegotiation", fetchRequests);
    socket.on("statusUpdated", fetchRequests);

    return () => {
      socket.off("receiveNote", handleReceiveNote);
      socket.off("receiveNegotiation", fetchRequests);
      socket.off("statusUpdated", fetchRequests);
    };
  }, [user, requests.length]);

  // Send Note
  const sendNote = async (id) => {
    if (!newNote.trim()) return alert("Enter note");

    try {
      const res = await API.put(`/requests/${id}/note`, { message: newNote });

      socket.emit("sendNote", {
        from: user.role,
        message: newNote,
        roomId: id,
      });

      setNewNote("");
      setSelectedRequest({ ...selectedRequest, notes: res.data.notes });
    } catch (err) {
      console.error(err);
    }
  };

  // Status update
  const updateStatus = async (id, status) => {
    try {
      await API.put(`/requests/${id}/status`, { status });

      socket.emit("updateStatus", { roomId: id, status });
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  // Negotiation
  const sendNegotiation = async (id) => {
    try {
      await API.put(`/requests/${id}/negotiate`, {
        proposedPrice: negotiation.price,
        message: negotiation.notes,
      });

      socket.emit("sendNegotiation", {
        roomId: id,
        proposedPrice: negotiation.price,
        message: negotiation.notes,
        from: user.role,
      });

      setNegotiation({ price: "", notes: "" });
      setShowNegotiation(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };
  const confirmAndIncrement = async (id) => {
  try {
    await API.post("/writers/update-total-works", { requestId: id });
    fetchRequests();  // refresh
    alert("Work marked as completed!");
  } catch (err) {
    alert(err.response?.data?.message || "Error updating total works");
  }
};


  // =============================== UI START ===============================
  return (
    <div className={`layout`}>

    {/* MAIN CONTENT (same as student) */}
    <div className="main-content">

      {/* ===== TOP BAR (same alignment, same spacing) ===== */}
      <header className="topbar">
  <h2>Welcome, {user?.name}</h2>

  <div className="topbar-right">
    <div className="profile-circle">{user?.name?.[0]}</div>

    {/* ⭐ Correct rating display */}
    {writerProfile && (
      <div className="writer-rating-small">
        ⭐ {writerProfile.rating?.toFixed(1) || "0.0"}
      </div>
    )}
  </div>
</header>

    
    <div className="writer-dashboard">

      {/* TOP HEADER */}


      {toast && <div className="toast-popup">{toast}</div>}

      {/* ACTIVE REQUEST SECTION */}
      <section className="active-section">
        <h2 className="section-heading">Your Active Requests</h2>

        {requests.length === 0 ? (
          <p className="no-requests">No active requests.</p>
        ) : (
          <div className="request-grid">
            {requests.map((req) => (
              <div key={req._id} className="request-card">

                <div className="card-top-row">
                  <h3 className="profile-circle">{req?.student?.name[0]}</h3>

                  <span
                    className={`status-pill status-${req.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {req.status}
                  </span>
                </div>

                <div className="details-block">
                  <p><span>Student:</span> {req.student?.name}</p>
                  <p><span>Subject:</span> {req.subject}</p>
                  <p className="price"><span>Proposed Price:</span> ₹{req.price}</p>
                </div>

                <div className="card-actions">
                  {req.status === "Requested" && (
                    <>
                      <button
                        className="btn-neg"
                        onClick={() => {
                          setSelectedRequest(req);
                          setShowNegotiation(true);
                        }}
                      >
                        Negotiate
                      </button>

                      <button
                        className="btn-primary" style={{display : 'block'}}
                        onClick={() => updateStatus(req._id, "Confirmed")}
                      >
                        Accept
                      </button>

                      <button
                        className="btn-reject"
                        onClick={() => updateStatus(req._id, "Rejected")}
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {req.status === "Awaiting Review" && (
                    <button
                      className="btn-primary"
                      onClick={() => updateStatus(req._id, "In Progress")}
                    >
                      Accept Work
                    </button>
                  )}

                  {req.status === "In Progress" && (
                    <button
                      className="btn-primary"
                      onClick={() => updateStatus(req._id, "Completed")}
                    >
                      Mark Completed
                    </button>
                  )}


                  {req.status === "Submitted" && (
                      <button
                        className="btn-primary"
                        onClick={() => confirmAndIncrement(req._id)}
                      >
                        Confirm Handover
                      </button>
                    )}


                  <button
                    className="btn-view"
                    onClick={() => {
                      setSelectedRequest(req);
                      setUnreadNotes((prev) => {
                        const s = new Set(prev);
                        s.delete(req._id);
                        return s;
                      });
                    }}
                  >
                    View Details
                    {unreadNotes.has(req._id) && (
                      <span className="unread-dot"></span>
                    )}
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </section>
      {/* ========================= FULL HISTORY TABLE ========================= */}
      <section className="history-section">
        <h2 className="section-heading">Full Assignment History</h2>

        {requests.length === 0 && history.length === 0 ? (
          <p className="no-requests">No history yet.</p>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Student</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>View</th>
                </tr>
              </thead>

              <tbody>
                {[...requests, ...history].map((r) => (
                  <tr key={r._id}>
                    <td>{r.topic}</td>
                    <td>{r.student?.name}</td>
                    <td>₹{r.price}</td>

                    <td>
                      <span
                        className={`status-badge status-${r.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {r.status}
                      </span>
                    </td>

                    <td>
                      {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "-"}
                    </td>

                    <td>
                      <button
                        className="history-view-btn"
                        onClick={() => {
                          setSelectedRequest(r);
                          setUnreadNotes((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(r._id);
                            return newSet;
                          });
                        }}
                      >
                        View{" "}
                      {unreadNotes.has(r._id) && (
                        <span className="unread-dot"></span>
                      )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ========================= NEGOTIATION MODAL ========================= */}
      {showNegotiation && selectedRequest && (
        <div className="neg-overlay">
          <div className="neg-modal">
            <h2 className="neg-title">Negotiate with {selectedRequest.student?.name}</h2>

            <input
              type="number"
              className="neg-input"
              placeholder="Proposed Price"
              value={negotiation.price}
              onChange={(e) =>
                setNegotiation({ ...negotiation, price: e.target.value })
              }
            />

            <textarea
              className="neg-textarea"
              placeholder="Message (optional)"
              value={negotiation.notes}
              onChange={(e) =>
                setNegotiation({ ...negotiation, notes: e.target.value })
              }
            ></textarea>

            <div className="neg-actions">
              <button
                className="neg-btn-primary"
                onClick={() => sendNegotiation(selectedRequest._id)}
              >
                Send
              </button>

              <button
                className="neg-btn-secondary"
                onClick={() => {
                  setSelectedRequest(null);
                  setShowNegotiation(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================= PREMIUM DETAILS MODAL ========================= */}
      {selectedRequest && !showNegotiation && (
        <div className="details-modal-overlay">
          <div className="details-modal">

            <div className="details-header">
              <div className="details-title-left">
                <i className="ri-file-text-line"></i>
                <span>Assignment Details</span>
              </div>

              <button
                className="details-close"
                onClick={() => setSelectedRequest(null)}
              >
                ✕
              </button>
            </div>

            <h1 className="details-topic">{selectedRequest.topic}</h1>

            <div
              className={`details-status-pill status-${selectedRequest.status
                .toLowerCase()
                .replace(" ", "-")}`}
            >
              <i className="ri-timer-line"></i>
              {selectedRequest.status}
            </div>

            <div className="details-info-row">
              <div className="details-info-box">
                <label>Student</label>
                <div className="details-info-value">
                  <i className="ri-user-line"></i>
                  {selectedRequest.student?.name}
                </div>
              </div>

              <div className="details-info-box">
                <label>Subject</label>
                <div className="details-info-value">
                  <i className="ri-book-2-line"></i>
                  {selectedRequest.subject}
                </div>
              </div>

              <div className="details-info-box">
                <label>Price</label>
                <div className="details-info-value">
                  <i className="ri-money-rupee-circle-line"></i>
                  ₹{selectedRequest.price}
                </div>
              </div>

              {selectedRequest.pages && (
                <div className="details-info-box">
                  <label>Pages</label>
                  <div className="details-info-value">
                    <i className="ri-file-copy-2-line"></i>
                    {selectedRequest.pages}
                  </div>
                </div>
              )}
            </div>

            {selectedRequest.deadline && (
              <p className="details-deadline">
                <i className="ri-calendar-line"></i>
                Deadline: {new Date(selectedRequest.deadline).toLocaleDateString()}
              </p>
            )}

            <h3 className="details-section-title">Uploaded Documents</h3>
            <div className="details-doc-list">
              {(selectedRequest.docs || []).map((doc, i) => (
                <div key={i} className="details-doc-item">
                  <div className="details-doc-left">
                    <i className="ri-file-3-line"></i>
                    <span>Document {i + 1}</span>
                  </div>

                  <a className="details-doc-download" href={doc} target="_blank" rel="noreferrer">
                    Download
                  </a>
                </div>
              ))}
              {selectedRequest.docs?.length === 0 && (
                <p className="details-muted">No documents uploaded.</p>
              )}
            </div>

            {Array.isArray(selectedRequest.negotiations) && selectedRequest.negotiations.length > 0 && (
              <>
                <h3 className="details-section-title">Negotiation History</h3>
                <div className="details-neg-list">
                  {selectedRequest.negotiations.map((n, i) => (
                    <div key={i} className="details-neg-item">
                      <i className="ri-exchange-dollar-line"></i>
                      <div>
                        <div className="details-neg-text">
                          {n.from === user.role ? "You" : n.from} offered <strong>₹{n.proposedPrice}</strong>
                        </div>
                        {n.message && <div className="details-neg-message">💬 {n.message}</div>}
                        <div className="details-neg-time">{new Date(n.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selectedRequest.meetingPoint && (
              <div className="details-meeting">
                <i className="ri-map-pin-line"></i>
                <strong>🚩 Meeting Point:</strong>&nbsp;{selectedRequest.meetingPoint}
              </div>
            )}

            <div className="details-chat-box">
              <div className="details-chat-messages">
                {selectedRequest.notes?.length > 0 ? (
                  selectedRequest.notes.map((n, i) => (
                    <div key={i} className={`chat-bubble ${n.from === user.role ? "me" : "them"}`}>
                      <div className="chat-text"><strong>{n.from === user.role ? "You" : n.from}:</strong> {n.message}</div>
                      <div className="chat-time">{new Date(n.timestamp).toLocaleString()}</div>
                    </div>
                  ))
                ) : (
                  <p className="details-muted">No notes yet.</p>
                )}
              </div>

              <div className="details-chat-input-row">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <button className="details-send-btn" onClick={() => sendNote(selectedRequest._id)}>
                  <i className="ri-send-plane-2-fill"></i>
                </button>
              </div>
            </div>

          </div>
        </div>
        
      )}
    </div> 
    </div>

    </div>
  );   // end return
}     // end component
