import React, { useState, useRef } from 'react';
import type { KeyboardEvent, ChangeEvent } from 'react';
import type { ChatInputProps } from '../types/types';

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
    const [message, setMessage] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const autoResize = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const removeFile = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSend = () => {
        if (!message.trim() && !file) return;

        onSendMessage(message, file);
        setMessage('');
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    return (
        <div className="chat-input-container">
            {file && (
                <div className="file-preview">
                    <div className="file-info">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M13 2V9H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                strokeLinejoin="round" />
                        </svg>
                        <span>{file.name}</span>
                    </div>
                    <button className="remove-file" onClick={removeFile}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="chat-input">
                <button className="attach-btn" onClick={() => fileInputRef.current?.click()}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59723 21.9983 8.005 21.9983C6.41277 21.9983 4.88583 21.3658 3.76 20.24C2.63417 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63417 12.8758 3.76 11.75L12.33 3.18C13.0806 2.42944 14.0991 2.00671 15.16 2.00671C16.2209 2.00671 17.2394 2.42944 17.99 3.18C18.7406 3.93056 19.1633 4.94908 19.1633 6.01C19.1633 7.07092 18.7406 8.08944 17.99 8.84L9.41 17.41C9.03472 17.7853 8.52544 17.9966 7.995 17.9966C7.46456 17.9966 6.95528 17.7853 6.58 17.41C6.20472 17.0347 5.99335 16.5254 5.99335 15.995C5.99335 15.4646 6.20472 14.9553 6.58 14.58L15.07 6.1"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                />
                <textarea
                    ref={textareaRef}
                    id="messageInput"
                    placeholder="Ketik pesan Anda..."
                    rows={1}
                    value={message}
                    onChange={(e) => {
                        setMessage(e.target.value);
                        autoResize();
                    }}
                    onKeyDown={handleKeyPress}
                    disabled={disabled}
                />
                <button className="send-btn" onClick={handleSend} disabled={disabled}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
