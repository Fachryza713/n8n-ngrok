import React from 'react';
import '../styles/Sidebar.css';

interface Session {
    id: string;
    title: string;
    created_at: string;
}

interface SidebarProps {
    sessions: Session[];
    currentSessionId: string | null;
    onSessionSelect: (sessionId: string) => void;
    onNewChat: () => void;
    onSignOut: () => void;
    onDeleteSession?: (sessionId: string) => void;
    isLoading?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
    sessions,
    currentSessionId,
    onSessionSelect,
    onNewChat,
    onSignOut,
    onDeleteSession,
    isLoading = false
}) => {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <button className="new-chat-btn" onClick={onNewChat} disabled={isLoading}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    New Chat
                </button>
            </div>

            <div className="sidebar-content">
                <div className="sidebar-section-title">History</div>

                {sessions.length === 0 ? (
                    <div style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        No history yet.
                    </div>
                ) : (
                    sessions.map((session) => (
                        <div
                            key={session.id}
                            className={`session-item ${currentSessionId === session.id ? 'active' : ''}`}
                            onClick={() => onSessionSelect(session.id)}
                        >
                            <div className="session-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                            <div className="session-title">
                                {session.title || 'Untitled Chat'}
                            </div>
                            <button
                                className="delete-session-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Delete this chat?')) {
                                        onDeleteSession?.(session.id);
                                    }
                                }}
                                title="Delete chat"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className="sidebar-footer">
                <button className="sign-out-btn" onClick={onSignOut}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
