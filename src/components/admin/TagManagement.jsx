import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Plus, Edit, Trash2, Tag, Palette, Hash, TrendingUp,
  Search, X, Loader2, AlertCircle, CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const TagManagement = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('usage_count');
  const [sortOrder, setSortOrder] = useState('desc');

  const { api, isAdmin } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      tag_name: '',
      description: '',
      color: '#3B82F6'
    }
  });

  const watchColor = watch('color', '#3B82F6');

  // Fetch tags
  const fetchTags = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
        limit: '100'
      });

      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const response = await api.get(`/tags?${params}`);
      
      if (response.success) {
        setTags(response.data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast.error('Failed to fetch tags');
    } finally {
      setLoading(false);
    }
  };

  // Load tags on mount and when filters change
  useEffect(() => {
    if (isAdmin) {
      fetchTags();
    }
  }, [isAdmin, searchTerm, sortBy, sortOrder]);

  // Debounce search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchTags();
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  // Create/Update tag
  const onSubmit = async (data) => {
    try {
      let response;
      if (editingTag) {
        response = await api.put(`/tags/${editingTag._id}`, data);
      } else {
        response = await api.post('/tags', data);
      }

      if (response.success) {
        toast.success(editingTag ? 'Tag updated successfully' : 'Tag created successfully');
        closeModal();
        fetchTags();
      }
    } catch (error) {
      console.error('Error saving tag:', error);
      toast.error(error.message || 'Failed to save tag');
    }
  };

  // Edit tag
  const handleEdit = (tag) => {
    setEditingTag(tag);
    reset({
      tag_name: tag.tag_name,
      description: tag.description || '',
      color: tag.color || '#3B82F6'
    });
    setShowEditModal(true);
  };

  // Delete tag
  const handleDelete = async (tagId, tagName) => {
    if (!window.confirm(`Are you sure you want to delete the tag "${tagName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/tags/${tagId}`);
      toast.success('Tag deleted successfully');
      fetchTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error(error.message || 'Failed to delete tag');
    }
  };

  // Close modal
  const closeModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingTag(null);
    reset();
  };

  // Color presets
  const colorPresets = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    '#14B8A6', '#F43F5E', '#8B5A2B', '#374151', '#059669'
  ];

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tag Management</h1>
              <p className="text-gray-600 mt-2">Create and manage blog tags for better organization</p>
            </div>
            <button
              onClick={() => {
                reset();
                setEditingTag(null);
                setShowCreateModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Tag
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>

            {/* Sort By */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              >
                <option value="usage_count">Most Used</option>
                <option value="tag_name">Alphabetical</option>
                <option value="createdAt">Date Created</option>
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

        {/* Tags Grid */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tags found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search.' : 'Get started by creating your first tag.'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Tag
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
              {tags.map((tag) => (
                <div key={tag._id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-2 flex-shrink-0" 
                        style={{ backgroundColor: tag.color }}
                      />
                      <h3 className="font-medium text-gray-900 truncate">{tag.tag_name}</h3>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={() => handleEdit(tag)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit tag"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tag._id, tag.tag_name)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete tag"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {tag.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{tag.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      <span>{tag.usage_count} posts</span>
                    </div>
                    <span>
                      {new Date(tag.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingTag ? 'Edit Tag' : 'Create New Tag'}
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
              <div className="p-6 space-y-4">
                {/* Tag Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag Name *
                  </label>
                  <input
                    type="text"
                    {...register('tag_name', {
                      required: 'Tag name is required',
                      minLength: { value: 1, message: 'Tag name must be at least 1 character' },
                      maxLength: { value: 50, message: 'Tag name cannot exceed 50 characters' },
                      pattern: {
                        value: /^[a-zA-Z0-9\s\-_]+$/,
                        message: 'Tag name can only contain letters, numbers, spaces, hyphens, and underscores'
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter tag name"
                  />
                  {errors.tag_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.tag_name.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    {...register('description', {
                      maxLength: { value: 200, message: 'Description cannot exceed 200 characters' }
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional description for this tag"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <input
                        type="color"
                        {...register('color')}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <div 
                        className="absolute inset-1 rounded pointer-events-none"
                        style={{ backgroundColor: watchColor }}
                      />
                    </div>
                    <input
                      type="text"
                      {...register('color', {
                        pattern: {
                          value: /^#[0-9A-F]{6}$/i,
                          message: 'Color must be a valid hex color code'
                        }
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="#3B82F6"
                    />
                  </div>
                  
                  {/* Color Presets */}
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Quick Colors:</p>
                    <div className="flex flex-wrap gap-2">
                      {colorPresets.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setValue('color', color)}
                          className={`w-8 h-8 rounded border-2 transition-all ${
                            watchColor === color 
                              ? 'border-gray-400 scale-110' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {errors.color && (
                    <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>
                  )}
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </label>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: watchColor }}
                    />
                    <span className="text-sm">
                      {watch('tag_name') || 'Tag Name'}
                    </span>
                  </div>
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
                      {editingTag ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {editingTag ? 'Update Tag' : 'Create Tag'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagManagement;