import { useState } from 'react';
import { User } from 'firebase/auth';
import { signInWithGoogle, signOut, UserProfile } from '../lib/firebase';

interface UserAvatarProps {
  user: User | null;
  userProfile: UserProfile | null;
  onManageUsers?: () => void;
}

export default function UserAvatar({ user, userProfile, onManageUsers }: UserAvatarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
      setError('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signOut();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="relative">
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
        {error && (
          <div className="absolute top-full mt-2 w-48 text-sm text-red-600 bg-red-50 p-2 rounded-md">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center focus:outline-none"
        disabled={isLoading}
      >
        <img
          src={user.photoURL || '/default-avatar.png'}
          alt={user.displayName || 'User avatar'}
          className="w-8 h-8 rounded-full border-2 border-gray-200"
        />
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-gray-700 border-b">
              <div>{user.displayName}</div>
              <div className="text-xs text-gray-500 mt-1">
                Role: {userProfile?.role || 'user'}
              </div>
            </div>
            {userProfile?.role === 'admin' && onManageUsers && (
              <button
                onClick={() => {
                  onManageUsers();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Manage Users
              </button>
            )}
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
          {error && (
            <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-t">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
