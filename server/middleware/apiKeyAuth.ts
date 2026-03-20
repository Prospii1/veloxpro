import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface ApiAuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    wallet_balance: number;
  };
}

export const apiKeyAuth = async (req: ApiAuthRequest, res: Response, next: NextFunction) => {
  const apiKey = (req.query.api_key as string) || (req.headers['x-api-key'] as string) || (req.body.api_key as string);

  if (!apiKey) {
    return res.status(401).json({ success: false, error: 'API key is missing' });
  }

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, role, wallet_balance')
      .eq('api_key', apiKey)
      .single();

    if (error || !profile) {
      return res.status(401).json({ success: false, error: 'Invalid or inactive API key' });
    }

    req.user = profile as any;
    
    // Log the API request asynchronously
    const logRequest = async () => {
      try {
        await supabase.from('api_logs').insert({
          user_id: profile.id,
          endpoint: req.originalUrl || req.url,
          request_data: {
            method: req.method,
            query: req.query,
            body: { ...req.body, api_key: '***' } // Mask key in logs
          },
          status_code: res.statusCode
        });
      } catch (logError) {
        console.error('Failed to log API request:', logError);
      }
    };

    // Use res.on('finish') to capture the final status code
    res.on('finish', logRequest);

    next();
  } catch (err) {
    console.error('API Auth Error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
