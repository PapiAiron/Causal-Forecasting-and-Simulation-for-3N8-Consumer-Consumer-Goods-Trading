import React, { useEffect, useState } from "react";
import { X, Package, MapPin, User, Truck } from "lucide-react";
import { useTheme } from "../components/ThemeContext";

export default function NewDeliveryModal({ show, onClose }) {
  const { theme } = useTheme();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (show) setTimeout(() => setAnimate(true), 10);
    else setAnimate(false);
  }, [show]);

  if (!show) return null;  // <-- FIXED


  return (
    <div
      className={`fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300 ${
        animate ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 transform transition-all duration-300 ${
          animate ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl"
              style={{ backgroundColor: `${theme.chart}15` }}
            >
              <Package className="w-6 h-6" style={{ color: theme.chart }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              New Delivery
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Delivery ID */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Delivery ID
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-10 pr-4 py-3 rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800"
                placeholder="e.g. DLV-2025-001"
              />
            </div>
          </div>

          {/* Store Name + Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Store Name
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800"
                placeholder="Enter store name"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800"
              >
                <option value="pending">Pending</option>
                <option value="in-transit">In-Transit</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Store Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400" />
              <textarea
                rows="2"
                className="w-full pl-10 pr-4 py-3 rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 resize-none"
                placeholder="Enter complete store address"
              />
            </div>
          </div>

          {/* Driver + Vehicle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Driver Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-full pl-10 pr-4 py-3 rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800"
                  placeholder="Enter driver name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Vehicle Info
              </label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-full pl-10 pr-4 py-3 rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800"
                  placeholder="e.g., Truck 102"
                />
              </div>
            </div>
          </div>

          {/* ETA */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Estimated Arrival Time
            </label>
            <input
              type="datetime-local"
              className="w-full px-4 py-3 rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            className="px-5 py-3 rounded-xl text-white font-semibold"
            style={{ backgroundColor: theme.chart }}
          >
            Create Delivery
          </button>
        </div>
      </div>
    </div>
  );
}