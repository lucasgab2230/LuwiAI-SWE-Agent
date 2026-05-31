import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Loader2, Clock, CheckCircle, XCircle, Loader as ProcessingIcon } from 'lucide-react';
import { api } from '../services/api';
import type { AgentJob } from '../types';
import { AgentJobStatus } from '../types';

const statusConfig = {
  [AgentJobStatus.PENDING]: {
    icon: Clock,
    label: 'Pending',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  [AgentJobStatus.PROCESSING]: {
    icon: ProcessingIcon,
    label: 'Processing',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  [AgentJobStatus.COMPLETED]: {
    icon: CheckCircle,
    label: 'Completed',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
  [AgentJobStatus.FAILED]: {
    icon: XCircle,
    label: 'Failed',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
};

function JobCard({ job }: { job: AgentJob }) {
  const config = statusConfig[job.status];
  const StatusIcon = config.icon;

  return (
    <div className={`card border ${config.border}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
            <StatusIcon size={20} className={config.color} />
          </div>
          <div>
            <h3 className="font-semibold text-white capitalize">
              {job.type.replace(/_/g, ' ')}
            </h3>
            <p className={`text-xs font-medium ${config.color}`}>{config.label}</p>
          </div>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(job.createdAt).toLocaleString()}
        </span>
      </div>

      {job.status === AgentJobStatus.COMPLETED && !!job.output?.result && (
        <div className="mt-3 p-4 rounded-lg bg-gray-800/50">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans line-clamp-6">
            {String(job.output.result)}
          </pre>
        </div>
      )}

      {job.status === AgentJobStatus.FAILED && job.error && (
        <div className="mt-3 p-4 rounded-lg bg-red-500/5 border border-red-500/10">
          <p className="text-sm text-red-400">{job.error}</p>
        </div>
      )}

      {job.status === AgentJobStatus.PROCESSING && (
        <div className="mt-3 flex items-center gap-2 text-sm text-blue-400">
          <Loader2 size={14} className="animate-spin" />
          Processing your request...
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-600">
        <span>ID: {job.id.slice(0, 8)}...</span>
        <span>
          {job.updatedAt !== job.createdAt
            ? `Completed ${new Date(job.updatedAt).toLocaleTimeString()}`
            : `Created ${new Date(job.createdAt).toLocaleTimeString()}`}
        </span>
      </div>
    </div>
  );
}

export default function Jobs() {
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AgentJobStatus | 'all'>('all');

  useEffect(() => {
    api.jobs
      .list()
      .then((data) => setJobs(data.jobs))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? jobs : jobs.filter((j) => j.status === filter);

  const counts = {
    all: jobs.length,
    [AgentJobStatus.PENDING]: jobs.filter((j) => j.status === AgentJobStatus.PENDING).length,
    [AgentJobStatus.PROCESSING]: jobs.filter((j) => j.status === AgentJobStatus.PROCESSING).length,
    [AgentJobStatus.COMPLETED]: jobs.filter((j) => j.status === AgentJobStatus.COMPLETED).length,
    [AgentJobStatus.FAILED]: jobs.filter((j) => j.status === AgentJobStatus.FAILED).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Jobs</h1>
          <p className="text-gray-400">Track your AI agent tasks</p>
        </div>
        <Link to="/jobs/new" className="btn-primary flex items-center gap-2">
          <PlusCircle size={18} />
          New Job
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', ...Object.values(AgentJobStatus)] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? status === 'all'
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                  : `${statusConfig[status].bg} ${statusConfig[status].color} border ${statusConfig[status].border}`
                : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-1.5 opacity-70">({counts[status]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="text-primary-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <p className="text-red-500 mb-2">Failed to load jobs</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Clock size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            {filter !== 'all' ? 'No jobs with this status' : 'No jobs yet'}
          </p>
          <Link to="/jobs/new" className="btn-primary">
            Create your first job
          </Link>
        </div>
      )}
    </div>
  );
}