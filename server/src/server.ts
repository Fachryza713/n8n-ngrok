import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { supabase } from './db';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Get all sessions for a specific user
app.get('/api/sessions', async (req: Request, res: Response) => {
    try {
        const { userId } = req.query;

        if (!userId || typeof userId !== 'string') {
            return res.json([]);
        }

        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('❌ Error fetching sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// Delete a session
app.delete('/api/sessions/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', id);

        if (error) throw error;

        console.log('🗑️ Session deleted:', id);
        res.json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting session:', error);
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

// Get messages for a session
app.get('/api/sessions/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Fetch messages from our local 'messages' table
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('session_id', id)
            .order('created_at', { ascending: true });

        if (error) {
            throw error;
        }

        // Map to frontend expectation if needed, or return as is
        // Frontend expects: { id, text/message, isUser/role, timestamp } logic
        // The table has: id, session_id, role, content, created_at
        // We can send raw data and let frontend map it, or map it here.
        // Let's map it here to match what the frontend likely expects based on App.tsx analysis
        // App.tsx uses: msg.message (or text), msg.role

        const mappedMessages = data.map(msg => ({
            id: msg.id,
            message: msg.content,
            role: msg.role === 'user' ? 'human' : 'ai', // Mapping to LangChain style roles if frontend expects that
            created_at: msg.created_at,
            image_url: msg.image_url // Pass image URL
        }));

        res.json(mappedMessages);
    } catch (error) {
        console.error('❌ Error fetching session messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Chat endpoint
app.post('/api/chat', upload.single('file'), async (req: Request, res: Response) => {
    try {
        const { message, temperature, history, apiUrl, userName, sessionId, userId } = req.body;
        const file = req.file;

        // Default n8n webhook URL
        const webhookUrl = apiUrl || 'https://schemeless-charli-unenlightenedly.ngrok-free.dev/webhook/bc3934df-8d10-48df-9960-f0db1e806328';

        console.log('📨 Incoming request:', { message, hasFile: !!file, userName, sessionId, userId });

        // If new session (or first message of session), save to Supabase 'sessions' table
        if (sessionId && message) {
            // Check if session exists (optimization: could caching validation, but simple select is fine)
            const { data: existingSession } = await supabase
                .from('sessions')
                .select('id')
                .eq('id', sessionId)
                .single();

            if (!existingSession) {
                // Create new session
                const { error: insertError } = await supabase
                    .from('sessions')
                    .insert({
                        id: sessionId,
                        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''), // Use first message as title
                        user_id: userId || 'anonymous' // Use actual User ID
                    });

                if (insertError) {
                    console.error('⚠️ Error creating session:', insertError);
                } else {
                    console.log('✅ New session created:', sessionId);
                }
            }

            // --- HANDLE FILE UPLOAD ---
            let imageUrl = null;
            if (file) {
                try {
                    const fileExt = file.originalname.split('.').pop();
                    const fileName = `${sessionId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                    const { data: uploadData, error: uploadError } = await supabase
                        .storage
                        .from('chat-attachments')
                        .upload(fileName, file.buffer, {
                            contentType: file.mimetype,
                            upsert: false
                        });

                    if (uploadError) {
                        console.error('⚠️ Error uploading file:', uploadError);
                    } else {
                        // Get public URL
                        const { data: { publicUrl } } = supabase
                            .storage
                            .from('chat-attachments')
                            .getPublicUrl(fileName);

                        imageUrl = publicUrl;
                        console.log('✅ File uploaded, URL:', imageUrl);
                    }
                } catch (err) {
                    console.error('❌ Upload exception:', err);
                }
            }

            // --- SAVE USER MESSAGE ---
            const { error: msgError } = await supabase
                .from('messages')
                .insert({
                    session_id: sessionId,
                    role: 'user',
                    content: message,
                    image_url: imageUrl // Save image URL
                });

            if (msgError) console.error('⚠️ Error saving user message:', msgError);
        }

        // Prepare request body for n8n webhook
        // Format to match what n8n webhook expects
        const requestBody: any = {
            message: message || '',
            chatId: sessionId || 'web-app', // Use sessionId if available
            sessionId: sessionId, // Explicit field for n8n
            from: {
                id: 'web-user',
                first_name: userName || 'User',
                username: (userName || 'user').toLowerCase().replace(/\s+/g, '_')
            }
        };

        // If there's a file, include file info
        if (file) {
            requestBody.hasFile = true;
            requestBody.fileName = file.originalname;
            requestBody.fileType = file.mimetype;
        }

        console.log('🔄 Forwarding to n8n:', webhookUrl);

        let response;
        if (file) {
            // If file exists, send as FormData
            const form = new FormData();

            // Add all text fields
            form.append('message', message || '');
            form.append('chatId', sessionId || 'web-app');
            form.append('sessionId', sessionId);
            form.append('from', JSON.stringify({
                id: 'web-user',
                first_name: userName || 'User',
                username: (userName || 'user').toLowerCase().replace(/\s+/g, '_')
            }));

            // Add file
            form.append('file', file.buffer, {
                filename: file.originalname,
                contentType: file.mimetype,
            });

            // Send as multipart
            response = await fetch(webhookUrl, {
                method: 'POST',
                body: form,
                headers: form.getHeaders(), // Important: adds Content-Type: multipart/form-data; boundary=...
            });
        } else {
            // Original JSON logic for text-only
            response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
        }

        console.log('📥 n8n response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ n8n error:', errorText);
            throw new Error(`n8n webhook responded with status: ${response.status}`);
        }

        // Try to parse as JSON, fallback to text
        const textResponse = await response.text();
        let data: any;
        try {
            data = JSON.parse(textResponse);
        } catch (e) {
            // If not JSON, treat as string
            data = textResponse;
        }

        // console.log('✅ n8n response:', data);

        // Extract the actual message from n8n response
        // n8n might return different formats, handle multiple cases
        let aiResponse = '';

        if (typeof data === 'string') {
            aiResponse = data;
        } else if (data?.output) {
            aiResponse = data.output;
        } else if (data?.text) {
            aiResponse = data.text;
        } else if (data?.message) {
            aiResponse = data.message;
        } else if (data?.response) {
            aiResponse = data.response;
        } else {
            // If we can't find a message field, return the whole object as string
            aiResponse = JSON.stringify(data);
        }

        // --- SAVE AI RESPONSE ---
        if (sessionId && aiResponse) {
            const { error: aiMsgError } = await supabase
                .from('messages')
                .insert({
                    session_id: sessionId,
                    role: 'assistant',
                    content: aiResponse
                });

            if (aiMsgError) console.error('⚠️ Error saving AI response:', aiMsgError);
        }

        res.json({
            response: aiResponse
        });

    } catch (error) {
        console.error('❌ Error in chat endpoint:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📡 Chat endpoint: http://localhost:${PORT}/api/chat`);
    console.log(`🔗 n8n webhook: https://schemeless-charli-unenlightenedly.ngrok-free.dev/webhook/bc3934df-8d10-48df-9960-f0db1e806328`);
});
