import React, { useState, useEffect } from 'react';
import type { SettingsModalProps } from '../types/types';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
    const [apiUrl, setApiUrl] = useState(config.apiUrl);
    const [temperature, setTemperature] = useState(config.temperature);

    useEffect(() => {
        setApiUrl(config.apiUrl);
        setTemperature(config.temperature);
    }, [config]);

    const handleSave = () => {
        onSave({ apiUrl, temperature });
        onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal" onClick={handleBackdropClick}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Pengaturan</h2>
                    <button className="close-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
                <div className="modal-body">
                    <div className="setting-item">
                        <label htmlFor="apiUrl">API URL (n8n Webhook)</label>
                        <input
                            type="text"
                            id="apiUrl"
                            placeholder="https://your-n8n-url.com/webhook-test/xxx/webhook"
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                        />
                    </div>
                    <div className="setting-item">
                        <label htmlFor="modelTemp">Temperature (0-1)</label>
                        <input
                            type="range"
                            id="modelTemp"
                            min="0"
                            max="1"
                            step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        />
                        <span>{temperature.toFixed(1)}</span>
                    </div>
                    <button className="save-btn" onClick={handleSave}>Simpan Pengaturan</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
