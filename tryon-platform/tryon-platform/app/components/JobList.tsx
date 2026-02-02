'use client';

import { Job } from '@/types';

interface JobListProps {
  jobs: Job[];
  onJobSelect: (job: Job) => void;
}

const getStatusColor = (status: Job['status']) => {
  switch (status) {
    case 'queued':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: Job['status']) => {
  switch (status) {
    case 'queued':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'processing':
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    case 'completed':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'failed':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

export default function JobList({ jobs, onJobSelect }: JobListProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const completedTasksCount = (job: Job) => {
    return job.tasks.filter(task => task.status === 'completed').length;
  };

  const totalTasksCount = (job: Job) => {
    return job.tasks.length;
  };

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <div
          key={job.id}
          onClick={() => onJobSelect(job)}
          className="bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                {getStatusIcon(job.status)}
                <span className="ml-1 capitalize">{job.status}</span>
              </span>
              <span className="text-sm text-gray-500">
                Job #{job.id.slice(-8)}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {formatDate(job.createdAt)}
            </span>
          </div>

          <div className="text-sm text-gray-600">
            {completedTasksCount(job)} of {totalTasksCount(job)} photos processed
          </div>

          {job.status === 'processing' && (
            <div className="mt-2">
              <div className="bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${totalTasksCount(job) > 0 ? (completedTasksCount(job) / totalTasksCount(job)) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}