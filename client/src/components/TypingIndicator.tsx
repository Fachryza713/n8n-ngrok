import React from 'react';
import type { TypingIndicatorProps } from '../types/types';

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ show }) => {
    if (!show) return null;

    return (
        <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
        </div>
    );
};

export default TypingIndicator;
