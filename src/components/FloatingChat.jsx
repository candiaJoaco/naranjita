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

  // API KEY
  const MISTRAL_API_KEY = "UCcNhmjfxXVc1FU6Eijlat1JwtYcpNzd";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // ------------------------------------------------------
  // 🔊 VOZ GRAVE EN ESPAÑOL (con reproducción incremental)
  // ------------------------------------------------------
  const speakChunk = (textChunk) => {
    if (!textChunk.trim()) return;

    const utter = new SpeechSynthesisUtterance(textChunk);

    let voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
      };
    }

    const voiceEs =
      voices.find(v => v.lang.startsWith("es") && v.name.includes("Male")) ||
      voices.find(v => v.lang.startsWith("es") && v.name.includes("Standard")) ||
      voices.find(v => v.lang.startsWith("es") && v.name.includes("Deep")) ||
      voices.find(v => v.lang.startsWith("es")) ||
      voices[0];

    utter.voice = voiceEs;
    utter.pitch = 0.6;
    utter.rate = 1;
    utter.volume = 1;

    window.speechSynthesis.speak(utter);
  };

  // ------------------------------------------------------
  // ✨ EFECTO MÁQUINA DE ESCRIBIR + AUDIO EN TIEMPO REAL
  // ------------------------------------------------------
  const typeWriter = (fullText) => {
    setIsSpeaking(true);

    let index = 0;
    let audioBuffer = ""; // contiene texto aún no hablado

    setMessages(prev => [...prev, { from: "bot", text: "" }]);

    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      index++;

      setMessages(prev => {
        const msgs = [...prev];
        const last = msgs[msgs.length - 1];
        last.text = fullText.substring(0, index);
        return msgs;
      });

      // añadir fragmento al buffer
      const newChar = fullText[index - 1];
      audioBuffer += newChar;

      // hablar cada 10 caracteres
      if (audioBuffer.length >= 10 && newChar === " ") {
        speakChunk(audioBuffer);
        audioBuffer = "";
      }

      if (index >= fullText.length) {
        clearInterval(intervalRef.current);
        setIsSpeaking(false);

        // hablar lo último que queda pendiente
        if (audioBuffer.trim().length > 0) {
          speakChunk(audioBuffer);
        }
      }

    }, 35);
  };

  // ------------------------------------------------------
  // 🤖 PETICIÓN A MISTRAL AI
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
                Responde SIEMPRE en español.
                Sé amable, profesional y experto en planillas/PLAME.
                Máximo 3 frases. Termina con 🍊.
              `
            },
            { role: "user", content: userMessage }
          ]
        })
      });

      const data = await response.json();
      const aiText = data?.choices?.[0]?.message?.content ?? "Hubo un error 🍊";

      typeWriter(aiText);

    } catch (err) {
      console.error("Error IA:", err);
      typeWriter("Lo siento, hubo un error con la IA. 🍊");
    }
  };

  // ------------------------------------------------------
  // 📩 ENVIAR MENSAJE
  // ------------------------------------------------------
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

          {/* CHAT BODY */}
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

      {/* Naranjita */}
      <button className="naranjita-btn" onClick={() => setIsOpen(!isOpen)}>
        <OrangeAssistant isSpeaking={isSpeaking} />
      </button>
    </div>
  );
}
