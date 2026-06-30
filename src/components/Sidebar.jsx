import { ChevronDown, Filter, X, Layers, Search } from 'lucide-react';
import Select from 'react-select';
import { masterFilterColumns, getFilterLabel, getFilterLabelKeluarga, keluargaColumnsAliases } from '../config/filter';
import { useState } from 'react';

const extractPrefix = (value) => {
  const raw = String(value || '');
  const digits = raw.match(/\d/g)?.join('') || '';
  return digits.length >= 7 ? digits.slice(0, 7) : raw.slice(0, 7);
};

const RANGE_COLUMNS = [
  'umur',
  'Luas Lantai Bangunan Tempat Tinggal (m2)',
  'Kepemilikan  Lahan (selain yang ditempati) (m2)',
  'Kepemilikan  Rumah_bangunan di tempat lain (m2)',
  'luas_lantai_bangunan_tempat_tinggal_m2',
  'kepemilikan_lahan_selain_yang_ditempati_m2',
  'kepemilikan_rumah_bangunan_di_tempat_lain_m2',
];

const Sidebar = ({ activeFilters, columnOptions, tableSection, addFilter, removeFilter, updateFilter, fetchOptions, fetchData, loading, isOpen }) => {
  const hasKecamatan = activeFilters.some((filter) => filter.column === 'kecamatan' && Array.isArray(filter.value) && filter.value.length > 0);

  const kecamatanPrefixes = activeFilters
    .filter((filter) => filter.column === 'kecamatan' && Array.isArray(filter.value))
    .flatMap((filter) => filter.value.map((val) => extractPrefix(val)))
    .filter(Boolean);

  const getDesaOptions = () => {
    const allDesa = columnOptions.desa_kelurahan || [];
    if (!hasKecamatan) return [];
    return allDesa.filter((option) => kecamatanPrefixes.some((prefix) => extractPrefix(option) === prefix));
  };

  const [openIndex, setOpenIndex] = useState(null);

  const validKeluargaFilters = [
    'kecamatan', 'desa_kelurahan', 'flag', 'Status Eligible',
    ...Object.keys(keluargaColumnsAliases),
    ...Object.values(keluargaColumnsAliases)
  ];

  const currentAvailableColumns = tableSection === 'keluarga' 
    ? masterFilterColumns.filter(c => validKeluargaFilters.includes(c))
    : masterFilterColumns;

  return (
    <aside className={`absolute lg:relative inset-y-0 left-0 bg-white/95 lg:bg-white/80 backdrop-blur-xl border-r border-slate-200/60 lg:border-white/40 flex flex-col shadow-[4px_0_24px_rgb(0,0,0,0.08)] lg:shadow-[4px_0_24px_rgb(0,0,0,0.02)] transition-all duration-300 z-50 lg:z-10 ${isOpen ? 'w-[85vw] max-w-[320px] lg:w-80 h-full overflow-auto' : 'w-0 overflow-hidden opacity-0'}`}>
      <div className="p-6">
        <div className="flex flex-col gap-4 pb-5 sticky top-0 bg-white/80 backdrop-blur-md z-20 border-b border-slate-100/50 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-slate-800 flex items-center gap-2.5 text-lg">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Filter size={18} strokeWidth={2.5} />
              </div>
              Filter Data
            </h2>
          </div>

          <Select
            className="w-full text-sm font-bold shadow-sm rounded-xl"
            options={currentAvailableColumns
              .filter((c) => !activeFilters.some((f) => f.column === c))
              .map((c) => ({
                value: c,
                label: tableSection === 'individu' ? getFilterLabel(c) : tableSection === 'keluarga' ? getFilterLabelKeluarga(c) : RANGE_COLUMNS.includes(c) ? c : c === 'desa_kelurahan' ? 'Desa/Kelurahan' : c,
                isDisabled: c === 'desa_kelurahan' && !hasKecamatan,
              }))}
            value={null}
            onChange={(opt) => {
              if (opt) {
                addFilter(opt.value);
                setOpenIndex(activeFilters.length);
              }
            }}
            placeholder="🔍 Cari & Tambah Filter..."
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={{
              control: (base) => ({ ...base, borderRadius: '0.75rem', borderColor: '#e2e8f0', padding: '2px', cursor: 'pointer' }),
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              placeholder: (base) => ({ ...base, color: '#64748b', fontWeight: '600' }),
            }}
            isSearchable
          />
        </div>

        <div className="space-y-3.5 pr-1">
          {activeFilters.map((f, idx) => {
            const isRangeColumn = RANGE_COLUMNS.includes(f.column);
            const optionValues = f.column === 'desa_kelurahan' ? getDesaOptions() : columnOptions[f.column] || [];
            const selectedValues = Array.isArray(f.value) ? f.value : f.value ? [f.value] : [];

            const rangeOptions = isRangeColumn ? (columnOptions[f.column] || []).map(Number).filter((v) => !Number.isNaN(v)) : [];
            const rangeMin = rangeOptions.length ? Math.min(...rangeOptions) : 0;
            const rangeMax = rangeOptions.length ? Math.max(...rangeOptions) : 100;

            const currentMin = Array.isArray(f.value) && f.value[0] != null ? Number(f.value[0]) : rangeMin;
            const currentMax = Array.isArray(f.value) && f.value[1] != null ? Number(f.value[1]) : rangeMax;

            const safeMin = Math.min(currentMin, currentMax);
            const safeMax = Math.max(currentMin, currentMax);

            return (
              <div key={idx} className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
                {/* HEADER ACCORDION */}
                <div onClick={() => setOpenIndex(openIndex === idx ? null : idx)} className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${openIndex === idx ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-2.5">
                    <Layers size={14} className={`${openIndex === idx ? 'text-blue-500' : 'text-slate-400 group-hover:text-blue-400'} transition-colors`} />
                    <div className={`text-[13px] font-bold ${openIndex === idx ? 'text-blue-700' : 'text-slate-600 group-hover:text-slate-800'}`}>
                      {f.column ? (tableSection === 'individu' ? getFilterLabel(f.column) : tableSection === 'keluarga' ? getFilterLabelKeluarga(f.column) : f.column) : 'Memuat...'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFilter(idx);
                      }}
                      className="text-slate-300 hover:bg-rose-100 hover:text-rose-600 rounded-full p-1 transition-all"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>

                    <span className={`text-slate-400 transition-transform duration-300 ${openIndex === idx ? 'rotate-180 text-blue-500' : ''}`}>
                      <ChevronDown size={16} />
                    </span>
                  </div>
                </div>

                {/* BODY ACCORDION */}
                <div className={`grid transition-all duration-300 ease-in-out ${openIndex === idx ? 'grid-rows-[1fr] opacity-100 border-t border-slate-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="p-3.5 bg-slate-50/50">
                      {f.column && (
                        <div>
                          {isRangeColumn ? (
                            <div className="space-y-4 bg-white p-3 border border-slate-100 rounded-xl shadow-sm">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-medium">Rentang Aktif</span>
                                <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                  {safeMin} - {safeMax}
                                </span>
                              </div>

                              <div className="w-full flex items-center text-center gap-3">
                                <input type="range" className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" min={rangeMin} max={rangeMax} value={safeMin} onChange={(e) => updateFilter(idx, 'value', [Number(e.target.value), safeMax])} />
                                <input className="w-16 bg-slate-50 rounded-lg border-slate-200 border p-1 text-xs text-center font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" type="number" value={safeMin} onChange={(e) => updateFilter(idx, 'value', [Number(e.target.value), safeMax])} />
                              </div>

                              <div className="w-full flex items-center text-center gap-3">
                                <input className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" type="range" min={rangeMin} max={rangeMax} value={safeMax} onChange={(e) => updateFilter(idx, 'value', [safeMin, Number(e.target.value)])} />
                                <input className="w-16 bg-slate-50 rounded-lg border-slate-200 border p-1 text-xs text-center font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" type="number" value={safeMax} onChange={(e) => updateFilter(idx, 'value', [safeMin, Number(e.target.value)])} />
                              </div>
                            </div>
                          ) : f.column === 'desa_kelurahan' && !hasKecamatan ? (
                            <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-4 text-[13px] text-amber-700 font-medium text-center shadow-sm">
                              Tentukan <span className="font-bold">Kecamatan</span> terlebih dahulu.
                            </div>
                          ) : f.column === 'Status Eligible' ? (
                            <div className="space-y-2 bg-white p-2 border border-slate-100 rounded-xl shadow-sm">
                              <label className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                                <div className="relative flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedValues.includes(true)}
                                    onChange={() => updateFilter(idx, 'value', selectedValues.includes(true) ? selectedValues.filter((v) => v !== true) : [...selectedValues, true])}
                                    className="peer w-5 h-5 appearance-none border-2 border-slate-300 rounded-md checked:bg-emerald-500 checked:border-emerald-500 transition-all cursor-pointer shadow-sm"
                                  />
                                  <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                                <span className="text-[13px] font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">Hanya Tampilkan Eligible</span>
                              </label>
                            </div>
                          ) : (
                            <div className="space-y-1 bg-white p-2 border border-slate-100 rounded-xl shadow-sm max-h-60 overflow-y-auto">
                              {optionValues.map((option) => {
                                const value = String(option);
                                const isChecked = selectedValues.includes(value);

                                return (
                                  <label key={value} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                                    <div className="relative flex items-center justify-center mt-0.5">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          const next = isChecked ? selectedValues.filter((v) => v !== value) : [...selectedValues, value];
                                          updateFilter(idx, 'value', next);
                                        }}
                                        className="peer w-4 h-4 appearance-none border-2 border-slate-300 rounded-[4px] checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                                      />
                                      <svg className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    </div>
                                    <span className={`text-xs flex-1 leading-snug transition-colors ${isChecked ? 'font-bold text-blue-700' : 'font-medium text-slate-600 group-hover:text-slate-800'}`}>
                                      {value}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 mt-auto border-t border-slate-100 bg-white/50 backdrop-blur-sm shadow-[0_-4px_24px_rgb(0,0,0,0.02)]">
        <button onClick={() => fetchData(1)} className="relative w-full overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-xl hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all group flex items-center justify-center gap-2">
          {loading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Memproses...</span>
            </div>
          ) : (
            <>
              <Search size={18} className="group-hover:scale-110 transition-transform" />
              <span>Terapkan Parameter</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
