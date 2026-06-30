import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { Eye, Search, ArrowUpDown, ArrowUp, ArrowDown, DownloadIcon, FileSpreadsheet, FileText, CheckCircle2, FileDown } from 'lucide-react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { downloadCardPng, downloadCardsZip } from '../services/cardPrintService';
import { Loading } from './Loading';
import { getToken } from '../main';

const TableView = ({ section = 'individu', setSection, data, page, total, limit, setLimit, setPage, fetchData, setSelectedIndividu, activeFilters = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const selectAllRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const getRowId = (row) => {
    if (!row) return null;
    return String(row.ind_uid || row.id_ui || row.id || row.kk_uid || row.kk || row.nomor_kk || row.NomorKTP || row['Nomor KTP/NIK'] || '').trim();
  };

  const visibleRowIds = useMemo(() => data.map((row) => getRowId(row)).filter(Boolean), [data]);
  const allVisibleSelected = visibleRowIds.length > 0 && visibleRowIds.every((id) => selectedIds.includes(id));
  const someVisibleSelected = visibleRowIds.some((id) => selectedIds.includes(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
    }
  }, [someVisibleSelected, allVisibleSelected]);

  const toggleRowSelection = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((value) => value !== id);
      return [...prev, id];
    });
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleRowIds.includes(id)));
      return;
    }
    const next = Array.from(new Set([...selectedIds, ...visibleRowIds]));
    setSelectedIds(next);
  };

  const handleSetSelectedEligible = async () => {
    const ids = Array.from(new Set(selectedIds.filter(Boolean)));
    if (ids.length === 0) return;

    try {
      await Promise.all(
        ids.map((id) => {
          const row = data.find((d) => getRowId(d) === id);
          if (!row) return null;
          const current = row.isEligible ?? row['Status Eligible'];
          const nextValue = !current;

          return axios.patch(`${import.meta.env.VITE_API_URL}/eligible/${encodeURIComponent(id)}`, {
            isEligible: nextValue,
            source: section,
          });
        }),
      );

      setSelectedIds([]);
      fetchData(page);
      alert(`Berhasil memperbarui eligible untuk ${ids.length} item.`);
    } catch (error) {
      console.error('Gagal memperbarui eligible', error);
      alert('Terjadi kesalahan saat memperbarui eligible. Silakan coba lagi.');
    }
  };

  const handleShowDetail = useCallback(
    async (row) => {
      const id = section === 'keluarga' ? row.kk_uid || row.KK : row.ind_uid || row.id_ui || row.id;
      if (!id) return;
      try {
        const endpoint = section === 'keluarga' ? `${import.meta.env.VITE_API_URL}/keluarga/${id}` : `${import.meta.env.VITE_API_URL}/individu/${id}`;
        const res = await axios.get(endpoint);
        res.data.section = section;
        setSelectedIndividu(res.data.data || res.data || null);
      } catch (error) {
        console.error('Gagal ambil detail', error);
      }
    },
    [section, setSelectedIndividu],
  );

  const columns = useMemo(() => {
    const commonFlagCell = (info) => {
      const desilStr = info.getValue()?.match(/\d+/)?.[0] || '1';
      const isSangatMiskin = desilStr === '1';
      const isMiskin = desilStr === '2';

      return (
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isSangatMiskin ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-[0_2px_10px_-3px_rgba(225,29,72,0.3)]' : isMiskin ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-[0_2px_10px_-3px_rgba(217,119,6,0.3)]' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSangatMiskin ? 'bg-rose-500' : isMiskin ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
          Desil {desilStr}
        </div>
      );
    };

    if (section === 'keluarga') {
      return [
        {
          accessorKey: 'nama_kepala_keluarga',
          header: 'NAMA KEPALA KELUARGA',
          cell: (info) => <span className="font-bold text-slate-800">{info.getValue()}</span>,
        },
        {
          accessorKey: 'nomor_kk',
          header: 'NO. KK',
          cell: (info) => <span className="font-mono text-xs text-slate-500 tracking-wide bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{info.getValue()}</span>,
        },
        {
          accessorKey: 'flag',
          header: 'KESEJAHTERAAN',
          cell: commonFlagCell,
        },
        {
          accessorKey: 'desa_kelurahan',
          header: 'DESA',
          cell: (info) => <span className="text-slate-600 font-medium">{info.getValue()}</span>,
        },
        {
          id: 'detail',
          header: 'AKSI',
          cell: (info) => (
            <button
              type="button"
              onClick={() => handleShowDetail(info.row.original)}
              className="cursor-pointer p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-all hover:scale-110 shadow-sm shadow-transparent hover:shadow-blue-200"
            >
              <Eye size={18} strokeWidth={2.5} />
            </button>
          ),
          enableSorting: false,
        },
      ];
    }

    return [
      {
        accessorKey: 'Nama Lengkap Individu',
        header: 'NAMA LENGKAP',
        cell: (info) => <span className="font-bold text-slate-800">{info.getValue()}</span>,
      },
      {
        accessorKey: 'Nomor KTP/NIK',
        header: 'NIK',
        cell: (info) => <span className="font-mono text-xs text-slate-500 tracking-wide bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{info.getValue()}</span>,
      },
      {
        accessorKey: 'flag',
        header: 'KESEJAHTERAAN',
        cell: commonFlagCell,
      },
      {
        accessorKey: 'desa_kelurahan',
        header: 'DESA',
        cell: (info) => <span className="text-slate-600 font-medium">{info.getValue()}</span>,
      },
      {
        id: 'detail',
        header: 'AKSI',
        cell: (info) => (
          <button type="button" onClick={() => handleShowDetail(info.row.original)} className="cursor-pointer p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-all hover:scale-110 shadow-sm shadow-transparent hover:shadow-blue-200">
            <Eye size={18} strokeWidth={2.5} />
          </button>
        ),
        enableSorting: false,
      },
    ];
  }, [handleShowDetail, section]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    setSorting([]);
  }, [section]);

  const mapSort = (sortingArr) => {
    if (!sortingArr || sortingArr.length === 0) return null;
    const s = sortingArr[0];
    const id = s.id;
    const order = s.desc ? 'desc' : 'asc';
    const map = {
      'Nama Lengkap Individu': 'nama',
      'Nomor KTP/NIK': 'nik',
      desa_kelurahan: 'desa_kelurahan',
      flag: 'flag',
      kk_uid: 'kk_uid',
      'Nama Kepala Keluarga': 'nama',
      'Nomor KK': 'kk',
    };
    return { column: map[id] || id, order };
  };

  const handleLimitChange = async (nextLimit) => {
    setLimit(nextLimit);
    setPage(1);
    const currentSort = mapSort(sorting);
    await fetchData(1, {
      search: debouncedSearch,
      sortBy: currentSort?.column,
      sortOrder: currentSort?.order,
      limit: nextLimit,
    });
  };

  const handleDownloadSelectedCards = async () => {
    const selectedRows = data.filter((row) => selectedIds.includes(getRowId(row)));
    if (selectedRows.length === 0) return;

    setBulkDownloading(true);
    try {
      if (selectedRows.length === 1) {
        const row = selectedRows[0];
        const id = getRowId(row);
        if (section === 'keluarga') {
          await downloadCardPng({ section, id, name: row.nama_kepala_keluarga || '-', nik: row.nomor_kk || '-', desa: row.desa_kelurahan || '-', desil: row.flag || '-' }, `kartu-desil-keluarga-${id}.png`);
        } else {
          await downloadCardPng({ section, id, name: row['Nama Lengkap Individu'] || '-', nik: row['Nomor KTP/NIK'] || '-', desa: row.desa_kelurahan || '-', desil: row.flag || '-' }, `kartu-desil-individu-${id}.png`);
        }
      } else {
        const items = selectedRows.map((row) => {
          const id = getRowId(row);
          return {
            section,
            id,
            name: section === 'keluarga' ? row.nama_kepala_keluarga || '-' : row['Nama Lengkap Individu'] || '-',
            nik: section === 'keluarga' ? row.nomor_kk || '-' : row['Nomor KTP/NIK'] || '-',
            desil: row.flag || '-',
            desa: row.desa_kelurahan || '-',
          };
        });
        await downloadCardsZip(items, `kartu-desil-${section}.zip`);
      }
    } catch (error) {
      console.error('Gagal mengunduh kartu', error);
      alert('Gagal mengunduh beberapa kartu. Silakan coba lagi.');
    } finally {
      setBulkDownloading(false);
    }
  };

  const handleExport = (format) => {
    setLoading(true);
    const exportEndpoint = section === 'keluarga' ? `${import.meta.env.VITE_API_URL}/keluarga/export` : `${import.meta.env.VITE_API_URL}/individu/export`;
    const filterPayload = {};
    const RANGE_COLUMNS = [
      'umur',
      'Luas Lantai Bangunan Tempat Tinggal (m2)',
      'Kepemilikan  Lahan (selain yang ditempati) (m2)',
      'Kepemilikan  Rumah_bangunan di tempat lain (m2)',
      'luas_lantai_bangunan_tempat_tinggal_m2',
      'kepemilikan_lahan_selain_yang_ditempati_m2',
      'kepemilikan_rumah_bangunan_di_tempat_lain_m2',
    ];

    activeFilters.forEach((f) => {
      if (!f.column || f.value === '' || f.value == null) return;
      if (Array.isArray(f.value) && f.value.length === 0) return;
      if (typeof f.value === 'object' && !Array.isArray(f.value) && f.value.min === '' && f.value.max === '') return;

      if (RANGE_COLUMNS.includes(f.column)) {
        if (Array.isArray(f.value) && f.value.length === 2) {
          filterPayload[f.column] = { min: Number(f.value[0]), max: Number(f.value[1]) };
          return;
        } else if (typeof f.value === 'object' && !Array.isArray(f.value) && f.value.min !== '' && f.value.max !== '') {
          filterPayload[f.column] = { min: Number(f.value.min), max: Number(f.value.max) };
          return;
        }
      }

      filterPayload[f.column] = Array.isArray(f.value) ? f.value : [f.value];
    });

    fetch(exportEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ filters: filterPayload, search: debouncedSearch, format: format }),
    })
      .then(async (res) => {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = section + '.' + format;
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const currentSort = mapSort(sorting);
    fetchData(1, {
      search: debouncedSearch || undefined,
      sortBy: currentSort?.column,
      sortOrder: currentSort?.order,
    });
  }, [debouncedSearch, sorting, fetchData]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const SortIcon = ({ column }) => {
    if (!column.getCanSort()) return null;
    const isSorted = column.getIsSorted();
    if (isSorted === false) return <ArrowUpDown size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return isSorted === 'asc' ? <ArrowUp size={14} className="text-blue-500" /> : <ArrowDown size={14} className="text-blue-500" />;
  };

  return (
    <div className="h-full w-full flex flex-col p-4 sm:p-6 bg-slate-50 font-sans">
      {loading && <Loading />}

      <div className="flex-1 bg-white/70 backdrop-blur-xl rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden flex flex-col relative z-0">
        {/* Top Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white/40 flex flex-col gap-4">
          {/* Row 1: Search, Section, & Export */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between w-full">
            <div className="relative flex-1 max-w-sm group">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                placeholder="Cari berdasarkan NIK atau Nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm bg-white shadow-sm transition-all"
              />
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="relative">
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="appearance-none border border-blue-200 rounded-xl pl-4 pr-10 py-2.5 text-sm bg-blue-50/50 text-blue-700 font-bold hover:bg-blue-100/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                >
                  <option value="individu">Data Individu</option>
                  <option value="keluarga">Data Keluarga</option>
                </select>
                <ArrowUpDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => handleExport('csv')}
                  className="flex gap-2 items-center cursor-pointer bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md shadow-slate-400/20 hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                >
                  <FileText size={16} /> <span className="hidden sm:inline">CSV</span>
                </button>
                <button
                  onClick={() => handleExport('xlsx')}
                  className="flex gap-2 items-center cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md shadow-emerald-400/20 hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                >
                  <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Excel</span>
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="flex gap-2 items-center cursor-pointer bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md shadow-rose-400/20 hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                >
                  <FileDown size={16} /> <span className="hidden sm:inline">PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Selected Actions Bar */}
          {selectedIds.length > 0 && (
            <div className="p-3 px-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100/50 rounded-xl shadow-inner flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-top-2">
              <div className="text-blue-800 text-sm font-bold text-center sm:text-left flex items-center gap-2">
                <CheckCircle2 size={18} className="text-blue-600" />
                {selectedIds.length} Data Terpilih
              </div>
              <div className="flex flex-wrap gap-2.5 justify-center sm:justify-end">
                <button onClick={handleSetSelectedEligible} className="px-4 py-2 bg-white text-blue-700 border border-blue-200 text-sm rounded-lg hover:bg-blue-50 font-bold transition-colors shadow-sm">
                  Ubah Status Eligible
                </button>
                <button
                  onClick={handleDownloadSelectedCards}
                  disabled={bulkDownloading}
                  className="px-4 py-2 bg-indigo-600 text-white border border-transparent text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-bold transition-colors shadow-sm shadow-indigo-200"
                >
                  {bulkDownloading ? 'Mempersiapkan Unduhan...' : `Unduh Kartu DTSEN`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile hint */}
        <div className="block lg:hidden text-[11px] text-slate-400 px-4 py-2 bg-slate-50 border-b border-slate-100 italic">Geser ke samping untuk melihat kolom penuh →</div>

        {/* Table Container */}
        <div className="overflow-x-auto flex-1 relative bg-white/40">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-white/80 backdrop-blur-md text-slate-500 font-bold border-b border-slate-200 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  <th className="p-4 w-12 text-center">
                    <input type="checkbox" ref={selectAllRef} checked={allVisibleSelected} onChange={toggleSelectAllVisible} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  </th>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={`p-4 whitespace-nowrap text-xs font-extrabold tracking-wide uppercase ${header.column.getCanSort() ? 'cursor-pointer hover:bg-slate-50 hover:text-slate-800 select-none group' : ''} ${header.id === 'detail' ? 'text-center w-24' : ''}`}
                    >
                      <div className={`flex items-center gap-2 ${header.id === 'detail' ? 'justify-center' : ''}`}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && <SortIcon column={header.column} />}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.map((row) => {
                const rowId = getRowId(row.original);
                const isSelected = rowId && selectedIds.includes(rowId);
                const isEligible = row.original['Status Eligible'] || row.original.isEligible;

                return (
                  <tr key={row.id} className={`transition-all duration-200 group ${isSelected ? 'bg-blue-50/60' : isEligible ? 'bg-emerald-50/30 hover:bg-emerald-50/70' : 'hover:bg-slate-50'}`}>
                    <td className="p-4 text-center">
                      <input type="checkbox" checked={Boolean(isSelected)} onChange={() => toggleRowSelection(rowId)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    </td>

                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={`p-4 text-slate-700 text-sm ${cell.column.id === 'detail' ? 'text-center' : ''}`}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/60 backdrop-blur-md">
          <button
            onClick={() => {
              const currentSort = mapSort(sorting);
              setPage(page - 1);
              fetchData(page - 1, { search: debouncedSearch, sortBy: currentSort?.column || 'nama', sortOrder: currentSort?.order || 'asc', limit });
            }}
            disabled={page === 1}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-slate-800 shadow-sm transition-all"
          >
            Sebelumnya
          </button>

          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center flex-1">
            <select
              value={limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
            >
              {[10, 25, 50, 100, 250, 500, 1000].map((v) => (
                <option key={v} value={v}>
                  {v} baris / halaman
                </option>
              ))}
            </select>

            <div className="bg-slate-100/80 px-4 py-2 rounded-xl text-xs font-extrabold text-slate-500 tracking-wide border border-slate-200/50">
              HALAMAN <span className="text-slate-800">{page}</span> DARI <span className="text-slate-800">{Math.ceil(total / limit) || 1}</span>
              <span className="mx-2 opacity-50">|</span>
              <span className="text-slate-800">{total}</span> TOTAL DATA
            </div>
          </div>

          <button
            onClick={() => {
              const currentSort = mapSort(sorting);
              setPage(page + 1);
              fetchData(page + 1, { search: debouncedSearch, sortBy: currentSort?.column || 'nama', sortOrder: currentSort?.order || 'asc', limit });
            }}
            disabled={page * limit >= total}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-slate-800 shadow-sm transition-all"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableView;
