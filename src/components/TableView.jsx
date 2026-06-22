import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { Eye, Search, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { downloadCardPng, downloadCardsZip } from '../services/cardPrintService';

const TableView = ({ section = 'individu', setSection, data, page, total, limit, setLimit, setPage, fetchData, setSelectedIndividu, activeFilters = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const selectAllRef = useRef(null);

  const getRowId = (row) => {
    if (!row) return null;
    return String(row.ind_uid || row.id_ui || row.id || row.kk_uid || row.kk || row.nomor_kk || row.NomorKTP || row['Nomor KTP/NIK'] || row['nomor_kk'] || row['kk_uid'] || row['id_ui'] || row['ind_uid'] || row['id'] || '').trim();
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

    console.log(ids);

    try {
      await Promise.all(ids.map((id) => axios.patch(`${import.meta.env.VITE_API_URL}/eligible/${encodeURIComponent(id)}`, { isEligible: true, source: section })));
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
          cell: (info) => <span>{info.getValue()}</span>,
        },
        {
          accessorKey: 'nomor_kk',
          header: 'NO. KK',
          cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
        },
        {
          accessorKey: 'flag',
          header: 'DESIL',
          cell: (info) => <span className={`bg-orange-100 ${info.getValue()?.match(/\d+/)?.[0] === '1' ? 'text-orange-700' : 'text-gray-700'} px-3 py-1 rounded-full text-xs font-black`}>{info.getValue().match(/\d+/)?.[0] || '1'}</span>,
        },
        {
          accessorKey: 'desa_kelurahan',
          header: 'DESA',
        },
        {
          id: 'detail',
          header: 'DETAIL',
          cell: (info) => (
            <button type="button" onClick={() => handleShowDetail(info.row.original)} className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg">
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
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
      },
      {
        accessorKey: 'flag',
        header: 'DESIL',
        cell: (info) => <span className={`bg-orange-100 ${info.getValue()?.match(/\d+/)?.[0] === '1' ? 'text-orange-700' : 'text-gray-700'} px-3 py-1 rounded-full text-xs font-black`}>{info.getValue().match(/\d+/)?.[0] || '1'}</span>,
      },
      {
        accessorKey: 'desa_kelurahan',
        header: 'DESA',
      },
      {
        id: 'detail',
        header: 'DETAIL',
        cell: (info) => (
          <button type="button" onClick={() => handleShowDetail(info.row.original)} className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg">
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
    const column = map[id] || id;
    return { column, order };
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
          await downloadCardPng({ section, id, name: row.nama_kepala_keluarga || row.name || '-', nik: row.nomor_kk || '-', desa: row.desa_kelurahan || '-', desil: row.flag || '-' }, `kartu-desil-keluarga-${id}.png`);
        } else {
          await downloadCardPng({ section, id, name: row['Nama Lengkap Individu'] || row.name || '-', nik: row['Nomor KTP/NIK'] || row.nik || '-', desa: row.desa_kelurahan || '-', desil: row.flag || '-' }, `kartu-desil-individu-${id}.png`);
        }
      } else {
        const items = selectedRows.map((row) => {
          const id = getRowId(row);
          if (section === 'keluarga') {
            return {
              section: 'keluarga',
              id,
              name: row.nama_kepala_keluarga || row.name || '-',
              nik: row.nomor_kk || row.kk || '-',
              desil: row.flag || '-',
              desa: row.desa_kelurahan || '-',
            };
          }

          return {
            section: 'individu',
            id,
            name: row['Nama Lengkap Individu'] || row.name || '-',
            nik: row['Nomor KTP/NIK'] || row.nik || '-',
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

  useEffect(() => {
    const currentSort = mapSort(sorting);
    fetchData(1, {
      search: debouncedSearch || undefined,
      sortBy: currentSort?.column,
      sortOrder: currentSort?.order,
    });
  }, [debouncedSearch, sorting, fetchData]);

  const table = useReactTable({
    data: data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  // const handleExportToExcel = () => {
  //   const filterPayload = {};
  //   activeFilters.forEach((f) => {
  //     if (!f.column || f.value === '' || f.value == null) return;
  //     if (Array.isArray(f.value) && f.value.length === 0) return;

  //     if (f.column === 'umur' && typeof f.value === 'object' && f.value.min !== '' && f.value.max !== '') {
  //       filterPayload[f.column] = [Number(f.value.min), Number(f.value.max)];
  //       return;
  //     }

  //     if (Array.isArray(f.value)) {
  //       filterPayload[f.column] = f.value;
  //       return;
  //     }

  //     filterPayload[f.column] = [f.value];
  //   });

  //   const exportEndpoint = section === 'keluarga' ? `${import.meta.env.VITE_API_URL}/keluarga/export` : `${import.meta.env.VITE_API_URL}/individu/export`;

  //   axios
  //     .post(exportEndpoint, { filters: filterPayload })
  //     .then(() => {
  //       // Export initiated by API call; response is handled by backend.
  //     })
  //     .catch((err) => {
  //       console.error('Export API gagal', err);
  //     });
  // };

  const SortIcon = ({ column }) => {
    if (!column.getCanSort()) return null;

    const isSorted = column.getIsSorted();
    if (isSorted === false) return <ArrowUpDown size={14} className="text-slate-400" />;
    return isSorted === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex-1 bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col">
        {/* Search Bar & Actions */}
        <div className="p-4 border-b bg-slate-50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cari data..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-3">
              <select value={section} onChange={(e) => setSection(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors">
                <option value="individu">Individu</option>
                <option value="keluarga">Keluarga</option>
              </select>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {selectedIds.length > 0 && (
                <>
                  <button onClick={handleSetSelectedEligible} disabled={selectedIds.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Tandai Eligible
                  </button>
                  <button
                    onClick={handleDownloadSelectedCards}
                    disabled={selectedIds.length === 0 || bulkDownloading}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {bulkDownloading ? 'Mengunduh...' : `Unduh ${selectedIds.length} kartu`}
                  </button>
                </>
              )}
              <div className="text-slate-500 text-sm font-semibold">{selectedIds.length > 0 ? `${selectedIds.length} item terpilih` : 'Tidak ada item terpilih'}</div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b sticky top-0 z-20">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  <th className="px-6 py-4">
                    <input type="checkbox" ref={selectAllRef} checked={allVisibleSelected} onChange={toggleSelectAllVisible} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                  </th>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={`px-6 py-4 text-slate-500 font-bold ${header.column.getCanSort() ? 'cursor-pointer hover:bg-slate-100' : ''} ${header.id === 'detail' ? 'text-center' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && <SortIcon column={header.column} />}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y">
              {table.getRowModel().rows.map((row) => {
                const rowId = getRowId(row.original);
                const isSelected = rowId && selectedIds.includes(rowId);

                return (
                  <tr key={row.id} className={` transition-colors ${row.original['Status Eligible'] ? 'bg-green-300 hover:bg-green-400' : 'hover:bg-slate-50'}`}>
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={Boolean(isSelected)} onChange={() => toggleRowSelection(rowId)} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                    </td>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={cell.column.id === 'detail' ? 'px-6 py-4 text-center' : 'px-6 py-4'}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t flex justify-between items-center text-xs font-bold text-slate-500">
          <button
            onClick={() => {
              const currentSort = mapSort(sorting);
              setPage(page - 1);
              fetchData(page - 1, {
                search: debouncedSearch,
                sortBy: currentSort?.column || 'nama',
                sortOrder: currentSort?.order || 'asc',
                limit,
              });
            }}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Prev
          </button>

          <div className="flex gap-2 items-center">
            <select value={limit} onChange={(e) => handleLimitChange(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors">
              <option value={10}>10 / halaman</option>
              <option value={25}>25 / halaman</option>
              <option value={50}>50 / halaman</option>
              <option value={100}>100 / halaman</option>
              <option value={250}>250 / halaman</option>
              <option value={500}>500 / halaman</option>
              <option value={1000}>1000 / halaman</option>
            </select>
            <span>
              HALAMAN {page} / {Math.ceil(total / limit)} ({total} DATA)
            </span>
          </div>
          <button
            onClick={() => {
              const currentSort = mapSort(sorting);
              setPage(page + 1);
              fetchData(page + 1, {
                search: debouncedSearch,
                sortBy: currentSort?.column || 'nama',
                sortOrder: currentSort?.order || 'asc',
                limit,
              });
            }}
            disabled={page * limit >= total}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableView;
