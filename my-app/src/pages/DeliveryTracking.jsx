import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Truck,
  MapPin,
  Search,
  X,
  Clock,
  CheckCircle,
  Package,
  XCircle,
  Phone,
  Download,
  Plus,
  User
} from 'lucide-react';

import { Card, Header } from '../components/SharedComponents';
import { LayoutWrapper } from './DashboardHome';
import { useTheme } from '../components/ThemeContext';
import NewDeliveryModal from '../components/DeliveryModal';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// --- CONSTANTS ---
const STATUS_CONFIG = {
  pending: { 
    label: 'Pending', 
    className: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
    color: '#eab308'
  },
  'in-transit': { 
    label: 'In-Transit', 
    className: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    color: '#3b82f6'
  },
  delivered: { 
    label: 'Delivered', 
    className: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    color: '#22c55e'
  },
  failed: { 
    label: 'Failed', 
    className: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
    color: '#ef4444'
  }
};

// --- MOCK DATA ---
const mockDeliveries = [
  {
    id: 'DLV-20251201-001',
    store: { name: '7-Eleven Biñan', address: 'Brgy. II, Biñan, Laguna', contact: '0917-111-2222' },
    items: [
      { sku: 'P1.5', name: 'Pepsi 1.5L', cases: 12 },
      { sku: 'MD1.5', name: 'Mountain-Dew 1.5L', cases: 8 }
    ],
    driver: 'Juan Dela Cruz',
    vehicle: 'Truck 102',
    status: 'in-transit',
    coordinates: [121.0825, 14.3335],
    eta: '2025-12-01T14:45:00',
    timestamps: { 
      created: '2025-12-01T08:00:00', 
      packed: '2025-12-01T09:00:00', 
      outForDelivery: '2025-12-01T09:30:00', 
      delivered: null 
    },
    warehouse: 'Warehouse A'
  },
  {
    id: 'DLV-20251201-002',
    store: { name: 'MiniMart Sta. Rosa', address: 'Sta. Rosa, Laguna', contact: '0917-222-3333' },
    items: [{ sku: 'PEPSI-1L', name: 'Pepsi 1L', cases: 6 }],
    driver: 'Maria Santos',
    vehicle: 'Motorbike 22',
    status: 'delivered',
    coordinates: [121.1114, 14.3105],
    eta: '2025-12-01T10:00:00',
    timestamps: { 
      created: '2025-12-01T07:30:00', 
      packed: '2025-12-01T08:15:00', 
      outForDelivery: '2025-12-01T08:40:00', 
      delivered: '2025-12-01T09:55:00' 
    },
    warehouse: 'Warehouse B'
  },
  {
    id: 'DLV-20251201-003',
    store: { name: "General Store Poblacion", address: 'Poblacion, Cabuyao', contact: '0917-333-4444' },
    items: [{ sku: 'MIRINDA-500', name: 'Mirinda 500ml', cases: 10 }],
    driver: 'Ramon Reyes',
    vehicle: 'Truck 108',
    status: 'pending',
    coordinates: [121.1238, 14.2764],
    eta: '2025-12-01T16:30:00',
    timestamps: { 
      created: '2025-12-01T08:10:00', 
      packed: null, 
      outForDelivery: null, 
      delivered: null 
    },
    warehouse: 'Warehouse A'
  },
  {
    id: 'DLV-20251201-004',
    store: { name: 'Sari-Sari Store Calamba', address: 'Calamba City, Laguna', contact: '0917-444-5555' },
    items: [
      { sku: 'ROYAL-500', name: 'Royal 500ml', cases: 15 }, 
      { sku: 'COKE-500', name: 'Coca-Cola 500ml', cases: 20 }
    ],
    driver: 'Pedro Martinez',
    vehicle: 'Truck 105',
    status: 'failed',
    coordinates: [121.1539, 14.2144],
    eta: '2025-12-01T12:00:00',
    timestamps: { 
      created: '2025-12-01T07:00:00', 
      packed: '2025-12-01T08:00:00', 
      outForDelivery: '2025-12-01T09:00:00', 
      delivered: null 
    },
    warehouse: 'Warehouse A',
    failureReason: 'Store closed during delivery attempt'
  }
];

// --- HELPER COMPONENTS ---
function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { 
    label: status, 
    className: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400' 
  };
  
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function StatsCard({ label, value, icon: Icon, color, bg }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className={`text-3xl font-bold mt-2 ${color} dark:text-white`}>{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${bg} dark:bg-opacity-20`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </Card>
  );
}

function FilterBar({ query, setQuery, statusFilter, setStatusFilter, onClear, onNewDelivery, theme }) {
  return (
    <Card className="p-6 mb-6">
      <div className="flex flex-wrap items-center gap-3 w-full">
        <div className="relative flex-1 min-w-[200px]">
          <input
            className="w-full pr-10 py-2.5 pl-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-opacity-50 transition-all"
            placeholder="Search by ID, store or driver..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
        </div>

        <select
          className="py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in-transit">In-Transit</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
        </select>

        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
          onClick={onClear}
        >
          <X className="w-4 h-4" /> Clear
        </button>
        
        <button 
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium hover:opacity-90 transition-opacity ml-auto"
          style={{ backgroundColor: theme.chart }}
          onClick={onNewDelivery}
        >
          <Plus className="w-4 h-4" /> New Delivery
        </button>
      </div>
    </Card>
  );
}

function MapContainer({ filtered, theme, onMarkerClick }) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  // Initialize Map
  useEffect(() => {
    if (mapInstance.current) return;
    if (!mapContainer.current) return;

    try {
      mapInstance.current = new maplibregl.Map({
        container: mapContainer.current,
        style: "https://demotiles.maplibre.org/style.json",
        center: [121.08, 14.28],
        zoom: 11,
        attributionControl: false
      });

      mapInstance.current.addControl(new maplibregl.NavigationControl(), 'top-right');

      mapInstance.current.on('load', () => {
        console.log('Delivery tracking map loaded successfully');
      });

      mapInstance.current.on('error', (e) => {
        console.error('Map error:', e);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    filtered.forEach(delivery => {
      if (!delivery.coordinates) return;

      const statusConfig = STATUS_CONFIG[delivery.status];
      const color = statusConfig?.color || '#6b7280';

      const marker = new maplibregl.Marker({ color })
        .setLngLat(delivery.coordinates)
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(
            `<div class="p-2">
              <b class="text-sm">${delivery.store.name}</b><br>
              <span class="text-xs text-gray-600">${statusConfig?.label || delivery.status}</span>
            </div>`
          )
        )
        .addTo(mapInstance.current);

      marker.getElement().addEventListener('click', () => onMarkerClick(delivery));
      
      markersRef.current.push(marker);
    });
  }, [filtered, onMarkerClick]);

  return (
    <Card className="p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: theme.chart + '20' }}>
            <MapPin className="w-5 h-5" style={{ color: theme.chart }} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Live Map View</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing {filtered.length} location{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
      
      <div 
        ref={mapContainer} 
        className="w-full h-[500px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800" 
        style={{ minHeight: '500px' }}
      />
    </Card>
  );
}

function DetailsSidebar({ selected, onClose, theme }) {
  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selected.id}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-500">Warehouse:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {selected.warehouse}
                </span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Store Info */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: theme.chart }} />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {selected.store.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selected.store.address}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <Phone className="w-4 h-4" /> {selected.store.contact}
                  </div>
                </div>
              </div>
            </div>

            {/* Driver & Vehicle Info */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Driver</div>
                  <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {selected.driver}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vehicle</div>
                  <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    {selected.vehicle}
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-gray-500" />
                <div className="font-semibold text-gray-900 dark:text-white">Items</div>
              </div>
              <div className="space-y-3">
                {selected.items.map(item => (
                  <div 
                    key={item.sku} 
                    className="flex justify-between p-3 bg-white dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.sku}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg" style={{ color: theme.chart }}>
                        {item.cases}
                      </div>
                      <div className="text-xs text-gray-500">cases</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="font-semibold text-gray-900 dark:text-white mb-2">Status</div>
              <StatusBadge status={selected.status} />
              {selected.status === 'failed' && selected.failureReason && (
                <div className="mt-3 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="font-medium mb-1">Failure Reason:</div>
                  {selected.failureReason}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-gray-500" />
                <div className="font-semibold text-gray-900 dark:text-white">Timeline</div>
              </div>
              <div className="space-y-3">
                {selected.timestamps.created && (
                  <TimelineItem 
                    label="Created" 
                    time={selected.timestamps.created} 
                    completed={true}
                  />
                )}
                {selected.timestamps.packed && (
                  <TimelineItem 
                    label="Packed" 
                    time={selected.timestamps.packed} 
                    completed={true}
                  />
                )}
                {selected.timestamps.outForDelivery && (
                  <TimelineItem 
                    label="Out for Delivery" 
                    time={selected.timestamps.outForDelivery} 
                    completed={true}
                  />
                )}
                {selected.timestamps.delivered && (
                  <TimelineItem 
                    label="Delivered" 
                    time={selected.timestamps.delivered} 
                    completed={true}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function TimelineItem({ label, time, completed }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex items-start gap-3">
      <div className={`w-2 h-2 rounded-full mt-1.5 ${completed ? 'bg-green-500' : 'bg-gray-300'}`} />
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-white">{label}</div>
        <div className="text-xs text-gray-500">{formatTime(time)}</div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function DeliveryTracking({ onNavigate, onBack }) {
  const { theme } = useTheme();
  
  // State
  const [deliveries, setDeliveries] = useState(mockDeliveries);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showNewDeliveryModal, setShowNewDeliveryModal] = useState(false);

  // Filter deliveries
  const filtered = useMemo(() => {
    return deliveries.filter(d => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      
      if (query) {
        const ql = query.toLowerCase();
        const matchesId = d.id.toLowerCase().includes(ql);
        const matchesStore = d.store.name.toLowerCase().includes(ql);
        const matchesDriver = d.driver.toLowerCase().includes(ql);
        if (!matchesId && !matchesStore && !matchesDriver) return false;
      }
      
      if (dateRange.from && d.timestamps.created < dateRange.from) return false;
      if (dateRange.to && d.timestamps.created > dateRange.to) return false;
      
      return true;
    });
  }, [deliveries, statusFilter, query, dateRange]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: deliveries.length,
      pending: deliveries.filter(d => d.status === 'pending').length,
      inTransit: deliveries.filter(d => d.status === 'in-transit').length,
      delivered: deliveries.filter(d => d.status === 'delivered').length,
      failed: deliveries.filter(d => d.status === 'failed').length,
    };
  }, [deliveries]);

  // Handlers
  const handleClearFilters = () => {
    setQuery('');
    setStatusFilter('all');
    setDateRange({ from: '', to: '' });
  };

  const handleMarkerClick = (delivery) => {
    setSelected(delivery);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setSelected(null);
    setShowDetail(false);
  };

  return (
    <LayoutWrapper currentPage="delivery-tracking" onNavigate={onNavigate}>
      <div className="pt-24">
        <Header 
          title="Delivery Tracking" 
          description="Real-time tracking of deliveries and performance metrics"
          icon={Truck}
          onBack={onBack}
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <StatsCard 
              label="Total" 
              value={stats.total} 
              icon={Truck} 
              color="text-gray-900" 
              bg="bg-gray-100" 
            />
            <StatsCard 
              label="Pending" 
              value={stats.pending} 
              icon={Clock} 
              color="text-yellow-600" 
              bg="bg-yellow-100" 
            />
            <StatsCard 
              label="In-Transit" 
              value={stats.inTransit} 
              icon={Truck} 
              color="text-blue-600" 
              bg="bg-blue-100" 
            />
            <StatsCard 
              label="Delivered" 
              value={stats.delivered} 
              icon={CheckCircle} 
              color="text-green-600" 
              bg="bg-green-100" 
            />
            <StatsCard 
              label="Failed" 
              value={stats.failed} 
              icon={XCircle} 
              color="text-red-600" 
              bg="bg-red-100" 
            />
          </div>

          {/* Filters */}
          <FilterBar
            query={query}
            setQuery={setQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onClear={handleClearFilters}
            onNewDelivery={() => setShowNewDeliveryModal(true)}
            theme={theme}
          />

          {/* Map View */}
          <MapContainer 
            filtered={filtered}
            theme={theme}
            onMarkerClick={handleMarkerClick}
          />

        </main>
      </div>

      {/* Details Sidebar */}
      {showDetail && selected && (
        <DetailsSidebar 
          selected={selected} 
          onClose={handleCloseDetail} 
          theme={theme} 
        />
      )}

      {/* New Delivery Modal */}
      {showNewDeliveryModal && (
        <NewDeliveryModal onClose={() => setShowNewDeliveryModal(false)} />
      )}
    </LayoutWrapper>
  );
}