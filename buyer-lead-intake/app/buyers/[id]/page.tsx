'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UpdateBuyerSchema } from '@/lib/validation'

interface Buyer {
  id: string
  fullName: string
  email?: string
  phone: string
  city: string
  propertyType: string
  bhk?: string
  purpose: string
  budgetMin?: number
  budgetMax?: number
  timeline: string
  source: string
  status: string
  notes?: string
  tags: string
  owner: {
    id: string
    name?: string
    email: string
  }
  updatedAt: string
  history: Array<{
    id: string
    changedBy: string
    changedAt: string
    diff: any
  }>
}

interface BuyerHistory {
  id: string
  changedBy: string
  changedAt: string
  diff: any
}

export default function BuyerDetailPage({ params }: { params: { id: string } }) {
  const [buyer, setBuyer] = useState<Buyer | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<Buyer>({
    resolver: zodResolver(UpdateBuyerSchema)
  })

  const propertyType = watch('propertyType')

  useEffect(() => {
    fetchBuyer()
  }, [params.id])

  const fetchBuyer = async () => {
    try {
      const response = await fetch(`/api/buyers/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setBuyer(data)
        reset(data)
      } else {
        if (response.status === 401) {
          router.push('/login')
        } else {
          setError('Failed to fetch buyer')
        }
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: Buyer) => {
    setSaving(true)
    setError('')

    try {
      // Clean up empty strings and convert numbers
      const submitData = {
        ...data,
        email: data.email || undefined,
        budgetMin: data.budgetMin || undefined,
        budgetMax: data.budgetMax || undefined,
        notes: data.notes || undefined,
        tags: Array.isArray(data.tags) ? data.tags.filter(tag => tag.trim() !== '') : [],
        updatedAt: buyer?.updatedAt
      }

      const response = await fetch(`/api/buyers/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        const updatedBuyer = await response.json()
        setBuyer(updatedBuyer)
        setIsEditing(false)
        await fetchBuyer() // Refresh to get updated history
      } else {
        if (response.status === 401) {
          router.push('/login')
        } else if (response.status === 409) {
          setError('Buyer has been modified by another user. Please refresh and try again.')
          await fetchBuyer()
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to update buyer')
        }
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this buyer? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/buyers/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/buyers')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete buyer')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
  }

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified'
    if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`
    if (min) return `₹${min.toLocaleString()}+`
    if (max) return `Up to ₹${max.toLocaleString()}`
    return 'Not specified'
  }

  const formatStatus = (status: string) => {
    const statusColors: Record<string, string> = {
      NEW: 'bg-gray-100 text-gray-800',
      QUALIFIED: 'bg-blue-100 text-blue-800',
      CONTACTED: 'bg-yellow-100 text-yellow-800',
      VISITED: 'bg-purple-100 text-purple-800',
      NEGOTIATION: 'bg-orange-100 text-orange-800',
      CONVERTED: 'bg-green-100 text-green-800',
      DROPPED: 'bg-red-100 text-red-800',
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading buyer details...</div>
      </div>
    )
  }

  if (!buyer) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">Buyer not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{buyer.fullName}</h1>
          <p className="text-gray-600">Buyer Details</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            {isEditing ? 'Cancel Edit' : 'Edit'}
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {isEditing ? (
        /* Edit Form */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                  <input
                    {...register('fullName')}
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    {...register('email')}
                    type="email"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone *</label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">City *</label>
                  <select
                    {...register('city')}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="CHANDIGARH">Chandigarh</option>
                    <option value="MOHALI">Mohali</option>
                    <option value="ZIRAKPUR">Zirakpur</option>
                    <option value="PANCHKULA">Panchkula</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Property Type *</label>
                  <select
                    {...register('propertyType')}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="APARTMENT">Apartment</option>
                    <option value="VILLA">Villa</option>
                    <option value="PLOT">Plot</option>
                    <option value="OFFICE">Office</option>
                    <option value="RETAIL">Retail</option>
                  </select>
                </div>

                {/* BHK - only for Apartment and Villa */}
                {(propertyType === 'APARTMENT' || propertyType === 'VILLA') && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">BHK *</label>
                    <select
                      {...register('bhk')}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select BHK</option>
                      <option value="STUDIO">Studio</option>
                      <option value="ONE">1 BHK</option>
                      <option value="TWO">2 BHK</option>
                      <option value="THREE">3 BHK</option>
                      <option value="FOUR">4 BHK</option>
                    </select>
                    {errors.bhk && (
                      <p className="mt-1 text-sm text-red-600">{errors.bhk.message}</p>
                    )}
                  </div>
                )}

                {/* Purpose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purpose *</label>
                  <select
                    {...register('purpose')}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="BUY">Buy</option>
                    <option value="RENT">Rent</option>
                  </select>
                </div>

                {/* Timeline */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timeline *</label>
                  <select
                    {...register('timeline')}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="ZERO_TO_THREE_MONTHS">0-3 months</option>
                    <option value="THREE_TO_SIX_MONTHS">3-6 months</option>
                    <option value="MORE_THAN_SIX_MONTHS">&gt;6 months</option>
                    <option value="EXPLORING">Exploring</option>
                  </select>
                </div>

                {/* Source */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Source *</label>
                  <select
                    {...register('source')}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="WEBSITE">Website</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="WALK_IN">Walk-in</option>
                    <option value="CALL">Call</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status *</label>
                  <select
                    {...register('status')}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="NEW">New</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="VISITED">Visited</option>
                    <option value="NEGOTIATION">Negotiation</option>
                    <option value="CONVERTED">Converted</option>
                    <option value="DROPPED">Dropped</option>
                  </select>
                </div>

                {/* Budget Min */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget Min (₹)</label>
                  <input
                    {...register('budgetMin', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Budget Max */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget Max (₹)</label>
                  <input
                    {...register('budgetMax', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Tags */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Tags</label>
                  <input
                    {...register('tags')}
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter tags separated by commas"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        /* View Mode */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{buyer.fullName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{buyer.phone}</dd>
                  </div>
                  {buyer.email && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{buyer.email}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">City</dt>
                    <dd className="mt-1 text-sm text-gray-900">{buyer.city}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Property Requirements</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Property Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{buyer.propertyType}</dd>
                  </div>
                  {buyer.bhk && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">BHK</dt>
                      <dd className="mt-1 text-sm text-gray-900">{buyer.bhk}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Purpose</dt>
                    <dd className="mt-1 text-sm text-gray-900">{buyer.purpose}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Budget</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatBudget(buyer.budgetMin, buyer.budgetMax)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Timeline</dt>
                    <dd className="mt-1 text-sm text-gray-900">{buyer.timeline.replace(/_/g, ' ').toLowerCase()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Source</dt>
                    <dd className="mt-1 text-sm text-gray-900">{buyer.source.replace(/_/g, ' ').toLowerCase()}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {buyer.notes && (
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                  <p className="text-sm text-gray-900">{buyer.notes}</p>
                </div>
              </div>
            )}

            {buyer.tags && buyer.tags.length > 0 && (
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {buyer.tags.split(',').map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
                <div className="flex items-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${formatStatus(buyer.status)}`}>
                    {buyer.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Owner</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {buyer.owner.name || buyer.owner.email}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(buyer.updatedAt).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* History */}
            {buyer.history.length > 0 && (
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Changes</h3>
                  <div className="space-y-4">
                    {buyer.history.map((change) => (
                      <div key={change.id} className="border-l-4 border-blue-400 pl-4">
                        <div className="text-sm text-gray-900">
                          {change.diff.action === 'created' && 'Created buyer'}
                          {change.diff.action === 'updated' && 'Updated buyer'}
                          {change.diff.action === 'imported' && 'Imported buyer'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(change.changedAt).toLocaleString()}
                        </div>
                        {change.diff.fields && Object.keys(change.diff.fields).length > 0 && (
                          <div className="mt-2 text-xs text-gray-600">
                            Changed: {Object.keys(change.diff.fields).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
