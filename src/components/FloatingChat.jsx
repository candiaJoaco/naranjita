// src/components/FloatingChat.jsx
import { useState, useRef, useEffect } from "react";
import OrangeAssistant from "./OrangeAssistant";
import "../styles/App.css";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "¡Hola! Soy Naranjita 🍊, tu asistente en Planillas y PLAME. ¿En qué te ayudo?" }
  ]);

  const [input, setInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const chatEndRef = useRef(null);
  const intervalRef = useRef(null);

  // ----------------------------------------------------------
  // ⚠️ 👉 AQUÍ COLOCAS TU INFORMACIÓN DE AZURE
  // ----------------------------------------------------------
  const AZURE_API_KEY = "B6kjnA8rgq8BSdarz0JfGBYbuxefsXfWfHpf6c6x0FOBpqyid0NxJQQJ99BKACHYHv6XJ3w3AAAAACOGAkEO";
  const AZURE_ENDPOINT = "https://openai-naranjita.openai.azure.com/"; 
  const DEPLOYMENT_NAME = "gpt-4o-mini";     // o el nombre que pusiste en Azure
  const API_VERSION = "2024-02-01";          // versión estable

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Limpieza de intervalos
  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  // ----------------------------------------------------------
  // ✨ EFECTO MÁQUINA DE ESCRIBIR
  // ----------------------------------------------------------
  const typeWriter = (text) => {
    setIsSpeaking(true);

    let index = 0;
    setMessages((prev) => [...prev, { from: "bot", text: "" }]);

    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];

        lastMsg.text = text.substring(0, index + 1);
        return updated;
      });

      index++;

      if (index >= text.length) {
        clearInterval(intervalRef.current);
        setIsSpeaking(false);
      }
    }, 30);
  };

  // ----------------------------------------------------------
  // 🤖 FUNCIÓN: LLAMAR A AZURE OPENAI
  // ----------------------------------------------------------
  const getAIResponse = async (userMessage) => {
    try {
      setIsSpeaking(false);

      const url = `${AZURE_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=${API_VERSION}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": AZURE_API_KEY
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `
                Eres "Naranjita", asistente virtual de Computer Patrisoft S.A.C.
                - Sé amable y profesional.
                - Responde en máximo 3 frases.
                - Siempre termina con el emoji 🍊.
              `
            },
            {
              role: "user",
              content: userMessage
            }
          ]
        })
      });

      const data = await response.json();

      const aiText =
        data?.choices?.[0]?.message?.content ??
        "Lo siento, no pude procesar tu mensaje. 🍊";

      typeWriter(aiText);

    } catch (error) {
      console.error("Error Azure:", error);
      typeWriter("Ups… hubo un error al conectar con Azure OpenAI. 🍊");
    }
  };

  // ----------------------------------------------------------
  // 📨 ENVIAR MENSAJE
  // ----------------------------------------------------------
  const handleSend = () => {
    if (!input.trim()) return;
    if (isSpeaking) return;

    setMessages((prev) => [...prev, { from: "user", text: input }]);

    const userMessage = input;
    setInput("");

    getAIResponse(userMessage);
  };

  return (
    <div className="floating-container">

      {/* Ventana de chat */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <span style={{ fontWeight: "600" }}>Asistente Naranjita</span>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontSize: "1.2rem"
              }}
            >
              ✕
            </button>
          </div>

          <div className="chat-body">
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.from}`}>
                {m.text}
              </div>
            ))}

            {/* Pensando… */}
            {messages[messages.length - 1]?.from === "user" && !isSpeaking && (
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#888",
                  marginLeft: "10px",
                  marginBottom: "10px",
                  fontStyle: "italic"
                }}
              >
                Naranjita está pensando...
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Área de input */}
          <div className="chat-input-area">
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Pregunta sobre planillas..."
              disabled={isSpeaking}
            />

            <button
              className="btn-primary"
              onClick={handleSend}
              disabled={isSpeaking}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button className="naranjita-btn" onClick={() => setIsOpen(!isOpen)}>
        <OrangeAssistant isSpeaking={isSpeaking} />
      </button>
    </div>
  );
}
