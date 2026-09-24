import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import AIChatbot from "../chatbot/AIChatbot";

function Layout({ children }) {
  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <Navbar />

        <div className="page-content">
          {children}
        </div>
      </main>

      {/* AI Floating Chatbot */}
      <AIChatbot />
    </div>
  );
}

export default Layout;