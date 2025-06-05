
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, LogOut, User, Shield } from 'lucide-react';
import { oauthService } from '@/services/oauthService';
import { tokenManager } from '@/services/tokenManager';

interface AuthButtonProps {
  onAuthChange: (isAuthenticated: boolean) => void;
}

const AuthButton: React.FC<AuthButtonProps> = ({ onAuthChange }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check initial auth state
    const authState = tokenManager.isAuthenticated();
    setIsAuthenticated(authState);
    onAuthChange(authState);

    // Listen for token changes
    tokenManager.onTokenChange(() => {
      const newAuthState = tokenManager.isAuthenticated();
      setIsAuthenticated(newAuthState);
      onAuthChange(newAuthState);
    });

    // Handle OAuth callback if we're on the callback route
    const handleCallback = async () => {
      if (window.location.pathname === '/callback' || window.location.search.includes('code=')) {
        setIsLoading(true);
        setError(null);
        
        try {
          const tokens = await oauthService.handleCallback();
          tokenManager.setToken(tokens.accessToken);
          
          // Clear URL parameters and redirect to home
          window.history.replaceState({}, document.title, '/');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Authentication failed');
          console.error('OAuth callback error:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleCallback();
  }, [onAuthChange]);

  const handleLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Ensure we're doing a full page redirect, not iframe
      console.log('Initiating OAuth login with full page redirect...');
      oauthService.initiateLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    tokenManager.clearToken();
    setError(null);
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 animate-spin" />
            <span>Authenticating...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Okta Authentication</span>
        </CardTitle>
        <CardDescription>
          {isAuthenticated ? 'Successfully authenticated with Okta' : 'Login with your Okta credentials'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
        
        {isAuthenticated ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-green-600">
              <User className="h-4 w-4" />
              <span className="text-sm">Authenticated</span>
            </div>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleLogin} 
            className="w-full"
            disabled={isLoading}
            type="button"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Login with Okta
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthButton;
