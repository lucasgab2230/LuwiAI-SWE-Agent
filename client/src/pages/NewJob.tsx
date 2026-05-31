import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Code2, Bug, RefreshCw, FileText, GitPullRequest, Sparkles, ArrowLeft, Loader2, Send } from 'lucide-react';
import { api } from '../services/api';
import { AgentJobType } from '../types';

const jobTypes = [
  {
    type: AgentJobType.CODE_REVIEW,
    icon: Code2,
    label: 'Code Review',
    description: 'Review code changes for bugs, security issues, and improvements',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    fields: [
      { name: 'code', label: 'Code to Review', type: 'textarea', placeholder: 'Paste the code or diff to review...' },
      { name: 'language', label: 'Programming Language', type: 'text', placeholder: 'e.g., TypeScript, Python, Rust' },
    ],
  },
  {
    type: AgentJobType.CODE_GENERATION,
    icon: FileText,
    label: 'Code Generation',
    description: 'Generate code from a natural language description',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    fields: [
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe what you want to build...' },
      { name: 'language', label: 'Target Language', type: 'text', placeholder: 'e.g., TypeScript, Python, Rust' },
    ],
  },
  {
    type: AgentJobType.BUG_FIX,
    icon: Bug,
    label: 'Bug Fixing',
    description: 'Analyze and fix bugs in your code',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    fields: [
      { name: 'code', label: 'Buggy Code', type: 'textarea', placeholder: 'Paste the code with the bug...' },
      { name: 'errorLog', label: 'Error Message / Log', type: 'textarea', placeholder: 'Paste any error logs...' },
      { name: 'language', label: 'Language', type: 'text', placeholder: 'e.g., TypeScript, Python' },
    ],
  },
  {
    type: AgentJobType.REFACTOR,
    icon: RefreshCw,
    label: 'Refactoring',
    description: 'Improve code structure and quality',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    fields: [
      { name: 'code', label: 'Code to Refactor', type: 'textarea', placeholder: 'Paste the code to refactor...' },
      { name: 'instructions', label: 'Refactoring Goals', type: 'textarea', placeholder: 'What aspects to improve? (performance, readability, etc.)' },
      { name: 'language', label: 'Language', type: 'text', placeholder: 'e.g., TypeScript, Python' },
    ],
  },
  {
    type: AgentJobType.EXPLAIN_CODE,
    icon: Sparkles,
    label: 'Code Explanation',
    description: 'Get a detailed explanation of complex code',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    fields: [
      { name: 'code', label: 'Code to Explain', type: 'textarea', placeholder: 'Paste the code you want explained...' },
      { name: 'language', label: 'Language', type: 'text', placeholder: 'e.g., TypeScript, Python' },
    ],
  },
  {
    type: AgentJobType.PR_SUMMARY,
    icon: GitPullRequest,
    label: 'PR Summary',
    description: 'Generate a summary of pull request changes',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    fields: [
      { name: 'diff', label: 'Diff / Changes', type: 'textarea', placeholder: 'Paste the PR diff...' },
      { name: 'title', label: 'PR Title', type: 'text', placeholder: 'Title of the pull request' },
      { name: 'description', label: 'PR Description', type: 'textarea', placeholder: 'Description of the pull request' },
    ],
  },
];

export default function NewJob() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedType = searchParams.get('type') as AgentJobType | null;

  const [selectedType, setSelectedType] = useState<AgentJobType | null>(preselectedType);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jobTypeConfig = jobTypes.find((j) => j.type === selectedType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    setSubmitting(true);
    setError(null);

    try {
      const input: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(formValues)) {
        input[key] = value;
      }

      await api.jobs.create(selectedType, input);
      navigate(`/jobs`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  if (!selectedType) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">New Job</h1>
          <p className="text-gray-400">Choose the type of task you want the AI agent to perform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobTypes.map((jobType) => {
            const Icon = jobType.icon;
            return (
              <button
                key={jobType.type}
                onClick={() => setSelectedType(jobType.type)}
                className="card hover:border-primary-600/50 transition-all text-left group"
              >
                <div className={`w-12 h-12 rounded-xl ${jobType.bg} flex items-center justify-center mb-4`}>
                  <Icon size={24} className={jobType.color} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                  {jobType.label}
                </h3>
                <p className="text-sm text-gray-400">{jobType.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const Icon = jobTypeConfig!.icon;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => {
            setSelectedType(null);
            setFormValues({});
            setError(null);
          }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to job types
        </button>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl ${jobTypeConfig!.bg} flex items-center justify-center`}>
            <Icon size={28} className={jobTypeConfig!.color} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{jobTypeConfig!.label}</h1>
            <p className="text-gray-400 text-sm">{jobTypeConfig!.description}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {jobTypeConfig!.fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={formValues[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                rows={5}
                className="input-field resize-none"
                required
              />
            ) : (
              <input
                type="text"
                value={formValues[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className="input-field"
                required
              />
            )}
          </div>
        ))}

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send size={18} />
              Submit Job
            </>
          )}
        </button>
      </form>
    </div>
  );
}