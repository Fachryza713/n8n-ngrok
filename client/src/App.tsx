import { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatMessages from './components/ChatMessages';
import ChatInput from './components/ChatInput';
import TypingIndicator from './components/TypingIndicator';
import SettingsModal from './components/SettingsModal';
import Sidebar from './components/Sidebar';
import { Login } from './components/Login';
import { supabase } from './supabase';
import type { Message, Config, ConversationMessage, ChatResponse } from './types/types';
import './styles/App.css';

const API_BASE_URL = 'http://localhost:3000';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const [config, setConfig] = useState<Config>({
    apiUrl: 'https://schemeless-charli-unenlightenedly.ngrok-free.dev/webhook/bc3934df-8d10-48df-9960-f0db1e806328',
    temperature: 0.7,
    userName: 'User',
  });

  // Session State
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Auth State
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Load user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Prioritize localStorage name if exists, otherwise use session name
        const savedUserName = localStorage.getItem('userName');
        setConfig(prev => ({
          ...prev,
          userName: savedUserName || session.user.user_metadata.full_name || session.user.email || 'User'
        }));
        fetchSessions(session.user.id);
      }
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Prioritize localStorage name if exists, otherwise use session name
        const savedUserName = localStorage.getItem('userName');
        setConfig(prev => ({
          ...prev,
          userName: savedUserName || session.user.user_metadata.full_name || session.user.email || 'User'
        }));
        fetchSessions(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);



  // Load settings from localStorage
  useEffect(() => {
    const savedApiUrl = localStorage.getItem('apiUrl');
    const savedTemp = localStorage.getItem('temperature');
    const savedNightMode = localStorage.getItem('nightMode');
    const savedUserName = localStorage.getItem('userName');

    if (savedApiUrl) {
      setConfig(prev => ({ ...prev, apiUrl: savedApiUrl }));
    }
    if (savedTemp) {
      setConfig(prev => ({ ...prev, temperature: parseFloat(savedTemp) }));
    }
    if (savedUserName) {
      setConfig(prev => ({ ...prev, userName: savedUserName }));
    }
    if (savedNightMode === 'true') {
      setIsNightMode(true);
    }

    // Load sessions on mount is handled by auth effect now
  }, []);

  const fetchSessions = async (userId: string) => {
    setIsLoadingSessions(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Apply night mode class to body
  useEffect(() => {
    if (isNightMode) {
      document.body.classList.add('night-mode');
    } else {
      document.body.classList.remove('night-mode');
    }
  }, [isNightMode]);

  const handleNightModeToggle = () => {
    const newMode = !isNightMode;
    setIsNightMode(newMode);
    localStorage.setItem('nightMode', newMode.toString());
  };

  const handleSaveSettings = (newConfig: Config) => {
    setConfig(newConfig);
    localStorage.setItem('apiUrl', newConfig.apiUrl);
    localStorage.setItem('temperature', newConfig.temperature.toString());
    localStorage.setItem('userName', newConfig.userName);
    showNotification('Pengaturan berhasil disimpan!');
  };

  const showNotification = (message: string) => {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      z-index: 10000;
      animation: slideInRight 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setConversationHistory([]);
  };

  const handleSessionSelect = async (sessionId: string) => {
    if (sessionId === currentSessionId) return;

    setCurrentSessionId(sessionId);
    setMessages([]); // Clear while loading
    setIsLoadingSessions(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        // Transform stored messages if needed to match UI Message type
        // Assuming data comes in a format we can map or use directly
        // If data structure is complex, might need mapping logic here
        if (Array.isArray(data)) {
          // Basic mapping - adjust based on actual DB structure
          const mappedMessages: Message[] = data.map((msg: any) => ({
            id: msg.id || Date.now().toString(),
            text: typeof msg.message === 'string' ? msg.message : JSON.stringify(msg.message),
            isUser: msg.role === 'human' || msg.type === 'human', // Adjust based on LangChain schema
            timestamp: new Date(msg.created_at || Date.now()),
            imageUrl: msg.image_url, // Map URL
          }));
          setMessages(mappedMessages);

          // For now, if we don't know the schema, we might not show old messages correctly
          // unless we verify the structure.
          // Placeholder:
          // showNotification('History loaded (schema adaptation required)');
        }
      }
    } catch (error) {
      console.error('Failed to load session messages:', error);
      showNotification('Gagal memuat riwayat chat');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          handleNewChat();
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      showNotification('Gagal menghapus chat');
    }
  };

  const handleSendMessage = async (messageText: string, file: File | null) => {
    if (!messageText.trim() && !file) return;

    // Generate Session ID if new
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      activeSessionId = crypto.randomUUID();
      setCurrentSessionId(activeSessionId);
    }

    // Add user message
    if (messageText || file) { // Allow empty text if file exists
      const userMessage: Message = {
        id: Date.now().toString(),
        text: messageText,
        isUser: true,
        timestamp: new Date(),
        imageUrl: file ? URL.createObjectURL(file) : undefined, // Preview image
      };
      setMessages(prev => [...prev, userMessage]);

      const userConversation: ConversationMessage = {
        role: 'user',
        content: messageText,
      };
      setConversationHistory(prev => [...prev, userConversation]);
    }

    setIsTyping(true);

    try {
      const formData = new FormData();
      formData.append('message', messageText);
      formData.append('temperature', config.temperature.toString());
      formData.append('history', JSON.stringify(conversationHistory));
      formData.append('apiUrl', config.apiUrl);
      formData.append('userName', config.userName);
      formData.append('sessionId', activeSessionId); // Pass session ID
      if (user?.id) {
        formData.append('userId', user.id);
      }

      if (file) {
        formData.append('file', file);
      }

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data: ChatResponse = await response.json();
      const aiResponse = data.response || data.message || 'Maaf, saya tidak dapat memproses permintaan Anda.';

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);

      const aiConversation: ConversationMessage = {
        role: 'assistant',
        content: aiResponse,
      };
      setConversationHistory(prev => [...prev, aiConversation]);

      // Refresh session list to show new chat title
      // Refresh session list to show new chat title
      if (!currentSessionId && user?.id) {
        fetchSessions(user.id);
      }

    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Maaf, terjadi kesalahan. Pastikan API URL sudah dikonfigurasi dengan benar di pengaturan.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);

      if (!config.apiUrl || config.apiUrl === '') {
        setTimeout(() => {
          showNotification('Silakan konfigurasi API URL di pengaturan');
          setIsSettingsOpen(true);
        }, 1000);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMessages([]);
    setConversationHistory([]);
    setCurrentSessionId(null);
  };

  if (isAuthLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a1a', color: 'white' }}>Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        onSignOut={handleSignOut}
        onDeleteSession={handleDeleteSession}
        isLoading={isLoadingSessions}
      />
      <div className="container" style={{ flex: 1, height: '100%', maxWidth: 'none', margin: 0 }}>
        <Header
          onSettingsClick={() => setIsSettingsOpen(true)}
          onNightModeToggle={handleNightModeToggle}
          isNightMode={isNightMode}
        />
        <ChatMessages messages={messages} />
        <TypingIndicator show={isTyping} />
        <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          config={config}
          onSave={handleSaveSettings}
        />
      </div>
    </div>
  );
}

export default App;
