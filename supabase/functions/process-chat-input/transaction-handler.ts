
import { supabase } from './gemini-service.ts';
import { TransactionData, RecurrenceData } from './types.ts';

export async function handleTransactionInsertion(
  transactions: TransactionData[],
  recurrences: RecurrenceData[],
  userId: string
): Promise<void> {
  try {
    // Insert recurrences first
    if (recurrences.length > 0) {
      const { error: recurrenceError } = await supabase
        .from('recorrencias')
        .insert(
          recurrences.map(rec => ({
            ...rec,
            user_id: userId,
          }))
        );

      if (recurrenceError) {
        console.error('Error inserting recurrences:', recurrenceError);
        throw recurrenceError;
      }
    }

    // Insert transactions
    if (transactions.length > 0) {
      const transactionsWithDefaults = transactions.map(transaction => ({
        ...transaction,
        user_id: userId,
        // Set is_paid based on transaction type
        is_paid: transaction.tipo_transacao === 'entrada' ? true : false,
      }));

      const { error: transactionError } = await supabase
        .from('transacoes')
        .insert(transactionsWithDefaults);

      if (transactionError) {
        console.error('Error inserting transactions:', transactionError);
        throw transactionError;
      }
    }

    console.log('Successfully inserted transactions and recurrences');
  } catch (error) {
    console.error('Error in handleTransactionInsertion:', error);
    throw error;
  }
}
