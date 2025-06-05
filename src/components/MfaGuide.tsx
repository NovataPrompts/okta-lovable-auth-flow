
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Smartphone, Mail, Key } from 'lucide-react';

const MfaGuide: React.FC = () => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Multi-Factor Authentication</span>
        </CardTitle>
        <CardDescription>
          Your organization requires MFA for secure access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Available MFA Methods:</h4>
          
          <div className="flex items-center space-x-3 text-sm">
            <Mail className="h-4 w-4 text-blue-500" />
            <span>Email verification</span>
          </div>
          
          <div className="flex items-center space-x-3 text-sm">
            <Smartphone className="h-4 w-4 text-green-500" />
            <span>Okta Verify mobile app</span>
          </div>
          
          <div className="flex items-center space-x-3 text-sm">
            <Key className="h-4 w-4 text-purple-500" />
            <span>Google Authenticator</span>
          </div>
        </div>
        
        <div className="p-3 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md">
          <strong>Note:</strong> After clicking "Login with Okta", you'll be redirected to complete 
          your second factor authentication. Follow the prompts in the Okta login window.
        </div>
      </CardContent>
    </Card>
  );
};

export default MfaGuide;
