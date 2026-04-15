import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  MessageSquare, 
  Settings, 
  Database, 
  Hammer, 
  Plus, 
  Send, 
  Layers, 
  Cpu, 
  History,
  Loader2
} from 'lucide-react';

const API_BASE = "http://localhost:8006";

const App = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendLive, setIsBackendLive] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll alla fine dei messaggi
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Carica modelli e sessioni all'avvio
  useEffect(() => {
    fetchModels();
    fetchSessions();
  }, []);

  const fetchModels = async () => {
    try {
      const res = await axios.get(`${API_BASE}/ollama/list`);
      setModels(res.data.models || []);
      if (res.data.models?.length > 0) setSelectedModel(res.data.models[0]);
      setIsBackendLive(true);
    } catch (err) { setIsBackendLive(false); }
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/sessions/`);
      setSessions(res.data);
    } catch (err) { console.error(err); }
  };

  const loadSession = async (sessionId) => {
    setCurrentSessionId(sessionId);
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/sessions/${sessionId}/messages`);
      setMessages(res.data);
    } catch (err) { console.error(err); }
    setIsLoading(false);
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setActiveTab('chat');
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedModel || isLoading) return;

    const userMsg = { role: 'user', content: inputText, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    const textToSend = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/chat`, {
        model: selectedModel,
        message: textToSend,
        session_id: currentSessionId
      });
      
      const assistantMsg = { 
        role: 'assistant', 
        content: res.data.content, 
        created_at: new Date().toISOString() 
      };
      setMessages(prev => [...prev, assistantMsg]);
      
      // Se era una nuova chat, aggiorna l'ID sessione e la lista laterale
      if (!currentSessionId) {
        setCurrentSessionId(res.data.session_id);
        fetchSessions();
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Errore di comunicazione." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseISO = (dateStr) => {
    if (!dateStr) return new Date();
    // Se la stringa non finisce con Z o un offset, aggiungiamo Z per forzare UTC
    const normalized = (dateStr.endsWith('Z') || dateStr.includes('+')) ? dateStr : `${dateStr}Z`;
    return new Date(normalized);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return parseISO(dateStr).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    return parseISO(dateStr).toLocaleString('it-IT', { 
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="flex h-full w-full bg-[#09090b] text-zinc-100 antialiased overflow-hidden">
      
      {/* SIDEBAR SINISTRA */}
      <aside className="w-64 bg-[#111113] border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-orange-600 p-2 rounded-lg"><Layers size={20} /></div>
            <span className="text-xl font-bold">Efesto</span>
          </div>

          <button 
            onClick={startNewChat}
            className="w-full mb-6 flex items-center justify-center space-x-2 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl border border-zinc-700 transition-all"
          >
            <Plus size={18} />
            <span className="text-sm font-semibold">Nuova Chat</span>
          </button>

          <nav className="space-y-1 overflow-y-auto max-h-[40vh] mb-6 custom-scrollbar">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 px-4">Recenti</p>
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={`w-full flex items-start space-x-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
                  currentSessionId === s.id ? 'bg-orange-600/10 text-orange-500' : 'text-zinc-500 hover:bg-zinc-900'
                }`}
              >
                <MessageSquare size={16} className="mt-1 shrink-0" />
                <div className="flex flex-col items-start min-w-0">
                  <span className="truncate w-full font-medium">{s.title}</span>
                  <span className="text-[10px] text-zinc-600">
                    {formatDateTime(s.created_at)}
                  </span>
                </div>
              </button>
            ))}
          </nav>

          <div className="space-y-1 border-t border-zinc-800 pt-6">
            <button onClick={() => setActiveTab('tools')} className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-zinc-500 hover:bg-zinc-900">
              <Hammer size={18} /> <span className="text-sm">Strumenti</span>
            </button>
            <button onClick={() => setActiveTab('db')} className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-zinc-500 hover:bg-zinc-900">
              <Database size={18} /> <span className="text-sm">Database</span>
            </button>
          </div>
        </div>

        <div className="mt-auto p-6">
          <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 flex items-center space-x-3">
             <div className={`w-2 h-2 rounded-full ${isBackendLive ? 'bg-green-500 shadow-[0_0_8px_green]' : 'bg-red-500'}`} />
             <span className="text-xs text-zinc-400">{isBackendLive ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </aside>

      {/* AREA CHAT */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-8 border-b border-zinc-800">
          <h2 className="font-semibold">{currentSessionId ? "Dettaglio Chat" : "Nuova Conversazione"}</h2>
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs outline-none"
          >
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {messages.length === 0 && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-50">
               <Layers size={48} className="mb-4" />
               <p>Nessun messaggio in questa conversazione.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex items-start space-x-4 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-orange-600' : 'bg-zinc-700'}`}>
                {msg.role === 'assistant' ? <Layers size={16} /> : <span className="text-[10px]">IO</span>}
              </div>
              <div className={`max-w-[80%] p-4 rounded-2xl relative group ${msg.role === 'assistant' ? 'bg-zinc-900 border border-zinc-800' : 'bg-orange-600/10 border border-orange-600/20'}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap pr-10">{msg.content}</p>
                <span className="absolute bottom-2 right-3 text-[9px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatTime(msg.created_at)}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center space-x-2 text-zinc-500 text-xs animate-pulse">
              <Loader2 className="animate-spin" size={14} /> <span>Efesto sta pensando...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-8">
          <div className="max-w-4xl mx-auto relative flex items-center">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Scrivi un messaggio..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 pr-14 outline-none focus:border-zinc-600 transition-all"
            />
            <button 
              onClick={handleSendMessage}
              className="absolute right-3 bg-orange-600 p-2.5 rounded-xl hover:bg-orange-500 transition-all"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
