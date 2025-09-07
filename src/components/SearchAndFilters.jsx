import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, Filter, Tag, X, ChevronDown, Loader2,
  Calendar, SortAsc, SortDesc, Grid, List
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SearchAndFilter = ({ 
  onSearch, 
  onFilter, 
  onSort,
  onViewChange,
  initialFilters = {},
  showViewToggle = true,
  showSortOptions = true,
  placeholder = "Search blogs by title, content, or tags..."
}) => {
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const [selectedTags, setSelectedTags] = useState(initialFilters.tags || []);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(initialFilters.sortBy || 'createdAt');
  const [sortOrder, setSortOrder] = useState(initialFilters.sortOrder || 'desc');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  const { api } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const tagDropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Load popular tags on mount
  useEffect(() => {
    fetchPopularTags();
  }, []);

  // Handle URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlSearch = urlParams.get('search') || '';
    const urlTags = urlParams.get('tags') ? urlParams.get('tags').split(',') : [];
    const urlSortBy = urlParams.get('sortBy') || 'createdAt';
    const urlSortOrder = urlParams.get('sortOrder') || 'desc';

    setSearchTerm(urlSearch);
    setSelectedTags(urlTags);
    setSortBy(urlSortBy);
    setSortOrder(urlSortOrder);

    // Apply filters
    applyFilters(urlSearch, urlTags, urlSortBy, urlSortOrder);
  }, [location.search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target)) {
        setShowTagDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch popular tags
  const fetchPopularTags = async () => {
    try {
      const response = await api.get('/tags/popular?limit=20');
      if (response.success) {
        setAvailableTags(response.data);
      }
    } catch (error) {
      console.error('Error fetching popular tags:', error);
    }
  };

  // Fetch tag suggestions
  const fetchTagSuggestions = async (query) => {
    if (!query.trim()) {
      setTagSuggestions([]);
      return;
    }

    try {
      const response = await api.get(`/tags/suggest?q=${encodeURIComponent(query)}&limit=10`);
      if (response.success) {
        setTagSuggestions(response.data);
      }
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
    }
  };

  // Debounced tag search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchTagSuggestions(tagSearchTerm);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [tagSearchTerm]);

  // Apply filters and update URL
  const applyFilters = (search, tags, sort, order) => {
    const params = new URLSearchParams();
    
    if (search) params.set('search', search);
    if (tags.length > 0) params.set('tags', tags.join(','));
    if (sort !== 'createdAt') params.set('sortBy', sort);
    if (order !== 'desc') params.set('sortOrder', order);

    const newUrl = `${location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    navigate(newUrl, { replace: true });

    // Notify parent component
    if (onSearch) onSearch(search);
    if (onFilter) onFilter({ tags, sortBy: sort, sortOrder: order });
    if (onSort) onSort({ sortBy: sort, sortOrder: order });
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    applyFilters(searchTerm, selectedTags, sortBy, sortOrder);
  };

  // Handle tag selection
  const handleTagSelect = (tag) => {
    const tagName = typeof tag === 'string' ? tag : tag.tag_name;
    
    if (!selectedTags.includes(tagName)) {
      const newTags = [...selectedTags, tagName];
      setSelectedTags(newTags);
      applyFilters(searchTerm, newTags, sortBy, sortOrder);
    }
    
    setTagSearchTerm('');
    setShowTagDropdown(false);
  };

  // Remove tag
  const removeTag = (tagToRemove) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    applyFilters(searchTerm, newTags, sortBy, sortOrder);
  };

  // Handle sort change
  const handleSortChange = (newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    applyFilters(searchTerm, selectedTags, newSortBy, newSortOrder);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    setSortBy('createdAt');
    setSortOrder('desc');
    applyFilters('', [], 'createdAt', 'desc');
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedTags.length > 0) count += selectedTags.length;
    if (sortBy !== 'createdAt' || sortOrder !== 'desc') count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span className="ml-2 hidden sm:inline">Search</span>
        </button>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center ${
            activeFilterCount > 0 ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-300 text-gray-700'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="ml-2 hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </form>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          {/* Tag Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Tags
            </label>
            <div className="relative" ref={tagDropdownRef}>
              <div className="flex">
                <input
                  type="text"
                  value={tagSearchTerm}
                  onChange={(e) => setTagSearchTerm(e.target.value)}
                  onFocus={() => setShowTagDropdown(true)}
                  placeholder="Search tags..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowTagDropdown(!showTagDropdown)}
                  className="px-3 py-2 border-t border-r border-b border-gray-300 rounded-r-lg hover:bg-gray-50 transition-colors"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${showTagDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Tag Dropdown */}
              {showTagDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {/* Tag Suggestions (when searching) */}
                  {tagSearchTerm && tagSuggestions.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                        Search Results
                      </div>
                      {tagSuggestions.map((tag) => (
                        <button
                          key={tag._id}
                          onClick={() => handleTagSelect(tag)}
                          disabled={selectedTags.includes(tag.tag_name)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: tag.color }}
                            />
                            <span>{tag.tag_name}</span>
                          </div>
                          <span className="text-xs text-gray-500">{tag.usage_count} posts</span>
                        </button>
                      ))}
                    </>
                  )}

                  {/* Popular Tags (when not searching) */}
                  {!tagSearchTerm && availableTags.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                        Popular Tags
                      </div>
                      {availableTags.map((tag) => (
                        <button
                          key={tag._id}
                          onClick={() => handleTagSelect(tag)}
                          disabled={selectedTags.includes(tag.tag_name)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: tag.color }}
                            />
                            <span>{tag.tag_name}</span>
                          </div>
                          <span className="text-xs text-gray-500">{tag.usage_count} posts</span>
                        </button>
                      ))}
                    </>
                  )}

                  {/* No results */}
                  {((tagSearchTerm && tagSuggestions.length === 0) || (!tagSearchTerm && availableTags.length === 0)) && (
                    <div className="px-3 py-4 text-center text-gray-500">
                      {tagSearchTerm ? 'No tags found' : 'No tags available'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sort Options */}
          {showSortOptions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value, sortOrder)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="updatedAt">Last Updated</option>
                  <option value="views">Most Viewed</option>
                  <option value="likes">Most Liked</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order
                </label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => handleSortChange(sortBy, 'desc')}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                      sortOrder === 'desc' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <SortDesc className="w-4 h-4 inline mr-1" />
                    Newest First
                  </button>
                  <button
                    onClick={() => handleSortChange(sortBy, 'asc')}
                    className={`flex-1 px-3 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
                      sortOrder === 'asc' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <SortAsc className="w-4 h-4 inline mr-1" />
                    Oldest First
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={clearAllFilters}
              disabled={activeFilterCount === 0}
              className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear All Filters
            </button>

            {/* View Mode Toggle */}
            {showViewToggle && (
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => {
                    setViewMode('grid');
                    if (onViewChange) onViewChange('grid');
                  }}
                  className={`px-3 py-1 text-sm transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setViewMode('list');
                    if (onViewChange) onViewChange('list');
                  }}
                  className={`px-3 py-1 text-sm border-l border-gray-300 transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;