import React, { useEffect, useRef } from 'react';
import type { ChatMessagesProps } from '../types/types';
import ryumaLogo from '../assets/ryuma-logo.png';

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatTime = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    return (
        <div className="chat-messages" id="chatMessages">
            {messages.length === 0 ? (
                <div className="welcome-message">
                    <div className="welcome-icon">
                        <img src={ryumaLogo} alt="Ryuma AI" />
                    </div>
                    <h2>Selamat Datang!</h2>
                    <p>Saya adalah Ryuma AI Assistant Anda. Tanyakan apa saja, upload dokumen, atau mulai percakapan.</p>
                </div>
            ) : (
                messages.map((message) => (
                    <div key={message.id} className={`message ${message.isUser ? 'user' : 'ai'}`}>
                        <div className="message-avatar">
                            {message.isUser ? (
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            ) : (
                                <img src={ryumaLogo} alt="Ryuma AI" className="ai-avatar-img" />
                            )}
                        </div>
                        <div className="message-content">
                            {message.imageUrl && (
                                <div className="message-image">
                                    <img
                                        src={message.imageUrl}
                                        alt="Uploaded content"
                                        style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer' }}
                                        onClick={() => window.open(message.imageUrl, '_blank')}
                                    />
                                </div>
                            )}
                            <div className="message-text">{message.text}</div>
                            <span className="message-time">{formatTime(message.timestamp)}</span>
                        </div>
                    </div>
                ))
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default ChatMessages;
