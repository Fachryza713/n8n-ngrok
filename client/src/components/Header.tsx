import React from 'react';
import type { HeaderProps } from '../types/types';

const Header: React.FC<HeaderProps> = ({ onSettingsClick, onNightModeToggle, isNightMode }) => {
    return (
        <header className="chat-header">
            <div className="header-content">
                <div className="ai-avatar">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                            strokeLinejoin="round" />
                        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                            strokeLinejoin="round" />
                    </svg>
                </div>
                <div className="header-info">
                    <h1>Ryuma</h1>
                    <p className="status">
                        <span className="status-dot"></span>Online
                    </p>
                </div>
            </div>
            <div className="header-actions">
                <button className="night-toggle" onClick={onNightModeToggle} title="Toggle Night Mode">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <button className="settings-btn" onClick={onSettingsClick}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                        <path
                            d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
        </header>
    );
};

export default Header;
