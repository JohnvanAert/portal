'use client'

import { useState } from 'react';
import { selectWinner } from '@/app/actions/selectWinner';
import { Trophy, CheckCircle2 } from 'lucide-react';

export default function SelectWinnerButton({ 
  tenderId, 
  bidId, 
  isWinner,
  isClosed 
}: { 
  tenderId: number, 
  bidId: number, 
  isWinner: boolean,
  isClosed: boolean
}) {
  const [loading, setLoading] = useState(false);

  const handleSelect = async () => {
    if (!confirm('Вы уверены, что хотите выбрать этого поставщика победителем? Тендер будет закрыт.')) return;
    
    setLoading(true);
    await selectWinner(tenderId, bidId);
    setLoading(false);
  };

  if (isWinner) {
    return (
      <div className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-xl font-bold uppercase text-xs">
        <Trophy size={16} />
        Победитель выбран
      </div>
    );
  }

  if (isClosed) return null; // Если тендер закрыт другим победителем, скрываем кнопку

  return (
    <button
      onClick={handleSelect}
      disabled={loading}
      className="mt-3 text-xs font-bold uppercase tracking-widest bg-slate-900 text-white px-6 py-2 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
    >
      {loading ? 'Обработка...' : 'Выбрать победителя'}
    </button>
  );
}