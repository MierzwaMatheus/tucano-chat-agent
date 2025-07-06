
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreditCardSettings } from '@/hooks/useCreditCardSettings';
import { CreditCard, Settings } from 'lucide-react';

const formSchema = z.object({
  enabled: z.boolean(),
  closing_day: z.number().min(1).max(31),
  payment_day: z.number().min(1).max(31),
});

export const CreditCardSettings = () => {
  const { settings, loading, createOrUpdateSettings } = useCreditCardSettings();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      enabled: settings?.enabled || false,
      closing_day: settings?.closing_day || 6,
      payment_day: settings?.payment_day || 10,
    },
  });

  React.useEffect(() => {
    if (settings) {
      form.reset({
        enabled: settings.enabled,
        closing_day: settings.closing_day,
        payment_day: settings.payment_day,
      });
    }
  }, [settings, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createOrUpdateSettings(values);
  };

  if (loading) {
    return (
      <Card className="glass border-white/20 backdrop-blur-lg">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-white/20 backdrop-blur-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <CreditCard className="h-5 w-5" />
          Configurações do Cartão de Crédito
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/20 p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-white">
                      Habilitar Cartão de Crédito
                    </FormLabel>
                    <div className="text-sm text-gray-300">
                      Ative para rastrear compras e parcelas do cartão
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="closing_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Dia de Fechamento da Fatura</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="6"
                        className="glass border-white/20 text-white"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 6)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Dia de Pagamento da Fatura</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="10"
                        className="glass border-white/20 text-white"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-tucano-500 to-tucano-600 hover:from-tucano-600 hover:to-tucano-700"
              disabled={loading}
            >
              <Settings className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
