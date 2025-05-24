import { ServiceHistory } from "@/app/types.index";

interface UptimeChartProps {
  history: ServiceHistory[];
}

export default function UptimeChart({ history }: UptimeChartProps) {
  if (!history || history.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  // Take last 50 records and reverse to show chronologically
  const chartData = history.slice(-50).reverse();
  const maxHeight = 100;

  return (
    <div className="h-32 flex items-end justify-between gap-1 px-2">
      {chartData.map((record, index) => {
        console.log(record)
        const isUp = record.response.code >= 200 && record.response.code < 400;
        const height = isUp ? maxHeight : 20;

        return (
          <div
            key={index}
            className="flex-1 flex flex-col items-center group relative"
          >
            <div
              className={`w-full rounded-t transition-all duration-200 ${
                isUp
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-red-500 hover:bg-red-600"
              }`}
              style={{ height: `${height}px` }}
            />

            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
              <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                <div>{new Date(record.timestamp).toLocaleString()}</div>
                <div>Status: {record.response.code}</div>
                <div className="truncate max-w-32">{record.response.text}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
