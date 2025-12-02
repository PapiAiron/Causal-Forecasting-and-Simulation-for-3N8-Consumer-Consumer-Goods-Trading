import React, { useEffect, useMemo, useState } from 'react';
import {
  Truck,
  MapPin,
  Search,
  Filter,
  X,
  Calendar,
  Clock,
  ListChecks,
  User,
  CheckCircle,
  Package,
  XCircle,
  Phone,
  Download,
  Plus
} from 'lucide-react';
import { Card, Header } from '../components/SharedComponents';
import { LayoutWrapper } from './DashboardHome';
import { useTheme } from '../components/ThemeContext';

// DELIVERY TRACKING PAGE (frontend only)
// - Mock data used by default
// - Firestore hooks are commented out and marked where to plug in real data

const mockDeliveries = [
  {
    id: 'DLV-20251201-001',
    store: { name: '7-Eleven Biñan', address: 'Brgy. II, Biñan, Laguna', contact: '0917-111-2222' },
    items: [
      { sku: 'COKE-1L', name: 'Coca-Cola 1L', cases: 12 },
      { sku: 'SPR-500', name: 'Sprite 500ml', cases: 8 }
    ],
    driver: 'Juan Dela Cruz',
    vehicle: 'Truck 102',
    status: 'in-transit',
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
    items: [ { sku: 'PEPSI-1L', name: 'Pepsi 1L', cases: 6 } ],
    driver: 'Maria Santos',
    vehicle: 'Motorbike 22',
    status: 'delivered',
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
    items: [ { sku: 'MIRINDA-500', name: 'Mirinda 500ml', cases: 10 } ],
    driver: 'Ramon Reyes',
    vehicle: 'Truck 108',
    status: 'pending',
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

function StatusBadge({ status }) {
  const map = {
    pending: { label: 'Pending', className: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' },
    'in-transit': { label: 'In-Transit', className: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
    delivered: { label: 'Delivered', className: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' },
    failed: { label: 'Failed', className: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' }
  };
  const meta = map[status] || { label: status, className: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400' };
  return <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${meta.className}`}>{meta.label}</span>;
}

export default function DeliveryTracking({ onNavigate, onBack }) {
  const { theme } = useTheme();
  const [deliveries, setDeliveries] = useState(mockDeliveries);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // TODO: Replace with Firestore fetch
  // useEffect(() => {
  //   const q = collection(db, 'deliveries');
  //   getDocs(q).then(snapshot => setDeliveries(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
  // }, []);

  const stats = useMemo(() => {
    const total = deliveries.length;
    const inTransit = deliveries.filter(d => d.status === 'in-transit').length;
    const delivered = deliveries.filter(d => d.status === 'delivered').length;
    const pending = deliveries.filter(d => d.status === 'pending').length;
    const failed = deliveries.filter(d => d.status === 'failed').length;
    const totalSKUs = deliveries.reduce((acc, d) => acc + d.items.reduce((s, it) => s + (it.cases || 0), 0), 0);
    return { total, inTransit, delivered, pending, failed, totalSKUs };
  }, [deliveries]);

  const filtered = useMemo(() => {
    return deliveries.filter(d => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (query) {
        const ql = query.toLowerCase();
        if (!d.id.toLowerCase().includes(ql) && 
            !d.store.name.toLowerCase().includes(ql) && 
            !d.driver.toLowerCase().includes(ql)) return false;
      }
      if (dateRange.from && d.timestamps.created < dateRange.from) return false;
      if (dateRange.to && d.timestamps.created > dateRange.to) return false;
      return true;
    });
  }, [deliveries, statusFilter, query, dateRange]);

  function openDetail(delivery) {
    setSelected(delivery);
    setShowDetail(true);
  }

  function closeDetail() {
    setSelected(null);
    setShowDetail(false);
  }

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
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: theme.chart + '20' }}>
                  <Truck className="w-6 h-6" style={{ color: theme.chart }} />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{stats.pending}</p>
                </div>
                <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/20">
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">In-Transit</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.inTransit}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                  <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Delivered</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.delivered}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.failed}</p>
                </div>
                <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/20">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-2/3">
                <div className="relative flex-1 w-full">
                  <input
                    className="w-full pr-10 py-2.5 pl-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-opacity-50 transition-all"
                    style={{ focusRingColor: theme.chart }}
                    placeholder="Search by delivery ID, store or driver..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                </div>

                <select
                  className="py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-opacity-50 transition-all"
                  style={{ focusRingColor: theme.chart }}
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
                  onClick={() => { 
                    setQuery(''); 
                    setStatusFilter('all'); 
                    setDateRange({ from: '', to: '' }); 
                  }}
                >
                  <X className="w-4 h-4" /> Clear
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                >
                  <Download className="w-4 h-4" /> Export
                </button>
                <button 
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: theme.chart }}
                >
                  <Plus className="w-4 h-4" /> New Delivery
                </button>
              </div>
            </div>

            {/* Deliveries Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="py-3 font-semibold">Delivery ID</th>
                    <th className="py-3 font-semibold">Store</th>
                    <th className="py-3 font-semibold">Items</th>
                    <th className="py-3 font-semibold">Driver</th>
                    <th className="py-3 font-semibold">Status</th>
                    <th className="py-3 font-semibold">ETA</th>
                    <th className="py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-4 font-medium text-gray-900 dark:text-white">{d.id}</td>
                      <td className="py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{d.store.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {d.store.address}
                        </div>
                      </td>
                      <td className="py-4">
                        {d.items.map((it, idx) => (
                          <div key={it.sku} className="text-xs text-gray-700 dark:text-gray-300">
                            {it.name} • <span className="font-semibold">{it.cases}</span> cases
                          </div>
                        ))}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">{d.driver}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{d.vehicle}</div>
                      </td>
                      <td className="py-4">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="py-4 text-gray-700 dark:text-gray-300">
                        {new Date(d.eta).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                      </td>
                      <td className="py-4">
                        <button 
                          onClick={() => openDetail(d)} 
                          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                        <p className="text-gray-500 dark:text-gray-400">No deliveries found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Map Placeholder */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: theme.chart + '20' }}>
                  <MapPin className="w-5 h-5" style={{ color: theme.chart }} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Live Map View</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Real-time delivery tracking (Coming Soon)</p>
                </div>
              </div>
              <span className="text-xs px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full font-medium">
                GPS Integration Pending
              </span>
            </div>
            <div className="h-64 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
              <div className="text-center">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Map Integration Coming Soon</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Live GPS tracking will be available here</p>
              </div>
            </div>
          </Card>

        </main>
      </div>

      {/* DETAILS SIDEBAR */}
      {showDetail && selected && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
            onClick={closeDetail}
          />
          <div className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selected.id}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Warehouse:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{selected.warehouse}</span>
                  </div>
                </div>
                <button 
                  onClick={closeDetail} 
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Store Info */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-gray-700">
                      <MapPin className="w-5 h-5" style={{ color: theme.chart }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">{selected.store.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selected.store.address}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
                        <Phone className="w-4 h-4" />
                        {selected.store.contact}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-gray-900 dark:text-white">Items</div>
                    <div className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {selected.items.length} SKU{selected.items.length > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {selected.items.map(it => (
                      <div key={it.sku} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{it.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{it.sku}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg" style={{ color: theme.chart }}>{it.cases}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">cases</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Driver & Vehicle */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="font-semibold text-gray-900 dark:text-white mb-3">Driver & Vehicle</div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-gray-700">
                      <User className="w-5 h-5" style={{ color: theme.chart }} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{selected.driver}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{selected.vehicle}</div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="font-semibold text-gray-900 dark:text-white mb-3">Current Status</div>
                  <StatusBadge status={selected.status} />
                  {selected.status === 'failed' && selected.failureReason && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-400">{selected.failureReason}</p>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="font-semibold text-gray-900 dark:text-white mb-3">Timeline</div>
                  <div className="space-y-3">
                    {[
                      { label: 'Created', time: selected.timestamps.created, icon: Package },
                      { label: 'Packed', time: selected.timestamps.packed, icon: CheckCircle },
                      { label: 'Out for Delivery', time: selected.timestamps.outForDelivery, icon: Truck },
                      { label: 'Delivered', time: selected.timestamps.delivered, icon: CheckCircle }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${item.time ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
                          <item.icon className={`w-4 h-4 ${item.time ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {item.time ? new Date(item.time).toLocaleString() : 'Pending'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</div>
                  <div className="grid grid-cols-1 gap-2">
                    <button className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300">
                      <CheckCircle className="w-4 h-4 inline mr-2" />
                      Mark as Delivered
                    </button>
                    <button className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300">
                      <XCircle className="w-4 h-4 inline mr-2" />
                      Report Issue
                    </button>
                    <button className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300">
                      <User className="w-4 h-4 inline mr-2" />
                      Re-assign Driver
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </LayoutWrapper>
  );
}