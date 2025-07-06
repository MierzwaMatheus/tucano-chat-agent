
import React from 'react';

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

        <div className="text-center py-12">
          <p className="text-gray-300 text-lg">Configurações gerais do sistema</p>
          <p className="text-gray-400 text-sm mt-2">
            Outras configurações aparecerão aqui no futuro
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
