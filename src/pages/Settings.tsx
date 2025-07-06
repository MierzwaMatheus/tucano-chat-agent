
import React from 'react';
import { CreditCardSettings } from '@/components/CreditCardSettings';

const Settings = () => {
  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
          <p className="text-gray-300">
            Gerencie suas preferências e configurações do sistema
          </p>
        </div>

        <CreditCardSettings />
      </div>
    </div>
  );
};

export default Settings;
