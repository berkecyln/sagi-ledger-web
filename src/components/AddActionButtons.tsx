/**
 * Add Acction Buttons (add income and add expense)
 *
 * Add Income and Add Expense buttons fixed to the bottom of the Dashboard on phones.
 *
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import TransactionModal from './TransactionModal';
import type { TransactionType } from '../types';

export default function AddActionButtons() {
  const [modal, setModal] = useState<TransactionType | null>(null);

  return (
    <>
      <div className="md:hidden sticky bottom-0 z-40 flex gap-3 px-3 pt-3 pb-6 bg-card border-t border-stroke">
        <button
          onClick={() => setModal('INCOME')}
          className="flex-1 flex items-center justify-center gap-1.5 py-4 rounded-lg text-base font-medium bg-income-btn text-income active:bg-income-btn-hover transition-colors"
        >
          <Plus size={18} /> Add Income
        </button>
        <button
          onClick={() => setModal('EXPENSE')}
          className="flex-1 flex items-center justify-center gap-1.5 py-4 rounded-lg text-base font-medium bg-expense-btn text-expense active:bg-expense-btn-hover transition-colors"
        >
          <Plus size={18} /> Add Expense
        </button>
      </div>

      {modal && <TransactionModal type={modal} onClose={() => setModal(null)} />}
    </>
  );
}
