import { useContext, useState } from 'react';
import { AuthContext } from '../../contexts/AuthContext.jsx';
import PerformanceCharts from './components/PerformanceCharts';

export default function DashboardPage() {
  const { user } = useContext(AuthContext);
  const [timeframe, setTimeframe] = useState('week');

  // Placeholder data - In real app, this would come from API
  const stats = {
    qualityScore: 98.5,
    eventsToday: 5,
    pendingInspections: 8,
    lowStockItems: 12,
    totalEvents: 156,
    completionRate: 94.2,
    qualityIssues: 3,
    equipmentUptime: 99.1,
    maintenanceRequests: 4,
    certificationStatus: 'Valid',
    lastAuditScore: 95,
    nextAuditDate: '2025-03-15',
  };

  const upcomingInspections = [
    { id: 1, item: 'Audio Equipment', due: '2025-02-08', priority: 'high' },
    { id: 2, item: 'Safety Equipment', due: '2025-02-09', priority: 'critical' },
    { id: 3, item: 'Lighting Systems', due: '2025-02-10', priority: 'medium' },
  ];

  const activityFeed = [
    { id: 1, type: 'inspection', message: 'Safety inspection completed', user: 'John Doe', time: '2 hours ago' },
    { id: 2, type: 'inventory', message: 'New equipment added', user: 'Jane Smith', time: '4 hours ago' },
    { id: 3, type: 'event', message: 'Event setup started', user: 'Mike Johnson', time: '5 hours ago' },
  ];

  const qualityIssues = [
    { id: 1, issue: 'Equipment Calibration', severity: 'high', status: 'in_progress', assignee: 'John Doe' },
    { id: 2, issue: 'Safety Protocol Update', severity: 'medium', status: 'pending', assignee: 'Jane Smith' },
    { id: 3, issue: 'Documentation Review', severity: 'low', status: 'completed', assignee: 'Mike Johnson' },
  ];

  const getTimeframeText = (tf) => {
    switch (tf) {
      case 'day': return 'Daily';
      case 'week': return 'Weekly';
      default: return 'Monthly';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Quality Control Dashboard</h1>
          <div className="flex items-center space-x-4">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <button className="btn btn-primary">Generate Report</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          {/* Welcome Message */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow-lg px-6 py-8 mb-6 text-white">
            <h2 className="text-2xl font-bold">
              Welcome back, {user?.firstName} {user?.lastName}!
            </h2>
            <p className="mt-2 text-primary-100">
              Quality Control Manager • {getTimeframeText(timeframe)} Overview
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-primary-100">Certification Status</p>
                <p className="font-semibold">{stats.certificationStatus}</p>
              </div>
              <div>
                <p className="text-primary-100">Next Audit Date</p>
                <p className="font-semibold">{stats.nextAuditDate}</p>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Quality Score</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.qualityScore}%</div>
                        <span className="ml-2 text-sm text-green-600">↑2.3%</span>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Equipment Uptime</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.equipmentUptime}%</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Quality Issues</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.qualityIssues}</div>
                        <span className="ml-2 text-sm text-yellow-600">Active</span>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Last Audit Score</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.lastAuditScore}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Charts */}
          <PerformanceCharts timeframe={timeframe} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Quality Issues */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Active Quality Issues</h3>
              </div>
              <div className="px-6 py-5">
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {qualityIssues.map((issue) => (
                      <li key={issue.id} className="py-5">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{issue.issue}</p>
                            <p className="text-sm text-gray-500 truncate">Assigned to: {issue.assignee}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                              {issue.severity}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                              {issue.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Upcoming Inspections */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Upcoming Inspections</h3>
              </div>
              <div className="px-6 py-5">
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {upcomingInspections.map((inspection) => (
                      <li key={inspection.id} className="py-5">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{inspection.item}</p>
                            <p className="text-sm text-gray-500 truncate">Due: {inspection.due}</p>
                          </div>
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(inspection.priority)}`}>
                              {inspection.priority}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
              </div>
              <div className="px-6 py-5">
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {activityFeed.map((activity) => (
                      <li key={activity.id} className="py-5">
                        <div className="flex space-x-3">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium">{activity.user}</h3>
                              <p className="text-sm text-gray-500">{activity.time}</p>
                            </div>
                            <p className="text-sm text-gray-500">{activity.message}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <a href="/quality/check" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <h4 className="text-base font-medium text-gray-900">Quality Check</h4>
                <p className="mt-1 text-sm text-gray-500">Perform quality inspection</p>
              </a>
              <a href="/quality/report" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <h4 className="text-base font-medium text-gray-900">Quality Report</h4>
                <p className="mt-1 text-sm text-gray-500">Generate quality analysis</p>
              </a>
              <a href="/maintenance/request" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <h4 className="text-base font-medium text-gray-900">Maintenance</h4>
                <p className="mt-1 text-sm text-gray-500">Schedule equipment maintenance</p>
              </a>
              <a href="/audit/prepare" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <h4 className="text-base font-medium text-gray-900">Audit Prep</h4>
                <p className="mt-1 text-sm text-gray-500">Prepare for quality audit</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
