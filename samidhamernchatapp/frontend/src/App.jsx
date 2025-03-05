// import Navbar from "./components/Navbar";

import SignUpPage from "./Pages/SignUpPages";
import LoginPage from "./Pages/LoginPage";
import ProfilePage from "./Pages/ProfilePage";
// import SettingsPage from "./pages/SettingsPage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useTheamStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import SettingsPage from "./Pages/SettingPage";
import HomePage from "./Pages/HomePage";
import { useChatStore } from "./store/useChatStore";
import { useGroupStore } from "./store/useGroupStore";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers,socket } = useAuthStore();
  const { theme } = useThemeStore();
  const { subscribeToUnreadMessages } = useChatStore();
  const { subscribeToUnreadGroupMessages } = useGroupStore();


  useEffect(() => {
    checkAuth();

    // Ensure socket connection when component mounts
    if (authUser && !socket) {
      connectSocket();
    }
    
    // Setup unread message tracking
    if (authUser) {
      // Small delay to ensure socket is connected
      const timeoutId = setTimeout(() => {
        subscribeToUnreadMessages();
        subscribeToUnreadGroupMessages();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [checkAuth]);


  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div data-theme={theme}>
      <Navbar />

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>

      <Toaster />
    </div>
  );
};
export default App;