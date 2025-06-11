// OAuth 2.0 with PKCE service for Okta authentication with MFA support
class OAuthService {
  private readonly issuer = 'https://novatacimsandbox.oktapreview.com/oauth2/default';
  private readonly clientId = '0oan1pa7s3tRupysv1d7'; // Updated with sandbox client ID
  
  // Dynamically determine redirect URI based on environment
  private getRedirectUriInternal(): string {
    const currentOrigin = window.location.origin;
    
    // Check if we're on GitHub Pages
    if (currentOrigin.includes('github.io') || currentOrigin.includes('pages.beta.novata.dev')) {
      return `${currentOrigin}/okta-lovable-auth-flow/callback`;
    }
    
    // Default for Lovable preview and local development
    return `${currentOrigin}/callback`;
  }
  
  private readonly scope = 'openid profile email';
  
  // Check if we're in Lovable iframe environment
  private isInLovableIframe(): boolean {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true; // If we can't access window.top, we're likely in an iframe
    }
  }

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
      console.log('Environment check - In iframe:', this.isInLovableIframe());
      console.log('Current URL:', window.location.href);
      
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);
      const state = this.generateState();
      const redirectUri = this.getRedirectUriInternal();

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
      console.log("🔁 handleCallback() running");
      
      // Show full URL and split breakdown
      console.log("href:", window.location.href);
      console.log("search:", window.location.search);
      
      // Use URL constructor for robust parameter extraction
      const fullUrl = new URL(window.location.href);
      const code = fullUrl.searchParams.get("code");
      const state = fullUrl.searchParams.get("state");

      console.log("🌐 Parsed using URL object:");
      console.log("code:", code);
      console.log("state:", state);
      
      const error = fullUrl.searchParams.get('error');
      const errorDescription = fullUrl.searchParams.get('error_description');
      const redirectUri = this.getRedirectUriInternal();

      console.log('📋 Callback URL analysis:', {
        code: code ? `present (${code.substring(0, 10)}...)` : 'missing',
        state: state ? `present (${state.substring(0, 10)}...)` : 'missing',
        error,
        errorDescription,
        currentPath: window.location.pathname,
        fullUrl: window.location.href,
        redirectUri,
        allParams: Object.fromEntries(fullUrl.searchParams.entries())
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

      // If we're missing code/state, provide helpful error message
      if (!code || !state) {
        console.log('⚠️ Missing OAuth parameters, checking environment...');
        
        // Check if there might be OAuth parameters in the hash (some OAuth flows use fragments)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashCode = hashParams.get('code');
        const hashState = hashParams.get('state');
        
        if (hashCode && hashState) {
          console.log('🔄 Found OAuth parameters in URL hash, using those instead');
          // Use hash parameters if available
          return this.exchangeCodeForTokens(hashCode, hashState, redirectUri);
        }
        
        // If we're on the callback route but missing parameters
        if (window.location.pathname === '/callback') {
          throw new Error('OAuth callback incomplete. Please try logging in again.');
        }
        
        throw new Error('Missing authorization code or state parameter. Please try logging in again.');
      }

      console.log('✅ OAuth parameters validated, proceeding to token exchange');
      return this.exchangeCodeForTokens(code, state, redirectUri);
      
    } catch (error) {
      console.error('💥 Error handling OAuth callback:', error);
      console.error('💥 Error details:', error instanceof Error ? error.message : 'Unknown error');
      console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  // Separate method to handle the token exchange
  private async exchangeCodeForTokens(code: string, state: string, redirectUri: string): Promise<{ accessToken: string; idToken?: string }> {
    console.log('🔄 Starting token exchange process...');
    
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

    // Get code verifier
    const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
    if (!codeVerifier) {
      console.error('❌ Missing code verifier in sessionStorage');
      throw new Error('Missing code verifier');
    }

    const tokenEndpoint = `${this.issuer}/v1/token`;
    console.log('📤 Preparing token exchange request:', {
      tokenEndpoint,
      codeVerifierLength: codeVerifier.length,
      codeLength: code.length,
      redirectUri
    });

    // Exchange code for tokens
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    console.log('🌐 About to send POST request to token endpoint:', tokenEndpoint);
    console.log('📝 Request body parameters:', Object.fromEntries(tokenRequestBody.entries()));
    
    try {
      const tokenResponse = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenRequestBody,
      });

      console.log('📨 Token response received:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        ok: tokenResponse.ok,
        headers: Object.fromEntries(tokenResponse.headers.entries())
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('❌ Token exchange failed:', {
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
      console.log('🎉 Token exchange successful:', {
        hasAccessToken: !!tokens.access_token,
        hasIdToken: !!tokens.id_token,
        tokenType: tokens.token_type,
        expiresIn: tokens.expires_in,
        accessTokenLength: tokens.access_token ? tokens.access_token.length : 0
      });
      
      // Clean up temporary storage
      sessionStorage.removeItem('oauth_code_verifier');
      sessionStorage.removeItem('oauth_state');
      console.log('🧹 Cleaned up temporary storage');

      console.log('📤 Returning tokens to caller for storage in tokenManager');
      return {
        accessToken: tokens.access_token,
        idToken: tokens.id_token,
      };
    } catch (fetchError) {
      console.error('💥 Fetch error during token exchange:', fetchError);
      console.error('💥 Fetch error details:', fetchError instanceof Error ? fetchError.message : 'Unknown fetch error');
      throw fetchError;
    }
  }

  // Get current redirect URI for configuration
  getRedirectUri(): string {
    return this.getRedirectUriInternal();
  }

  // Get client ID for configuration display
  getClientId(): string {
    return this.clientId;
  }
}

export const oauthService = new OAuthService();
