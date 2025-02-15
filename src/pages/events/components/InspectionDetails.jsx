import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import CommentList from '../../../components/comments/CommentList';

export default function InspectionDetails() {
  const { eventId, inspectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchInspection();
  }, [inspectionId]);

  const fetchInspection = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/inspections/${inspectionId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch inspection details');
      }

      const data = await response.json();
      setInspection(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/events/${eventId}/inspections/${inspectionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update inspection status');
      }

      await fetchInspection();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const hasPermission = (userRole, assignedUserId) => {
    return ['admin', 'manager'].includes(userRole) || assignedUserId === user?.id;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading inspection</h3>
            <p className="text-sm text-red-700 mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return null;
  }

  const canEdit = hasPermission(user?.role, inspection.assignedTo);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Inspection Details</h1>
            <p className="mt-1 text-sm text-gray-500">Type: {inspection.type}</p>
          </div>
          <div className="flex space-x-3">
            {canEdit && inspection.status !== 'completed' && (
              <button
                onClick={() => navigate(`/events/${eventId}/inspections/${inspectionId}/edit`)}
                className="btn btn-secondary"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(inspection.status)}`}>
            {inspection.status.replace('_', ' ')}
          </span>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {inspection.assignedUser?.firstName} {inspection.assignedUser?.lastName}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(inspection.dueDate).toLocaleDateString()}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {inspection.description}
                </dd>
              </div>

              {inspection.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {inspection.notes}
                  </dd>
                </div>
              )}

              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Created By</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {inspection.createdByUser?.firstName} {inspection.createdByUser?.lastName} on{' '}
                  {new Date(inspection.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Status Update Section */}
          {canEdit && inspection.status !== 'completed' && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Update Status</h3>
                <div className="flex space-x-3">
                  {inspection.status === 'pending' && (
                    <button
                      onClick={() => updateStatus('in_progress')}
                      disabled={updating}
                      className="btn btn-secondary btn-sm"
                    >
                      Start Inspection
                    </button>
                  )}
                  {inspection.status === 'in_progress' && (
                    <>
                      <button
                        onClick={() => updateStatus('completed')}
                        disabled={updating}
                        className="btn btn-success btn-sm"
                      >
                        Mark Complete
                      </button>
                      <button
                        onClick={() => updateStatus('failed')}
                        disabled={updating}
                        className="btn btn-danger btn-sm"
                      >
                        Mark Failed
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="mt-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Comments</h2>
            <CommentList entityType="inspection" entityId={inspectionId} />
          </div>
        </div>
      </div>
    </div>
  );
}
