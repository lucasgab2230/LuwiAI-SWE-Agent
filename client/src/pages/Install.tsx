import { useState, useEffect } from 'react';
import { Copy, Check, GitBranch, Key, Shield, ExternalLink, Loader2, Terminal } from 'lucide-react';
import { api } from '../services/api';

interface WorkflowFile {
  path: string;
  content: string;
}

interface SecretInfo {
  name: string;
  description: string;
  required: boolean;
}

function CodeBlock({ content, filename }: { content: string; filename: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-gray-800">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800/50 border-b border-gray-800">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Terminal size={14} />
          {filename}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-500" />
              Copied
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-sm text-gray-300 overflow-x-auto font-mono leading-relaxed bg-gray-950">
        {content}
      </pre>
    </div>
  );
}

function StepCard({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-lg bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm font-bold shrink-0">
          {number}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Install() {
  const [workflowFiles, setWorkflowFiles] = useState<WorkflowFile[]>([]);
  const [secrets, setSecrets] = useState<SecretInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    api.workflow
      .install()
      .then((data) => {
        setWorkflowFiles(data.files);
        setSecrets(data.secrets);
        if (data.files.length > 0) {
          setActiveTab(data.files[0].path);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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
        <p className="text-red-500 mb-2">Failed to load workflow files</p>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Install Workflow</h1>
        <p className="text-gray-400">
          Install the LuwiAI SWE Agent automation workflow in your GitHub repository.
          Follow the steps below to enable automatic code reviews, PR suggestions, and issue handling.
        </p>
      </div>

      <div className="space-y-4">
        <StepCard number={1} title="Create the workflow files in your repository">
          <p className="text-sm text-gray-400 mb-4">
            Add the following files to your repository. The workflow will:</p>
          <ul className="text-sm text-gray-400 mb-4 space-y-1.5 list-disc list-inside">
            <li>Run code reviews automatically on new pull requests</li>
            <li>Respond when you mention <code className="text-primary-400">@luwiai-swe-agent</code> in issues with implementation guidance</li>
            <li>Respond when you mention <code className="text-primary-400">@luwiai-swe-agent</code> in PRs (provides improvement suggestions)</li>
          </ul>

          <div className="space-y-3 mb-4">
            <div className="flex gap-2 flex-wrap">
              {workflowFiles.map((file) => (
                <button
                  key={file.path}
                  onClick={() => setActiveTab(file.path)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === file.path
                      ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700'
                  }`}
                >
                  {file.path}
                </button>
              ))}
            </div>
          </div>

          {workflowFiles.map((file) => (
            activeTab === file.path && (
              <CodeBlock key={file.path} content={file.content} filename={file.path} />
            )
          ))}

          <p className="text-xs text-gray-600 mt-3">
            These files go into the <code className="text-gray-400">.github/</code> directory at the root of your repository.
          </p>
        </StepCard>

        <StepCard number={2} title="Add repository secrets">
          <p className="text-sm text-gray-400 mb-4">
            Go to your repository on GitHub, navigate to <strong className="text-gray-300">Settings → Secrets and variables → Actions</strong>, and add the following secrets:
          </p>

          <div className="space-y-3">
            {secrets.map((secret) => (
              <div
                key={secret.name}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-800"
              >
                <Key size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-primary-400">{secret.name}</code>
                    {secret.required && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400">
                        required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{secret.description}</p>
                </div>
              </div>
            ))}
          </div>

          <a
            href="https://github.com/settings/secrets"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary inline-flex items-center gap-2 mt-4 text-sm"
          >
            <Shield size={16} />
            Open GitHub Secrets
            <ExternalLink size={14} />
          </a>
        </StepCard>

        <StepCard number={3} title="Commit and push">
          <p className="text-sm text-gray-400 mb-4">
            Commit the files to your repository and push to the default branch (usually <code className="text-gray-300">main</code> or <code className="text-gray-300">master</code>).
          </p>

          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-800">
            <pre className="text-sm text-gray-300 font-mono">
              {`git add .github/
git commit -m "chore: add LuwiAI SWE Agent automation"
git push origin main`}
            </pre>
          </div>
        </StepCard>

        <StepCard number={4} title="Test the integration">
          <p className="text-sm text-gray-400 mb-4">
            Once the workflow is installed, test it by doing one of the following:
          </p>

          <ul className="text-sm text-gray-400 space-y-3">
            <li className="flex items-start gap-3">
              <GitBranch size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <span><strong className="text-gray-300">Open a PR</strong> — The agent will automatically post a code review as a comment on the pull request.</span>
            </li>
            <li className="flex items-start gap-3">
              <Terminal size={16} className="text-green-500 shrink-0 mt-0.5" />
              <span><strong className="text-gray-300">Comment on an issue</strong> — Write a comment containing <code className="text-primary-400">@luwiai-swe-agent</code> and the agent will reply with implementation guidance.</span>
            </li>
            <li className="flex items-start gap-3">
              <Terminal size={16} className="text-purple-500 shrink-0 mt-0.5" />
              <span><strong className="text-gray-300">Comment on a PR</strong> — Write a comment containing <code className="text-primary-400">@luwiai-swe-agent</code> and the agent will provide improvement suggestions.</span>
            </li>
          </ul>
        </StepCard>
      </div>
    </div>
  );
}
