import { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatMessages from './components/ChatMessages';
import ChatInput from './components/ChatInput';
import TypingIndicator from './components/TypingIndicator';
import SettingsModal from './components/SettingsModal';
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
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedApiUrl = localStorage.getItem('apiUrl');
    const savedTemp = localStorage.getItem('temperature');
    const savedNightMode = localStorage.getItem('nightMode');

    if (savedApiUrl) {
      setConfig(prev => ({ ...prev, apiUrl: savedApiUrl }));
    }
    if (savedTemp) {
      setConfig(prev => ({ ...prev, temperature: parseFloat(savedTemp) }));
    }
    if (savedNightMode === 'true') {
      setIsNightMode(true);
    }
  }, []);

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

  const handleSendMessage = async (messageText: string, file: File | null) => {
    if (!messageText.trim() && !file) return;

    // Add user message
    if (messageText) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: messageText,
        isUser: true,
        timestamp: new Date(),
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

  return (
    <div className="container">
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
  );
}

export default App;
