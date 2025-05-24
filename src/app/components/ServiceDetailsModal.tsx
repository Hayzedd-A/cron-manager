import { useState, useEffect, useCallback } from "react";
import { Service, ServiceHistory } from "@/app/types.index";
import {
  XIcon,
  RefreshIcon,
  EditIcon,
  TrashIcon,
  ClockIcon,
  GlobeIcon,
} from "./Icons";
import EditServiceModal from "./EditServiceModal";
import UptimeChart from "./UptimeChart";
import { PauseIcon, PlayIcon } from "lucide-react";

interface ServiceDetailsModalProps {
  open: boolean;
  service: Service;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

interface ServiceHistories extends ServiceHistory {
  timestamp: string;
  status: "up" | "down";
  responseTime: number;
}

interface CachedServiceData {
  service: Service;
  history: ServiceHistories[];
  timestamp: number;
  lastFetch: Date;
}

const CACHE_DURATION = 15000; // 15 seconds cache for service details
const AUTO_REFRESH_INTERVAL = 30000; // Auto refresh every 30 seconds

export default function ServiceDetailsModal({
  open,
  service,
  onClose,
  onUpdate,
  onDelete,
}: ServiceDetailsModalProps) {
  const [serviceData, setServiceData] = useState<Service>(service);
  const [history, setHistory] = useState<ServiceHistories[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  if (!open) return null;

  // Cache management for service details
  const getCacheKey = (serviceId: string) => `service-details-${serviceId}`;

  const getCachedServiceData = (
    serviceId: string
  ): CachedServiceData | null => {
    try {
      const cached = localStorage.getItem(getCacheKey(serviceId));
      if (!cached) return null;

      const data: CachedServiceData = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - data.timestamp < CACHE_DURATION) {
        return data;
      }

      // Cache expired, remove it
      localStorage.removeItem(getCacheKey(serviceId));
      return null;
    } catch (error) {
      console.error("Error reading service cache:", error);
      localStorage.removeItem(getCacheKey(serviceId));
      return null;
    }
  };

  const setCachedServiceData = (
    serviceId: string,
    service: Service,
    history: ServiceHistories[]
  ) => {
    try {
      const cacheData: CachedServiceData = {
        service,
        history,
        timestamp: Date.now(),
        lastFetch: new Date(),
      };
      localStorage.setItem(getCacheKey(serviceId), JSON.stringify(cacheData));
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error setting service cache:", error);
    }
  };

  const clearServiceCache = (serviceId: string) => {
    localStorage.removeItem(getCacheKey(serviceId));
  };

  const fetchServiceDetails = useCallback(
    async (forceRefresh = false) => {
      try {
        // Check cache first if not forcing refresh
        if (!forceRefresh) {
          const cachedData = getCachedServiceData(service._id);
          if (cachedData) {
            setServiceData(cachedData.service);
            setHistory(cachedData.history);
            setLastUpdated(cachedData.lastFetch);
            setLoading(false);
            return;
          }
        }

        setRefreshing(true);

        // Fetch service details and history
        const serviceRes = await fetch(`/api/services/${service._id}`, {
          cache: forceRefresh ? "no-cache" : "default",
          headers: forceRefresh ? { "Cache-Control": "no-cache" } : {},
        });

        if (!serviceRes.ok) {
          throw new Error("Failed to fetch service data");
        }

        const serviceData = await serviceRes.json();

        const updatedService: Service = serviceData.service || service;
        const serviceHistory: ServiceHistories[] = serviceData.service?.history || [];

        setServiceData(updatedService);
        setHistory(serviceHistory);
        setCachedServiceData(service._id, updatedService, serviceHistory);
      } catch (error) {
        console.error("Failed to fetch service details:", error);

        // Try to use cached data as fallback
        const cachedData = getCachedServiceData(service._id);
        if (cachedData) {
          setServiceData(cachedData.service);
          setHistory(cachedData.history);
          setLastUpdated(cachedData.lastFetch);
          console.log("Using cached service data as fallback");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [service._id, service]
  );

  const handleRefresh = () => {
    fetchServiceDetails(true);
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditClose = () => {
    setShowEditModal(false);
    clearServiceCache(service._id);
    fetchServiceDetails(true);
    onUpdate(); // Update parent component
  };

  const handleDelete = () => {
    clearServiceCache(service._id);
    onDelete();
    onClose();
  };

const formatLastUpdated = (date: Date | string | null | undefined): string => {
  if (!date) return "Never";

  const parsedDate = typeof date === "string" ? new Date(date) : date;

  if (isNaN(parsedDate.getTime())) return "Never"; // invalid date check

  const now = new Date();
  const diff = now.getTime() - parsedDate.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;

  return parsedDate.toLocaleTimeString();
};


  const calculateUptime = () => {
    if (history.length === 0) return 0;
    const upCount = history.filter((h) => h.status === "up").length;
    return (upCount / history.length) * 100;
  };

  const getAverageResponseTime = () => {
    if (history.length === 0) return 0;
    const validResponses = history.filter((h) => h.responseTime > 0);
    if (validResponses.length === 0) return 0;
    const sum = validResponses.reduce((acc, h) => acc + h.responseTime, 0);
    return sum / validResponses.length;
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !open) return;

    const interval = setInterval(() => {
      fetchServiceDetails(true);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefresh, open, fetchServiceDetails]);

  // Initial data fetch
  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchServiceDetails();
    }
  }, [open, fetchServiceDetails]);

  // Cleanup cache when modal closes
  useEffect(() => {
    return () => {
      if (!open) {
        // Optional: Clear cache when modal closes to save memory
        clearServiceCache(service._id);
      }
    };
  }, [open, service._id]);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  serviceData.status === "up" ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <h2 className="text-xl font-semibold text-gray-900">
                {serviceData.name}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Refresh Controls */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  title="Refresh service data"
                >
                  <RefreshIcon
                    className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
                <div className="w-px h-4 bg-gray-300"></div>
                <label className="flex items-center gap-1 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-3 h-3"
                  />
                  Auto
                </label>
              </div>

              {/* Action Buttons */}
              <button
                onClick={handleEdit}
                className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                title="Edit service"
              >
                <EditIcon className="w-5 h-5" />
              </button>

              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                title="Delete service"
              >
                <TrashIcon className="w-5 h-5" />
              </button>

              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Service Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL
                      </label>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <GlobeIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-mono break-all">
                          {serviceData.url}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          serviceData.status === "up"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            serviceData.status === "up"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></div>
                        {serviceData.status.toUpperCase()}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monitoring
                      </label>
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          serviceData.active
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {serviceData.active ? (
                          <span className="flex items-center gap-2">
                            <PlayIcon className="w-2 h-2" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <PauseIcon className="w-2 h-2" />
                            Paused
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Uptime (24h)
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${calculateUptime()}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {calculateUptime().toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Response
                        </label>
                        <p className="text-sm text-gray-600">
                          {serviceData.lastResponse
                            ? serviceData.lastResponse.text
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Updated
                      </label>
                      <div className="text-sm text-gray-600">
                        {formatLastUpdated(lastUpdated)}
                        {refreshing && (
                          <span className="ml-2 text-blue-600">
                            <RefreshIcon className="w-3 h-3 inline animate-spin" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Query Parameters */}
                {serviceData.query &&
                  Object.keys(serviceData.query).length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Query Parameters
                      </label>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
                          {JSON.stringify(serviceData.query, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                {/* Response History Chart */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Response History
                    </h3>
                    <span className="text-sm text-gray-500">
                      {history.length} data points
                    </span>
                  </div>
                  {/* Uptime Chart */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Response Time History
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <UptimeChart history={serviceData.history} />
                    </div>
                  </div>

                  {history.length > 0 ? (
                    <div className="space-y-4">
                      {/* Simple Chart */}
                      {/* <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-end justify-between h-32 gap-1">
                          {history.map((point, index) => {
                            point.status =
                              point.response.code >= 200 &&
                              point.response.code < 400
                                ? "up"
                                : "down";
                            return (
                              <div
                                key={index}
                                className="flex-1 flex flex-col justify-end"
                                title={`${new Date(
                                  point.timestamp
                                ).toLocaleString()}: ${point.status} (${
                                  point.responseTime
                                }ms)`}
                              >
                                <div
                                  className={`w-full rounded-t transition-all duration-200 ${
                                    point.status === "up"
                                      ? "bg-green-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{
                                    height:
                                      point.status === "up"
                                        ? `${Math.max(
                                            10,
                                            Math.min(
                                              100,
                                              (point.responseTime / 1000) * 100
                                            )
                                          )}%`
                                        : "10%",
                                  }}
                                ></div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>Response Time (ms)</span>
                          <span>Last 20 checks</span>
                        </div>
                      </div> */}

                      {/* Recent History Table */}
                      <div className="bg-white border rounded-lg overflow-hidden">
                        <div className="px-4 py-3 border-b bg-gray-50">
                          <h4 className="text-sm font-medium text-gray-900">
                            Recent Checks
                          </h4>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Time
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Status
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Response Text
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {history.map((point, index) => {
                                point.status =
                                  point.response.code >= 200 &&
                                  point.response.code < 400
                                    ? "up"
                                    : "down";
                                return (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-gray-900">
                                      {new Date(
                                        point.timestamp
                                      ).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2">
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                          point.status === "up"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        <div
                                          className={`w-1.5 h-1.5 rounded-full ${
                                            point.status === "up"
                                              ? "bg-green-500"
                                              : "bg-red-500"
                                          }`}
                                        ></div>
                                        {point.status?.toUpperCase()}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-gray-900">
                                      {point.response?.text
                                        ? `${point.response.text}`
                                        : "N/A"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ClockIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No history data available</p>
                      <p className="text-sm">
                        Check back after the service has been monitored for a
                        while
                      </p>
                    </div>
                  )}
                </div>

                {/* Service Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Created
                    </label>
                    <p className="text-sm text-gray-600">
                      {new Date(serviceData.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Ping
                    </label>
                    <p className="text-sm text-gray-600">
                      {serviceData.lastPing
                        ? new Date(serviceData.lastPing).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditServiceModal
          open={showEditModal}
          service={serviceData}
          onClose={handleEditClose}
          onUpdate={handleEditClose}
        />
      )}
    </>
  );
}
