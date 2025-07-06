
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface CreditCardSettings {
  id: string;
  user_id: string;
  enabled: boolean;
  closing_day: number;
  payment_day: number;
  created_at: string;
  updated_at: string;
}

export const useCreditCardSettings = () => {
  const [settings, setSettings] = useState<CreditCardSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('credit_card_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw error;
      }

      setSettings(data);
    } catch (error) {
      console.error('Error fetching credit card settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações do cartão",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateSettings = async (newSettings: Partial<CreditCardSettings>) => {
    if (!user) return;

    try {
      setLoading(true);
      
      if (settings) {
        // Update existing settings
        const { data, error } = await supabase
          .from('credit_card_settings')
          .update({
            enabled: newSettings.enabled ?? settings.enabled,
            closing_day: newSettings.closing_day ?? settings.closing_day,
            payment_day: newSettings.payment_day ?? settings.payment_day,
          })
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        setSettings(data);
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('credit_card_settings')
          .insert({
            user_id: user.id,
            enabled: newSettings.enabled ?? false,
            closing_day: newSettings.closing_day ?? 6,
            payment_day: newSettings.payment_day ?? 10,
          })
          .select()
          .single();

        if (error) throw error;
        setSettings(data);
      }

      toast({
        title: "Sucesso",
        description: "Configurações do cartão atualizadas!",
      });
    } catch (error) {
      console.error('Error updating credit card settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações do cartão",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  return {
    settings,
    loading,
    createOrUpdateSettings,
    refetch: fetchSettings,
  };
};
