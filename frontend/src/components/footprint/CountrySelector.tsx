'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { POPULAR_COUNTRIES } from '@/lib/countryList';
import { COUNTRY_REGISTRY } from '@/lib/countries';
import { fetchGadmCountryConfig } from '@/lib/countries';

interface CountrySelectorProps {
  currentCountry: string;
  onCountryChange: (iso3: string) => void;
  isDark: boolean;
}

export function CountrySelector({ currentCountry, onCountryChange, isDark }: CountrySelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const currentConfig = COUNTRY_REGISTRY[currentCountry];
  const currentFlag = currentConfig?.flag || '';
  const currentName = currentConfig?.name || currentCountry;

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleSelect = async (iso3: string) => {
    if (iso3 === currentCountry) { setOpen(false); return; }
    // 确保国家配置已注册
    if (!COUNTRY_REGISTRY[iso3]) {
      await fetchGadmCountryConfig(iso3);
    }
    onCountryChange(iso3);
    setOpen(false);
    setSearch('');
  };

  const filtered = search.trim()
    ? POPULAR_COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.nameZh.includes(search) ||
        c.iso3.toLowerCase().includes(search.toLowerCase()),
      )
    : POPULAR_COUNTRIES;

  const mutedText = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
          isDark ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-white/80 hover:bg-white text-gray-700'
        } border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
      >
        <span>{currentFlag}</span>
        <span>{currentName}</span>
        <ChevronDown size={12} className={mutedText} />
      </button>

      {open && (
        <div className={`absolute top-full left-0 mt-1 w-64 rounded-lg shadow-xl border z-50 overflow-hidden ${
          isDark ? 'bg-gray-900/95 border-white/10 backdrop-blur-xl' : 'bg-white border-gray-200'
        }`}>
          <div className={`p-2 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
            <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${
              isDark ? 'bg-white/5' : 'bg-gray-50'
            }`}>
              <Search size={12} className={mutedText} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索国家..."
                className={`flex-1 bg-transparent text-xs outline-none ${
                  isDark ? 'text-white placeholder:text-gray-500' : 'text-gray-700 placeholder:text-gray-400'
                }`}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className={`px-3 py-4 text-center text-xs ${mutedText}`}>未找到匹配国家</div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.iso3}
                  onClick={() => handleSelect(c.iso3)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                    c.iso3 === currentCountry
                      ? (isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600')
                      : (isDark ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700')
                  }`}
                >
                  <span>{c.flag}</span>
                  <span className="flex-1">{c.nameZh}</span>
                  <span className={mutedText}>{c.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
