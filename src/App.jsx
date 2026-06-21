import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TableView from './components/TableView';
import MapView from './components/MapView';
import DetailModal from './components/DetailModal';

function App() {
  const [data, setData] = useState([]);
  const [mapData, setMapData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('table');
  const [activeFilters, setActiveFilters] = useState([]);
  const [columnOptions, setColumnOptions] = useState({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 100;
  const [selectedIndividu, setSelectedIndividu] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const getMarkerColor = (desil) => {
    const normalized = String(desil || '').trim();

    if (normalized === '1') return '#ef4444';
    if (normalized === '2') return '#f97316';
    if (normalized === '3') return '#f59e0b';
    if (normalized === '4') return '#eab308';
    if (normalized === '5') return '#84cc16';
    if (normalized === '6') return '#22c55e';
    if (normalized === '7') return '#14b8a6';
    if (normalized === '8') return '#06b6d4';
    if (normalized === '9') return '#3b82f6';
    return '#8b5cf6';
  };

  const fetchData = useCallback(
    async (targetPage = 1, opts = {}) => {
      setLoading(true);
      try {
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

        const body = {
          page: targetPage,
          limit,
          filters: filterPayload,
        };

        if (opts.search) body.search = opts.search;
        if (opts.sortBy) body.sortBy = opts.sortBy;
        if (opts.sortOrder) body.sortOrder = opts.sortOrder;

        const res = await axios.post(`${import.meta.env.VITE_API_URL}/individu/search`, body);

        setData(res.data.data);
        setTotal(res.data.total);
        setPage(targetPage);
        setMapData(res.data.data);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    },
    [activeFilters],
  );

  const fetchOptions = async (index, columnName) => {
    if (!columnName) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/options/${columnName}`);
      setColumnOptions((prev) => ({ ...prev, [columnName]: res.data.options }));
      setActiveFilters((prev) => {
        const next = [...prev];
        next[index] = {
          column: columnName,
          value: columnName === 'umur' ? { min: '', max: '' } : [],
        };
        return next;
      });
    } catch (error) {
      console.error('Gagal ambil opsi', error);
    }
  };

  const addFilter = () => setActiveFilters([...activeFilters, { column: '', value: '' }]);
  const removeFilter = (index) => {
    const newFilters = [...activeFilters];
    newFilters.splice(index, 1);
    setActiveFilters(newFilters);
  };
  const updateFilter = (index, field, val) => {
    const newFilters = [...activeFilters];
    newFilters[index][field] = val;
    setActiveFilters(newFilters);
  };

  const handleMapMarkerClick = async (item) => {
    const id = item.ind_uid || item.id_ui || item.id;
    if (!id) return;

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/individu/${id}`);
      setSelectedIndividu(res.data.data || res.data || null);
    } catch (error) {
      console.error('Gagal ambil detail individu dari map', error);
    }
  };

  // load initial page once
  useEffect(() => {
    const load = async () => {
      await fetchData(1);
    };
    load();
    // intentionally ignore fetchData in deps to run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <Header view={view} setView={setView} sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeFilters={activeFilters}
          columnOptions={columnOptions}
          addFilter={addFilter}
          removeFilter={removeFilter}
          updateFilter={updateFilter}
          fetchOptions={fetchOptions}
          fetchData={fetchData}
          loading={loading}
          isOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 relative">
          {view === 'table' ? (
            <TableView data={data} page={page} total={total} limit={limit} fetchData={fetchData} setSelectedIndividu={setSelectedIndividu} />
          ) : (
            <MapView mapData={mapData} getMarkerColor={getMarkerColor} onMarkerClick={handleMapMarkerClick} />
          )}

          <DetailModal selectedIndividu={selectedIndividu} setSelectedIndividu={setSelectedIndividu} />
        </main>
      </div>
    </div>
  );
}

export default App;
