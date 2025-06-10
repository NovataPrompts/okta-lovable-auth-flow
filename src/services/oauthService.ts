// OAuth 2.0 with PKCE service for Okta authentication with MFA support
class OAuthService {
  private readonly issuer = 'https://novatacimsandbox.oktapreview.com/oauth2/default';
  private readonly clientId = '0oan1pa7s3tRupysv1d7'; // Updated with sandbox client ID
  
  // Dynamically determine redirect URI based on environment
  private getRedirectUri(): string {
    const currentOrigin = window.location.origin;
    const currentPath = window.location.pathname;
    
    // Check if we're on GitHub Pages
    if (currentOrigin.includes('github.io') || currentOrigin.includes('pages.beta.novata.dev')) {
      return `${currentOrigin}/okta-lovable-auth-flow/callback`;
    }
    
    // Default for Lovable preview and local development
    return `${currentOrigin}/callback`;
  }
  
  private readonly scope = 'openid profile email';
  
  // Generate cryptographically random string for PKCE
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Generate code challenge from verifier
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Generate random state parameter
  private generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array)).replace(/[^a-zA-Z0-9]/g, '');
  }

  // Initiate OAuth login flow
  async initiateLogin(): Promise<void> {
    try {
      console.log('=== Starting OAuth Login Process ===');
      
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);
      const state = this.generateState();
      const redirectUri = this.getRedirectUri();

      console.log('Generated PKCE parameters:');
      console.log('- Code verifier length:', codeVerifier.length);
      console.log('- Code challenge length:', codeChallenge.length);
      console.log('- State length:', state.length);
      console.log('- Redirect URI:', redirectUri);

      // Store PKCE parameters in sessionStorage temporarily (cleared after use)
      sessionStorage.setItem('oauth_code_verifier', codeVerifier);
      sessionStorage.setItem('oauth_state', state);

      const authUrl = new URL(`${this.issuer}/v1/authorize`);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', this.clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', this.scope);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      // Add prompt parameter to ensure MFA is triggered
      authUrl.searchParams.set('prompt', 'login');

      console.log('OAuth Configuration:');
      console.log('- Issuer:', this.issuer);
      console.log('- Client ID:', this.clientId);
      console.log('- Redirect URI:', redirectUri);
      console.log('- Scope:', this.scope);
      console.log('- Authorization URL length:', authUrl.toString().length);
      
      // Log each parameter for debugging
      console.log('URL Parameters:');
      authUrl.searchParams.forEach((value, key) => {
        console.log(`  ${key}:`, value.substring(0, 50) + (value.length > 50 ? '...' : ''));
      });
      
      console.log('Full Authorization URL:', authUrl.toString());
      
      // Add a small delay to ensure logging completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force a full page redirect (not iframe)
      console.log('Performing full page redirect to Okta sandbox...');
      
      // Try location.replace instead of assign to ensure no back button issues
      window.location.replace(authUrl.toString());
      
    } catch (error) {
      console.error('Error initiating OAuth login:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw new Error('Failed to initiate login');
    }
  }

  // Handle OAuth callback and exchange code for tokens
  async handleCallback(): Promise<{ accessToken: string; idToken?: string }> {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      const redirectUri = this.getRedirectUri();

      console.log('Callback URL params:', {
        code: code ? 'present' : 'missing',
        state: state ? 'present' : 'missing',
        error,
        errorDescription,
        currentPath: window.location.pathname,
        fullUrl: window.location.href,
        redirectUri
      });

      // Handle MFA-related errors specifically
      if (error) {
        console.error('OAuth error from Okta:', error, errorDescription);
        
        // Check for MFA-specific errors
        if (error === 'access_denied' && errorDescription?.includes('Policy')) {
          throw new Error('MFA authentication required. Please complete multi-factor authentication in the popup window.');
        }
        
        throw new Error(`OAuth error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
      }

      if (!code || !state) {
        throw new Error('Missing authorization code or state parameter');
      }

      // Verify state parameter
      const storedState = sessionStorage.getItem('oauth_state');
      if (state !== storedState) {
        console.error('State mismatch:', { received: state, stored: storedState });
        throw new Error('Invalid state parameter');
      }

      // Get code verifier
      const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
      if (!codeVerifier) {
        throw new Error('Missing code verifier');
      }

      console.log('Exchanging code for tokens...');
      console.log('Token endpoint:', `${this.issuer}/v1/token`);

      // Exchange code for tokens
      const tokenResponse = await fetch(`${this.issuer}/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
      });

      console.log('Token response status:', tokenResponse.status);

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('Token exchange failed:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: errorData
        });
        
        // Handle MFA-related token exchange errors
        if (tokenResponse.status === 400 && errorData.includes('invalid_grant')) {
          throw new Error('MFA verification incomplete. Please retry the authentication process.');
        }
        
        throw new Error(`Token exchange failed (${tokenResponse.status}): ${errorData}`);
      }

      const tokens = await tokenResponse.json();
      console.log('Token exchange successful');
      
      // Clean up temporary storage
      sessionStorage.removeItem('oauth_code_verifier');
      sessionStorage.removeItem('oauth_state');

      return {
        accessToken: tokens.access_token,
        idToken: tokens.id_token,
      };
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      throw error;
    }
  }

  // Get current redirect URI for configuration
  getRedirectUri(): string {
    return this.getRedirectUri();
  }

  // Get client ID for configuration display
  getClientId(): string {
    return this.clientId;
  }
}

export const oauthService = new OAuthService();
