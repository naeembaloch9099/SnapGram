import React, { useContext } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PostProvider } from "./context/PostContext";
// Import MessageProvider AND MessageContext
import { MessageProvider, MessageContext } from "./context/MessageContext";
import AppRoutes from "./routes/AppRoutes";

// Import BOTH modals/pop-ups
import IncomingCallModal from "./components/IncomingCallModal";
import IncomingMessageToast from "./components/incomingmessagetoast"; // ** NEW **

/**
 * NEW: This component is needed to access the call state
 * from *within* the MessageProvider
 */
const AppContent = () => {
  // Get state for BOTH calls and message toasts
  const {
    incomingCall,
    acceptCall,
    declineCall,
    messageToast, // ** NEW **
    closeMessageToast, // ** NEW **
  } = useContext(MessageContext);

  return (
    <>
      {/* Your regular app routes */}
      <AppRoutes />

      {/* This will render the modal ON TOP of your routes when a call comes in */}
      {incomingCall && (
        <IncomingCallModal
          callOffer={incomingCall}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}

      {/* ** NEW: This will render the message pop-up ** */}
      {messageToast && (
        <IncomingMessageToast
          toastData={messageToast}
          onClose={closeMessageToast}
        />
      )}
    </>
  );
};

// Main app: wraps providers and router.
const App = () => {
  return (
    <AuthProvider>
      <PostProvider>
        {/* FIX: <Router> must be ON THE OUTSIDE of MessageProvider. */}
        <Router>
          <MessageProvider>
            {/* AppContent contains your routes and both modals. */}
            <AppContent />
          </MessageProvider>
        </Router>
      </PostProvider>
    </AuthProvider>
  );
};

export default App;
