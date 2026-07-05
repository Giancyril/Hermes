import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomSelectDropdown({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  icon: Icon,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => {
    const val = typeof opt === 'string' ? opt : opt.value;
    return val === value;
  });
  
  const displayLabel = selectedOption 
    ? (typeof selectedOption === 'string' ? selectedOption : selectedOption.label)
    : placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white/5 border border-white/5 text-gray-300 text-[10px] font-bold rounded-lg px-2 py-1 outline-none hover:border-white/10 transition-all text-left"
      >
        <span className="flex items-center gap-1.5 truncate">
          {Icon && <Icon size={11} className="text-gray-500 shrink-0" />}
          {displayLabel}
        </span>
        <ChevronDown size={10} className={`text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 bg-gray-900 border border-white/5 rounded-xl shadow-xl z-50 py-1 min-w-[100px] overflow-hidden">
          {options.map((opt) => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const label = typeof opt === 'string' ? opt : opt.label;
            const isSelected = value === val;

            return (
              <button
                key={val}
                type="button"
                onClick={() => {
                  onChange(val);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[10px] transition-colors ${
                  isSelected
                    ? 'bg-indigo-500/10 text-indigo-400 font-bold'
                    : 'text-gray-450 hover:bg-white/[0.03] hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
