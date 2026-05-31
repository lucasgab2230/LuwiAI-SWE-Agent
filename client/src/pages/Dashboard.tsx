import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Code2, Bug, RefreshCw, FileText, GitPullRequest, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import type { AgentJob } from '../types';
import { AgentJobStatus } from '../types';

const features = [
  {
    icon: Code2,
    title: 'Code Review',
    description: 'Automated PR reviews with detailed feedback on bugs, security, and best practices.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    type: 'code_review',
  },
  {
    icon: FileText,
    title: 'Code Generation',
    description: 'Generate production-ready code from natural language descriptions.',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    type: 'code_generation',
  },
  {
    icon: Bug,
    title: 'Bug Fixing',
    description: 'Analyze errors and automatically generate fixes for your codebase.',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    type: 'bug_fix',
  },
  {
    icon: RefreshCw,
    title: 'Refactoring',
    description: 'Improve code structure and quality while preserving behavior.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    type: 'refactor',
  },
  {
    icon: Sparkles,
    title: 'Code Explanation',
    description: 'Get comprehensive explanations of complex code and algorithms.',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    type: 'explain_code',
  },
  {
    icon: GitPullRequest,
    title: 'PR Summaries',
    description: 'Automatic pull request summaries and changelog generation.',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    type: 'pr_summary',
  },
];

const statusColors: Record<AgentJobStatus, string> = {
  [AgentJobStatus.PENDING]: 'text-yellow-500 bg-yellow-500/10',
  [AgentJobStatus.PROCESSING]: 'text-blue-500 bg-blue-500/10',
  [AgentJobStatus.COMPLETED]: 'text-green-500 bg-green-500/10',
  [AgentJobStatus.FAILED]: 'text-red-500 bg-red-500/10',
};

function JobRow({ job }: { job: AgentJob }) {
  return (
    <Link
      to={`/jobs`}
      className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[job.status]}`}>
          {job.status}
        </span>
        <span className="text-sm text-gray-300 font-medium truncate">
          {job.type.replace(/_/g, ' ')}
        </span>
      </div>
      <span className="text-xs text-gray-500 shrink-0">
        {new Date(job.createdAt).toLocaleDateString()}
      </span>
    </Link>
  );
}

export default function Dashboard() {
  const [recentJobs, setRecentJobs] = useState<AgentJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.jobs
      .list()
      .then((data) => setRecentJobs(data.jobs.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">
          Welcome to LuwiAI — your AI-powered coding assistant
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => (
          <Link
            key={feature.type}
            to={`/jobs/new?type=${feature.type}`}
            className="card hover:border-primary-600/50 transition-colors group"
          >
            <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
              <feature.icon size={24} className={feature.color} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
              {feature.title}
            </h3>
            <p className="text-sm text-gray-400">{feature.description}</p>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Recent Jobs</h2>
          <Link to="/jobs" className="text-sm text-primary-500 hover:text-primary-400 transition-colors">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="text-gray-500 animate-spin" />
          </div>
        ) : recentJobs.length > 0 ? (
          <div className="space-y-2">
            {recentJobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No jobs yet</p>
            <Link to="/jobs/new" className="btn-primary">
              Create your first job
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}