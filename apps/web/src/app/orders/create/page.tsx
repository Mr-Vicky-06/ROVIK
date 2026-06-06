"use client";

import { useState } from "react";
import { Package, User, MapPin, Truck, Calendar, CheckCircle2 } from "lucide-react";

export default function CreateOrderPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const orderData = {
      customer_name: formData.get("customer_name"),
      customer_phone: formData.get("customer_phone"),
      customer_email: formData.get("customer_email"), // Additional field mapped to notes or extended DB schema if required
      
      pickup_address: formData.get("pickup_address"),
      pickup_latitude: parseFloat(formData.get("pickup_latitude") as string) || 0,
      pickup_longitude: parseFloat(formData.get("pickup_longitude") as string) || 0,
      
      delivery_address: formData.get("drop_address"),
      delivery_latitude: parseFloat(formData.get("drop_latitude") as string) || 0,
      delivery_longitude: parseFloat(formData.get("drop_longitude") as string) || 0,
      
      package_weight: parseFloat(formData.get("package_weight") as string) || 0,
      package_dimensions: {
        length: parseFloat(formData.get("package_length") as string) || 0,
        width: parseFloat(formData.get("package_width") as string) || 0,
        height: parseFloat(formData.get("package_height") as string) || 0,
      },
      
      vehicle_requirement: formData.get("vehicle_type"),
      priority: formData.get("priority"),
      delivery_deadline: formData.get("delivery_deadline") ? new Date(formData.get("delivery_deadline") as string).toISOString() : null,
      notes: formData.get("special_instructions")
    };

    try {
      const token = localStorage.getItem("auth_token") || "local-dev";
      const res = await fetch("http://localhost:8000/api/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        setSuccess(true);
        e.currentTarget.reset();
      } else {
        alert("Failed to create order: " + await res.text());
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting order.");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Manual Order</h1>
        <p className="text-gray-500 mt-2">Enter the dispatch parameters to insert a delivery order directly into the database.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Customer Information */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-6">
            <User className="text-indigo-500" size={20} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Name *</label>
              <input required name="customer_name" type="text" className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
              <input name="customer_phone" type="tel" className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input name="customer_email" type="email" className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="text-indigo-500" size={20} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Routing Coordinates</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Pickup Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">Full Address</label>
                  <input name="pickup_address" type="text" className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                  <input name="pickup_latitude" type="number" step="any" className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                  <input name="pickup_longitude" type="number" step="any" className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Drop-off Location *</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">Full Address *</label>
                  <input required name="drop_address" type="text" className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Latitude *</label>
                  <input required name="drop_latitude" type="number" step="any" className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Longitude *</label>
                  <input required name="drop_longitude" type="number" step="any" className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payload Information */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-6">
            <Package className="text-indigo-500" size={20} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payload & Dimensions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight (kg) *</label>
              <input required name="package_weight" type="number" step="any" className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Length (cm)</label>
              <input name="package_length" type="number" step="any" className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Width (cm)</label>
              <input name="package_width" type="number" step="any" className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Height (cm)</label>
              <input name="package_height" type="number" step="any" className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Logistics Requirements */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-6">
            <Truck className="text-indigo-500" size={20} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Logistics & SLA</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle Type</label>
              <select name="vehicle_type" className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none">
                <option value="any">Any Available</option>
                <option value="bike">Bike (2-Wheeler)</option>
                <option value="van">Cargo Van</option>
                <option value="truck">Box Truck</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
              <select name="priority" className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none">
                <option value="low">Low (Standard)</option>
                <option value="medium">Medium</option>
                <option value="high">High (Express)</option>
                <option value="critical">Critical (SLA Bound)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Deadline</label>
              <input name="delivery_deadline" type="datetime-local" className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Special Instructions</label>
              <textarea name="special_instructions" rows={3} className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Gate codes, delivery handling instructions, etc." />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white font-medium py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Persisting to PostgreSQL..." : "Ingest Order to ROVIK"}
          </button>
          {success && (
            <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium px-4">
              <CheckCircle2 /> Created Successfully
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
