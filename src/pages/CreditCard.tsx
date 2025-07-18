
import React, { useState } from 'react';
import { CreditCardSettings } from '@/components/CreditCardSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionCard } from '@/components/ui/bauhaus-card';
import { EditTransactionModal } from '@/components/EditTransactionModal';
import { DeleteTransactionDialog } from '@/components/DeleteTransactionDialog';
import { MonthSelector } from '@/components/MonthSelector';
import { CreditCard as CreditCardIcon, Settings } from 'lucide-react';
import { useMonthSelector } from '@/hooks/useMonthSelector';
import { useCreditCardInvoice } from '@/hooks/useCreditCardInvoice';

const CreditCardPage = () => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const { 
    selectedMonth, 
    setSelectedMonth, 
    getMonthOptions 
  } = useMonthSelector();

  const { 
    transactions, 
    loading, 
    refetch 
  } = useCreditCardInvoice(selectedMonth);

  const handleEdit = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      setSelectedTransaction(transaction);
      setEditModalOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      setSelectedTransaction(transaction);
      setDeleteDialogOpen(true);
    }
  };

  const handleTransactionUpdated = () => {
    refetch();
    setSelectedTransaction(null);
  };

  const handleTransactionDeleted = () => {
    refetch();
    setSelectedTransaction(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <CreditCardIcon className="h-8 w-8" />
            Cartão de Crédito
          </h1>
          <p className="text-gray-300">
            Gerencie suas configurações e visualize suas transações do cartão
          </p>
        </div>

        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="transactions">
              <CreditCardIcon className="h-4 w-4 mr-2" />
              Transações
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Fatura do Cartão</h2>
              <MonthSelector
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
                options={getMonthOptions()}
              />
            </div>

            <Card className="glass border-white/20 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-white">Compras da Fatura</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-32 bg-muted rounded-xl animate-pulse"></div>
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">Nenhuma compra encontrada nesta fatura</p>
                    <p className="text-muted-foreground/80 text-sm mt-2">
                      As compras do cartão de crédito aparecerão aqui
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {transactions.map((transaction) => (
                      <TransactionCard
                        key={transaction.id}
                        id={transaction.id}
                        tipo_transacao="gasto"
                        nome_gasto={transaction.nome_gasto}
                        categoria={transaction.categoria}
                        valor_gasto={transaction.valor_gasto}
                        data_transacao={transaction.data_transacao}
                        isRecurrent={false}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        showCreditInfo={true}
                        purchase_date={transaction.purchase_date}
                        total_amount={transaction.total_amount}
                        installments={transaction.installments}
                        is_subscription={transaction.is_subscription}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <CreditCardSettings />
          </TabsContent>
        </Tabs>

        {/* Edit Modal */}
        <EditTransactionModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          transaction={selectedTransaction}
          onTransactionUpdated={handleTransactionUpdated}
        />

        {/* Delete Dialog */}
        <DeleteTransactionDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          transaction={selectedTransaction}
          onTransactionDeleted={handleTransactionDeleted}
        />
      </div>
    </div>
  );
};

export default CreditCardPage;
