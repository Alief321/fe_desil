import React, { useState, useMemo, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Eye, Search, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';

const TableView = ({ section = 'individu', setSection, data, page, total, limit, fetchData, setSelectedIndividu, activeFilters = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sorting, setSorting] = useState([]);
  const [debouncedSearch, setDebouncedSearch] = useState('');

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

  const handleExportToExcel = () => {
    const filterPayload = {};
    activeFilters.forEach((f) => {
      if (!f.column || f.value === '' || f.value == null) return;
      if (Array.isArray(f.value) && f.value.length === 0) return;

      if (f.column === 'umur' && typeof f.value === 'object' && f.value.min !== '' && f.value.max !== '') {
        filterPayload[f.column] = [Number(f.value.min), Number(f.value.max)];
        return;
      }

      if (Array.isArray(f.value)) {
        filterPayload[f.column] = f.value;
        return;
      }

      filterPayload[f.column] = [f.value];
    });

    const exportEndpoint = section === 'keluarga' ? `${import.meta.env.VITE_API_URL}/keluarga/export` : `${import.meta.env.VITE_API_URL}/individu/export`;

    axios
      .post(exportEndpoint, { filters: filterPayload })
      .then(() => {
        // Export initiated by API call; response is handled by backend.
      })
      .catch((err) => {
        console.error('Export API gagal', err);
      });
  };

  const SortIcon = ({ column }) => {
    if (!column.getCanSort()) return null;

    const isSorted = column.getIsSorted();
    if (isSorted === false) return <ArrowUpDown size={14} className="text-slate-400" />;
    return isSorted === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex-1 bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col">
        {/* Search Bar & Export */}
        <div className="p-4 border-b bg-slate-50 flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cari data..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <select value={section} onChange={(e) => setSection(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors">
              <option value="individu">Individu</option>
              <option value="keluarga">Keluarga</option>
            </select>
            {/* <button onClick={handleExportToExcel} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium text-sm whitespace-nowrap">
              <Download size={16} />
              Export Excel
            </button> */}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b sticky top-0 z-20">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
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
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={cell.column.id === 'detail' ? 'px-6 py-4 text-center' : 'px-6 py-4'}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t flex justify-between items-center text-xs font-bold text-slate-500">
          <button
            onClick={() => {
              const currentSort = mapSort(sorting);
              fetchData(page - 1, {
                search: debouncedSearch,
                sortBy: currentSort?.column || 'nama',
                sortOrder: currentSort?.order || 'asc',
              });
            }}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Prev
          </button>
          <span>
            HALAMAN {page} / {Math.ceil(total / limit)} ({total} DATA)
          </span>
          <button
            onClick={() => {
              const currentSort = mapSort(sorting);
              fetchData(page + 1, {
                search: debouncedSearch,
                sortBy: currentSort?.column || 'nama',
                sortOrder: currentSort?.order || 'asc',
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
