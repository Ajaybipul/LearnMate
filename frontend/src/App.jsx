import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

import DashboardLayout from "./components/DashboardLayout.jsx";
import ChatbotWidget from "./components/ChatbotWidget.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleRoute from "./components/RoleRoute.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import InstructorDashboard from "./pages/InstructorDashboard.jsx";
import CreateCourse from "./pages/CreateCourse.jsx";
import EditCourse from "./pages/EditCourse.jsx";
import CourseStudents from "./pages/CourseStudents.jsx";
import CoursePlayer from "./pages/CoursePlayer.jsx";
import LearningPath from "./pages/LearningPath.jsx";
import Profile from "./pages/Profile.jsx";
import TechnicalSummary from "./pages/TechnicalSummary.jsx";

function AppRoutes() {
  const { user } = useAuth();
  const isInstructor = user?.role === "instructor" || user?.role === "admin";

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route
        path="/"
        element={<Navigate to={user ? (isInstructor ? "/instructor" : "/dashboard") : "/login"} />}
      />

      {/* Student routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/learning-path" element={<RoleRoute roles={["student", "admin"]}><LearningPath /></RoleRoute>} />
      <Route path="/learning-path/:id" element={<RoleRoute roles={["student", "admin"]}><LearningPath /></RoleRoute>} />

      {/* Instructor routes */}
      <Route path="/instructor" element={<RoleRoute roles={["instructor", "admin"]}><InstructorDashboard /></RoleRoute>} />
      <Route path="/create-course" element={<RoleRoute roles={["instructor", "admin"]}><CreateCourse /></RoleRoute>} />
      <Route path="/course/:id/edit" element={<RoleRoute roles={["instructor", "admin"]}><EditCourse /></RoleRoute>} />
      <Route path="/course/:id/students" element={<RoleRoute roles={["instructor", "admin"]}><CourseStudents /></RoleRoute>} />

      {/* Shared */}
      <Route path="/course/:id" element={<ProtectedRoute><CoursePlayer /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/technical-summary" element={<RoleRoute roles={["instructor", "admin"]}><TechnicalSummary /></RoleRoute>} />
    </Routes>
  );
}

export default function App() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-body">
        <AppRoutes />
      </div>
    );
  }

  return (
    <div className="font-body text-slate-900">
      <DashboardLayout>
        <AppRoutes />
      </DashboardLayout>
      <ChatbotWidget />
    </div>
  );
}