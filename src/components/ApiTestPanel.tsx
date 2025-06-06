
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Server, RefreshCw, User, AlertCircle, CheckCircle, Bug } from 'lucide-react';
import { novataApi } from '@/services/novataApi';
import { tokenManager } from '@/services/tokenManager';

interface ApiTestPanelProps {
  isAuthenticated: boolean;
}

const ApiTestPanel: React.FC<ApiTestPanelProps> = ({ isAuthenticated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingDetailed, setIsTestingDetailed] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);
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

  const handleDetailedTest = async () => {
    if (!isAuthenticated) {
      setError('Please authenticate first');
      return;
    }

    setIsTestingDetailed(true);
    setError(null);
    setTestResults(null);
    setApiResponse(null);

    try {
      console.log('=== Starting detailed CORS & Auth test ===');
      const results = await novataApi.testSandboxApi();
      setTestResults(results);
      setLastCallTime(new Date().toLocaleString());
      
      if (results.success) {
        setApiResponse(results.data);
      } else {
        setError(results.error || 'Test failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Test failed';
      setError(errorMessage);
      console.error('Detailed test error:', err);
    } finally {
      setIsTestingDetailed(false);
    }
  };

  const tokenInfo = tokenManager.getTokenInfo();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Server className="h-5 w-5" />
          <span>Novata Sandbox API Test Panel</span>
        </CardTitle>
        <CardDescription>
          Test authenticated API calls to Novata's sandbox backend with CORS debugging
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

        {/* API Call Buttons */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Test Sandbox API Endpoints</h4>
          <p className="text-sm text-muted-foreground">
            GET https://api.sandbox.novata.com/apis/novata/me
          </p>
          
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={handleApiCall}
              disabled={!isAuthenticated || isLoading || isTestingDetailed}
              className="w-full"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <User className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Calling API...' : 'Call /me Endpoint'}
            </Button>

            <Button 
              onClick={handleDetailedTest}
              disabled={!isAuthenticated || isLoading || isTestingDetailed}
              variant="secondary"
              className="w-full"
            >
              {isTestingDetailed ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bug className="h-4 w-4 mr-2" />
              )}
              {isTestingDetailed ? 'Testing CORS & Auth...' : 'Detailed CORS & Auth Test'}
            </Button>
          </div>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Test Results</h4>
            <div className="bg-gray-50 border rounded-md p-3">
              <div className="flex items-center space-x-2 mb-2">
                {testResults.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {testResults.success ? 'Success!' : 'Failed'}
                </span>
              </div>
              <pre className="text-xs bg-white border rounded p-2 overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          </div>
        )}

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
          <h4 className="text-sm font-medium text-blue-800 mb-2">CORS & Auth Test Guide</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <p><strong>What we're testing:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>CORS Error:</strong> "Failed to fetch" = sandbox API doesn't allow this preview domain</li>
              <li><strong>401 Unauthorized:</strong> Token invalid for sandbox audience/scope</li>
              <li><strong>200 Success:</strong> Both CORS and auth are working!</li>
            </ul>
            <p className="mt-2"><strong>Use "Detailed Test" for comprehensive logging in browser console.</strong></p>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>First authenticate with Okta using the login button above</li>
            <li>Click "Detailed CORS & Auth Test" for comprehensive debugging</li>
            <li>Check browser console for detailed logs and error messages</li>
            <li>Tokens are stored in memory only (not persisted)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiTestPanel;
