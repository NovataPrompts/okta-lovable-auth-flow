
// OAuth 2.0 with Authorization Code + PKCE flow for Okta authentication with MFA support
class OAuthService {
  private readonly issuer = 'https://demo-okta.novata.com/oauth2/default';
  private readonly clientId = '0oap72q3ppDf7mqGR5d7';
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

  // Generate PKCE code verifier
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array)).replace(/[^a-zA-Z0-9]/g, '');
  }

  // Generate PKCE code challenge from verifier
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
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

  // Initiate OAuth login flow with Authorization Code + PKCE
  async initiateLogin(): Promise<void> {
    try {
      console.log('=== Starting OAuth Authorization Code + PKCE Flow ===');
      console.log('Environment check - In iframe:', this.isInLovableIframe());
      console.log('Current URL:', window.location.href);
      
      const state = this.generateState();
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);

      console.log('Generated OAuth parameters:');
      console.log('- State length:', state.length);
      console.log('- Code verifier length:', codeVerifier.length);
      console.log('- Code challenge length:', codeChallenge.length);
      console.log('- Redirect URI:', this.redirectUri);
      console.log('- Requested scopes:', this.scopes);

      // Store state and code verifier in sessionStorage for validation
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_code_verifier', codeVerifier);

      const authUrl = new URL(`${this.issuer}/v1/authorize`);
      authUrl.searchParams.set('response_type', 'code'); // Authorization Code flow
      authUrl.searchParams.set('client_id', this.clientId);
      authUrl.searchParams.set('redirect_uri', this.redirectUri);
      authUrl.searchParams.set('scope', this.scope); // Space-separated scopes
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256'); // PKCE with SHA256
      // Add prompt parameter to ensure MFA is triggered
      authUrl.searchParams.set('prompt', 'login');

      console.log('OAuth Configuration:');
      console.log('- Issuer:', this.issuer);
      console.log('- Client ID:', this.clientId);
      console.log('- Redirect URI:', this.redirectUri);
      console.log('- Response Type: code (Authorization Code + PKCE flow)');
      console.log('- Scope (space-separated):', this.scope);
      console.log('- Individual scopes:', this.scopes);
      console.log('- PKCE Challenge Method: S256');
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

  // Handle OAuth callback and exchange code for tokens (Authorization Code + PKCE flow)
  async handleCallback(): Promise<{ accessToken: string; idToken?: string }> {
    try {
      console.log("🔁 handleCallback() running for Authorization Code + PKCE flow");
      
      // In Authorization Code flow, we get a code in query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');

      console.log("🌐 Parsed from URL query:");
      console.log("code:", code ? `present (${code.substring(0, 10)}...)` : 'missing');
      console.log("state:", state ? `present (${state.substring(0, 10)}...)` : 'missing');
      console.log("error:", error);
      console.log("error_description:", errorDescription);
      
      console.log('📋 Callback URL analysis:', {
        code: code ? `present (${code.substring(0, 10)}...)` : 'missing',
        state: state ? `present (${state.substring(0, 10)}...)` : 'missing',
        error,
        errorDescription,
        currentPath: window.location.pathname,
        fullUrl: window.location.href,
        redirectUri: this.redirectUri,
        allParams: Object.fromEntries(urlParams.entries())
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

      // Verify we have the required authorization code
      if (!code) {
        console.log('⚠️ Missing authorization code in URL query parameters');
        throw new Error('Missing authorization code in callback. Please try logging in again.');
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

      // Get stored code verifier for PKCE
      const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
      if (!codeVerifier) {
        console.error('❌ Missing code verifier in session storage');
        throw new Error('Missing PKCE code verifier');
      }

      console.log('🔄 Exchanging authorization code for tokens...');

      // Exchange authorization code for tokens
      const tokenResponse = await fetch(`${this.issuer}/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          code: code,
          redirect_uri: this.redirectUri,
          code_verifier: codeVerifier, // PKCE verification
        }),
      });

      console.log('📡 Token exchange response status:', tokenResponse.status);

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('❌ Token exchange failed:', errorText);
        throw new Error(`Token exchange failed: ${errorText}`);
      }

      const tokens = await tokenResponse.json();
      console.log('🎉 Token exchange successful:', {
        hasAccessToken: !!tokens.access_token,
        hasIdToken: !!tokens.id_token,
        tokenType: tokens.token_type,
        expiresIn: tokens.expires_in,
        scope: tokens.scope
      });

      // Decode and log token contents as requested
      if (tokens.access_token) {
        console.log('🔍 Decoding ACCESS TOKEN (primary focus):');
        this.decodeAndLogToken(tokens.access_token, 'Access');
        
        // Call Novata API /me endpoint with the access token
        await this.callNovataMe(tokens.access_token);
      }
      
      if (tokens.id_token) {
        console.log('🔍 Decoding ID TOKEN:');
        this.decodeAndLogToken(tokens.id_token, 'ID');
      }
      
      // Clean up temporary storage
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_code_verifier');
      console.log('🧹 Cleaned up temporary storage');

      console.log('📤 Returning tokens to caller for storage in tokenManager');
      return {
        accessToken: tokens.access_token,
        idToken: tokens.id_token || undefined,
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
