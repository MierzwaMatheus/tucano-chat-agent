
import React, { useState } from 'react';
import { Search, Filter, ArrowUpCircle, ArrowDownCircle, Repeat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionCard } from '@/components/ui/bauhaus-card';
import { EditTransactionModal } from '@/components/EditTransactionModal';
import { DeleteTransactionDialog } from '@/components/DeleteTransactionDialog';
import { CreditCardSummaryCard } from '@/components/CreditCardSummaryCard';
import { MonthSelector } from '@/components/MonthSelector';
import { useMonthSelector } from '@/hooks/useMonthSelector';
import { useMonthlyTransactions } from '@/hooks/useMonthlyTransactions';
import { useTransactionPayment } from '@/hooks/useTransactionPayment';
import { useTransactionFilters, NormalizedTransaction } from '@/hooks/useTransactionFilters';

export const TransactionsList = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<NormalizedTransaction | null>(null);

  const { 
    selectedMonth, 
    setSelectedMonth, 
    getMonthOptions 
  } = useMonthSelector();

  const { 
    transactions, 
    creditCardSummary, 
    loading, 
    refetch 
  } = useMonthlyTransactions(selectedMonth);

  const { updatePaymentStatus } = useTransactionPayment();

  const {
    filters,
    updateFilters,
    clearFilters,
    categorizedTransactions
  } = useTransactionFilters(transactions);

  // Categorias disponíveis
  const availableCategories = Array.from(new Set(transactions.map(t => t.categoria)));

  const handleCategoryFilter = (category: string) => {
    const updated = filters.selectedCategories.includes(category)
      ? filters.selectedCategories.filter(c => c !== category)
      : [...filters.selectedCategories, category];
    updateFilters({ selectedCategories: updated });
  };

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

  const handlePaymentToggle = async (id: string, isPaid: boolean) => {
    const success = await updatePaymentStatus(id, isPaid);
    if (success) {
      refetch();
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

  const handleViewCreditDetails = () => {
    // Navegar para a aba de crédito
    const event = new CustomEvent('navigate-to-credit');
    window.dispatchEvent(event);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Minhas Transações</h2>
        <div className="flex items-center gap-4">
          <MonthSelector
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            options={getMonthOptions()}
          />
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="glass border-white/20"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <Card className="glass border-white/20 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar transações..."
                value={filters.searchTerm}
                onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                className="pl-10 glass border-white/20"
              />
            </div>

            {/* Categories */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">
                Categorias
              </label>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map(category => (
                  <Badge
                    key={category}
                    variant={filters.selectedCategories.includes(category) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-tucano-500 hover:text-white transition-colors"
                    onClick={() => handleCategoryFilter(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={clearFilters} className="glass border-white/20">
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit Card Summary Card */}
      {creditCardSummary && (
        <CreditCardSummaryCard
          summary={creditCardSummary}
          onViewDetails={handleViewCreditDetails}
        />
      )}

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="glass border-white/20 backdrop-blur-lg">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="entradas">Entradas</TabsTrigger>
          <TabsTrigger value="gastos">Gastos</TabsTrigger>
          <TabsTrigger value="gastos-pagos">Gastos Pagos</TabsTrigger>
          <TabsTrigger value="gastos-nao-pagos">Gastos Não Pagos</TabsTrigger>
          <TabsTrigger value="recorrentes">Recorrentes</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <TransactionGrid 
            transactions={categorizedTransactions.all}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPaymentToggle={handlePaymentToggle}
          />
        </TabsContent>

        <TabsContent value="entradas" className="space-y-4">
          <TransactionGrid 
            transactions={categorizedTransactions.entradas}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPaymentToggle={handlePaymentToggle}
          />
        </TabsContent>

        <TabsContent value="gastos" className="space-y-4">
          <TransactionGrid 
            transactions={categorizedTransactions.gastos}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPaymentToggle={handlePaymentToggle}
          />
        </TabsContent>

        <TabsContent value="gastos-pagos" className="space-y-4">
          <TransactionGrid 
            transactions={categorizedTransactions.gastosPagos}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPaymentToggle={handlePaymentToggle}
          />
        </TabsContent>

        <TabsContent value="gastos-nao-pagos" className="space-y-4">
          <TransactionGrid 
            transactions={categorizedTransactions.gastosNaoPagos}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPaymentToggle={handlePaymentToggle}
          />
        </TabsContent>

        <TabsContent value="recorrentes" className="space-y-4">
          <TransactionGrid 
            transactions={categorizedTransactions.recorrentes}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPaymentToggle={handlePaymentToggle}
          />
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
  );
};

interface TransactionGridProps {
  transactions: NormalizedTransaction[];
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPaymentToggle: (id: string, isPaid: boolean) => void;
}

const TransactionGrid: React.FC<TransactionGridProps> = ({
  transactions,
  loading,
  onEdit,
  onDelete,
  onPaymentToggle,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="glass border-white/20 backdrop-blur-lg">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-muted-foreground text-lg">Nenhuma transação encontrada</p>
            <p className="text-muted-foreground/80 text-sm mt-2">
              Tente ajustar os filtros ou adicionar novas transações
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {transactions.map((transaction) => (
        <TransactionCard
          key={transaction.id}
          id={transaction.id}
          tipo_transacao={transaction.tipo_transacao}
          nome_gasto={transaction.nome_gasto}
          categoria={transaction.categoria}
          valor_gasto={transaction.valor_gasto}
          data_transacao={transaction.data_transacao}
          isRecurrent={transaction.isRecurrent}
          is_paid={transaction.is_paid}
          onEdit={onEdit}
          onDelete={onDelete}
          onPaymentToggle={onPaymentToggle}
        />
      ))}
    </div>
  );
};
