import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { Eye, Search, ArrowUpDown, ArrowUp, ArrowDown, DownloadIcon } from 'lucide-react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { downloadCardPng, downloadCardsZip } from '../services/cardPrintService';
import { Loading } from './Loading';

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
    if (section === 'keluarga') {
      return [
        {
          accessorKey: 'nama_kepala_keluarga',
          header: 'NAMA KEPALA KELUARGA',
          cell: (info) => <span className="font-medium text-slate-900">{info.getValue()}</span>,
        },
        {
          accessorKey: 'nomor_kk',
          header: 'NO. KK',
          cell: (info) => <span className="font-mono text-xs text-slate-600">{info.getValue()}</span>,
        },
        {
          accessorKey: 'flag',
          header: 'DESIL',
          cell: (info) => <span className={`bg-orange-100 ${info.getValue()?.match(/\d+/)?.[0] === '1' ? 'text-orange-700' : 'text-gray-700'} px-2.5 py-0.5 rounded-full text-xs font-black`}>{info.getValue().match(/\d+/)?.[0] || '1'}</span>,
        },
        {
          accessorKey: 'desa_kelurahan',
          header: 'DESA',
        },
        {
          id: 'detail',
          header: 'DETAIL',
          cell: (info) => (
            <button type="button" onClick={() => handleShowDetail(info.row.original)} className="cursor-pointer p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all">
              <Eye size={16} />
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
        cell: (info) => <span className="font-bold text-blue-600">{info.getValue()}</span>,
      },
      {
        accessorKey: 'Nomor KTP/NIK',
        header: 'NIK',
        cell: (info) => <span className="font-mono text-xs text-slate-600">{info.getValue()}</span>,
      },
      {
        accessorKey: 'flag',
        header: 'DESIL',
        cell: (info) => <span className={`bg-orange-100 ${info.getValue()?.match(/\d+/)?.[0] === '1' ? 'text-orange-700' : 'text-gray-700'} px-2.5 py-0.5 rounded-full text-xs font-black`}>{info.getValue().match(/\d+/)?.[0] || '1'}</span>,
      },
      {
        accessorKey: 'desa_kelurahan',
        header: 'DESA',
      },
      {
        id: 'detail',
        header: 'DETAIL',
        cell: (info) => (
          <button type="button" onClick={() => handleShowDetail(info.row.original)} className="cursor-pointer p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
            <Eye size={16} />
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

  const handleExportToExcel = () => {
    setLoading(true);
    const exportEndpoint = section === 'keluarga' ? `${import.meta.env.VITE_API_URL}/keluarga/export` : `${import.meta.env.VITE_API_URL}/individu/export`;
    const filterPayload = {};
    activeFilters.forEach((f) => {
      if (!f.column || f.value === '' || f.value == null) return;
      if (Array.isArray(f.value) && f.value.length === 0) return;
      if (f.column === 'umur' && typeof f.value === 'object' && f.value.min !== '' && f.value.max !== '') {
        filterPayload[f.column] = [Number(f.value.min), Number(f.value.max)];
        return;
      }
      filterPayload[f.column] = Array.isArray(f.value) ? f.value : [f.value];
    });

    fetch(exportEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ filters: filterPayload }),
    })
      .then(async (res) => {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = section + '.csv';
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
    if (isSorted === false) return <ArrowUpDown size={14} className="text-slate-400" />;
    return isSorted === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  return (
    <div className="h-full w-full flex flex-col p-3 sm:p-5">
      {loading && <Loading />}

      <div className="flex-1 bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col">
        {/* Top Controls Bar */}
        <div className="p-3 sm:p-4 border-b bg-slate-50 flex flex-col gap-3">
          {/* Row 1: Search, Section, & Export */}
          <div className="flex flex-row gap-2  xs:items-center xs:justify-between w-full">
            <div className="relative flex-1 max-w-full xs:max-w-xs ">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              />
            </div>

            <div className="flex items-center gap-2 self-end xs:self-auto">
              <select value={section} onChange={(e) => setSection(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors focus:outline-none">
                <option value="individu">Individu</option>
                <option value="keluarga">Keluarga</option>
              </select>

              <button onClick={handleExportToExcel} className="flex gap-1.5 items-center cursor-pointer bg-green-600 hover:bg-green-700 text-white rounded-xl px-3 py-2 text-sm font-semibold transition-colors">
                <DownloadIcon size={16} /> <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Row 2: Selected Actions Bar (Hanya muncul jika ada item terpilih) */}
          {selectedIds.length > 0 && (
            <div className="p-2 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between animate-fadeIn">
              <div className="text-slate-700 text-xs sm:text-sm font-semibold text-center sm:text-left">{selectedIds.length} item terpilih</div>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                <button onClick={handleSetSelectedEligible} className="px-3 py-1.5 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 font-medium transition-colors">
                  Ubah Status Eligible
                </button>
                <button onClick={handleDownloadSelectedCards} disabled={bulkDownloading} className="px-3 py-1.5 bg-slate-900 text-white text-xs sm:text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50 font-medium transition-colors">
                  {bulkDownloading ? 'Mengunduh...' : `Unduh Kartu`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile hint */}
        <div className="block lg:hidden text-[11px] text-slate-400 px-4 py-1.5 bg-slate-50/50 border-b italic">Geser ke samping untuk melihat kolom penuh →</div>

        {/* Table Container */}
        <div className="overflow-x-auto overflow-y-auto flex-1 relative">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b sticky top-0 z-20">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  <th className="p-3 sm:px-6 sm:py-3.5 w-10">
                    <input type="checkbox" ref={selectAllRef} checked={allVisibleSelected} onChange={toggleSelectAllVisible} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  </th>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={`p-3 sm:px-6 sm:py-3.5 whitespace-nowrap text-xs font-bold tracking-wider ${header.column.getCanSort() ? 'cursor-pointer hover:bg-slate-100 select-none' : ''} ${header.id === 'detail' ? 'text-center w-20' : ''}`}
                    >
                      <div className={`flex items-center gap-1.5 ${header.id === 'detail' ? 'justify-center' : ''}`}>
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
                  <tr key={row.id} className={`transition-colors ${isEligible ? 'bg-green-50/70 hover:bg-green-100/80' : 'hover:bg-slate-50/80'}`}>
                    <td className="p-3 sm:px-6 sm:py-3.5">
                      <input type="checkbox" checked={Boolean(isSelected)} onChange={() => toggleRowSelection(rowId)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    </td>

                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={`p-3 sm:px-6 sm:py-3.5 text-slate-700 text-xs sm:text-sm ${cell.column.id === 'detail' ? 'text-center' : ''}`}>
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
        <div className="p-3 sm:p-4 border-t flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center bg-slate-50 text-xs font-bold text-slate-500">
          <button
            onClick={() => {
              const currentSort = mapSort(sorting);
              setPage(page - 1);
              fetchData(page - 1, { search: debouncedSearch, sortBy: currentSort?.column || 'nama', sortOrder: currentSort?.order || 'asc', limit });
            }}
            disabled={page === 1}
            className="w-full sm:w-auto px-4 py-2 border rounded-xl bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 shadow-sm transition-colors text-center"
          >
            Sebelumnya
          </button>

          <div className="flex flex-row gap-2 items-center justify-center flex-1  sm:mr-4">
            <select value={limit} onChange={(e) => handleLimitChange(Number(e.target.value))} className="max-w-lg xs:w-auto border rounded-xl px-2.5 py-1.5 text-xs bg-white text-slate-700 focus:outline-none shadow-sm">
              {[10, 25, 50, 100, 250, 500, 1000].map((v) => (
                <option key={v} value={v}>
                  {v} / halaman
                </option>
              ))}
            </select>

            <span className="text-center text-[11px] sm:text-xs text-slate-500 whitespace-nowrap mt-1 xs:mt-0">
              HALAMAN {page} / {Math.ceil(total / limit) || 1} ({total} DATA)
            </span>
          </div>

          <button
            onClick={() => {
              const currentSort = mapSort(sorting);
              setPage(page + 1);
              fetchData(page + 1, { search: debouncedSearch, sortBy: currentSort?.column || 'nama', sortOrder: currentSort?.order || 'asc', limit });
            }}
            disabled={page * limit >= total}
            className="w-full sm:w-auto px-4 py-2 border rounded-xl bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 shadow-sm transition-colors text-center"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableView;
