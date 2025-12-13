import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Warning: SUPABASE_URL or SUPABASE_KEY missing in .env file. Database features will not work.');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
