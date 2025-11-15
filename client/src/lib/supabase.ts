/**
 * Supabase Client Configuration
 * 
 * Bu dosya Supabase client'ını yapılandırır ve export eder.
 * Environment variables'dan URL ve anon key alır.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables eksik! Auth özellikleri çalışmayabilir.');
  console.warn('Lütfen .env.local dosyasına VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY ekleyin.');
}

// Supabase client oluştur
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

/**
 * Supabase bağlantısını test et
 */
export async function testSupabaseConnection() {
  if (!supabase) {
    return { connected: false, error: 'Supabase client oluşturulamadı' };
  }

  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (normal)
      throw error;
    }
    return { connected: true };
  } catch (error: any) {
    return { connected: false, error: error.message };
  }
}

