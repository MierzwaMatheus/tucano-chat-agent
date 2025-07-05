import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Ripple, 
  AuthTabs, 
  TechOrbitDisplay, 
  financialIconsArray 
} from '@/components/ui/modern-animated-sign-in';

type FormData = {
  email: string;
  password: string;
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    console.log('🔍 Auth: Verificando estado do usuário', { user });
    if (user) {
      console.log('✅ Auth: Usuário autenticado, redirecionando para dashboard');
      window.location.href = '/';
    }
  }, [user]);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>,
    name: keyof FormData
  ) => {
    const value = event.target.value;
    console.log(`📝 Auth: Alterando campo ${name}:`, value);
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    // Limpar erro quando o usuário começa a digitar
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');

    console.log('🚀 Auth: Iniciando processo de autenticação', { 
      isLogin, 
      email: formData.email, 
      hasPassword: !!formData.password 
    });

    try {
      const { error } = isLogin 
        ? await signIn(formData.email, formData.password)
        : await signUp(formData.email, formData.password);

      if (error) {
        console.error('❌ Auth: Erro de autenticação:', error);
        setErrorMessage(error.message);
        toast({
          title: "Erro de autenticação",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('✅ Auth: Autenticação bem-sucedida');
        if (!isLogin) {
          toast({
            title: "Cadastro realizado!",
            description: "Verifique seu email para confirmar a conta.",
          });
        } else {
          toast({
            title: "Login realizado!",
            description: "Redirecionando para o dashboard...",
          });
        }
      }
    } catch (error) {
      console.error('💥 Auth: Erro inesperado:', error);
      const errorMsg = "Ocorreu um erro inesperado. Tente novamente.";
      setErrorMessage(errorMsg);
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    console.log('🔄 Auth: Alternando modo de autenticação', { 
      from: isLogin ? 'login' : 'cadastro',
      to: !isLogin ? 'login' : 'cadastro'
    });
    setIsLogin(!isLogin);
    setFormData({ email: '', password: '' });
    setErrorMessage('');
  };

  const formFields = {
    header: isLogin ? 'Bem-vindo de volta' : 'Criar conta',
    subHeader: isLogin ? 'Entre na sua conta' : 'Cadastre-se para começar',
    fields: [
      {
        label: 'Email',
        required: true,
        type: 'email',
        placeholder: 'Digite seu e-mail',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'email'),
      },
      {
        label: 'Password',
        required: true,
        type: 'password',
        placeholder: 'Digite sua senha',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'password'),
      },
    ],
    submitButton: isLogin ? 'Entrar' : 'Cadastrar',
    textVariantButton: isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login',
  };

  return (
    <div className="min-h-screen bg-background dark flex">
      {/* Left Side - Animação */}
      <div className='flex flex-col justify-center w-1/2 max-lg:hidden relative'>
        <Ripple mainCircleSize={100} />
        <TechOrbitDisplay iconsArray={financialIconsArray} text="Tucano Agent" />
      </div>

      {/* Right Side - Formulário */}
      <div className='w-1/2 h-[100dvh] flex flex-col justify-center items-center max-lg:w-full max-lg:px-[10%]'>
        <AuthTabs
          formFields={formFields}
          goTo={handleToggleMode}
          handleSubmit={handleSubmit}
          loading={loading}
          errorField={errorMessage}
        />
      </div>
    </div>
  );
};

export default Auth;
