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

  // 🔑 CLAVE DE MISTRAL (NO USAR EN PRODUCCIÓN)
  const MISTRAL_API_KEY = "UCcNhmjfxXVc1FU6Eijlat1JwtYcpNzd";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  // ------------------------------------------------------
  // 🔊 VOZ GRAVE (Web Speech API)
  // ------------------------------------------------------
  const speak = (text) => {
    const utter = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    const graveVoice =
      voices.find(v => v.name.includes("Male")) ||
      voices.find(v => v.name.includes("Deep")) ||
      voices.find(v => v.name.includes("Standard B")) ||
      voices[0];

    utter.voice = graveVoice;
    utter.pitch = 0.6; // tono grave
    utter.rate = 1;    // velocidad normal
    utter.volume = 1;

    window.speechSynthesis.speak(utter);
  };

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

        // 🔊 VOZ GRAVE AL TERMINAR DE ESCRIBIR
        speak(text);
      }
    }, 30);
  };

  // ------------------------------------------------------
  // 🤖 MISTRAL AI
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
                Actúa como "Naranjita", el asistente de Computer Patrisoft S.A.C.
                - Sé amable, profesional y experto en planillas, RRHH y PLAME.
                - Responde en máximo 3 frases.
                - Termina siempre con el emoji 🍊.
              `
            },
            { role: "user", content: userMessage }
          ]
        })
      });

      const data = await response.json();
      const aiText =
        data?.choices?.[0]?.message?.content ??
        "Ups... no pude procesar tu consulta. 🍊";

      typeWriter(aiText);

    } catch (error) {
      console.error("Error IA:", error);
      typeWriter("Lo siento, hubo un problema conectando con la IA. 🍊");
    }
  };

  // ------------------------------------------------------
  // 📩 Enviar mensaje
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
