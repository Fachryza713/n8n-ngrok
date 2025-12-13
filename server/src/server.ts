import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
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

// Get all sessions
app.get('/api/sessions', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('❌ Error fetching sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// Get messages for a session
// Note: This requires knowing the table where LangChain stores messages. 
// Standard is often 'messages' or 'message_store'. 
// We will attempt to query 'messages' with 'session_id'.
app.get('/api/sessions/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Assuming the table is 'messages' and column is 'session_id' (common in LangTech)
        // If n8n uses a different schema, this query needs adjustment.
        // Defined in n8n Postgres Chat Memory node
        const { data, error } = await supabase
            .from('n8n_chat_histories')
            .select('*')
            .eq('sessionId', id) // n8n uses camelCase 'sessionId' by default
            .order('id', { ascending: true }); // n8n usually has an auto-inc id

        if (error) {
            // Trying alternative schema if 'messages' fails or returns empty unexpectedly?
            // For now, let's just return what we find or empty.
            // console.warn('Could not fetch messages from default table:', error.message);
            throw error;
        }
        res.json(data);
    } catch (error) {
        console.error('❌ Error fetching session messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Chat endpoint
app.post('/api/chat', upload.single('file'), async (req: Request, res: Response) => {
    try {
        const { message, temperature, history, apiUrl, userName, sessionId } = req.body;
        const file = req.file;

        // Default n8n webhook URL
        const webhookUrl = apiUrl || 'https://schemeless-charli-unenlightenedly.ngrok-free.dev/webhook/bc3934df-8d10-48df-9960-f0db1e806328';

        console.log('📨 Incoming request:', { message, hasFile: !!file, userName, sessionId });

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
                        user_id: userName || 'user'
                    });

                if (insertError) {
                    console.error('⚠️ Error creating session:', insertError);
                    // Don't block chat flow, just log it
                } else {
                    console.log('✅ New session created:', sessionId);
                }
            }
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

        // Forward request to n8n webhook
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

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
