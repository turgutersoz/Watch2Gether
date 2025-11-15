/**
 * useAuth Hook
 * 
 * Supabase Auth state yönetimi için custom hook
 */

import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  color?: string;
  status?: 'online' | 'away' | 'busy';
  role?: string;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Session ve user state'ini yükle
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Mevcut session'ı kontrol et
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session yüklenemedi:', error);
        setLoading(false);
        return;
      }

      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Auth state değişikliklerini dinle
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      setSession(session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user);
        toast.success('Giriş başarılı!');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        toast.success('Çıkış yapıldı');
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        await loadUserProfile(session.user);
      } else if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Kullanıcı profilini yükle
  const loadUserProfile = async (supabaseUser: User) => {
    if (!supabase) return;

    try {
      // Önce users tablosundan profil bilgilerini al
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profil yüklenemedi:', profileError);
      }

      // Eğer profil yoksa, yeni profil oluştur
      if (!profile) {
        const username = supabaseUser.email?.split('@')[0] || `user_${supabaseUser.id.substring(0, 8)}`;
        const newProfile = {
          id: supabaseUser.id,
          username,
          email: supabaseUser.email || '',
          avatar: null,
          color: generateUserColor(supabaseUser.id),
          status: 'online',
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('users')
          .insert([newProfile]);

        if (insertError) {
          console.error('Profil oluşturulamadı:', insertError);
        }

        setUser({
          id: supabaseUser.id,
          username: newProfile.username,
          email: newProfile.email,
          avatar: newProfile.avatar || undefined,
          color: newProfile.color,
          status: newProfile.status as 'online' | 'away' | 'busy',
          role: newProfile.role,
          isAuthenticated: true
        });
      } else {
        setUser({
          id: profile.id,
          username: profile.username,
          email: profile.email,
          avatar: profile.avatar,
          color: profile.color,
          status: profile.status,
          role: profile.role,
          isAuthenticated: true
        });
      }
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
      // Fallback: Supabase user bilgilerini kullan
      setUser({
        id: supabaseUser.id,
        username: supabaseUser.email?.split('@')[0] || 'Kullanıcı',
        email: supabaseUser.email || '',
        isAuthenticated: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı rengi oluştur
  const generateUserColor = (userId: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
      '#EC7063', '#5DADE2', '#58D68D', '#F4D03F', '#AF7AC5'
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Giriş yap
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      toast.error('Supabase yapılandırılmamış!');
      return { error: 'Supabase yapılandırılmamış' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Giriş hatası:', error);
      toast.error(error.message || 'Giriş yapılamadı');
      return { data: null, error };
    }
  };

  // Kayıt ol
  const signUp = async (email: string, password: string, username: string) => {
    if (!supabase) {
      toast.error('Supabase yapılandırılmamış!');
      return { error: 'Supabase yapılandırılmamış' };
    }

    try {
      // Önce Supabase Auth ile kayıt ol
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (authError) throw authError;

      // Kullanıcı profili oluştur (eğer başarılıysa)
      if (authData.user) {
        const color = generateUserColor(authData.user.id);
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            username,
            email,
            color,
            status: 'online',
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (profileError) {
          console.error('Profil oluşturulamadı:', profileError);
        }
      }

      return { data: authData, error: null };
    } catch (error: any) {
      console.error('Kayıt hatası:', error);
      toast.error(error.message || 'Kayıt olunamadı');
      return { data: null, error };
    }
  };

  // Çıkış yap
  const signOut = async () => {
    if (!supabase) {
      toast.error('Supabase yapılandırılmamış!');
      return { error: 'Supabase yapılandırılmamış' };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Çıkış hatası:', error);
      toast.error(error.message || 'Çıkış yapılamadı');
      return { error };
    }
  };

  // Profil güncelle
  const updateProfile = async (updates: {
    username?: string;
    avatar?: string;
    status?: 'online' | 'away' | 'busy';
  }) => {
    if (!supabase || !user) {
      return { error: 'Kullanıcı giriş yapmamış' };
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Local state'i güncelle
      if (data) {
        setUser({
          ...user,
          ...updates
        });
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Profil güncelleme hatası:', error);
      toast.error(error.message || 'Profil güncellenemedi');
      return { data: null, error };
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile
  };
}

