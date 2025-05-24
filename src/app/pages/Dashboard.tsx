import { useEffect, useState, useCallback } from "react";
import { useSession, signOut, signIn } from "next-auth/react";
import { Service, ServiceStats } from "@/app/types.index";
import AddServiceModal from "@/app/components/AddServiceModal";
import ServiceCard from "@/app/components/ServiceCard";
import ServiceDetailsModal from "@/app/components/ServiceDetailsModal";
import StatsCards from "@/app/components/StatsCards";
import SearchAndFilters from "@/app/components/SearchAndFilters";
import {
  GridIcon,
  ListIcon,
  PlusIcon,
  LogoutIcon,
  LoginIcon,
  RefreshIcon,
} from "@/app/components/Icons";
import ConfirmDialog from "../components/ConfirmDialog";

type ViewMode = "grid" | "list";
export type SortBy = "name" | "status" | "createdAt" | "lastPing";
export type FilterBy = "all" | "up" | "down" | "active" | "paused";

interface CacheData {
  services: Service[];
  timestamp: number;
  lastFetch: Date;
}
interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  serviceId?: string;
  serviceName?: string;
}
const CACHE_DURATION = 4 * 60 * 1000; // 4 minutes cache duration
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // Auto refresh every 5 minutes

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [filterBy, setFilterBy] = useState<FilterBy>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Cache management
  const getCachedData = (): CacheData | null => {
    try {
      const cached = localStorage.getItem("services-cache");
      if (!cached) return null;

      const data: CacheData = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - data.timestamp < CACHE_DURATION) {
        return data;
      }

      // Cache expired, remove it
      localStorage.removeItem("services-cache");
      return null;
    } catch (error) {
      console.error("Error reading cache:", error);
      localStorage.removeItem("services-cache");
      return null;
    }
  };

  const setCachedData = (services: Service[]) => {
    try {
      const cacheData: CacheData = {
        services,
        timestamp: Date.now(),
        lastFetch: new Date(),
      };
      localStorage.setItem("services-cache", JSON.stringify(cacheData));
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error setting cache:", error);
    }
  };

  const clearCache = () => {
    localStorage.removeItem("services-cache");
  };

  const fetchServices = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedData = getCachedData();
        if (cachedData) {
          setServices(cachedData.services);
          setLastUpdated(cachedData.lastFetch);
          setLoading(false);
          return;
        }
      }

      setRefreshing(true);
      const res = await fetch("/api/services", {
        cache: forceRefresh ? "no-cache" : "default",
        headers: forceRefresh ? { "Cache-Control": "no-cache" } : {},
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const servicesData = data.services || [];

      setServices(servicesData);
      setCachedData(servicesData);
    } catch (error) {
      console.error("Failed to fetch services:", error);

      // Try to use cached data as fallback
      const cachedData = getCachedData();
      if (cachedData) {
        setServices(cachedData.services);
        setLastUpdated(cachedData.lastFetch);
        console.log("Using cached data as fallback");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = () => {
    fetchServices(true);
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !session) return;

    const interval = setInterval(() => {
      fetchServices(true);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefresh, session, fetchServices]);

  useEffect(() => {
    // Only fetch services if user is authenticated
    if (session) {
      fetchServices();
    } else {
      setLoading(false);
      clearCache(); // Clear cache when user logs out
    }
  }, [session, fetchServices]);

  useEffect(() => {
    let filtered = services.filter(
      (service) =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.url.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply filters
    switch (filterBy) {
      case "up":
        filtered = filtered.filter((s) => s.status === "up");
        break;
      case "down":
        filtered = filtered.filter((s) => s.status === "down");
        break;
      case "active":
        filtered = filtered.filter((s) => s.active);
        break;
      case "paused":
        filtered = filtered.filter((s) => !s.active);
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "status":
          return a.status.localeCompare(b.status);
        case "createdAt":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "lastPing":
          return (
            new Date(b.lastPing).getTime() - new Date(a.lastPing).getTime()
          );
        default:
          return 0;
      }
    });

    setFilteredServices(filtered);
  }, [services, searchTerm, sortBy, filterBy]);

  const calculateStats = (): ServiceStats => {
    const total = services.length;
    const up = services.filter((s) => s.status === "up").length;
    const down = services.filter((s) => s.status === "down").length;
    const paused = services.filter((s) => !s.active).length;
    const avgUptime = total > 0 ? (up / total) * 100 : 0;

    return { total, up, down, paused, avgUptime };
  };

  const toggleStatus = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });

      // Update the specific service in state immediately for better UX
      setServices((prevServices) =>
        prevServices.map((service) =>
          service._id === id ? { ...service, active: !active } : service
        )
      );

      // Refresh data to get latest state
      setTimeout(() => fetchServices(true), 1000);
    } catch (error) {
      console.error("Failed to toggle service status:", error);
      // Revert optimistic update on error
      fetchServices(true);
    }
  };

  const showDeleteConfirmation = (id: string, serviceName: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete Service",
      message: `Are you sure you want to delete "${serviceName}"? This action cannot be undone and all monitoring data for this service will be permanently lost.`,
      serviceId: id,
      serviceName,
      onConfirm: () => confirmDeleteService(id)
    });
  };

  const confirmDeleteService = async (id: string) => {
    try {
      await fetch(`/api/services/${id}`, {
        method: "DELETE",
      });

      // Remove service from state immediately
      setServices((prevServices) =>
        prevServices.filter((service) => service._id !== id)
      );
      clearCache(); // Clear cache since data changed

      // Close confirm dialog
      setConfirmDialog((prev) => ({ ...prev, open: false }));

      // Refresh to ensure consistency
      setTimeout(() => fetchServices(true), 500);
    } catch (error) {
      console.error("Failed to delete service:", error);
      // Close confirm dialog and refresh on error to restore correct state
      setConfirmDialog((prev) => ({ ...prev, open: false }));
      fetchServices(true);
    }
  };

  const deleteService = (id: string) => {
    const service = services.find((s) => s._id === id);
    if (service) {
      showDeleteConfirmation(id, service.name);
    }
  };

  // const deleteService = async (id: string) => {
  //   if (!confirm("Are you sure you want to delete this service?")) return;

  //   try {
  //     await fetch(`/api/services/${id}`, {
  //       method: "DELETE",
  //     });

  //     // Remove service from state immediately
  //     setServices((prevServices) =>
  //       prevServices.filter((service) => service._id !== id)
  //     );
  //     clearCache(); // Clear cache since data changed

  //     // Refresh to ensure consistency
  //     setTimeout(() => fetchServices(true), 500);
  //   } catch (error) {
  //     console.error("Failed to delete service:", error);
  //     // Refresh on error to restore correct state
  //     fetchServices(true);
  //   }
  // };

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setShowDetailsModal(true);
  };

  const handleAuthAction = () => {
    if (session) {
      clearCache(); // Clear cache on logout
      signOut({ callbackUrl: "/auth/signin" });
    } else {
      signIn();
    }
  };

  const handleServiceUpdate = () => {
    clearCache(); // Clear cache when service is updated
    fetchServices(true);
  };

  const formatLastUpdated = (
    date: Date | string | null | undefined
  ): string => {
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

  // Show loading spinner while checking authentication status
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Service Monitor Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            {session
              ? `Welcome back, ${
                  session.user?.name || session.user?.email || "User"
                }`
              : "Please sign in to manage your services"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {session && (
            <>
              {/* Refresh Controls */}
              <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  title="Refresh data"
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

              {/* Last Updated */}
              <div className="text-xs text-gray-500 bg-white rounded px-2 py-1 border">
                Updated: {formatLastUpdated(lastUpdated)}
              </div>
            </>
          )}

          <button
            onClick={handleAuthAction}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              session
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {session ? (
              <>
                <LogoutIcon className="w-4 h-4" />
                Logout
              </>
            ) : (
              <>
                <LoginIcon className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </div>
      </div>

      {/* Show content only if user is authenticated */}
      {session ? (
        <>
          {/* Stats Cards */}
          <StatsCards stats={calculateStats()} />

          {/* Search and Filters */}
          <SearchAndFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            onSortChange={setSortBy}
            filterBy={filterBy}
            onFilterChange={setFilterBy}
          />

          {/* View Toggle and Service Count */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                {filteredServices.length} of {services.length} services
              </span>
              {refreshing && (
                <span className="text-sm text-blue-600 flex items-center gap-1">
                  <RefreshIcon className="w-4 h-4 animate-spin" />
                  Refreshing...
                </span>
              )}
              <div className="flex bg-white rounded-lg border">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-l-lg ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <GridIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-r-lg ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <ListIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Services Grid/List */}
          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No services found</p>
              <p className="text-gray-400 mt-2">
                {services.length === 0
                  ? "Get started by adding your first service"
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service._id}
                  service={service}
                  viewMode={viewMode}
                  onToggle={() => toggleStatus(service._id, service.active)}
                  onDelete={() => deleteService(service._id)}
                  onClick={() => handleServiceClick(service)}
                />
              ))}
            </div>
          )}

          {/* Add Service Button - Fixed Bottom Left - Only show when authenticated */}
          <button
            onClick={() => setShowAddModal(true)}
            className="fixed bottom-6 left-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
            title="Add New Service"
          >
            <PlusIcon className="w-6 h-6" />
          </button>

          {/* Modals - Only render when authenticated */}
          <AddServiceModal
            open={showAddModal}
            onClose={() => {
              setShowAddModal(false);
              handleServiceUpdate();
            }}
          />

          {selectedService && (
            <ServiceDetailsModal
              open={showDetailsModal}
              service={selectedService}
              onClose={() => {
                setShowDetailsModal(false);
                setSelectedService(null);
              }}
              onUpdate={handleServiceUpdate}
              onDelete={() => deleteService(selectedService._id)}
            />
          )}

          {/* Confirm Dialog */}
          <ConfirmDialog
            open={confirmDialog.open}
            title={confirmDialog.title}
            message={confirmDialog.message}
            confirmText="Delete Service"
            cancelText="Cancel"
            type="danger"
            onConfirm={confirmDialog.onConfirm}
            onCancel={() =>
              setConfirmDialog((prev) => ({ ...prev, open: false }))
            }
          />
        </>
      ) : (
        /* Show sign-in prompt when not authenticated */
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <LoginIcon className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-8">
              Please sign in to access your service monitoring dashboard and
              manage your services.
            </p>
            <button
              onClick={() => signIn()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Sign In to Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
