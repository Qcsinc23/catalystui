import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext.jsx';
import CommentList from '../../../components/comments/CommentList';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const [eventResponse, inspectionsResponse] = await Promise.all([
        fetch(`/api/events/${id}`, {
          credentials: 'include'
        }),
        fetch(`/api/events/${id}/inspections`, {
          credentials: 'include'
        })
      ]);

      if (!eventResponse.ok) {
        throw new Error('Failed to fetch event details');
      }

      if (!inspectionsResponse.ok) {
        throw new Error('Failed to fetch inspections');
      }

      const [eventData, inspectionsData] = await Promise.all([
        eventResponse.json(),
        inspectionsResponse.json()
      ]);

      setEvent({
        ...eventData.data,
        inspections: inspectionsData.data
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to cancel this event?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to cancel event');
      }

      navigate('/events');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInspectionStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getCompletionRate = (total, completed) => {
    if (total <= 0) return 'N/A';
    return `${Math.round((completed / total) * 100)}%`;
  };

  const hasPermission = (role) => ['admin', 'manager'].includes(role);

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
            <h3 className="text-sm font-medium text-red-800">Error loading event</h3>
            <p className="text-sm text-red-700 mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const canEdit = hasPermission(user?.role);
  const canAddInspection = hasPermission(user?.role) && !['completed', 'cancelled'].includes(event.status);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{event.title}</h1>
            <p className="mt-1 text-sm text-gray-500">{event.location}</p>
          </div>
          <div className="flex space-x-3">
            {canEdit && (
              <>
                <button
                  onClick={() => navigate(`/events/${id}/edit`)}
                  className="btn btn-secondary"
                >
                  Edit
                </button>
                {event.status !== 'cancelled' && (
                  <button
                    onClick={handleDelete}
                    className="btn btn-danger"
                  >
                    Cancel Event
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Status and Risk Level */}
        <div className="flex space-x-4 mb-6">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
            {event.status.replace('_', ' ')}
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(event.riskLevel)}`}>
            {event.riskLevel} risk
          </span>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Event Details</h2>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{event.description}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{event.type}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quality Requirements</h2>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{event.qualityRequirements}</p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Required Inspections</h2>
                {canAddInspection && (
                  <button
                    onClick={() => navigate(`/events/${id}/inspections/new`)}
                    className="btn btn-primary btn-sm"
                  >
                    Add Inspection
                  </button>
                )}
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{event.requiredInspections}</p>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Inspection Status</h2>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Inspections</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">{event.inspectionsCount}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Completed Inspections</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">{event.completedInspectionsCount}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Completion Rate</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {getCompletionRate(event.inspectionsCount, event.completedInspectionsCount)}
                  </dd>
                </div>
              </dl>
            </div>
  
            {/* Inspections List */}
            <div className="mt-6">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Inspections</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {event.inspections?.length > 0 ? (
                    event.inspections.map((inspection) => (
                      <div
                        key={inspection.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/events/${id}/inspections/${inspection.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {inspection.type}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              Assigned to: {inspection.assignedUserName}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex flex-col items-end">
                              <p className="text-sm text-gray-500">Due: {new Date(inspection.dueDate).toLocaleDateString()}</p>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInspectionStatusColor(inspection.status)}`}>
                              {inspection.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No inspections found
                    </div>
                  )}
                </div>
              </div>
    
              {/* Comments Section */}
              <div className="mt-6">
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Comments</h2>
                  <CommentList entityType="event" entityId={id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
