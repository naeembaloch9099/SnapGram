import React, { Suspense, lazy, useContext } from "react";
import Loader from "../components/Loader";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import MainLayout from "../layout/MainLayout";
import AuthLayout from "../layout/AuthLayout";
// Note: You aren't using ProtectedRoute in your logic, so I've removed the unused import.

// Lazy load pages for faster dev experience
const Home = lazy(() => import("../pages/Home"));
const Explore = lazy(() => import("../pages/Explore"));
const Reels = lazy(() => import("../pages/Reels"));
const Profile = lazy(() => import("../pages/Profile/Profile"));
const EditProfile = lazy(() => import("../pages/Profile/EditProfile"));
const Messages = lazy(() => import("../pages/Messages/Messages"));
const Notifications = lazy(() => import("../pages/Notifications"));
const PostView = lazy(() => import("../pages/Post/PostView"));
const Create = lazy(() => import("../components/CreatePostModal"));
const Settings = lazy(() => import("../pages/Settings"));
const Login = lazy(() => import("../pages/Auth/Login"));
const Signup = lazy(() => import("../pages/Auth/Signup"));
const ForgotPassword = lazy(() => import("../pages/Auth/ForgotPassword"));
const NotFound = lazy(() => import("../pages/NotFound"));

// Legal pages (public)
const Privacy = lazy(() => import("../pages/Privacy"));
const Terms = lazy(() => import("../pages/Terms"));
const DataDeletion = lazy(() => import("../pages/DataDeletion"));
// ---
// **1. LAZY LOAD THE NEW CALL PAGE**
// ---
const CallPage = lazy(() => import("../pages/Callpage"));

const AppRoutes = () => {
  const { activeUser } = useContext(AuthContext);

  return (
    <Suspense fallback={<Loader fullScreen={true} size="lg" />}>
      <Routes>
        {/* Public/legal pages */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/data-deletion" element={<DataDeletion />} />
        {/* If not authenticated, only expose auth routes and redirect everything to /login */}
        {!activeUser ? (
          <>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            {/* ---
              - **2. AUTHENTICATED ROUTES**
              - --- */}

            {/* Routes WITH the main layout (sidebar, header, etc.) */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/reels" element={<Reels />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/profile/edit" element={<EditProfile />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:id" element={<Messages />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/post/:id" element={<PostView />} />
              <Route path="/create" element={<Create />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* ---
              - **3. FULL-SCREEN ROUTES (NO LAYOUT)**
              - The CallPage goes here so it can be full-screen.
              - --- */}
            <Route path="/call/:callId" element={<CallPage />} />

            {/* Auth routes (for already-logged-in users) */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </>
        )}
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
