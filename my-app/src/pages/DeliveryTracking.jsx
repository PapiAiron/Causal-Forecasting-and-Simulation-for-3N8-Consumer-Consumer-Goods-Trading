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
  CheckCircle
} from 'lucide-react';
import { Card } from '../components/SharedComponents';
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
    status: 'in-transit', // pending | in-transit | delivered | failed
    eta: '2025-12-01T14:45:00',
    timestamps: { created: '2025-12-01T08:00:00', packed: '2025-12-01T09:00:00', outForDelivery: '2025-12-01T09:30:00', delivered: null },
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
    timestamps: { created: '2025-12-01T07:30:00', packed: '2025-12-01T08:15:00', outForDelivery: '2025-12-01T08:40:00', delivered: '2025-12-01T09:55:00' },
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
    timestamps: { created: '2025-12-01T08:10:00', packed: null, outForDelivery: null, delivered: null },
    warehouse: 'Warehouse A'
  }
];

export default function DeliveryTracking() {
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
        if (!d.id.toLowerCase().includes(ql) && !d.store.name.toLowerCase().includes(ql) && !d.driver.toLowerCase().includes(ql)) return false;
      }
      // dateRange filter (simple string compare with ISO) if provided
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
    <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Deliveries</p>
              <p className="text-2xl font-semibold">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: theme.chart }}>
              <Truck className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In-Transit</p>
              <p className="text-2xl font-semibold">{stats.inTransit}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: theme.chart }}>
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Delivered</p>
              <p className="text-2xl font-semibold">{stats.delivered}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: theme.chart }}>
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 w-full md:w-2/3">
            <div className="relative flex-1">
              <input
                className="w-full pr-10 py-2 pl-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60"
                placeholder="Search by delivery ID, store or driver..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>

            <select
              className="py-2 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="in-transit">In-Transit</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>

            <button
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700"
              onClick={() => { setQuery(''); setStatusFilter('all'); setDateRange({ from: '', to: '' }); }}
            >
              <X className="w-4 h-4" /> Clear
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-3 py-2 rounded-xl bg-white/80 border border-gray-200">Export</button>
            <button className="px-3 py-2 rounded-xl bg-white/80 border border-gray-200">New Delivery</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="py-3">Delivery ID</th>
                <th className="py-3">Store</th>
                <th className="py-3">SKUs / Cases</th>
                <th className="py-3">Driver</th>
                <th className="py-3">Status</th>
                <th className="py-3">ETA</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-transparent">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="py-3 pr-6">{d.id}</td>
                  <td className="py-3 pr-6">
                    <div className="font-medium">{d.store.name}</div>
                    <div className="text-xs text-gray-500">{d.store.address}</div>
                  </td>
                  <td className="py-3 pr-6">
                    {d.items.map((it) => (
                      <div key={it.sku} className="text-xs">{it.name} • {it.cases} cases</div>
                    ))}
                  </td>
                  <td className="py-3 pr-6">{d.driver}</td>
                  <td className="py-3 pr-6">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="py-3 pr-6">{new Date(d.eta).toLocaleString()}</td>
                  <td className="py-3 pr-6">
                    <button onClick={() => openDetail(d)} className="px-3 py-1 rounded-xl border">View</button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500">No deliveries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* DETAILS SIDEBAR */}
      {showDetail && selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1" onClick={closeDetail} />
          <div className="w-full md:w-1/3 bg-white dark:bg-gray-900 p-6 overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Delivery {selected.id}</h3>
                <div className="text-xs text-gray-500">Warehouse: {selected.warehouse}</div>
              </div>
              <button onClick={closeDetail} className="p-2 rounded-lg border"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-white/60"><MapPin className="w-5 h-5" /></div>
                  <div>
                    <div className="font-medium">{selected.store.name}</div>
                    <div className="text-xs text-gray-500">{selected.store.address}</div>
                    <div className="text-xs text-gray-500">{selected.store.contact}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Items</div>
                  <div className="text-xs text-gray-500">Total SKUs: {selected.items.length}</div>
                </div>
                <div className="space-y-2">
                  {selected.items.map(it => (
                    <div key={it.sku} className="flex items-center justify-between text-sm">
                      <div>
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-gray-500">{it.sku}</div>
                      </div>
                      <div className="text-xs">{it.cases} cases</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Driver & Vehicle</div>
                </div>
                <div className="text-sm">{selected.driver} • {selected.vehicle}</div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div className="font-medium mb-2">Timeline</div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Created: {selected.timestamps.created}</div>
                  <div>Packed: {selected.timestamps.packed || '—'}</div>
                  <div>Out for Delivery: {selected.timestamps.outForDelivery || '—'}</div>
                  <div>Delivered: {selected.timestamps.delivered || '—'}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div className="font-medium mb-2">Actions</div>
                <div className="flex gap-2">
                  <button className="px-3 py-2 rounded-xl border">Mark Delivered</button>
                  <button className="px-3 py-2 rounded-xl border">Report Damage</button>
                  <button className="px-3 py-2 rounded-xl border">Re-assign Driver</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MAP PLACEHOLDER */}
      <div className="mt-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5" />
              <div className="font-medium">Map View (mock)</div>
            </div>
            <div className="text-xs text-gray-500">Live GPS not configured</div>
          </div>
          <div className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">Map Placeholder</div>
        </Card>
      </div>

    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
    'in-transit': { label: 'In-Transit', className: 'bg-blue-100 text-blue-700' },
    delivered: { label: 'Delivered', className: 'bg-green-100 text-green-700' },
    failed: { label: 'Failed', className: 'bg-red-100 text-red-700' }
  };
  const meta = map[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  return <span className={`inline-block px-2 py-1 rounded-full text-xs ${meta.className}`}>{meta.label}</span>;
}