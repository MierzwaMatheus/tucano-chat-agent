
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ModernAnimatedSignIn } from '@/components/ui/modern-animated-sign-in';
import type { FieldType } from '@/components/ui/modern-animated-sign-in';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Erro no login",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login realizado com sucesso!",
            description: "Bem-vindo de volta.",
          });
        }
      } else {
        if (password !== confirmPassword) {
          toast({
            title: "Erro",
            description: "As senhas não coincidem",
            variant: "destructive",
          });
          return;
        }

        const { error } = await signUp(email, password);
        if (error) {
          toast({
            title: "Erro no cadastro",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Cadastro realizado!",
            description: "Verifique seu email para confirmar a conta.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Algo deu errado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Erro no login com Google",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer login com Google",
        variant: "destructive",
      });
    }
  };

  const goTo = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const loginFields = [
    {
      label: 'Email',
      required: true,
      type: 'email' as FieldType,
      placeholder: 'Digite seu email',
      onChange: (event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value),
    },
    {
      label: 'Senha',
      required: true,
      type: 'password' as FieldType,
      placeholder: 'Digite sua senha',
      onChange: (event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value),
    },
  ];

  const signupFields = [
    {
      label: 'Email',
      required: true,
      type: 'email' as FieldType,
      placeholder: 'Digite seu email',
      onChange: (event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value),
    },
    {
      label: 'Senha',
      required: true,
      type: 'password' as FieldType,
      placeholder: 'Digite sua senha',
      onChange: (event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value),
    },
    {
      label: 'Confirmar Senha',
      required: true,
      type: 'password' as FieldType,
      placeholder: 'Confirme sua senha',
      onChange: (event: ChangeEvent<HTMLInputElement>) => setConfirmPassword(event.target.value),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-tucano-900 via-tucano-800 to-tucano-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ModernAnimatedSignIn
          fieldPerRow={1}
          onSubmit={handleSubmit}
          goTo={goTo}
          header={isLogin ? 'Bem-vindo de volta!' : 'Criar conta'}
          subHeader={isLogin ? 'Entre na sua conta' : 'Cadastre-se para começar'}
          fields={isLogin ? loginFields : signupFields}
          submitButton={loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
          textVariantButton={isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
          onGoogleSignIn={handleGoogleSignIn}
        />
      </div>
    </div>
  );
};

export default Auth;
