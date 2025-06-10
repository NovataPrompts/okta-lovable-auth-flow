
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, LogOut, User, Shield, AlertCircle, ExternalLink } from 'lucide-react';
import { oauthService } from '@/services/oauthService';
import { tokenManager } from '@/services/tokenManager';
import MfaGuide from './MfaGuide';

interface AuthButtonProps {
  onAuthChange: (isAuthenticated: boolean) => void;
}

const AuthButton: React.FC<AuthButtonProps> = ({ onAuthChange }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMfaGuide, setShowMfaGuide] = useState(false);

  // Check if we're in an iframe (Lovable environment)
  const isInIframe = () => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  };

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
          console.log('Processing OAuth callback...');
          const tokens = await oauthService.handleCallback();
          tokenManager.setToken(tokens.accessToken);
          
          // Clear URL parameters and redirect to home
          window.history.replaceState({}, document.title, '/');
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
          setError(errorMessage);
          
          // Show MFA guide if it's an MFA-related error
          if (errorMessage.includes('MFA') || errorMessage.includes('multi-factor')) {
            setShowMfaGuide(true);
          }
          
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
    setShowMfaGuide(false);
    
    try {
      // Ensure we're doing a full page redirect, not iframe
      console.log('Initiating OAuth login with MFA support...');
      oauthService.initiateLogin();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      setIsLoading(false);
      
      // Show MFA guide if it's an MFA-related error
      if (errorMessage.includes('MFA') || errorMessage.includes('multi-factor')) {
        setShowMfaGuide(true);
      }
    }
  };

  const handleLogout = () => {
    tokenManager.clearToken();
    setError(null);
    setShowMfaGuide(false);
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

  // Show MFA guide if requested
  if (showMfaGuide && !isAuthenticated) {
    return (
      <div className="space-y-4">
        <MfaGuide />
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Button 
              onClick={handleLogin} 
              className="w-full"
              disabled={isLoading}
              type="button"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Try Login Again
            </Button>
          </CardContent>
        </Card>
      </div>
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
          {isAuthenticated ? 'Successfully authenticated with Okta' : 'Login with your Okta credentials (MFA required)'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show iframe warning */}
        {isInIframe() && !isAuthenticated && (
          <div className="p-3 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md flex items-start space-x-2">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Lovable Environment Detected</div>
              <div className="text-xs mt-1">OAuth login will open in a new tab for security.</div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Authentication Error</div>
              <div className="text-xs mt-1">{error}</div>
              {(error.includes('MFA') || error.includes('Policy')) && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-xs underline mt-1"
                  onClick={() => setShowMfaGuide(true)}
                >
                  Show MFA Help
                </Button>
              )}
            </div>
          </div>
        )}
        
        {isAuthenticated ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-green-600">
              <User className="h-4 w-4" />
              <span className="text-sm">Authenticated with MFA</span>
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
            {isInIframe() ? 'Login with Okta (Opens New Tab)' : 'Login with Okta (MFA)'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthButton;
