
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Globe, Key, Shield } from 'lucide-react';
import { oauthService } from '@/services/oauthService';

const ConfigPanel: React.FC = () => {
  const redirectUri = oauthService.getRedirectUri();
  const clientId = oauthService.getClientId();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>OAuth Configuration (Demo)</span>
        </CardTitle>
        <CardDescription>
          Current OAuth 2.0 Authorization Code + PKCE configuration for demo environment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Okta Demo Issuer</span>
            </div>
            <code className="block text-xs bg-gray-100 p-2 rounded border">
              https://demo-okta.novata.com/oauth2/default
            </code>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Key className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Demo Client ID</span>
            </div>
            <code className="block text-xs bg-gray-100 p-2 rounded border">
              {clientId}
            </code>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Redirect URI</span>
            </div>
            <code className="block text-xs bg-gray-100 p-2 rounded border">
              {redirectUri}
            </code>
            <p className="text-xs text-muted-foreground">
              Fixed redirect URI for production deployment
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-medium">Security Features</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Authorization Code + PKCE</Badge>
              <Badge variant="secondary">S256 Challenge</Badge>
              <Badge variant="secondary">No Client Secret</Badge>
              <Badge variant="secondary">In-Memory Tokens</Badge>
              <Badge variant="secondary">State Validation</Badge>
              <Badge variant="secondary">Lovable SSO Devs</Badge>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Demo Environment Setup</h4>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            <li>Demo client ID configured for SPA (Single Page Application)</li>
            <li>Fixed redirect URI set for production deployment</li>
            <li>Using secure Authorization Code + PKCE flow (response_type=code)</li>
            <li>Scopes: openid, profile, email explicitly requested</li>
            <li>PKCE S256 challenge method for enhanced security</li>
            <li>App assigned to "Lovable SSO Devs" group with matching access policy</li>
            <li>Tokens issued by demo-okta.novata.com are accepted by sandbox API</li>
            <li>CORS configured for pages.beta.novata.dev domain</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfigPanel;
