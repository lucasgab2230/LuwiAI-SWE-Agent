import { Bot, Github } from 'lucide-react';

export default function Login({ loginUrl }: { loginUrl: string }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-2xl mb-6">
            <Bot size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">LuwiAI</h1>
          <p className="text-gray-400 text-lg">
            Cloud-powered AI coding agent with GitHub integration
          </p>
        </div>

        <div className="card space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Get Started</h2>
            <p className="text-gray-400 text-sm">
              Sign in with GitHub to start using the AI coding agent. We'll
              access your repositories to help you review, generate, and
              improve code.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Code review & analysis
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Automated bug fixing
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              PR summaries & refactoring
            </div>
          </div>

          <a
            href={loginUrl}
            className="btn-primary w-full flex items-center justify-center gap-3 text-lg py-3"
          >
            <Github size={24} />
            Continue with GitHub
          </a>

          <p className="text-xs text-gray-600 text-center">
            By continuing, you agree to let LuwiAI access your GitHub
            repositories for code analysis and improvement.
          </p>
        </div>
      </div>
    </div>
  );
}