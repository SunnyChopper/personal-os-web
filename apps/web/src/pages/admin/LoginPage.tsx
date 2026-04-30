import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/Auth';
import Button from '@/components/atoms/Button';
import { ROUTES } from '@/routes';
import { authService } from '@/lib/auth/auth.service';

type LoginView = 'signIn' | 'forgotRequest' | 'forgotConfirm';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [view, setView] = useState<LoginView>('signIn');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const initialCheckComplete = useRef(false);

  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[LoginPage] Component mounted');
    return () => {
      console.log('[LoginPage] Component unmounting');
    };
  }, []);

  // Track when initial auth check completes
  useEffect(() => {
    if (!loading && !initialCheckComplete.current) {
      initialCheckComplete.current = true;
      console.log('[LoginPage] Initial auth check completed');
    }
  }, [loading]);

  // Redirect authenticated users to dashboard immediately
  // This prevents the form from being shown and prevents form submission
  useEffect(() => {
    console.log('[LoginPage] useEffect triggered:', {
      loading,
      hasUser: !!user,
      userEmail: user?.email,
    });

    if (!loading && user) {
      const dest = user.role === 'spouse' ? ROUTES.sidecar.home : ROUTES.admin.dashboard;
      console.log('[LoginPage] User is authenticated, redirecting', dest);
      navigate(dest, { replace: true });
    }
  }, [user, loading, navigate]);

  // Show nothing during initial auth check or if user is authenticated (redirecting)
  // Don't hide during sign-in attempts (when initialCheckComplete is true)
  if ((loading && !initialCheckComplete.current) || (!loading && user)) {
    return null;
  }

  const goToSignIn = () => {
    setView('signIn');
    setLocalError(null);
    setSuccessMessage(null);
    setResetCode('');
    setNewPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent form submission if user is already authenticated
    if (user) {
      const dest = user.role === 'spouse' ? ROUTES.sidecar.home : ROUTES.admin.dashboard;
      console.log('[LoginPage] Form submitted but user is already authenticated, redirecting');
      navigate(dest, { replace: true });
      return;
    }

    setLocalError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await signIn(email, password);
      // Only navigate if sign in was successful
      // The auth context will update the user state, which will trigger the redirect in useEffect
      // Don't navigate immediately to avoid race conditions
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';

      // If user is already signed in, redirect instead of showing error
      if (
        errorMessage.includes('already signed in') ||
        errorMessage.includes('already a signed in')
      ) {
        const dest =
          authService.getStoredUser()?.role === 'spouse'
            ? ROUTES.sidecar.home
            : ROUTES.admin.dashboard;
        console.log('[LoginPage] User already signed in, redirecting', dest);
        navigate(dest, { replace: true });
        return;
      }

      setLocalError(errorMessage);
      console.error('[LoginPage] Authentication error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const response = await authService.requestPasswordReset(email);
      if (response.success && response.data) {
        setSuccessMessage(response.data.message);
        setResetCode('');
        setNewPassword('');
        setView('forgotConfirm');
      } else {
        setLocalError(response.error?.message ?? 'Could not send reset code.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const response = await authService.confirmPasswordReset({
        email,
        confirmationCode: resetCode,
        newPassword,
      });
      if (response.success && response.data) {
        setPassword('');
        setResetCode('');
        setNewPassword('');
        setView('signIn');
        setSuccessMessage(response.data.message);
      } else {
        setLocalError(response.error?.message ?? 'Could not reset password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const linkClass =
    'text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {view === 'signIn' && 'Welcome Back'}
            {view === 'forgotRequest' && 'Reset password'}
            {view === 'forgotConfirm' && 'Choose a new password'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {view === 'signIn' && 'Sign in to access Personal OS'}
            {view === 'forgotRequest' && "Enter your email and we'll send you a verification code."}
            {view === 'forgotConfirm' && 'Enter the code from your email and your new password.'}
          </p>
        </div>

        {view === 'signIn' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  className={linkClass}
                  disabled={isLoading}
                  onClick={() => {
                    setView('forgotRequest');
                    setLocalError(null);
                    setSuccessMessage(null);
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {successMessage && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            {localError && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {localError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        )}

        {view === 'forgotRequest' && (
          <form onSubmit={handleSendResetCode} className="space-y-6">
            <div>
              <label
                htmlFor="reset-email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="reset-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>

            {localError && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {localError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send code'}
            </Button>

            <div className="text-center">
              <button type="button" className={linkClass} onClick={goToSignIn} disabled={isLoading}>
                Back to sign in
              </button>
            </div>
          </form>
        )}

        {view === 'forgotConfirm' && (
          <form onSubmit={handleConfirmReset} className="space-y-6">
            {successMessage && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            <div>
              <label
                htmlFor="email-readonly"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email-readonly"
                value={email}
                readOnly
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300"
              />
            </div>

            <div>
              <label
                htmlFor="reset-code"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Verification code
              </label>
              <input
                type="text"
                id="reset-code"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter code from email"
                required
                autoComplete="one-time-code"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                New password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded p-1"
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  disabled={isLoading}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {localError && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {localError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Resetting...' : 'Reset password'}
            </Button>

            <div className="text-center">
              <button type="button" className={linkClass} onClick={goToSignIn} disabled={isLoading}>
                Back to sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
