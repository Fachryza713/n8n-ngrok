export interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    imageUrl?: string;
}

export interface Config {
    apiUrl: string;
    temperature: number;
    userName: string;
}

export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatResponse {
    response?: string;
    message?: string;
    error?: string;
}

export interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: Config;
    onSave: (config: Config) => void;
}

export interface HeaderProps {
    onSettingsClick: () => void;
    onNightModeToggle: () => void;
    isNightMode: boolean;
}

export interface ChatMessagesProps {
    messages: Message[];
}

export interface ChatInputProps {
    onSendMessage: (message: string, file: File | null) => void;
    disabled: boolean;
}

export interface TypingIndicatorProps {
    show: boolean;
}
