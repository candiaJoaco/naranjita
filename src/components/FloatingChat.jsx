// src/components/FloatingChat.jsx
import { useState, useRef, useEffect } from "react";
import OrangeAssistant from "./OrangeAssistant";
import "../styles/App.css";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "¡Hola! Soy Naranjita 🍊. ¿En qué te ayudo hoy?" }
  ]);

  const [input, setInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const chatEndRef = useRef(null);
  const intervalRef = useRef(null);

  // ------------------------------
  // 🔑 API KEY
  // ------------------------------
  const MISTRAL_API_KEY = "UCcNhmjfxXVc1FU6Eijlat1JwtYcpNzd";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // ---------------------------------------------------------
  // 🔊 FUNCIÓN DE VOZ EN ESPAÑOL (HABLA MIENTRAS GENERA)
  // ---------------------------------------------------------
  const speakChunk = (chunk) => {
    if (!chunk.trim()) return;

    const utter = new SpeechSynthesisUtterance(chunk);

    let voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
      };
    }

    const spanishVoice =
      voices.find(v => v.lang.startsWith("es") && v.name.includes("Male")) ||
      voices.find(v => v.lang.startsWith("es") && v.name.includes("Standard")) ||
      voices.find(v => v.lang.startsWith("es")) ||
      voices[0];

    utter.voice = spanishVoice;
    utter.pitch = 0.65;  // voz grave
    utter.rate = 1.0;
    utter.volume = 1;

    window.speechSynthesis.speak(utter);
  };

  // ---------------------------------------------------------
  // ✨ EFECTO MÁQUINA DE ESCRIBIR + AUDIO EN VIVO
  // ---------------------------------------------------------
  const typeWriter = (fullText) => {
    setIsSpeaking(true);

    let index = 0;
    let voiceBuffer = "";

    setMessages(prev => [...prev, { from: "bot", text: "" }]);

    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      index++;

      // actualizar el texto visible
      setMessages(prev => {
        const msgs = [...prev];
        msgs[msgs.length - 1].text = fullText.substring(0, index);
        return msgs;
      });

      // capturar letra para hablar
      const newChar = fullText[index - 1];
      voiceBuffer += newChar;

      // HABLAR cada 8–12 caracteres o al final de una palabra
      if (voiceBuffer.length >= 10 && newChar === " ") {
        speakChunk(voiceBuffer);
        voiceBuffer = "";
      }

      // cuando termina
      if (index >= fullText.length) {
        clearInterval(intervalRef.current);
        setIsSpeaking(false);

        // hablar cualquier fragmento pendiente
        if (voiceBuffer.trim().length > 0) {
          speakChunk(voiceBuffer);
        }
      }

    }, 35); // velocidad de escritura
  };

  // ---------------------------------------------------------
  // 🤖 MISTRAL AI
  // ---------------------------------------------------------
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
                Eres "Naranjita", asistente oficial de Computer Patrisoft.
                Respondes SIEMPRE en español.
                Eres amable, profesional y experto en Planillas, RRHH y PLAME.
                Máximo 3 frases. Termina con 🍊.
              `
            },
            { role: "user", content: userMessage }
          ]
        })
      });

      const data = await response.json();
      const aiText = data?.choices?.[0]?.message?.content ?? "Error en el servidor 🍊";

      typeWriter(aiText);

    } catch (error) {
      console.error("Error IA:", error);
      typeWriter("Lo siento, tuve problemas para conectar con la IA. 🍊");
    }
  };

  // ---------------------------------------------------------
  // 📩 Enviar Mensaje
  // ---------------------------------------------------------
  const handleSend = () => {
    if (!input.trim()) return;
    if (isSpeaking) return;

    setMessages(prev => [...prev, { from: "user", text: input }]);
    const msg = input;
    setInput("");
    getAIResponse(msg);
  };

  return (
    <div className="floating-container">
      {isOpen && (
        <div className="chat-window">

          {/* HEADER */}
          <div className="chat-header">
            <span style={{ fontWeight: "600" }}>Asistente Naranjita</span>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "1.2rem" }}
            >
              ✕
            </button>
          </div>

          {/* CUERPO DEL CHAT */}
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

          {/* INPUT */}
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

      {/* BOTÓN FLOTANTE */}
      <button className="naranjita-btn" onClick={() => setIsOpen(!isOpen)}>
        <OrangeAssistant isSpeaking={isSpeaking} />
      </button>
    </div>
  );
}
