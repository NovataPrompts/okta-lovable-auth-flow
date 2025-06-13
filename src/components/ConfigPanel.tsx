
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
          <span>OAuth Configuration (Sandbox)</span>
        </CardTitle>
        <CardDescription>
          Current OAuth 2.0 + PKCE configuration for sandbox environment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Okta Sandbox Issuer</span>
            </div>
            <code className="block text-xs bg-gray-100 p-2 rounded border">
              https://novatacimsandbox.oktapreview.com/oauth2/default
            </code>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Key className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Sandbox Client ID</span>
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
              Configure this URI in your Okta sandbox application settings
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-medium">Security Features</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">PKCE (S256)</Badge>
              <Badge variant="secondary">No Client Secret</Badge>
              <Badge variant="secondary">In-Memory Tokens</Badge>
              <Badge variant="secondary">State Validation</Badge>
              <Badge variant="secondary">MFA Required</Badge>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Sandbox Setup Instructions</h4>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            <li>Sandbox client ID is configured</li>
            <li>Add the redirect URI to your Okta sandbox app configuration</li>
            <li>Ensure the Okta app is configured as a "Public" client type</li>
            <li>Enable PKCE in your Okta application settings</li>
            <li>Configure MFA policies for enhanced security</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfigPanel;
