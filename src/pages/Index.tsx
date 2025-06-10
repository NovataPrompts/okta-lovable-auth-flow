import React, { useState, useEffect } from 'react';
import AuthButton from '@/components/AuthButton';
import ApiTestPanel from '@/components/ApiTestPanel';
import ConfigPanel from '@/components/ConfigPanel';
import { Separator } from '@/components/ui/separator';
import { oauthService } from '@/services/oauthService';
import { tokenManager } from '@/services/tokenManager';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthChange = (authState: boolean) => {
    setIsAuthenticated(authState);
  };

  useEffect(() => {
    // Check for OAuth callback parameters on page load
    const urlParams = new URLSearchParams(window.location.search);
    const hasCode = urlParams.has('code');
    const hasState = urlParams.has('state');
    
    console.log('Index.tsx useEffect - Checking for OAuth parameters:', {
      hasCode,
      hasState,
      currentUrl: window.location.href,
      searchParams: window.location.search
    });

    // If we have OAuth parameters, handle the callback
    if (hasCode && hasState) {
      console.log('Index.tsx - OAuth parameters detected, calling handleCallback');
      console.log('Calling handleCallback'); // Added as requested
      
      const processCallback = async () => {
        try {
          const tokens = await oauthService.handleCallback();
          console.log('Index.tsx - OAuth callback successful, storing token');
          tokenManager.setToken(tokens.accessToken);
          
          // Clear URL parameters after successful authentication
          window.history.replaceState({}, document.title, '/');
          console.log('Index.tsx - URL cleaned, redirected to home');
        } catch (error) {
          console.error('Index.tsx - OAuth callback failed:', error);
        }
      };

      processCallback();
    }

    // Set initial auth state
    const authState = tokenManager.isAuthenticated();
    setIsAuthenticated(authState);
    handleAuthChange(authState);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Okta OAuth 2.0 + PKCE Integration
          </h1>
          <p className="text-lg text-gray-600">
            Secure authentication with Novata API integration
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Auth & Config */}
          <div className="space-y-6">
            <AuthButton onAuthChange={handleAuthChange} />
            <ConfigPanel />
          </div>

          {/* Right Column - API Testing */}
          <div className="space-y-6">
            <ApiTestPanel isAuthenticated={isAuthenticated} />
          </div>
        </div>

        <Separator />

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Built with React + TypeScript • OAuth 2.0 + PKCE • In-Memory Token Storage
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
