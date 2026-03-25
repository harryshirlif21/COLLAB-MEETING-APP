import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup        from "./pages/Signup.jsx";
import Login         from "./pages/Login.jsx";
import Dashboard     from "./pages/Dashboard.jsx";
import MeetingsList  from "./pages/MeetingsList.jsx";
import MeetingRoom   from "./pages/MeetingRoom.jsx";
import Profile       from "./pages/Profile.jsx";
import MeetingHistory from "./pages/MeetingHistory.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup"   element={<Signup />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/meetings"  element={<MeetingsList />} />
        <Route path="/meeting/:code" element={<MeetingRoom />} />
        <Route path="/profile"   element={<Profile />} />
        <Route path="/history"   element={<MeetingHistory />} />
        <Route path="*"          element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
