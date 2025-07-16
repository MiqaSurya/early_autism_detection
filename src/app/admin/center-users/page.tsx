'use client'

import { useState, useEffect } from 'react'
import { 
  Building2, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Users, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Plus,
  RefreshCw,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react'
import AdminAuthWrapper from '@/components/admin/AdminAuthWrapper'

interface CenterUser {
  id: string
  email: string
  contact_person: string
  center_name: string
  center_type: 'diagnostic' | 'therapy' | 'support' | 'education'
  address: string
  phone?: string
  description?: string
  business_license?: string
  is_verified: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  last_login?: string
}

interface CenterUserStats {
  total: number
  verified: number
  pending: number
  inactive: number
  newThisMonth: number
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminCenterUsersPage() {
  const [centerUsers, setCenterUsers] = useState<CenterUser[]>([])
  const [stats, setStats] = useState<CenterUserStats>({
    total: 0,
    verified: 0,
    pending: 0,
    inactive: 0,
    newThisMonth: 0
  })
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedUser, setSelectedUser] = useState<CenterUser | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  const fetchCenterUsers = async () => {
    try {
      setLoading(true)
      setError('')

      const adminSession = localStorage.getItem('admin_session')
      if (!adminSession) {
        setError('Admin authentication required')
        return
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        status: statusFilter,
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/admin/center-users?${params}`, {
        headers: {
          'x-admin-session': adminSession
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch center users')
      }

      const data = await response.json()
      setCenterUsers(data.data.centerUsers)
      setStats(data.data.stats)
      setPagination(data.data.pagination)

    } catch (err) {
      console.error('Error fetching center users:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch center users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCenterUsers()
  }, [pagination.page, searchTerm, statusFilter, sortBy, sortOrder])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleEdit = (user: CenterUser) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleDelete = (user: CenterUser) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const handleUpdateUser = async (updatedData: Partial<CenterUser>) => {
    if (!selectedUser) return

    try {
      setProcessingId(selectedUser.id)

      const adminSession = localStorage.getItem('admin_session')
      if (!adminSession) {
        setError('Admin authentication required')
        return
      }

      // Update center user
      const response = await fetch('/api/admin/center-users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-session': adminSession
        },
        body: JSON.stringify({
          id: selectedUser.id,
          ...updatedData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update center user')
      }

      // Sync to autism_centers table
      const syncResponse = await fetch('/api/admin/sync-centers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-session': adminSession
        },
        body: JSON.stringify({
          centerUserId: selectedUser.id,
          action: 'sync'
        })
      })

      if (!syncResponse.ok) {
        console.warn('Failed to sync center to autism_centers table')
      }

      await fetchCenterUsers()
      setShowEditModal(false)
      setSelectedUser(null)

    } catch (err) {
      console.error('Error updating center user:', err)
      setError(err instanceof Error ? err.message : 'Failed to update center user')
    } finally {
      setProcessingId(null)
    }
  }

  const handleSyncAllCenters = async () => {
    try {
      setSyncing(true)
      setError('')

      const adminSession = localStorage.getItem('admin_session')
      if (!adminSession) {
        setError('Admin authentication required')
        return
      }

      const response = await fetch('/api/admin/sync-centers', {
        method: 'GET',
        headers: {
          'x-admin-session': adminSession
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to sync centers')
      }

      const data = await response.json()
      console.log('Sync completed:', data)

      // Refresh the center users list
      await fetchCenterUsers()

    } catch (err) {
      console.error('Error syncing centers:', err)
      setError(err instanceof Error ? err.message : 'Failed to sync centers')
    } finally {
      setSyncing(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      setProcessingId(selectedUser.id)

      const adminSession = localStorage.getItem('admin_session')
      if (!adminSession) {
        setError('Admin authentication required')
        return
      }

      // Delete from autism_centers table first
      const syncResponse = await fetch('/api/admin/sync-centers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-session': adminSession
        },
        body: JSON.stringify({
          centerUserId: selectedUser.id,
          action: 'delete'
        })
      })

      if (!syncResponse.ok) {
        console.warn('Failed to remove center from autism_centers table')
      }

      // Delete center user
      const response = await fetch(`/api/admin/center-users?id=${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-session': adminSession
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete center user')
      }

      await fetchCenterUsers()
      setShowDeleteModal(false)
      setSelectedUser(null)

    } catch (err) {
      console.error('Error deleting center user:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete center user')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (user: CenterUser) => {
    if (!user.is_active) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircle className="w-3 h-3 mr-1" />
          Inactive
        </span>
      )
    }
    
    if (user.is_verified) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    )
  }

  const getCenterTypeLabel = (type: string) => {
    const types = {
      diagnostic: 'Diagnostic',
      therapy: 'Therapy',
      support: 'Support',
      education: 'Education'
    }
    return types[type as keyof typeof types] || type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <AdminAuthWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Center Users Management</h1>
            <p className="text-gray-600 mt-2">
              Manage registered autism centers and their portal accounts
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSyncAllCenters}
              disabled={syncing || loading}
              className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync All Centers'}
            </button>
            <button
              onClick={fetchCenterUsers}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Centers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-gray-900">{stats.verified}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newThisMonth}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search centers, contacts, or emails..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Sort */}
            <div className="sm:w-48">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field)
                  setSortOrder(order)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="center_name-asc">Name A-Z</option>
                <option value="center_name-desc">Name Z-A</option>
                <option value="updated_at-desc">Recently Updated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Center Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Center Users ({pagination.total})
            </h3>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center">
              <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Loading center users...</p>
            </div>
          ) : centerUsers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No center users found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'No centers have registered yet.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('center_name')}
                    >
                      Center Name
                      {sortBy === 'center_name' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Person
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('created_at')}
                    >
                      Registered
                      {sortBy === 'created_at' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {centerUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.center_name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.contact_person}</div>
                        {user.phone && (
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Phone className="h-3 w-3 mr-1" />
                            {user.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getCenterTypeLabel(user.center_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            disabled={processingId === user.id}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                            title="Edit center user"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={processingId === user.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Delete center user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && selectedUser && (
          <EditCenterUserModal
            user={selectedUser}
            onSave={handleUpdateUser}
            onCancel={() => {
              setShowEditModal(false)
              setSelectedUser(null)
            }}
            isLoading={processingId === selectedUser.id}
          />
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedUser && (
          <DeleteConfirmModal
            centerName={selectedUser.center_name}
            contactPerson={selectedUser.contact_person}
            onConfirm={handleDeleteUser}
            onCancel={() => {
              setShowDeleteModal(false)
              setSelectedUser(null)
            }}
            isLoading={processingId === selectedUser.id}
          />
        )}
      </div>
    </AdminAuthWrapper>
  )
}

// Edit Center User Modal Component
interface EditCenterUserModalProps {
  user: CenterUser
  onSave: (data: Partial<CenterUser>) => void
  onCancel: () => void
  isLoading: boolean
}

function EditCenterUserModal({ user, onSave, onCancel, isLoading }: EditCenterUserModalProps) {
  const [formData, setFormData] = useState({
    center_name: user.center_name,
    contact_person: user.contact_person,
    center_type: user.center_type,
    address: user.address,
    phone: user.phone || '',
    description: user.description || '',
    business_license: user.business_license || '',
    is_verified: user.is_verified,
    is_active: user.is_active
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Edit Center User</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Center Name *
              </label>
              <input
                type="text"
                value={formData.center_name}
                onChange={(e) => setFormData(prev => ({ ...prev, center_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person *
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Center Type *
              </label>
              <select
                value={formData.center_type}
                onChange={(e) => setFormData(prev => ({ ...prev, center_type: e.target.value as CenterUser['center_type'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="diagnostic">Diagnostic</option>
                <option value="therapy">Therapy</option>
                <option value="support">Support</option>
                <option value="education">Education</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business License
            </label>
            <input
              type="text"
              value={formData.business_license}
              onChange={(e) => setFormData(prev => ({ ...prev, business_license: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_verified}
                onChange={(e) => setFormData(prev => ({ ...prev, is_verified: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Verified</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Delete Confirmation Modal Component
interface DeleteConfirmModalProps {
  centerName: string
  contactPerson: string
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}

function DeleteConfirmModal({ centerName, contactPerson, onConfirm, onCancel, isLoading }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Delete Center User</h3>
        </div>

        <div className="p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
            <p className="text-sm text-gray-700">
              Are you sure you want to delete this center user? This action cannot be undone.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-gray-900">{centerName}</p>
            <p className="text-sm text-gray-600">Contact: {contactPerson}</p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
