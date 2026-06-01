'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Props {
  onRangeSelect: (start: string, end: string) => void;
  initialStart?: string;
  initialEnd?: string;
}

export default function MonthRangePicker({ onRangeSelect, initialStart, initialEnd }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  
  // Formato: "YYYY-MM-01"
  const [startMonth, setStartMonth] = useState(initialStart || '');
  const [endMonth, setEndMonth] = useState(initialEnd || '');
  
  const containerRef = useRef<HTMLDivElement>(null);

  const months = [
    'jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.',
    'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMonthClick = (monthIdx: number) => {
    const dateStr = `${viewYear}-${String(monthIdx + 1).padStart(2, '0')}-01`;
    
    if (!startMonth || (startMonth && endMonth)) {
      setStartMonth(dateStr);
      setEndMonth('');
    } else {
      // Se clicar em uma data anterior à inicial, ela vira a inicial
      if (new Date(dateStr + 'T00:00:00') < new Date(startMonth + 'T00:00:00')) {
        setStartMonth(dateStr);
        setEndMonth('');
      } else {
        setEndMonth(dateStr);
      }
    }
  };

  const handleApply = () => {
    if (startMonth && endMonth) {
      // Ajusta o final para o último dia do mês de forma robusta e livre de fuso horário
      const [year, month] = endMonth.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      const finalEnd = `${endMonth.substring(0, 7)}-${String(lastDay).padStart(2, '0')}`;
      
      onRangeSelect(startMonth, finalEnd);
      setIsOpen(false);
    }
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    return `${months[parseInt(month, 10) - 1]} de ${year}`;
  };

  const isSelected = (mIdx: number) => {
    const current = `${viewYear}-${String(mIdx + 1).padStart(2, '0')}-01`;
    if (startMonth === current || endMonth === current) return true;
    return false;
  };

  const isInRange = (mIdx: number) => {
    if (!startMonth || !endMonth) return false;
    const current = new Date(viewYear, mIdx, 1);
    const start = new Date(startMonth + 'T00:00:00');
    const end = new Date(endMonth + 'T00:00:00');
    return current > start && current < end;
  };

  return (
    <div className="relative z-30" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-[#161b22] hover:bg-[#1c232d] border border-white/10 rounded-full px-4 py-2 text-sm font-bold text-white transition-all shadow-lg"
      >
        <Calendar size={16} className="text-[#00ff9d]" />
        {startMonth && endMonth ? (
          <span>{formatDateLabel(startMonth)} – {formatDateLabel(endMonth)}</span>
        ) : (
          <span className="text-gray-400">Selecionar Período</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-3 left-0 md:left-auto md:right-0 w-[320px] bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl z-[100] p-5 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setViewYear(viewYear - 1)} className="p-1 hover:bg-white/5 rounded-full text-gray-400">
              <ChevronLeft size={20} />
            </button>
            <span className="text-lg font-black text-white">{viewYear}</span>
            <button onClick={() => setViewYear(viewYear + 1)} className="p-1 hover:bg-white/5 rounded-full text-gray-400">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {months.map((m, idx) => {
              const selected = isSelected(idx);
              const inRange = isInRange(idx);
              return (
                <button
                  key={m}
                  onClick={() => handleMonthClick(idx)}
                  className={`
                    h-12 rounded-xl text-sm font-bold transition-all relative
                    ${selected ? 'bg-[#007aff] text-white shadow-[0_0_15px_rgba(0,122,255,0.4)]' : 
                      inRange ? 'bg-[#007aff]/10 text-[#007aff]' : 
                      'text-gray-400 hover:bg-white/5'}
                  `}
                >
                  {m}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex gap-2">
            <button
              onClick={() => { setStartMonth(''); setEndMonth(''); }}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              disabled={!startMonth || !endMonth}
              className="flex-1 py-2.5 rounded-xl bg-[#007aff] hover:bg-[#006ae6] disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-white transition-all shadow-lg"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
