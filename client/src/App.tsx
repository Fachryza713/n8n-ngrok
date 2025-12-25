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

const API_BASE_URL = '';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // New State
  const [isGuestMode, setIsGuestMode] = useState(false); // Guest Mode State
  const [config, setConfig] = useState<Config>({
    apiUrl: 'https://webhook.ryuma-ai.cloud/webhook/bc3934df-8d10-48df-9960-f0db1e806328',
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

      // Clean up URL hash (remove #) after login
      if (session?.user && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }

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
        if (Array.isArray(data)) {
          const mappedMessages: Message[] = data.map((msg: any) => ({
            id: msg.id || Date.now().toString(),
            text: typeof msg.message === 'string' ? msg.message : JSON.stringify(msg.message),
            isUser: msg.role === 'human' || msg.type === 'human',
            timestamp: new Date(msg.created_at || Date.now()),
            imageUrl: msg.image_url,
          }));
          setMessages(mappedMessages);
        }
      }
    } catch (error) {
      console.error('Failed to load session messages:', error);
      showNotification('Gagal memuat riwayat chat');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleRenameSession = async (sessionId: string, newTitle: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        setSessions(prev =>
          prev.map(s => (s.id === sessionId ? { ...s, title: newTitle } : s))
        );
        showNotification('Chat renamed');
      }
    } catch (error) {
      console.error('Failed to rename session:', error);
      showNotification('Failed to rename chat');
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

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      activeSessionId = crypto.randomUUID();
      setCurrentSessionId(activeSessionId);
    }

    if (messageText || file) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: messageText,
        isUser: true,
        timestamp: new Date(),
        imageUrl: file ? URL.createObjectURL(file) : undefined,
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
      formData.append('sessionId', activeSessionId);
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
    if (user) {
      await supabase.auth.signOut();
    }
    setIsGuestMode(false); // Reset guest mode
    setMessages([]);
    setConversationHistory([]);
    setCurrentSessionId(null);
  };

  if (isAuthLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a1a', color: 'white' }}>Loading...</div>;
  }

  if (!user && !isGuestMode) {
    return <Login onGuestLogin={() => setIsGuestMode(true)} />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            backdropFilter: 'blur(2px)' // Optional: blur effect
          }}
        />
      )}

      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={(id) => {
          handleSessionSelect(id);
          setIsMobileSidebarOpen(false); // Close on select
        }}
        onNewChat={() => {
          handleNewChat();
          setIsMobileSidebarOpen(false); // Close on new chat
        }}
        onSignOut={handleSignOut}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        isLoading={isLoadingSessions}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="container" style={{ flex: 1, height: '100%', maxWidth: 'none', margin: 0 }}>
        <Header
          onSettingsClick={() => setIsSettingsOpen(true)}
          onNightModeToggle={handleNightModeToggle}
          isNightMode={isNightMode}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
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
