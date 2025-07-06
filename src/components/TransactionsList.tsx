
import React, { useState } from 'react';
import { Search, Filter, Calendar, ArrowUpCircle, ArrowDownCircle, Repeat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useTransactionFilters, NormalizedTransaction } from '@/hooks/useTransactionFilters';
import { TransactionCard } from '@/components/ui/bauhaus-card';
import { EditTransactionModal } from '@/components/EditTransactionModal';
import { DeleteTransactionDialog } from '@/components/DeleteTransactionDialog';

export const TransactionsList = () => {
  const {
    filters,
    updateFilters,
    paginatedData,
    loading,
    availableCategories,
    changePage,
    refetch
  } = useTransactionFilters();

  const [showFilters, setShowFilters] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<NormalizedTransaction | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getTransactionIcon = (tipo: 'entrada' | 'gasto', isRecurrent?: boolean) => {
    if (isRecurrent) {
      return <Repeat className="h-4 w-4 text-blue-500" />;
    }
    return tipo === 'entrada' 
      ? <ArrowUpCircle className="h-4 w-4 text-green-500" />
      : <ArrowDownCircle className="h-4 w-4 text-red-500" />;
  };

  const handleTabChange = (value: string) => {
    const typeMap: Record<string, 'entrada' | 'gasto' | 'all'> = {
      'all': 'all',
      'entradas': 'entrada',
      'gastos': 'gasto',
      'recorrentes': 'all'
    };
    
    updateFilters({
      transactionType: typeMap[value],
      showRecurrentOnly: value === 'recorrentes'
    });
  };

  const handleCategoryFilter = (category: string) => {
    const updatedCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    updateFilters({ categories: updatedCategories });
  };

  const clearFilters = () => {
    updateFilters({
      searchTerm: '',
      categories: [],
      dateRange: {},
      showRecurrentOnly: false
    });
  };

  const handleEdit = (id: string) => {
    const transaction = paginatedData.transactions.find(t => t.id === id);
    if (transaction) {
      setSelectedTransaction(transaction);
      setEditModalOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    const transaction = paginatedData.transactions.find(t => t.id === id);
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Minhas Transações</h2>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="glass border-white/20"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
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

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Data Início
                </label>
                <Input
                  type="date"
                  value={filters.dateRange.start || ''}
                  onChange={(e) => updateFilters({ 
                    dateRange: { ...filters.dateRange, start: e.target.value }
                  })}
                  className="glass border-white/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Data Fim
                </label>
                <Input
                  type="date"
                  value={filters.dateRange.end || ''}
                  onChange={(e) => updateFilters({ 
                    dateRange: { ...filters.dateRange, end: e.target.value }
                  })}
                  className="glass border-white/20"
                />
              </div>
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
                    variant={filters.categories.includes(category) ? "default" : "outline"}
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

      {/* Tabs */}
      <Tabs defaultValue="all" onValueChange={handleTabChange}>
        <TabsList className="glass border-white/20 backdrop-blur-lg">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="entradas">Entradas</TabsTrigger>
          <TabsTrigger value="gastos">Gastos</TabsTrigger>
          <TabsTrigger value="recorrentes">Recorrentes</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <TransactionGrid 
            transactions={paginatedData.transactions}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="entradas" className="space-y-4">
          <TransactionGrid 
            transactions={paginatedData.transactions}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="gastos" className="space-y-4">
          <TransactionGrid 
            transactions={paginatedData.transactions}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="recorrentes" className="space-y-4">
          <TransactionGrid 
            transactions={paginatedData.transactions}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {paginatedData.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              {paginatedData.page > 1 && (
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => changePage(paginatedData.page - 1)}
                    className="cursor-pointer"
                  />
                </PaginationItem>
              )}
              
              {Array.from({ length: Math.min(5, paginatedData.totalPages) }, (_, i) => {
                const pageNumber = i + Math.max(1, paginatedData.page - 2);
                if (pageNumber <= paginatedData.totalPages) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => changePage(pageNumber)}
                        isActive={pageNumber === paginatedData.page}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                return null;
              })}
              
              {paginatedData.page < paginatedData.totalPages && (
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => changePage(paginatedData.page + 1)}
                    className="cursor-pointer"
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}

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
}

const TransactionGrid: React.FC<TransactionGridProps> = ({
  transactions,
  loading,
  onEdit,
  onDelete,
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
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
