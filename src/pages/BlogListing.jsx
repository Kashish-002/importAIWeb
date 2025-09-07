import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, User, Clock, Eye, Heart, Tag, 
  Loader2, AlertCircle, ChevronLeft, ChevronRight,
  Grid, List
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SearchAndFilter from '../components/SearchAndFilter';
import toast from 'react-hot-toast';

const BlogListing = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 });
  const [filters, setFilters] = useState({
    search: '',
    tags: [],
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const { api } = useAuth();
  const location = useLocation();

  // Fetch blogs based on current filters
  const fetchBlogs = async (page = 1, newFilters = filters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        status: 'published',
        sortBy: newFilters.sortBy,
        sortOrder: newFilters.sortOrder
      });

      if (newFilters.search) {
        params.set('search', newFilters.search);
      }

      if (newFilters.tags && newFilters.tags.length > 0) {
        params.set('tags', newFilters.tags.join(','));
      }

      const response = await api.get(`/blogs?${params}`);
      
      if (response.success) {
        setBlogs(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error('Failed to load blogs');
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize filters from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const initialFilters = {
      search: urlParams.get('search') || '',
      tags: urlParams.get('tags') ? urlParams.get('tags').split(',') : [],
      sortBy: urlParams.get('sortBy') || 'createdAt',
      sortOrder: urlParams.get('sortOrder') || 'desc'
    };

    setFilters(initialFilters);
    fetchBlogs(1, initialFilters);
  }, [location.search]);

  // Handle search
  const handleSearch = (searchTerm) => {
    const newFilters = { ...filters, search: searchTerm };
    setFilters(newFilters);
    fetchBlogs(1, newFilters);
  };

  // Handle filter changes
  const handleFilter = (newFilterOptions) => {
    const newFilters = { ...filters, ...newFilterOptions };
    setFilters(newFilters);
    fetchBlogs(1, newFilters);
  };

  // Handle sort changes
  const handleSort = (sortOptions) => {
    const newFilters = { ...filters, ...sortOptions };
    setFilters(newFilters);
    fetchBlogs(1, newFilters);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      fetchBlogs(newPage, filters);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const numbers = [];
    const current = pagination.page;
    const total = pagination.pages;
    
    // Always show first page
    if (total > 0) numbers.push(1);
    
    // Show ellipsis if current page is far from start
    if (current > 4) numbers.push('...');
    
    // Show pages around current page
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      if (i > 1 && i < total) numbers.push(i);
    }
    
    // Show ellipsis if current page is far from end
    if (current < total - 3) numbers.push('...');
    
    // Always show last page
    if (total > 1) numbers.push(total);
    
    return [...new Set(numbers)]; // Remove duplicates
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Blog</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover insights, tutorials, and case studies about AI automation and business transformation
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <SearchAndFilter
          onSearch={handleSearch}
          onFilter={handleFilter}
          onSort={handleSort}
          onViewChange={setViewMode}
          initialFilters={filters}
          showViewToggle={true}
          showSortOptions={true}
        />

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600">
            {loading ? (
              'Loading...'
            ) : (
              <>
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} articles
                {filters.search && (
                  <span> for "{filters.search}"</span>
                )}
                {filters.tags.length > 0 && (
                  <span> tagged with {filters.tags.join(', ')}</span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Blog Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading articles...</span>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600">
              {filters.search || filters.tags.length > 0 
                ? 'Try adjusting your search criteria or filters.' 
                : 'No articles have been published yet.'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogs.map((blog) => (
                  <Link
                    key={blog._id}
                    to={`/blogs/${blog.slug}`}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    {/* Featured Image */}
                    {blog.featured_image && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={blog.featured_image}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}

                    <div className="p-6">
                      {/* Tags */}
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {blog.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag._id}
                              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {tag.tag_name}
                            </span>
                          ))}
                          {blog.tags.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{blog.tags.length - 2} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Title */}
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-3 line-clamp-2">
                        {blog.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {blog.excerpt || blog.content?.substring(0, 150) + '...'}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            <span>{blog.author_id?.name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{formatDate(blog.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{blog.reading_time}m</span>
                          </div>
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            <span>{blog.views || 0}</span>
                          </div>
                          {blog.likes > 0 && (
                            <div className="flex items-center">
                              <Heart className="w-4 h-4 mr-1" />
                              <span>{blog.likes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-6">
                {blogs.map((blog) => (
                  <Link
                    key={blog._id}
                    to={`/blogs/${blog.slug}`}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex"
                  >
                    {/* Featured Image */}
                    {blog.featured_image && (
                      <div className="w-48 flex-shrink-0 overflow-hidden">
                        <img
                          src={blog.featured_image}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}

                    <div className="flex-1 p-6">
                      {/* Tags */}
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {blog.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag._id}
                              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {tag.tag_name}
                            </span>
                          ))}
                          {blog.tags.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{blog.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Title */}
                      <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-3">
                        {blog.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {blog.excerpt || blog.content?.substring(0, 200) + '...'}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            <span>{blog.author_id?.name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{formatDate(blog.createdAt)}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{blog.reading_time} min read</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            <span>{blog.views || 0} views</span>
                          </div>
                          {blog.likes > 0 && (
                            <div className="flex items-center">
                              <Heart className="w-4 h-4 mr-1" />
                              <span>{blog.likes} likes</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-12 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </div>

                <div className="flex items-center space-x-1">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="hidden md:flex items-center space-x-1">
                    {getPaginationNumbers().map((pageNum, index) => (
                      <React.Fragment key={index}>
                        {pageNum === '...' ? (
                          <span className="px-3 py-2 text-gray-500">...</span>
                        ) : (
                          <button
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              pageNum === pagination.page
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Mobile Page Info */}
                  <div className="md:hidden px-3 py-2 text-sm text-gray-700">
                    {pagination.page} / {pagination.pages}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BlogListing;