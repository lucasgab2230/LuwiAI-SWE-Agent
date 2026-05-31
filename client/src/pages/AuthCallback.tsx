import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function AuthCallback({ onLogin }: { onLogin: (code: string) => Promise<void> }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setError('No authorization code received from GitHub');
      return;
    }

    onLogin(code)
      .then(() => navigate('/', { replace: true }))
      .catch((err) => {
        setError(err.message || 'Authentication failed');
      });
  }, [searchParams, onLogin, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h2 className="text-xl font-semibold text-white mb-2">Authentication Failed</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 size={48} className="text-primary-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-lg">Authenticating with GitHub...</p>
      </div>
    </div>
  );
}