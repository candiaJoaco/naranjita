// src/components/FloatingChat.jsx
import { useState, useRef, useEffect } from "react";
import OrangeAssistant from "./OrangeAssistant";
import "../styles/App.css";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "¡Hola! Soy Naranjita 🍊. ¿En qué te ayudo?" }
  ]);

  const [input, setInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatEndRef = useRef(null);
  const intervalRef = useRef(null);

  // 🟧 API Key de Mistral
  const MISTRAL_API_KEY = "UCcNhmjfxXVc1FU6Eijlat1JwtYcpNzd";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ------------------------------------------------------
  // 🔊 VOZ ESPAÑOL - palabra por palabra
  // ------------------------------------------------------
  const speakWord = (word) => {
    const utter = new SpeechSynthesisUtterance(word);

    let voices = window.speechSynthesis.getVoices();

    const spanishVoice =
      voices.find(v => v.lang.startsWith("es") && v.name.includes("Male")) ||
      voices.find(v => v.lang.startsWith("es") && v.name.includes("Standard")) ||
      voices.find(v => v.lang.startsWith("es")) ||
      voices[0];

    utter.voice = spanishVoice;
    utter.pitch = 0.7;  // grave
    utter.rate = 1;
    utter.volume = 1;

    window.speechSynthesis.cancel(); // evita superposición
    window.speechSynthesis.speak(utter);
  };

  // ------------------------------------------------------
  // ✨ MÁQUINA DE ESCRIBIR + voz por palabra
  // ------------------------------------------------------
  const typeWriter = (fullText) => {
    let index = 0;
    let currentWord = "";

    setIsSpeaking(true);
    setMessages(prev => [...prev, { from: "bot", text: "" }]);

    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];

        const nextChar = fullText[index];

        last.text += nextChar;

        // --- 👇 Detectar fin de palabra ---
        if (nextChar === " " || nextChar === "." || nextChar === "," || index === fullText.length - 1) {
          currentWord += nextChar.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, "");

          if (currentWord.trim().length > 0) {
            speakWord(currentWord);
          }

          currentWord = "";
        } else {
          currentWord += nextChar;
        }

        return updated;
      });

      index++;

      if (index >= fullText.length) {
        clearInterval(intervalRef.current);
        setIsSpeaking(false);
      }

    }, 40);
  };

  // ------------------------------------------------------
  // 🤖 Llamada a Mistral AI
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
                Eres Naranjita, asistente de Computer Patrisoft S.A.C.
                Responde en español, de manera clara y amable.
                Máximo 3 frases. Termina con 🍊.
              `
            },
            { role: "user", content: userMessage }
          ]
        })
      });

      const data = await response.json();
      const aiText =
        data?.choices?.[0]?.message?.content ??
        "Hubo un error, lo siento. 🍊";

      typeWriter(aiText);

    } catch (err) {
      console.error(err);
      typeWriter("No pude conectar con la IA. 🍊");
    }
  };

  // ------------------------------------------------------
  // 📩 Enviar mensaje
  // ------------------------------------------------------
  const handleSend = () => {
    if (!input.trim()) return;
    if (isSpeaking) return;

    setMessages(prev => [...prev, { from: "user", text: input }]);

    const userMessage = input;
    setInput("");
    getAIResponse(userMessage);
  };

  return (
    <div className="floating-container">
      {isOpen && (
        <div className="chat-window">

          <div className="chat-header">
            <b>Naranjita – Asistente</b>
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
              <div style={{
                fontSize: "0.8rem",
                color: "#888",
                marginLeft: "10px",
                fontStyle: "italic"
              }}>
                Naranjita está pensando...
              </div>
            )}

            <div ref={chatEndRef}></div>
          </div>

          <div className="chat-input-area">
            <input
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Escribe tu consulta..."
              disabled={isSpeaking}
            />

            <button className="btn-primary" onClick={handleSend} disabled={isSpeaking}>
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Naranjita flotante */}
      <button className="naranjita-btn" onClick={() => setIsOpen(!isOpen)}>
        <OrangeAssistant isSpeaking={isSpeaking} />
      </button>
    </div>
  );
}
