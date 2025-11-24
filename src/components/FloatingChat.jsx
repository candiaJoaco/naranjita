import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai"; 
import OrangeAssistant from "./OrangeAssistant";
import "../styles/App.css"; // Asegúrate que la ruta sea correcta

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "¡Hola! Soy Naranjita 🍊. Tu asistente experto en planillas y PLAME. ¿En qué te ayudo?" }
  ]);
  const [input, setInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false); // Controla la animación
  const chatEndRef = useRef(null);
  const intervalRef = useRef(null); // Para limpiar intervalos

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  // --- FUNCIÓN DE ESCRITURA (EFECTO MÁQUINA DE ESCRIBIR) ---
  const typeWriter = (text) => {
    // 🔥 SOLO AQUÍ: Naranjita empieza a animarse cuando el texto YA ESTÁ SALIENDO
    setIsSpeaking(true); 

    let index = 0;
    setMessages(prev => [...prev, { from: "bot", text: "" }]);
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
        setIsSpeaking(false); // Se detiene al finalizar de escribir
      }
    }, 30); // Velocidad de escritura
  };

  // --- LLAMADA A LA IA ---
  const getAIResponse = async (userMessage) => {
    try {
      // 🛑 IMPORTANTE: Naranjita NO HABLA (está estática) mientras la IA "piensa"
      setIsSpeaking(false); // Aseguramos que esté estática
      
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Actúa como "Naranjita", el Asistente Virtual oficial de la empresa "Computer Patrisoft S.A.C.".
        Instrucciones:
        1. Eres amable, profesional y experto en gestión de planillas, PLAME y RRHH.
        2. Responde de forma concisa (máximo 2 o 3 frases).
        3. Termina SIEMPRE con el emoji: 🍊.
        Pregunta: "${userMessage}"
      `;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      // Una vez que tenemos la respuesta completa, llamamos a typeWriter.
      // typeWriter es quien activa setIsSpeaking(true) para la animación de escritura.
      typeWriter(response);

    } catch (error) {
      console.error("Error IA:", error);
      setIsSpeaking(false); // Por si acaso hubo un error y la dejó animada
      typeWriter(`¡Claro! Con gusto. El siguiente sistema de la empresa Computer Patrisoft SAC, se encarga de la automatización de planillas, cálculos de remuneraciones y todas tus declaraciones PLAME y RRHH. 🍊`);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return; // No permitir enviar mensajes vacíos
    if (isSpeaking) return; // No permitir enviar si Naranjita ya está escribiendo

    setMessages(prev => [...prev, { from: "user", text: input }]);
    const userMessage = input;
    setInput("");
    
    // Naranjita se queda estática mientras espera la respuesta de la IA (estado inicial)
    setIsSpeaking(false); 
    
    getAIResponse(userMessage); 
  };

  return (
    <div className="floating-container">
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <span style={{ fontWeight: '600' }}>Asistente Naranjita</span>
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              ✕
            </button>
          </div>
          
          <div className="chat-body">
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.from}`}>
                <div>{m.text}</div>
              </div>
            ))}
            {/* Mensaje de "Pensando..." visual SOLO cuando el usuario envió y Naranjita no está escribiendo aún */}
            {/* Comprobamos si el último mensaje fue del usuario Y Naranjita NO está en modo "speaking" */}
            {messages[messages.length - 1]?.from === 'user' && !isSpeaking && (
              <div style={{ fontSize: '0.8rem', color: '#888', marginLeft: '10px', fontStyle: 'italic', marginBottom: '10px' }}>
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
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pregunta sobre planillas..."
              disabled={isSpeaking} // Desactivamos el input mientras Naranjita está escribiendo
            />
            <button className="btn-primary" onClick={handleSend} disabled={isSpeaking}>
              ➤
            </button>
          </div>
        </div>
      )}

      {/* OrangeAssistant recibe el estado isSpeaking */}
      <button className="naranjita-btn" onClick={() => setIsOpen(!isOpen)}>
        <OrangeAssistant isSpeaking={isSpeaking} />
      </button>
    </div>
  );
}

