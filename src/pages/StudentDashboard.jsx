import { useEffect, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../socket";
import "./StudentDashboard.css"

export default function StudentDashboard() {
  const { user } = useAuth();
  const socket = getSocket();

  // ---------- STATE ----------
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [writers, setWriters] = useState([]);
  const [filters, setFilters] = useState({ institute: "", subject: "" });
  const [requests, setRequests] = useState([]);
  const [selectedWriter, setSelectedWriter] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestData, setRequestData] = useState({
    topic: "",
    subject: "",
    price: "",
    pages: "",
    notes: "",
  });
  const [uploadData, setUploadData] = useState({ docs: "", deadline: "" });
  const [meetingPoint, setMeetingPoint] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRenegotiation, setShowRenegotiation] = useState(false);
  const [renegotiate, setRenegotiate] = useState({ price: "", message: "" });
  const [newNote, setNewNote] = useState("");
  const [unreadNotes, setUnreadNotes] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [showWriterDetails, setShowWriterDetails] = useState(false);
  const [requestWriterData, setRequestWriterData] = useState(null);
  // Store user's rating for this request
const [myRating, setMyRating] = useState(0);
const [myComment, setMyComment] = useState("");




  // ---------- FETCH ----------
  const fetchWriters = async () => {
    try {
      const res = await API.get("/writers", { params: filters });
      // const unique = [...new Map(res.data.map(item => [item.user._id, item])).values()];
      // setWriters(unique);

      setWriters(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await API.get("/requests/student");
      setRequests(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchWriters();
    fetchRequests();
  }, []);

 useEffect(() => {
  fetchWriters();
}, [filters]);


  // ---------- SOCKET ----------
  useEffect(() => {
    if (!user || requests.length === 0) return;

    const active = requests.filter((r) =>
      ["Confirmed", "In Progress", "Completed", "Submitted"].includes(r.status)
    );

    active.forEach((req) => socket.emit("joinRoom", req._id));

    const handleReceiveNote = (data) => {
      setUnreadNotes((prev) => new Set(prev).add(data.roomId));
      setToast(`📩 New note from writer on "${data.topic || "an assignment"}"`);
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

    const negotiationUpdate = () => fetchRequests();
    const statusUpdate = () => fetchRequests();

    socket.on("receiveNote", handleReceiveNote);
    socket.on("receiveNegotiation", negotiationUpdate);
    socket.on("sendNegotiation", negotiationUpdate);
    socket.on("statusUpdated", statusUpdate);

    return () => {
      socket.off("receiveNote", handleReceiveNote);
      socket.off("receiveNegotiation", negotiationUpdate);
      socket.off("sendNegotiation", negotiationUpdate);
      socket.off("statusUpdated", statusUpdate);
    };
  }, [user, requests.length]);

  // ---------- SEND NOTE ----------
  const sendNote = async (id) => {
    if (!newNote.trim()) return;

    try {
      const res = await API.put(`/requests/${id}/note`, { message: newNote });

      socket.emit("sendNote", {
        message: newNote,
        from: user.role,
        roomId: id,
      });

      setNewNote("");
      setSelectedRequest({ ...selectedRequest, notes: res.data.notes });
    } catch (e) {
      console.error(e);
    }
  };
  const submitRating = async () => {
  if (!myRating) return;

  try {
    const res = await API.post("/reviews", {
      writerId: selectedRequest.writer._id,
      requestId: selectedRequest._id,
      rating: myRating
    });

    setSelectedRequest({
      ...selectedRequest,
      rating: myRating
    });

    alert("Rating saved!");
  } catch (e) {
    console.log(e);
  }
};


  // ---------- NEGOTIATION ----------
  const handleNegotiation = async (id, action) => {
    try {
      await API.put(`/requests/${id}/respond`, { action });
      socket.emit("receiveNegotiation", { roomId: id, action });
      fetchRequests();
    } catch (e) {}
  };

  const handleRenegotiate = async (id) => {
    try {
      await API.put(`/requests/${id}/negotiate`, {
        proposedPrice: renegotiate.price,
        message: renegotiate.message,
      });

      socket.emit("sendNegotiation", {
        roomId: id,
        proposedPrice: renegotiate.price,
        message: renegotiate.message,
        from: user.role,
      });

      setRenegotiate({ price: "", message: "" });
      setShowRenegotiation(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (e) {}
  };

  // ---------- UPLOAD ----------
  const uploadDocs = async (id) => {
    try {
      await API.put(`/requests/${id}/upload`, uploadData);
      socket.emit("statusUpdated", { roomId: id, status: "In Progress" });
      setShowUploadModal(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (e) {}
  };

  const confirmSubmission = async (id) => {
    try {
      await API.put(`/requests/${id}/submit`, { meetingPoint });
      socket.emit("statusUpdated", { roomId: id, status: "Submitted" });
      fetchRequests();
    } catch (e) {}
  };

  // ---------- NEW REQUEST ----------
  const sendRequest = async () => {
    try {
      await API.post("/requests", {
        writerId: requestWriterData.user._id,

        ...requestData,
      });

      setSelectedWriter(null);
      setRequestData({
        topic: "",
        subject: "",
        price: "",
        pages: "",
        notes: "",
      });
      fetchRequests();
    } catch (e) {}
  };
  // ---------- RATING ----------
const handleRatingSelect = (value) => {
  setMyRating(value);
  setSelectedRequest((prev) => ({ ...prev, myRating: value }));
};

const submitReview = async () => {
  if (myRating < 1) {
    alert("Please choose a rating");
    return;
  }

  try {
    await API.post("/reviews", {
      writerId: selectedRequest.writer._id,
      requestId: selectedRequest._id,
      rating: myRating,
      comment: ""
    });

    alert("Thanks for your review!");

    fetchWriters();
    fetchRequests();
  } catch (e) {
    alert(e.response?.data?.message || "Error submitting review");
  }
};


  // ---------- UI ----------
  return (
    <div className={`layout ${sidebarCollapsed ? "collapsed" : ""}`}>

      {/* SIDEBAR */}
      

      {/* MAIN AREA */}
      <div className="main-content">

        {/* TOPBAR */}
        <header className="topbar">
          <h2>Welcome, {user?.name}</h2>

          <div className="topbar-right">

            <div className="profile-circle">{user?.name?.[0]}</div>
          </div>
        </header>

        {/* WRITER FINDER */}
        <section className="finder-section">
          <h3>Find Your Expert</h3>

          <div className="filter-row">
            <input
              type="text"
              placeholder="Institute"
              value={filters.institute}
              onChange={(e) =>
                setFilters({ ...filters, institute: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Subject"
              value={filters.subject}
              onChange={(e) =>
                setFilters({ ...filters, subject: e.target.value })
              }
            />
            <button onClick={fetchWriters}>Search</button>
          </div>

          {/* WRITERS GRID */}
          <div className="writer-grid">
  {writers.filter((w) => w && w.user && w.user.name).map((w) => (
    <div key={w._id} className="writer-card">

      <div className="writer-header">
        <div className="writer-avatar">
          {(w.user?.name || "U")[0]}
        </div>

        <div>
          <h4>{w.user?.name || "Unknown Writer"}</h4>
          <p className="muted">{w.user?.institute || "Unknown Institute"}</p>
        </div>

        <span className="price">₹{w.pricePerPage}/pg</span>
      </div>

      <div className="subjects">
        {(w.subjects || []).map((s, i) => (
          <span key={i} className="tag">{s}</span>
        ))}
      </div>

      <button
        className="primary-btn"
        onClick={() => {
    setRequestWriterData(w);
    setShowWriterDetails(false);
    setSelectedWriter(null);
  }}
        disabled={!w.user?._id}
      >
        Request Writer
      </button>
      <button
        className="secondary-btn"
        onClick={() => {
          setSelectedWriter(w);      // ONLY for details modal
setShowWriterDetails(true);
setRequestWriterData(null); // ensure request modal stays CLOSED

        }}
      >
        View Full Details
      </button>


    </div>
  ))}
</div>

        </section>

        {/* REQUEST HISTORY */}
        <section className="history-section">
          <h3>My Request History</h3>

          <table className="history-table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Writer</th>
                <th>Date</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
                <th>View</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td>{r.topic}</td>
                  <td>{r.writer?.name}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>₹{r.price}</td>
                  <td>
                    <span className={`status-badge status-${r.status.toLowerCase().replace(" ", "-")}`}>
  {r.status}
</span>

                  </td>
                  <td>
                    {/* Negotiation buttons */}
                    {(r.status === "Negotiation" ||
                      (Array.isArray(r.negotiations) &&
                        r.negotiations.some(
                          (n) =>
                            n.from === "writer" &&
                            [
                              "Pending",
                              "Active",
                              "Awaiting Response",
                              "Sent",
                            ].includes(n.status)
                        ))) && (
                      <>
                        <button
                          className="table-btn success"
                          onClick={() => handleNegotiation(r._id, "accept")}
                        >
                          Accept
                        </button>
                        <button
                          className="table-btn danger"
                          onClick={() => handleNegotiation(r._id, "reject")}
                        >
                          Reject
                        </button>
                        <button
                          className="table-btn warn"
                          onClick={() => {
                            setShowRenegotiation(true);
                            setSelectedRequest(r);
                          }}
                        >
                          Re-Negotiate
                        </button>
                      </>
                    )}

                    {r.status === "Confirmed" && (
                      <button
                        className="table-btn primary"
                        onClick={() => {
                          setSelectedRequest(r);
                          setShowUploadModal(true);
                        }}
                      >
                        Upload Docs
                      </button>
                    )}

                    {r.status === "Completed" && (
                      <>
                        <input
                          type="text"
                          placeholder="Meeting Point"
                          className="meeting-input"
                          onChange={(e) => setMeetingPoint(e.target.value)}
                        />
                        <button
                          className="table-btn primary"
                          onClick={() => confirmSubmission(r._id)}
                        >
                          Confirm
                        </button>
                      </>
                    )}
                  </td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => {
  setSelectedRequest(r);
  setMyRating(0);

  setUnreadNotes((prev) => {
    const s = new Set(prev);
    s.delete(r._id);
    return s;
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
        </section>
      </div>
      {/* ========================= WRITER DETAILS MODAL ========================= */}
{showWriterDetails && selectedWriter && (
  <div className="writer-details-overlay">
    <div className="writer-details-modal">

      {/* Header */}
      <div className="writer-details-header">
        <h2>Writer Profile</h2>
        <button
          className="writer-close-btn"
          onClick={() => setShowWriterDetails(false)}
        >
          ✕
        </button>
      </div>

      {/* Avatar */}
      <div className="writer-avatar-large">
        {(selectedWriter.user?.name || "U")[0]}
      </div>

      {/* Name + Institute */}
      <h3 className="writer-name">{selectedWriter.user?.name}</h3>
      <p className="writer-institute">
        {selectedWriter.user?.institute || "Institute not provided"}
      </p>

      {/* Price */}
      <div className="writer-price-box">
        <i className="ri-money-rupee-circle-line"></i>
        <strong>₹{selectedWriter.pricePerPage}</strong>
        <span>/page</span>
      </div>

      {/* Bio */}
      <div className="writer-section">
        <h4>Bio</h4>
        <p className="writer-bio">
          {selectedWriter.bio || "No bio provided."}
        </p>
      </div>

      {/* Subjects */}
      <div className="writer-section">
        <h4>Subjects</h4>
        <div className="writer-tags">
          {(selectedWriter.subjects || []).map((subj, i) => (
            <span key={i} className="writer-tag">{subj}</span>
          ))}
        </div>
      </div>

      {/* Rating + Total works */}
      <div className="writer-stats-row">
        <div className="writer-stat-box">
          <i className="ri-star-fill"></i>
          <span>{selectedWriter.rating || 0}</span>
          <span> </span>
          <small>Rating</small>
        </div>

        <div className="writer-stat-box">
          <i className="ri-file-list-3-line"></i>
          <span>{selectedWriter.totalWorks || 0}</span>
          <span> </span>
          <small>Completed Works</small>
        </div>
      </div>

      {/* Sample works */}
      <div className="writer-section">
        <h4>Sample Works</h4>
        {selectedWriter.sampleWorks?.length > 0 ? (
          <ul className="writer-samples">
            {selectedWriter.sampleWorks.map((link, i) => (
              <li key={i}>
                <a href={link} target="_blank" rel="noreferrer">
                  Sample {i + 1}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="writer-empty">No sample works uploaded.</p>
        )}
      </div>

      {/* Request button */}
      <button
        className="request-writer-btn"
        onClick={() => {
          // setShowWriterDetails(false);
          // // Open existing request modal
          // setSelectedWriter(selectedWriter);
          setRequestWriterData(selectedWriter);
    setShowWriterDetails(false);
    setSelectedWriter(null);
        }}
      >
        Request This Writer
      </button>

    </div>
  </div>
)}


      {/* TOAST */}
      {toast && <div className="toast">{toast}</div>}

      {/* ---------- REQUEST MODAL ---------- */}
      {requestWriterData && (

        <div className="modal-overlay">
          <div className="requestModal">

  {/* HEADER */}
  <div className="requestModal-header">
    <h2>New Assignment Request</h2>
    <button className="requestModal-close" onClick={() => setRequestWriterData(null)}>✕</button>
  </div>

  <p className="requestModal-sub">
    Fill in the details below to find a writer for your assignment.
  </p>

  {/* TOPIC */}
  <label className="requestModal-label">Topic</label>
  <input
    className="requestModal-input"
    type="text"
    placeholder="e.g., The Impact of Renewable Energy"
    value={requestData.topic}
    onChange={(e) =>
      setRequestData({ ...requestData, topic: e.target.value })
    }
  />

  {/* SUBJECT */}
  <label className="requestModal-label">Subject</label>
  <input
    className="requestModal-input"
    type="text"
    placeholder="e.g., Environmental Science"
    value={requestData.subject}
    onChange={(e) =>
      setRequestData({ ...requestData, subject: e.target.value })
    }
  />

  {/* PRICE + PAGES ROW */}
  <div className="requestModal-row">
    <div className="requestModal-col">
      <label className="requestModal-label">Your Offer (₹)</label>
      <input
        className="requestModal-input"
        type="number"
        placeholder="50"
        value={requestData.price}
        onChange={(e) =>
          setRequestData({ ...requestData, price: e.target.value })
        }
      />
    </div>

    <div className="requestModal-col">
      <label className="requestModal-label">Page Count</label>
      <input
        className="requestModal-input"
        type="number"
        placeholder="5"
        value={requestData.pages}
        onChange={(e) =>
          setRequestData({ ...requestData, pages: e.target.value })
        }
      />
    </div>
  </div>

  {/* NOTES */}
  <label className="requestModal-label">Notes & Instructions</label>
  <textarea
    className="requestModal-textarea"
    placeholder="Add any specific requirements, guidelines, or sources..."
    value={requestData.notes}
    onChange={(e) =>
      setRequestData({ ...requestData, notes: e.target.value })
    }
  ></textarea>

  {/* FOOTER */}
  <div className="requestModal-footer">
    <button className="requestModal-cancel" onClick={() => setRequestWriterData(null)}>
      Cancel
    </button>

    <button className="requestModal-submit" onClick={sendRequest}>
      Send Request
    </button>
  </div>

</div>

        </div>
      )}

      {/* ---------- UPLOAD MODAL ---------- */}
      {showUploadModal && (
  <div className="theme-modal-overlay">
    <div className="theme-modal">

      <div className="theme-modal-header">
        <h2>Upload Assignment Files</h2>
        <button
          className="theme-modal-close"
          onClick={() => {
            setShowUploadModal(false);
            setSelectedRequest(null);
          }}
        >
          ✕
        </button>
      </div>

      <div className="theme-modal-body">

        <label className="theme-label">Document Link</label>
        <input
          type="text"
          className="theme-input"
          placeholder="Paste Google Drive or file link"
          value={uploadData.docs}
          onChange={(e) =>
            setUploadData({ ...uploadData, docs: e.target.value })
          }
        />

        <label className="theme-label">Deadline</label>
        <input
          type="date"
          className="theme-input"
          value={uploadData.deadline}
          onChange={(e) =>
            setUploadData({ ...uploadData, deadline: e.target.value })
          }
        />

      </div>

      <div className="theme-modal-actions">
        <button
          className="theme-btn-primary"
          onClick={() => uploadDocs(selectedRequest._id)}
        >
          Upload
        </button>

        <button
          className="theme-btn-secondary"
          onClick={() => {
            setShowUploadModal(false);
            setSelectedRequest(null);
          }}
        >
          Cancel
        </button>
      </div>

    </div>
  </div>
)}


      {/* ---------- RE-NEGOTIATE MODAL ---------- */}
      {showRenegotiation && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Re-negotiate with {selectedRequest.writer?.name}</h3>

            <input
              type="number"
              placeholder="New Price"
              value={renegotiate.price}
              onChange={(e) =>
                setRenegotiate({ ...renegotiate, price: e.target.value })
              }
            />

            <textarea
              placeholder="Message"
              value={renegotiate.message}
              onChange={(e) =>
                setRenegotiate({ ...renegotiate, message: e.target.value })
              }
            ></textarea>

            <div className="modal-actions">
              <button
                className="primary-btn"
                onClick={() => handleRenegotiate(selectedRequest._id)}
              >
                Send
              </button>
              <button
                onClick={() => {
                  setShowRenegotiation(false);
                  setSelectedRequest(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- REQUEST DETAILS MODAL ---------- */}
      {/* ============================
     NEW DETAILS MODAL (OPTION B STYLE)
     EXACT UI FROM SCREENSHOT
============================ */}
{selectedRequest && !showRenegotiation && !showUploadModal && (
  <div className="details-modal-overlay">
    <div className="details-modal">

      {/* Header */}
      <div className="details-header">
        <div className="details-title-left">
          <i className="ri-file-text-line"></i>
          <span>Assignment Details</span>
        </div>
        <button className="details-close" onClick={() => setSelectedRequest(null)}>✕</button>
      </div>

      {/* Topic Title */}
      <h1 className="details-topic">{selectedRequest.topic}</h1>

      {/* Status pill */}
      <div className="details-status-pill">
        <i className="ri-timer-line"></i>
        {selectedRequest.status}
      </div>

      {/* Info Row */}
      <div className="details-info-row">

        <div className="details-info-box">
          <label>Writer</label>
          <div className="details-info-value">
            <i className="ri-user-3-line"></i>
            {selectedRequest.writer?.name}
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
            <i className="ri-money-dollar-circle-line"></i>
            ₹{selectedRequest.price}
          </div>
        </div>

      </div>

      {/* Uploaded Documents */}
      <h3 className="details-section-title">Uploaded Documents</h3>
      <div className="details-doc-list">
        {(selectedRequest.docs || []).map((doc, index) => (
          <div key={index} className="details-doc-item">
            <div className="details-doc-left">
              <i className="ri-file-line"></i>
              <span>{`Document ${index + 1}`}</span>
            </div>
            <a href={doc} target="_blank" rel="noreferrer" className="details-doc-download">
              Download
            </a>
          </div>
        ))}
      </div>

      {/* Negotiation History */}
      {Array.isArray(selectedRequest.negotiations) &&
        selectedRequest.negotiations.length > 0 && (
          <>
            <h3 className="details-section-title">Negotiation History</h3>
            <div className="details-neg-list">
              {selectedRequest.negotiations.map((n, idx) => (
                <div key={idx} className="details-neg-item">
                  <i className="ri-exchange-dollar-line"></i>
                  <div>
                    <div className="details-neg-text">
                      {n.from === user.role ? "You" : n.from} offered{" "}
                      <strong>₹{n.proposedPrice}</strong>
                      {n.message && <div className="details-neg-message">💬 {n.message}</div>}
                    </div>
                    <div className="details-neg-time">
                      {new Date(n.timestamp).toLocaleString()}
                    </div>
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

        {/* ============================
    STUDENT RATING SECTION
============================ */}
{/* RATING SECTION */}
{/* RATING SECTION */}
{selectedRequest.status === "Submitted" && (
  <div className="rating-section">

    <h3 className="rating-title">Rate Your Writer</h3>

    <div className="rating-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={`ri-star-fill star-icon ${
            star <= myRating ? "active" : ""
          }`}
          onClick={() => setMyRating(star)}
        />
      ))}
    </div>

    <button className="rating-submit-btn" onClick={submitReview}>
      {myRating > 0 ? "Update Rating" : "Submit Rating"}
    </button>

  </div>
)}




      {/* Notes / Chat Section */}
      <div className="details-chat-box">

        <div className="details-chat-messages">
          {selectedRequest.notes?.map((note, index) => (
            <div
              key={index}
              className={`chat-bubble ${note.from === user.role ? "me" : "them"}`}
            >
              <div className="chat-text">
                <strong>{note.from === user.role ? "You" : note.from}:</strong>{" "}
                {note.message}
              </div>
              <div className="chat-time">
                {new Date(note.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="details-chat-input-row">
          <input
            type="text"
            placeholder="Type a message..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <button
            className="details-send-btn"
            onClick={() => sendNote(selectedRequest._id)}
          >
            <i className="ri-send-plane-2-fill"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
