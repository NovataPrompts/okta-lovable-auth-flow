
// OAuth 2.0 with implicit flow for Okta authentication with MFA support
class OAuthService {
  private readonly issuer = 'https://novatacimsandbox.oktapreview.com/oauth2/default';
  private readonly clientId = '0oan1pa7s3tRupysv1d7';
  private readonly redirectUri = 'https://pages.beta.novata.dev/okta-lovable-auth-flow/callback';
  
  // Explicitly define scopes as array for clarity
  private readonly scopes = ['openid', 'profile', 'email'];
  private readonly scope = this.scopes.join(' '); // Space-separated for OAuth spec
  
  // Check if we're in Lovable iframe environment
  private isInLovableIframe(): boolean {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true; // If we can't access window.top, we're likely in an iframe
    }
  }

  // Generate random state parameter
  private generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array)).replace(/[^a-zA-Z0-9]/g, '');
  }

  // Generate random nonce parameter for implicit flow
  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array)).replace(/[^a-zA-Z0-9]/g, '');
  }

  // Decode and log JWT token parts
  private decodeAndLogToken(token: string, tokenType: string): void {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));
        
        console.log(`🔍 ${tokenType} Token Header:`, header);
        console.log(`🔍 ${tokenType} Token Payload:`, payload);
        console.log(`🔍 ${tokenType} Token issued by:`, payload.iss);
        console.log(`🔍 ${tokenType} Token audience:`, payload.aud);
        console.log(`🔍 ${tokenType} Token expires at:`, new Date(payload.exp * 1000).toISOString());
        
        // Log scopes specifically to verify they're included
        if (payload.scp) {
          console.log(`🔍 ${tokenType} Token scopes (scp):`, payload.scp);
        }
        if (payload.scope) {
          console.log(`🔍 ${tokenType} Token scopes (scope):`, payload.scope);
        }
      }
    } catch (decodeError) {
      console.error(`❌ Error decoding ${tokenType} token:`, decodeError);
    }
  }

  // Call Novata API /me endpoint after successful authentication
  private async callNovataMe(accessToken: string): Promise<void> {
    try {
      console.log('🚀 Calling Novata API /me endpoint with access token...');
      
      const response = await fetch('https://api.sandbox.novata.com/apis/novata/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Novata API response status:', response.status);
      console.log('📡 Novata API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Novata API error:', errorText);
        return;
      }

      const userData = await response.json();
      console.log('✅ Novata API /me response:', userData);
      
    } catch (error) {
      console.error('💥 Error calling Novata API:', error);
    }
  }

  // Initiate OAuth login flow with implicit grant
  async initiateLogin(): Promise<void> {
    try {
      console.log('=== Starting OAuth Implicit Flow Login Process ===');
      console.log('Environment check - In iframe:', this.isInLovableIframe());
      console.log('Current URL:', window.location.href);
      
      const state = this.generateState();
      const nonce = this.generateNonce();

      console.log('Generated OAuth parameters:');
      console.log('- State length:', state.length);
      console.log('- Nonce length:', nonce.length);
      console.log('- Redirect URI:', this.redirectUri);
      console.log('- Requested scopes:', this.scopes);

      // Store state and nonce in sessionStorage for validation
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_nonce', nonce);

      const authUrl = new URL(`${this.issuer}/v1/authorize`);
      authUrl.searchParams.set('response_type', 'token id_token'); // Implicit flow for both tokens
      authUrl.searchParams.set('client_id', this.clientId);
      authUrl.searchParams.set('redirect_uri', this.redirectUri);
      authUrl.searchParams.set('scope', this.scope); // Space-separated scopes
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('nonce', nonce);
      // Add prompt parameter to ensure MFA is triggered
      authUrl.searchParams.set('prompt', 'login');

      console.log('OAuth Configuration:');
      console.log('- Issuer:', this.issuer);
      console.log('- Client ID:', this.clientId);
      console.log('- Redirect URI:', this.redirectUri);
      console.log('- Response Type: token id_token (implicit flow)');
      console.log('- Scope (space-separated):', this.scope);
      console.log('- Individual scopes:', this.scopes);
      console.log('Full Authorization URL:', authUrl.toString());
      
      // Add a small delay to ensure logging completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force a full page redirect (not iframe)
      console.log('Performing full page redirect to Okta...');
      
      // Try location.replace instead of assign to ensure no back button issues
      window.location.replace(authUrl.toString());
      
    } catch (error) {
      console.error('Error initiating OAuth login:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw new Error('Failed to initiate login');
    }
  }

  // Handle OAuth callback and extract tokens from URL fragment (implicit flow)
  async handleCallback(): Promise<{ accessToken: string; idToken?: string }> {
    try {
      console.log("🔁 handleCallback() running for implicit flow");
      
      // In implicit flow, tokens are returned in the URL fragment (hash), not query params
      console.log("href:", window.location.href);
      console.log("hash:", window.location.hash);
      
      // Parse tokens from URL fragment
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const idToken = hashParams.get("id_token");
      const state = hashParams.get("state");
      const tokenType = hashParams.get("token_type");
      const expiresIn = hashParams.get("expires_in");

      console.log("🌐 Parsed from URL hash:");
      console.log("access_token:", accessToken ? `present (${accessToken.substring(0, 10)}...)` : 'missing');
      console.log("id_token:", idToken ? `present (${idToken.substring(0, 10)}...)` : 'missing');
      console.log("state:", state ? `present (${state.substring(0, 10)}...)` : 'missing');
      console.log("token_type:", tokenType);
      console.log("expires_in:", expiresIn);
      
      const error = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');

      console.log('📋 Callback URL analysis:', {
        accessToken: accessToken ? `present (${accessToken.substring(0, 10)}...)` : 'missing',
        idToken: idToken ? `present (${idToken.substring(0, 10)}...)` : 'missing',
        state: state ? `present (${state.substring(0, 10)}...)` : 'missing',
        error,
        errorDescription,
        currentPath: window.location.pathname,
        fullUrl: window.location.href,
        redirectUri: this.redirectUri,
        allParams: Object.fromEntries(hashParams.entries())
      });

      // Handle MFA-related errors specifically
      if (error) {
        console.error('❌ OAuth error from Okta:', error, errorDescription);
        
        // Check for MFA-specific errors
        if (error === 'access_denied' && errorDescription?.includes('Policy')) {
          throw new Error('MFA authentication required. Please complete multi-factor authentication.');
        }
        
        throw new Error(`OAuth error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
      }

      // Verify we have the required access token
      if (!accessToken) {
        console.log('⚠️ Missing access token in URL fragment');
        
        // Check if there might be OAuth parameters in the query string (fallback)
        const queryParams = new URLSearchParams(window.location.search);
        const queryCode = queryParams.get('code');
        
        if (queryCode) {
          throw new Error('Received authorization code instead of access token. The flow may be configured incorrectly.');
        }
        
        throw new Error('Missing access token in callback. Please try logging in again.');
      }

      // Verify state parameter
      const storedState = sessionStorage.getItem('oauth_state');
      console.log('🔐 State verification:', {
        receivedState: state ? `${state.substring(0, 10)}...` : 'missing',
        storedState: storedState ? `${storedState.substring(0, 10)}...` : 'missing',
        matches: state === storedState
      });
      
      if (state !== storedState) {
        console.error('❌ State mismatch:', { received: state, stored: storedState });
        throw new Error('Invalid state parameter');
      }

      console.log('🎉 Token extraction successful:', {
        hasAccessToken: !!accessToken,
        hasIdToken: !!idToken,
        tokenType: tokenType,
        expiresIn: expiresIn,
        accessTokenLength: accessToken ? accessToken.length : 0
      });

      // Decode and log token contents as requested
      if (accessToken) {
        console.log('🔍 Decoding ACCESS TOKEN (primary focus):');
        this.decodeAndLogToken(accessToken, 'Access');
        
        // Call Novata API /me endpoint with the access token
        await this.callNovataMe(accessToken);
      }
      
      if (idToken) {
        console.log('🔍 Decoding ID TOKEN:');
        this.decodeAndLogToken(idToken, 'ID');
      }
      
      // Clean up temporary storage
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_nonce');
      console.log('🧹 Cleaned up temporary storage');

      console.log('📤 Returning tokens to caller for storage in tokenManager');
      return {
        accessToken: accessToken,
        idToken: idToken || undefined,
      };
      
    } catch (error) {
      console.error('💥 Error handling OAuth callback:', error);
      console.error('💥 Error details:', error instanceof Error ? error.message : 'Unknown error');
      console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  // Get current redirect URI for configuration
  getRedirectUri(): string {
    return this.redirectUri;
  }

  // Get client ID for configuration display
  getClientId(): string {
    return this.clientId;
  }
}

export const oauthService = new OAuthService();
