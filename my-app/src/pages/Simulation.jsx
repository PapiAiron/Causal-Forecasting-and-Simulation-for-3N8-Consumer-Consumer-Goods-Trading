import { useState } from "react";
import { Activity } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Card, Header } from "../components/SharedComponents";
import { LayoutWrapper } from './DashboardHome';

const Simulation = ({ onNavigate }) => {
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [demand, setDemand] = useState("500");
  const [stock, setStock] = useState("1000");
  const [leadTime, setLeadTime] = useState("3");
  const [scenario, setScenario] = useState("normal");
  const [days, setDays] = useState("30");

  const handleSimulate = async () => {
    setError("");
    setSimulation(null);
    
    if (!demand || !stock || !leadTime || !days) {
      setError("Please fill in all simulation parameters (demand, replenishment quantity, lead time, days)");
      return;
    }
    
    const demandNum = parseFloat(demand);
    const stockNum = parseFloat(stock);
    const leadTimeNum = parseFloat(leadTime);
    const daysNum = parseFloat(days);
    
    if (isNaN(demandNum) || isNaN(stockNum) || isNaN(leadTimeNum) || isNaN(daysNum)) {
      setError("All simulation parameters must be valid numbers");
      return;
    }
    
    if (demandNum <= 0 || stockNum <= 0 || leadTimeNum <= 0 || daysNum <= 0) {
      setError("All simulation parameters must be positive numbers");
      return;
    }
    
    if (demandNum > 1000000 || stockNum > 10000000 || daysNum > 365) {
      setError("Values are too large. Please use reasonable numbers (demand < 1M, replenishment < 10M, days ≤ 365)");
      return;
    }
    
    setLoading(true);
    
    try {
      const payload = {
        stock: Math.floor(stockNum),
        lead_time: Math.floor(leadTimeNum),
        scenario: scenario || "normal",
        days: Math.floor(daysNum),
        demand: Math.floor(demandNum)
      };

      const res = await fetch("http://127.0.0.1:5000/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Simulation failed ${res.status}: ${txt}`);
      }

      const data = await res.json();
      setSimulation(data);
    } catch (err) {
      setError(`Simulation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const simulationChartData = simulation?.history?.map((h) => ({
    day: `Day ${h.day + 1}`,
    stock: h.stock,
    demand: h.demand,
    unmet: h.unmet,
    inventoryPosition: h.inventory_position
  })) || [];

  const inputClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <LayoutWrapper currentPage="simulation" onNavigate={onNavigate}>
      <div className="pt-24">
        <Header
          title="Inventory Simulation"
          description="Industry-standard continuous review (Q, r) inventory policy simulation with dynamic replenishment."
          icon={Activity}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card className="p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Continuous Review Policy Simulation
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Configure your inventory parameters below. The system uses a (Q, r) policy where orders of quantity Q are placed when inventory reaches reorder point r.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className={labelClass}>Average Daily Demand</label>
                <input 
                  type="number"
                  value={demand} 
                  onChange={(e) => setDemand(e.target.value)} 
                  placeholder="500"
                  className={inputClass}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Expected units per day</p>
              </div>

              <div>
                <label className={labelClass}>Replenishment Quantity (Q)</label>
                <input 
                  type="number"
                  value={stock} 
                  onChange={(e) => setStock(e.target.value)} 
                  placeholder="1000"
                  className={inputClass}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Units per order</p>
              </div>

              <div>
                <label className={labelClass}>Lead Time (Days)</label>
                <input 
                  type="number"
                  value={leadTime} 
                  onChange={(e) => setLeadTime(e.target.value)} 
                  placeholder="3"
                  className={inputClass}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Days to receive stock</p>
              </div>

              <div>
                <label className={labelClass}>Simulation Period</label>
                <input 
                  type="number"
                  value={days} 
                  onChange={(e) => setDays(e.target.value)} 
                  placeholder="30"
                  className={inputClass}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Days to simulate</p>
              </div>
            </div>

            <div className="mb-6">
              <label className={labelClass}>Market Scenario</label>
              <select 
                value={scenario} 
                onChange={(e) => setScenario(e.target.value)} 
                className={inputClass}
              >
                <option value="normal">Normal Market Conditions</option>
                <option value="promo">Promotional Period (+30% demand)</option>
                <option value="holiday">Holiday Season (+50% demand)</option>
                <option value="economic_downturn">Economic Downturn (-20% demand)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Simulates different demand scenarios with variability</p>
            </div>

            <button 
              onClick={handleSimulate}
              disabled={loading}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Running Simulation...
                </>
              ) : (
                <>
                  <Activity className="w-5 h-5" />
                  Run Simulation
                </>
              )}
            </button>
          </Card>

          {error && (
            <Card className="p-6 mt-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-300 font-bold text-sm">!</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">Simulation Error</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {simulation && (
            <>
              <Card className="p-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Simulation Results - {simulation.scenario.charAt(0).toUpperCase() + simulation.scenario.slice(1).replace(/_/g, " ")}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg border border-blue-200 dark:border-blue-700">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1">
                      Replenishment Qty
                    </p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {simulation.params?.replenishment_qty?.toLocaleString() || "0"}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">units per order</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg border border-purple-200 dark:border-purple-700">
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-1">
                      Reorder Point
                    </p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {simulation.params?.reorder_point?.toLocaleString() || "0"}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">trigger level</p>
                  </div>

                  <div className={`p-4 rounded-lg border ${(simulation.final_inventory?.service_level || 0) >= 0.95 ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700' : (simulation.final_inventory?.service_level || 0) >= 0.90 ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-200 dark:border-yellow-700' : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-700'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${(simulation.final_inventory?.service_level || 0) >= 0.95 ? 'text-green-700 dark:text-green-300' : (simulation.final_inventory?.service_level || 0) >= 0.90 ? 'text-yellow-700 dark:text-yellow-300' : 'text-red-700 dark:text-red-300'}`}>
                      Service Level
                    </p>
                    <p className={`text-2xl font-bold ${(simulation.final_inventory?.service_level || 0) >= 0.95 ? 'text-green-900 dark:text-green-100' : (simulation.final_inventory?.service_level || 0) >= 0.90 ? 'text-yellow-900 dark:text-yellow-100' : 'text-red-900 dark:text-red-100'}`}>
                      {((simulation.final_inventory?.service_level || 0) * 100).toFixed(1)}%
                    </p>
                    <p className={`text-xs mt-1 ${(simulation.final_inventory?.service_level || 0) >= 0.95 ? 'text-green-600 dark:text-green-400' : (simulation.final_inventory?.service_level || 0) >= 0.90 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                      {(simulation.final_inventory?.service_level || 0) >= 0.95 ? 'Excellent' : (simulation.final_inventory?.service_level || 0) >= 0.90 ? 'Acceptable' : 'Below target'}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg border ${simulation.final_inventory?.shortages > 0 ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-700' : 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${simulation.final_inventory?.shortages > 0 ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
                      Total Shortages
                    </p>
                    <p className={`text-2xl font-bold ${simulation.final_inventory?.shortages > 0 ? 'text-red-900 dark:text-red-100' : 'text-green-900 dark:text-green-100'}`}>
                      {simulation.final_inventory?.shortages?.toLocaleString() || "0"}
                    </p>
                    <p className={`text-xs mt-1 ${simulation.final_inventory?.shortages > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      units unmet
                    </p>
                  </div>
                </div>

                <div className={`p-6 rounded-lg border-2 mb-6 ${
                  simulation.decisionType === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' :
                  simulation.decisionType === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700' :
                  simulation.decisionType === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' :
                  'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                }`}>
                  <h3 className={`text-sm font-bold uppercase tracking-wide mb-3 ${
                    simulation.decisionType === 'critical' ? 'text-red-800 dark:text-red-300' :
                    simulation.decisionType === 'warning' ? 'text-yellow-800 dark:text-yellow-300' :
                    simulation.decisionType === 'info' ? 'text-blue-800 dark:text-blue-300' :
                    'text-green-800 dark:text-green-300'
                  }`}>
                    Inventory Management Decision
                  </h3>
                  <p className={`text-base font-medium whitespace-pre-line ${
                    simulation.decisionType === 'critical' ? 'text-red-900 dark:text-red-200' :
                    simulation.decisionType === 'warning' ? 'text-yellow-900 dark:text-yellow-200' :
                    simulation.decisionType === 'info' ? 'text-blue-900 dark:text-blue-200' :
                    'text-green-900 dark:text-green-200'
                  }`}>
                    {simulation.decision}
                  </p>
                </div>

                {simulationChartData.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Daily Inventory & Demand Tracking
                    </h3>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={simulationChartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
                          <XAxis dataKey="day" className="text-xs" tick={{ fontSize: 11 }} />
                          <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                              border: '1px solid #e5e7eb', 
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }} 
                          />
                          <Legend wrapperStyle={{ fontSize: '13px' }} />
                          <Bar dataKey="stock" name="On-Hand Stock" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Line type="monotone" dataKey="demand" name="Daily Demand" stroke="#10b981" strokeWidth={2} dot={false} />
                          <Bar dataKey="unmet" name="Unmet Demand" fill="#ef4444" radius={[4, 4, 0, 0]} />
                          <Line type="monotone" dataKey="inventoryPosition" name="Inventory Position" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                      * Inventory Position = On-Hand Stock + Orders in Transit
                    </p>
                  </div>
                )}
              </Card>

              <Card className="p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    {
                      label: 'Total Demand',
                      value: `${simulation.metrics?.total_demand?.toLocaleString() || '0'} units`,
                      color: 'gray'
                    },
                    {
                      label: 'Demand Fulfilled',
                      value: `${simulation.metrics?.total_served?.toLocaleString() || '0'} units`,
                      color: 'green'
                    },
                    {
                      label: 'Avg Inventory',
                      value: `${simulation.metrics?.avg_inventory?.toLocaleString() || '0'} units`,
                      color: 'blue'
                    },
                    {
                      label: 'Stockout Days',
                      value: `${simulation.metrics?.stockout_days || 0}/${simulation.params?.days || 0}`,
                      color: simulation.metrics?.stockout_days > (simulation.params?.days * 0.05) ? 'red' : 'green'
                    },
                    {
                      label: 'Inventory Turnover',
                      value: `${simulation.metrics?.inventory_turnover?.toFixed(2) || '0'}x`,
                      color: 'purple'
                    },
                    {
                      label: 'Fill Rate',
                      value: `${((simulation.final_inventory?.fill_rate || 0) * 100).toFixed(1)}%`,
                      color: (simulation.final_inventory?.fill_rate || 0) >= 0.95 ? 'green' : 'yellow'
                    },
                    {
                      label: 'Peak Stock',
                      value: `${simulation.metrics?.peak_stock?.toLocaleString() || '0'} units`,
                      color: 'gray'
                    },
                    {
                      label: 'Min Stock',
                      value: `${simulation.metrics?.min_stock?.toLocaleString() || '0'} units`,
                      color: 'gray'
                    },
                    {
                      label: 'Total Replenished',
                      value: `${simulation.metrics?.total_replenishments?.toLocaleString() || '0'} units`,
                      color: 'blue'
                    },
                    {
                      label: 'Safety Stock',
                      value: `${simulation.params?.safety_stock?.toLocaleString() || '0'} units`,
                      color: 'purple'
                    }
                  ].map(({ label, value, color }) => {
                    const colorClasses = {
                      gray: 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600',
                      green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
                      blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
                      purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700',
                      red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
                      yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
                    };
                    
                    return (
                      <div key={label} className={`p-4 rounded-lg border ${colorClasses[color]}`}>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                          {label}
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {value}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          )}
        </main>
      </div>
    </LayoutWrapper>
  );
};

export default Simulation;