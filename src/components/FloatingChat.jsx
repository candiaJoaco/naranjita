// src/components/FloatingChat.jsx
import { useState, useRef, useEffect } from "react";
import OrangeAssistant from "./OrangeAssistant";
import "../styles/App.css";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "¡Hola! Soy Naranjita 🍊. Tu asistente experto en planillas y PLAME. ¿En qué te ayudo?" }
  ]);

  const [input, setInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatEndRef = useRef(null);
  const intervalRef = useRef(null);

  // 🔑 API KEY DIRECTA (SOLO PARA PRUEBAS)
  const MISTRAL_API_KEY = "ZCzZctGc8ZKEnTXIUc6zxju7Su7UY3OJ";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  // ------------------------------------------------------
  // ✨ EFECTO MÁQUINA DE ESCRIBIR
  // ------------------------------------------------------
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

  // ------------------------------------------------------
  // 🚨 MOSTRAR ERROR DETALLADO EN EL CHAT
  // ------------------------------------------------------
  const showError = (title, detail) => {
    const errorMessage = `⚠️ ¡Ups! Ha ocurrido un error.\n\n${title}\n\nRazón: ${detail}\n\n🍊`;
    typeWriter(errorMessage);
  };

  // ------------------------------------------------------
  // 🤖 LLAMADA A MISTRAL AI CON MANEJO DE ERRORES
  // ------------------------------------------------------
  const getAIResponse = async (userMessage) => {
    try {
      setIsSpeaking(false);

      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: [
            {
              role: "system",
              content: `
                Actúa como "Naranjita", asistente de Computer Patrisoft S.A.C.
                - Sé amable, experto en planillas/PLAME.
                - Máximo 3 frases.
                - Siempre termina con el emoji 🍊.
              `
            },
            { role: "user", content: userMessage }
          ]
        })
      });

      // ❗ SI LA RESPUESTA NO ES OK → ERROR HTTP
      if (!response.ok) {
        const errorText = `Código HTTP: ${response.status} (${response.statusText})`;
        showError("El servidor de IA rechazó la solicitud.", errorText);
        return;
      }

      const data = await response.json();

      // ❗ SI NO VIENE EL MENSAJE ADECUADO
      if (!data?.choices?.[0]?.message?.content) {
        showError(
          "La IA no devolvió un mensaje válido.",
          "La estructura 'choices[0].message.content' venía vacía."
        );
        return;
      }

      const aiText = data.choices[0].message.content;
      typeWriter(aiText);

    } catch (error) {
      console.error("ERROR:", error);

      showError(
        "Error de conexión con la IA.",
        error?.message ?? "Causa desconocida"
      );
    }
  };

  // ------------------------------------------------------
  // 📤 Enviar mensaje
  // ------------------------------------------------------
  const handleSend = () => {
    if (!input.trim()) return;
    if (isSpeaking) return;

    setMessages((prev) => [...prev, { from: "user", text: input }]);
    const userMessage = input;
    setInput("");

    setIsSpeaking(false);
    getAIResponse(userMessage);
  };

  return (
    <div className="floating-container">

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

          <div className="chat-input-area">
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Pregunta sobre planillas..."
              disabled={isSpeaking}
            />

            <button className="btn-primary" onClick={handleSend} disabled={isSpeaking}>
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
