import { useState, useCallback } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TableView from './components/TableView';
import MapView from './components/MapView';
import DetailModal from './components/DetailModal';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import DetailPage from './pages/DetailPage';
import UserPage from './pages/UserPage';

function getToken() {
  const localToken = localStorage.getItem('token');
  if (localToken) return localToken;

  const cookieToken = document.cookie.split('; ').find((cookie) => cookie.startsWith('token='));
  return cookieToken?.split('=')[1] || null;
}

function ProtectedRoute({ children }) {
  const location = useLocation();
  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function GeneralPageLayout({ children }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; max-age=0';
    navigate('/login', { replace: true });
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <Header showViewToggle={false} showSidebarToggle={false} onLogout={logout} />
      <main className="flex-1 overflow-auto p-3 sm:p-6">{children}</main>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState('table');
  const [data, setData] = useState([]);
  const [mapData, setMapData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [columnOptions, setColumnOptions] = useState({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [tableSection, setTableSection] = useState('individu');
  const [limit, setLimit] = useState(100);
  const [selectedIndividu, setSelectedIndividu] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; max-age=0';
    navigate('/login', { replace: true });
  };

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

        const fetchLimit = opts.limit || limit;
        const body = {
          page: targetPage,
          limit: fetchLimit,
          filters: filterPayload,
        };

        if (opts.search) body.search = opts.search;
        if (opts.sortBy) body.sortBy = opts.sortBy;
        if (opts.sortOrder) body.sortOrder = opts.sortOrder;

        const endpoint = tableSection === 'keluarga' ? `${import.meta.env.VITE_API_URL}/keluarga` : `${import.meta.env.VITE_API_URL}/individu/search`;
        const res = await axios.post(endpoint, body);

        setData(res.data.data || res.data || []);
        setTotal(res.data.total || 0);
        setPage(targetPage);
        setMapData(res.data.data || res.data || []);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    },
    [activeFilters, tableSection, limit],
  );

  const fetchOptions = async (index, columnName) => {
    if (!columnName) return;
    try {
      if (columnName === 'Status Eligible') {
        setColumnOptions((prev) => ({ ...prev, [columnName]: [true] }));
        setActiveFilters((prev) => {
          const next = [...prev];
          next[index] = { column: columnName, value: [] };
          return next;
        });
        return;
      }

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/options/${columnName}/${tableSection}`);
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
    const id = item.ind_uid || item.id_ui || item.id || item.kk_uid;
    if (!id) return;

    const url = item.ind_uid ? `${import.meta.env.VITE_API_URL}/individu/${id}` : `${import.meta.env.VITE_API_URL}/keluarga/${id}`;

    try {
      const res = await axios.get(url);
      setSelectedIndividu(res.data.data || res.data || null);
    } catch (error) {
      console.error('Gagal ambil detail individu dari map', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <Header view={view} setView={setView} sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} onLogout={logout} />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          activeFilters={activeFilters}
          tableSection={tableSection}
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

        <main className="flex-1 relative overflow-hidden">
          {view === 'table' ? (
            <TableView
              section={tableSection}
              setSection={setTableSection}
              data={data}
              page={page}
              total={total}
              limit={limit}
              setLimit={setLimit}
              setPage={setPage}
              fetchData={fetchData}
              setSelectedIndividu={setSelectedIndividu}
              activeFilters={activeFilters}
            />
          ) : (
            <MapView mapData={mapData} getMarkerColor={getMarkerColor} onMarkerClick={handleMapMarkerClick} />
          )}

          <DetailModal selectedIndividu={selectedIndividu} setSelectedIndividu={setSelectedIndividu} />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user"
        element={
          <ProtectedRoute>
            <UserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/detail/:section/:id"
        element={
          <ProtectedRoute>
            <DetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
