import { FilterBy, SortBy } from "../pages/Dashboard";
import { SearchIcon, FilterIcon } from "./Icons";

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: string;
  onSortChange: (sort: SortBy) => void;
  filterBy: string;
  onFilterChange: (filter: FilterBy) => void;
}

export default function SearchAndFilters({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  filterBy,
  onFilterChange,
}: SearchAndFiltersProps) {
  const handleSortChange = (value: string) => {
    if (["name", "status", "createdAt", "lastPing"].includes(value)) {
      onSortChange(value as SortBy);
    }
  };
  const handleFilterChange = (value: string) => {
    if (["all", "up", "down", "active", "paused"].includes(value)) {
      onFilterChange(value as FilterBy);
    }
  };
  return (
    <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search services by name or URL..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="name">Name</option>
            <option value="status">Status</option>
            <option value="createdAt">Created Date</option>
            <option value="lastPing">Last Ping</option>
          </select>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <FilterIcon className="w-5 h-5 text-gray-400" />
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={filterBy}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Services</option>
            <option value="up">Up</option>
            <option value="down">Down</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>
    </div>
  );
}
