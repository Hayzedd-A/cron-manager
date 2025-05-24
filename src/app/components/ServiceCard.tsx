import { Service } from "@/app/types.index";
import {
  PlayIcon,
  PauseIcon,
  EditIcon,
  TrashIcon,
  ClockIcon,
  GlobeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "./Icons";

interface ServiceCardProps {
  service: Service;
  viewMode: "grid" | "list";
  onToggle: () => void;
  onDelete: () => void;
  onClick: () => void;
}

export default function ServiceCard({
  service,
  viewMode,
  onToggle,
  onDelete,
  onClick,
}: ServiceCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "up":
        return "text-green-600 bg-green-100";
      case "down":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getUptimePercentage = () => {
    if (!service.history || service.history.length === 0) return 100;
    const upCount = service.history.filter(
      (h) => h.response.code >= 200 && h.response.code < 400
    ).length;
    return Math.round((upCount / service.history.length) * 100);
  };

  const formatLastPing = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (!service) return <></>;

  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              onClick={onClick}
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  service.status === "up" ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {service.name}
                </h3>
                <p className="text-sm text-gray-500 truncate">{service.url}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    service.status
                  )}`}
                >
                  {service.status === "up" ? (
                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                  ) : (
                    <XCircleIcon className="w-3 h-3 mr-1" />
                  )}
                  {service.status.toUpperCase()}
                </span>
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  {getUptimePercentage()}%
                </p>
                <p className="text-xs text-gray-500">Uptime</p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-900">
                  {formatLastPing(service.lastPing)}
                </p>
                <p className="text-xs text-gray-500">Last ping</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className={`p-2 rounded-lg transition-colors ${
                service.active
                  ? "text-yellow-600 hover:bg-yellow-50"
                  : "text-green-600 hover:bg-green-50"
              }`}
              title={service.active ? "Pause monitoring" : "Resume monitoring"}
            >
              {service.active ? (
                <PauseIcon className="w-4 h-4" />
              ) : (
                <PlayIcon className="w-4 h-4" />
              )}
            </button>

            {/* <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit service"
            >
              <EditIcon className="w-4 h-4" />
            </button> */}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete service"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-4 h-4 rounded-full ${
              service?.status === "up" ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <h3 className="font-semibold text-gray-900 truncate">
            {service?.name}
          </h3>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            service?.status
          )}`}
        >
          {service?.status.toUpperCase()}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <GlobeIcon className="w-4 h-4" />
          <span className="truncate">{service?.url}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <ClockIcon className="w-4 h-4" />
          <span>Last ping: {formatLastPing(service?.lastPing)}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Uptime</span>
          <span className="font-medium">{getUptimePercentage()}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              getUptimePercentage() > 90
                ? "bg-green-500"
                : getUptimePercentage() > 70
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${getUptimePercentage()}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`p-2 rounded-lg transition-colors ${
              service?.active
                ? "text-yellow-600 hover:bg-yellow-50"
                : "text-green-600 hover:bg-green-50"
            }`}
            title={service?.active ? "Pause monitoring" : "Resume monitoring"}
          >
            {service?.active ? (
              <PauseIcon className="w-4 h-4" />
            ) : (
              <PlayIcon className="w-4 h-4" />
            )}
          </button>

          {/* <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit service"
          >
            <EditIcon className="w-4 h-4" />
          </button> */}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete service"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>

        <span
          className={`text-xs px-2 py-1 rounded ${
            service?.active
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {service?.active ? "Active" : "Paused"}
        </span>
      </div>
    </div>
  );
}
