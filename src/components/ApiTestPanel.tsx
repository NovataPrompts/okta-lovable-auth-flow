
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Server, RefreshCw, User, AlertCircle, CheckCircle } from 'lucide-react';
import { novataApi } from '@/services/novataApi';
import { tokenManager } from '@/services/tokenManager';

interface ApiTestPanelProps {
  isAuthenticated: boolean;
}

const ApiTestPanel: React.FC<ApiTestPanelProps> = ({ isAuthenticated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCallTime, setLastCallTime] = useState<string | null>(null);

  const handleApiCall = async () => {
    if (!isAuthenticated) {
      setError('Please authenticate first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      const response = await novataApi.getCurrentUser();
      setApiResponse(response);
      setLastCallTime(new Date().toLocaleString());
      console.log('API Response:', response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'API call failed';
      setError(errorMessage);
      console.error('API call error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const tokenInfo = tokenManager.getTokenInfo();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Server className="h-5 w-5" />
          <span>Novata Production API Test Panel</span>
        </CardTitle>
        <CardDescription>
          Test authenticated API calls to Novata's production backend with sandbox OAuth token
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Token Status</h4>
          <div className="flex items-center space-x-2">
            {tokenInfo.hasToken ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Token Available
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                No Token
              </Badge>
            )}
            {tokenInfo.expiresAt && (
              <span className="text-xs text-muted-foreground">
                Expires: {new Date(tokenInfo.expiresAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <Separator />

        {/* API Call Button */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Test Production API Endpoint</h4>
          <p className="text-sm text-muted-foreground">
            GET https://api.novata.com/apis/novata/me
          </p>
          <Button 
            onClick={handleApiCall}
            disabled={!isAuthenticated || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <User className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Calling Production API...' : 'Call Production /me Endpoint'}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">API Error:</span>
            </div>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* Success Response */}
        {apiResponse && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-green-600">API Response</h4>
              {lastCallTime && (
                <span className="text-xs text-muted-foreground">
                  Last call: {lastCallTime}
                </span>
              )}
            </div>
            <Textarea
              value={JSON.stringify(apiResponse, null, 2)}
              readOnly
              className="min-h-[200px] font-mono text-xs bg-green-50 border-green-200"
            />
          </div>
        )}

        {/* Test Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-blue-800 mb-2">CORS & Auth Test</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <p><strong>Testing production API with sandbox OAuth token...</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>CORS Error:</strong> Production API doesn't allow this preview domain</li>
              <li><strong>401 Unauthorized:</strong> Sandbox token invalid for production audience</li>
              <li><strong>200 Success:</strong> Ready for production use!</li>
            </ul>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>First authenticate with Okta using the login button above</li>
            <li>Once authenticated, click "Call Production /me Endpoint" to test</li>
            <li>Check browser console for detailed CORS/auth error messages</li>
            <li>Tokens are stored in memory only (not persisted)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiTestPanel;
