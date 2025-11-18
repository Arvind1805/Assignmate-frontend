import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import WriterDashboard from "./pages/WriterDashboard";
import WriterProfile from "./pages/WriterProfile";
import WriterProfileSetup from "./pages/WriterProfileSetup";

import "./App.css";
function AppContent() {
  const location = useLocation();

  const hideNavbarRoutes = [
    "/login",
    "/register",
    "/writer/profile-setup",
    "/"
  ];

  const hideNavbar = hideNavbarRoutes.includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/writer/dashboard" element={<WriterDashboard />} />
        <Route path="/writer/:id" element={<WriterProfile />} />
        <Route path="/writer/profile-setup" element={<WriterProfileSetup />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
