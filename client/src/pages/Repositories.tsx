import { useEffect, useState } from 'react';
import { GitBranch, Globe, Lock, ExternalLink, Loader2, BookOpen } from 'lucide-react';
import { api } from '../services/api';
import type { Repository } from '../types';

const languageColors: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-500',
  Python: 'bg-green-500',
  Rust: 'bg-orange-500',
  Go: 'bg-cyan-500',
  Java: 'bg-red-500',
  Ruby: 'bg-red-600',
  'C++': 'bg-pink-500',
  C: 'bg-gray-500',
  HTML: 'bg-orange-600',
  CSS: 'bg-purple-500',
  Shell: 'bg-emerald-500',
  Dockerfile: 'bg-blue-400',
};

function LanguageBadge({ language }: { language: string | null }) {
  if (!language) return null;
  const color = languageColors[language] || 'bg-gray-500';
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-400">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      {language}
    </span>
  );
}

function RepoCard({ repo }: { repo: Repository }) {
  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="card hover:border-primary-600/50 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <GitBranch size={18} className="text-gray-500 shrink-0 mt-0.5" />
          <h3 className="font-semibold text-white truncate group-hover:text-primary-400 transition-colors">
            {repo.name}
          </h3>
        </div>
        {repo.private ? (
          <Lock size={16} className="text-yellow-500 shrink-0" />
        ) : (
          <Globe size={16} className="text-green-500 shrink-0" />
        )}
      </div>

      {repo.description && (
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{repo.description}</p>
      )}

      <div className="flex items-center gap-4">
        <LanguageBadge language={repo.language} />
        <span className="text-xs text-gray-500">
          Updated {new Date(repo.updated_at).toLocaleDateString()}
        </span>
        <ExternalLink size={14} className="text-gray-600 ml-auto group-hover:text-primary-500 transition-colors" />
      </div>
    </a>
  );
}

export default function Repositories() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.repositories
      .list()
      .then((data) => setRepos(data.repositories))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={32} className="text-primary-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-500 mb-2">Failed to load repositories</p>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Repositories</h1>
          <p className="text-gray-400">Your GitHub repositories</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <BookOpen size={16} />
          {repos.length} repositories
        </div>
      </div>

      <input
        type="text"
        placeholder="Search repositories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field"
      />

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <BookOpen size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">
            {search ? 'No repositories match your search' : 'No repositories found'}
          </p>
        </div>
      )}
    </div>
  );
}