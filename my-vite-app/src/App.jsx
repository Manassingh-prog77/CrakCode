import { useState, useRef, useEffect } from "react";
import "./App.css";
import logo from "../public/crakCodeLogoImg.svg";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Scroll to bottom on new messages or loading changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    // 1) Append user message
    setMessages((msgs) => [...msgs, { text, sender: "user" }]);
    setInput("");
    setLoading(true);

    try {
      // 2) Call your Flask API
      const res = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      // 3) Append bot reply
      const botText = data.response ?? "Sorry, something went wrong.";
      setMessages((msgs) => [...msgs, { text: botText, sender: "bot" }]);
    } catch (err) {
      console.error(err);
      setMessages((msgs) => [
        ...msgs,
        { text: "Backend is not responding at the moment.", sender: "bot" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  function formatMessage(text) {
    if (!text) return "";

    // Safely replace only properly paired **bold** parts
    const boldFormatted = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // Optionally escape any stray single '*' to avoid confusion (optional)
    const cleaned = boldFormatted.replace(/\*(?!\*)(.*?)\*/g, "<em>$1</em>");

    return cleaned;
  }

  return (
    <div className="app">
      <div className="outer">
        <div className="dot" />
        <div className="card">
          <div className="ray" />
          <div className="title-container">
            <img src={logo} alt="CrakCode Logo" className="logo-image" />
            <div className="text">CrakCode</div>
          </div>

          <div className="chat-container">
            <div className="chat-box">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`message ${
                    m.sender === "user" ? "user-message" : "bot-message"
                  }`}
                >
                  <div
                    dangerouslySetInnerHTML={{ __html: formatMessage(m.text) }}
                  />
                </div>
              ))}

              {loading && (
                <div className="message bot-message loader-message">
                  <div className="dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="loader-text">Analyzing…</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            <div className="input-area">
              <input
                className="chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                disabled={loading}
              />
              <button
                className="send-button"
                onClick={handleSendMessage}
                disabled={loading}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
