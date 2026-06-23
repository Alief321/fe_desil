import { ChevronDown, Filter, Plus, X } from 'lucide-react';
import Select from 'react-select';
import { masterFilterColumns, getFilterLabel, getFilterLabelKeluarga } from '../config/filter';
import { useState } from 'react';
const extractPrefix = (value) => {
  const raw = String(value || '');
  const digits = raw.match(/\d/g)?.join('') || '';
  return digits.length >= 7 ? digits.slice(0, 7) : raw.slice(0, 7);
};

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

  return (
    <aside className={`bg-white border-r flex flex-col shadow-inner transition-all duration-300 ${isOpen ? 'w-80 h-auto overflow-auto ' : 'w-0 overflow-hidden'}`}>
      <div className="p-5">
        <div className="flex items-center justify-between pb-4 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-slate-700 flex items-center gap-2">
            <Filter size={18} /> Filter Panel
          </h2>
          <button onClick={addFilter} className="text-blue-600 hover:bg-blue-50 p-1 rounded-full">
            <Plus size={20} />
          </button>
        </div>

        <div className="space-y-3 pr-2">
          {activeFilters.map((f, idx) => {
            const optionValues = f.column === 'desa_kelurahan' ? getDesaOptions() : columnOptions[f.column] || [];
            const selectedValues = Array.isArray(f.value) ? f.value : f.value ? [f.value] : [];
            const umurOptions = (columnOptions.umur || []).map((opt) => Number(opt)).filter((value) => !Number.isNaN(value));
            const umurMin = umurOptions.length ? Math.min(...umurOptions) : 0;
            const umurMax = umurOptions.length ? Math.max(...umurOptions) : 100;
            const currentMin = f.value?.min != null ? Number(f.value.min) : umurMin;
            const currentMax = f.value?.max != null ? Number(f.value.max) : umurMax;
            const safeMin = Math.min(currentMin, currentMax);
            const safeMax = Math.max(currentMin, currentMax);

            return (
              <div key={idx} className="bg-slate-50 border rounded-xl overflow-hidden animate-in slide-in-from-left-2">
                {/* HEADER ACCORDION */}
                <div onClick={() => setOpenIndex(openIndex === idx ? null : idx)} className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-100">
                  <div className="text-xs font-bold text-slate-700">{f.column ? (tableSection === 'individu' ? getFilterLabel(f.column) : tableSection === 'keluarga' ? getFilterLabelKeluarga(f.column) : f.column) : 'Pilih Kategori'}</div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFilter(idx);
                      }}
                      className="bg-white shadow-sm border text-red-500 rounded-full p-1"
                    >
                      <X size={12} />
                    </button>

                    <span className={`transition-transform ${openIndex === idx ? 'rotate-180' : ''}`}>
                      <ChevronDown />
                    </span>
                  </div>
                </div>

                {/* BODY ACCORDION */}
                {openIndex === idx && (
                  <div className="p-3 border-t">
                    <Select
                      className="w-full text-xs font-bold mb-2"
                      options={masterFilterColumns.map((c) => ({
                        value: c,
                        label: tableSection === 'individu' ? getFilterLabel(c) : tableSection === 'keluarga' ? getFilterLabelKeluarga(c) : c === 'umur' ? 'Umur' : c === 'desa_kelurahan' ? 'Desa/Kelurahan' : c,
                        isDisabled: c === 'desa_kelurahan' && !hasKecamatan,
                      }))}
                      value={
                        f.column
                          ? {
                              value: f.column,
                              label: tableSection === 'individu' ? getFilterLabel(f.column) : tableSection === 'keluarga' ? getFilterLabelKeluarga(f.column) : f.column,
                            }
                          : null
                      }
                      onChange={(opt) => fetchOptions(idx, opt.value)}
                      placeholder="Pilih Kategori..."
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                      isClearable
                    />

                    {f.column && (
                      <div>
                        {f.column === 'umur' ? (
                          <div className="space-y-4">
                            <div className="flex justify-between text-sm text-slate-700">
                              <span>Rentang Umur</span>
                              <span className="font-semibold">
                                {safeMin} - {safeMax}
                              </span>
                            </div>

                            <div className="w-full flex items-center text-center gap-4">
                              <input
                                type="range"
                                className="w-4/5"
                                min={umurMin}
                                max={umurMax}
                                value={safeMin}
                                onChange={(e) =>
                                  updateFilter(idx, 'value', {
                                    min: Number(e.target.value),
                                    max: safeMax,
                                  })
                                }
                              />
                              <input
                                className="w-1/5 bg-white rounded-lg border-gray-500 border "
                                type="number"
                                name="min"
                                id="min"
                                value={safeMin}
                                onChange={(e) =>
                                  updateFilter(idx, 'value', {
                                    min: Number(e.target.value),
                                    max: safeMax,
                                  })
                                }
                              />
                            </div>

                            <div className="w-full flex items-center text-center gap-4 ">
                              <input
                                className="w-4/5"
                                type="range"
                                min={umurMin}
                                max={umurMax}
                                value={safeMax}
                                onChange={(e) =>
                                  updateFilter(idx, 'value', {
                                    min: safeMin,
                                    max: Number(e.target.value),
                                  })
                                }
                              />

                              <input
                                className="w-1/5 bg-white rounded-lg border-gray-500 border "
                                type="number"
                                name="max"
                                id="max"
                                value={safeMax}
                                onChange={(e) =>
                                  updateFilter(idx, 'value', {
                                    min: safeMin,
                                    max: Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                          </div>
                        ) : f.column === 'desa_kelurahan' && !hasKecamatan ? (
                          <div className="rounded-xl border border-dashed p-4 text-sm text-slate-600">Pilih kecamatan terlebih dahulu agar desa/kelurahan dapat dipilih.</div>
                        ) : f.column === 'Status Eligible' ? (
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={selectedValues.includes(true)}
                                onChange={() => updateFilter(idx, 'value', selectedValues.includes(true) ? selectedValues.filter((v) => v !== true) : [...selectedValues, true])}
                              />
                              <span>Eligible</span>
                            </label>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {optionValues.map((option) => {
                              const value = String(option);
                              const isChecked = selectedValues.includes(value);

                              return (
                                <label key={value} className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      const next = isChecked ? selectedValues.filter((v) => v !== value) : [...selectedValues, value];
                                      updateFilter(idx, 'value', next);
                                    }}
                                  />
                                  <span className="truncate">{value}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-5 mt-auto border-t bg-slate-50">
        <button onClick={() => fetchData(1)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-lg active:scale-95 transition-all">
          {loading ? 'Memproses...' : 'Terapkan Filter'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
