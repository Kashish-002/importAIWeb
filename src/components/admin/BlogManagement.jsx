import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  Plus, Edit, Trash2, Eye, Search, Filter, 
  Calendar, User, Tag, BarChart3, Loader2,
  FileText, Globe, Archive, Clock, Star, X,
  CheckSquare, Square, MoreHorizontal, Download,
  TrendingUp, Users as UsersIcon, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import RichTextEditor from '../RichTextEditor';
import toast from 'react-hot-toast';

const BlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [tags, setTags] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [selectedBlogs, setSelectedBlogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const { api, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      status: 'draft',
      tags: '',
      featured_image: ''
    }
  });

  const watchContent = watch('content', '');

  // Fetch blogs
  const fetchBlogs = async (page = 1, filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.tag && { tags: filters.tag })
      });

      const response = await api.get(`/blogs?${params}`);
      
      if (response.data.success) {
        setBlogs(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error('Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tags
  const fetchTags = async () => {
    try {
      const response = await api.get('/tags');
      if (response.data.success) {
        setTags(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics');
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    if (isAdmin) {
      fetchBlogs();
      fetchTags();
      fetchAnalytics();
    }
  }, [isAdmin]);

  // Handle search and filters
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchBlogs(1, {
        search: searchTerm,
        status: statusFilter,
        tag: tagFilter
      });
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, statusFilter, tagFilter, sortBy, sortOrder]);

  // Create/Update blog
  const onSubmit = async (data) => {
    try {
      const blogData = {
        ...data,
        tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      let response;
      if (editingBlog) {
        response = await api.put(`/blogs/${editingBlog._id}`, blogData);
      } else {
        response = await api.post('/blogs', blogData);
      }

      if (response.data.success) {
        toast.success(editingBlog ? 'Blog updated successfully' : 'Blog created successfully');
        closeModal();
        fetchBlogs();
        fetchAnalytics();
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      toast.error(error.response?.data?.message || 'Failed to save blog');
    }
  };

  // Edit blog
  const handleEdit = (blog) => {
    setEditingBlog(blog);
    reset({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      status: blog.status,
      tags: blog.tags?.map(tag => tag.tag_name).join(', ') || '',
      featured_image: blog.featured_image || ''
    });
    setShowEditModal(true);
  };

  // Delete blog
  const handleDelete = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/blogs/${blogId}`);
      toast.success('Blog deleted successfully');
      fetchBlogs();
      fetchAnalytics();
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete blog');
    }
  };

  // Bulk operations
  const handleBulkOperation = async (action) => {
    if (selectedBlogs.length === 0) {
      toast.error('Please select blogs first');
      return;
    }

    const actionText = {
      publish: 'publish',
      unpublish: 'unpublish',
      archive: 'archive',
      delete: 'delete'
    }[action];

    if (!window.confirm(`Are you sure you want to ${actionText} ${selectedBlogs.length} blog(s)?`)) {
      return;
    }

    try {
      const response = await api.post('/blogs/bulk', {
        action,
        blogIds: selectedBlogs
      });

      if (response.data.success) {
        toast.success(`Successfully ${actionText}ed ${response.data.modifiedCount} blog(s)`);
        setSelectedBlogs([]);
        setShowBulkModal(false);
        fetchBlogs();
        fetchAnalytics();
      }
    } catch (error) {
      console.error('Bulk operation error:', error);
      toast.error(`Failed to ${actionText} blogs`);
    }
  };

  // Helper functions
  const closeModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingBlog(null);
    reset();
  };

  const toggleBlogSelection = (blogId) => {
    setSelectedBlogs(prev => 
      prev.includes(blogId) 
        ? prev.filter(id => id !== blogId)
        : [...prev, blogId]
    );
  };

  const selectAllBlogs = () => {
    if (selectedBlogs.length === blogs.length) {
      setSelectedBlogs([]);
    } else {
      setSelectedBlogs(blogs.map(blog => blog._id));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportBlogs = () => {
    const csvContent = [
      ['Title', 'Status', 'Author', 'Views', 'Likes', 'Created', 'Updated'].join(','),
      ...blogs.map(blog => [
        `"${blog.title}"`,
        blog.status,
        `"${blog.author_id?.name || 'Unknown'}"`,
        blog.views || 0,
        blog.likes || 0,
        new Date(blog.createdAt).toISOString().split('T')[0],
        new Date(blog.updatedAt).toISOString().split('T')[0]
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blogs-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <Link to="/dashboard" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
              <p className="text-gray-600 mt-2">Create, edit, and manage your blog posts</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {selectedBlogs.length > 0 && (
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Actions ({selectedBlogs.length})
                </button>
              )}
              <button
                onClick={exportBlogs}
                className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
              <button
                onClick={() => {
                  reset();
                  setEditingBlog(null);
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Blog Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Blogs</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalBlogs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Globe className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.publishedBlogs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Views</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.avgViewsPerBlog}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MessageSquare className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Comments</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalComments}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search blogs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full appearance-none"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Tag Filter */}
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full appearance-none"
              >
                <option value="">All Tags</option>
                {tags.map(tag => (
                  <option key={tag._id} value={tag.tag_name}>
                    {tag.tag_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              >
                <option value="updatedAt">Last Updated</option>
                <option value="createdAt">Date Created</option>
                <option value="views">Views</option>
                <option value="likes">Likes</option>
                <option value="title">Title</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Blog List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No blogs found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' || tagFilter 
                  ? 'Try adjusting your search filters.' 
                  : 'Get started by creating your first blog post.'
                }
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Blog Post
              </button>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                  <div className="col-span-1 flex items-center">
                    <button
                      onClick={selectAllBlogs}
                      className="flex items-center justify-center w-4 h-4"
                    >
                      {selectedBlogs.length === blogs.length ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : selectedBlogs.length > 0 ? (
                        <Square className="w-4 h-4 text-blue-600 opacity-50" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="col-span-4">Title</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Author</div>
                  <div className="col-span-1">Views</div>
                  <div className="col-span-1">Date</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {blogs.map((blog) => (
                  <div key={blog._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Checkbox */}
                      <div className="col-span-1">
                        <button
                          onClick={() => toggleBlogSelection(blog._id)}
                          className="flex items-center justify-center w-4 h-4"
                        >
                          {selectedBlogs.includes(blog._id) ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>

                      {/* Title */}
                      <div className="col-span-4">
                        <div className="flex items-start space-x-3">
                          {blog.featured_image && (
                            <img
                              src={blog.featured_image}
                              alt={blog.title}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
                              {blog.title}
                            </h3>
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                              {blog.excerpt || blog.content?.substring(0, 100) + '...'}
                            </p>
                            {blog.tags && blog.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {blog.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag._id}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {tag.tag_name}
                                  </span>
                                ))}
                                {blog.tags.length > 2 && (
                                  <span className="text-xs text-gray-500">
                                    +{blog.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(blog.status)}`}>
                          {blog.status === 'published' && <Globe className="w-3 h-3 mr-1" />}
                          {blog.status === 'draft' && <Clock className="w-3 h-3 mr-1" />}
                          {blog.status === 'archived' && <Archive className="w-3 h-3 mr-1" />}
                          {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                        </span>
                      </div>

                      {/* Author */}
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          {blog.author_id?.avatar ? (
                            <img
                              src={blog.author_id.avatar}
                              alt={blog.author_id.name}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-gray-600" />
                            </div>
                          )}
                          <span className="text-sm text-gray-900 truncate">
                            {blog.author_id?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>

                      {/* Views */}
                      <div className="col-span-1">
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <BarChart3 className="w-4 h-4" />
                          <span>{blog.views || 0}</span>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="col-span-1">
                        <div className="text-xs text-gray-600">
                          {formatDate(blog.updatedAt)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1">
                        <div className="flex items-center space-x-1">
                          {blog.status === 'published' && (
                            <Link
                              to={`/blogs/${blog.slug}`}
                              target="_blank"
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="View Blog"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                          <button
                            onClick={() => handleEdit(blog)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit Blog"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(blog._id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete Blog"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} results
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => fetchBlogs(1)}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        First
                      </button>
                      <button
                        onClick={() => fetchBlogs(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700">
                        Page {pagination.page} of {pagination.pages}
                      </span>
                      <button
                        onClick={() => fetchBlogs(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                      <button
                        onClick={() => fetchBlogs(pagination.pages)}
                        disabled={pagination.page === pagination.pages}
                        className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Last
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    {...register('title', {
                      required: 'Title is required',
                      minLength: { value: 5, message: 'Title must be at least 5 characters' },
                      maxLength: { value: 200, message: 'Title cannot exceed 200 characters' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter blog title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <RichTextEditor
                    value={watchContent}
                    onChange={(content) => setValue('content', content)}
                    placeholder="Write your blog content here..."
                    maxLength={50000}
                    allowCodeBlocks={true}
                    allowImages={true}
                    allowVideos={true}
                  />
                  {errors.content && (
                    <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                  )}
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Excerpt
                  </label>
                  <textarea
                    {...register('excerpt', {
                      maxLength: { value: 500, message: 'Excerpt cannot exceed 500 characters' }
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of the blog post (optional)"
                  />
                  {errors.excerpt && (
                    <p className="mt-1 text-sm text-red-600">{errors.excerpt.message}</p>
                  )}
                </div>

                {/* Meta Info Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      {...register('status')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <input
                      type="text"
                      {...register('tags')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter tags separated by commas"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Separate multiple tags with commas (e.g., AI, Technology, Tutorial)
                    </p>
                  </div>
                </div>

                {/* Featured Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Featured Image URL
                  </label>
                  <input
                    type="url"
                    {...register('featured_image')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Optional: Add a URL to an image that represents your blog post
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingBlog ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {editingBlog ? 'Update Blog' : 'Create Blog'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bulk Actions ({selectedBlogs.length} selected)
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleBulkOperation('publish')}
                  className="w-full flex items-center space-x-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Globe className="w-5 h-5" />
                  <span>Publish Selected</span>
                </button>
                <button
                  onClick={() => handleBulkOperation('unpublish')}
                  className="w-full flex items-center space-x-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <Clock className="w-5 h-5" />
                  <span>Unpublish Selected</span>
                </button>
                <button
                  onClick={() => handleBulkOperation('archive')}
                  className="w-full flex items-center space-x-3 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Archive className="w-5 h-5" />
                  <span>Archive Selected</span>
                </button>
                <button
                  onClick={() => handleBulkOperation('delete')}
                  className="w-full flex items-center space-x-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Delete Selected</span>
                </button>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="w-full mt-4 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogManagement;