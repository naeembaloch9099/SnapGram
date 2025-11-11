import React, { useContext } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PostProvider } from "./context/PostContext";
import { MessageProvider, MessageContext } from "./context/MessageContext";
import AppRoutes from "./routes/AppRoutes";

// Modals
import IncomingCallModal from "./components/IncomingCallModal";
import IncomingMessageToast from "./components/incomingmessagetoast";

const AppContent = () => {
  const {
    incomingCall,
    acceptCall,
    declineCall,
    messageToast,
    closeMessageToast,
  } = useContext(MessageContext);

  return (
    <>
      <AppRoutes />

      {/* Call popup */}
      {incomingCall && (
        <IncomingCallModal
          callOffer={incomingCall}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}

      {/* Message popup */}
      {messageToast && (
        <IncomingMessageToast
          toastData={messageToast}
          onClose={closeMessageToast}
        />
      )}
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <PostProvider>
          <MessageProvider>
            <AppContent />
          </MessageProvider>
        </PostProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
