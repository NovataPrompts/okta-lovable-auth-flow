
// OAuth 2.0 with PKCE service for Okta authentication
class OAuthService {
  private readonly issuer = 'https://novataworkforcesandbox.oktapreview.com/oauth2/default';
  private readonly clientId = '0oan0uf1p7BAsvphm1d7'; // Updated with actual client ID
  private readonly redirectUri = `${window.location.origin}/callback`;
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
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);
      const state = this.generateState();

      // Store PKCE parameters in sessionStorage temporarily (cleared after use)
      sessionStorage.setItem('oauth_code_verifier', codeVerifier);
      sessionStorage.setItem('oauth_state', state);

      const authUrl = new URL(`${this.issuer}/v1/authorize`);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', this.clientId);
      authUrl.searchParams.set('redirect_uri', this.redirectUri);
      authUrl.searchParams.set('scope', this.scope);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');

      console.log('Initiating OAuth login...');
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('Error initiating OAuth login:', error);
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

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Missing authorization code or state parameter');
      }

      // Verify state parameter
      const storedState = sessionStorage.getItem('oauth_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }

      // Get code verifier
      const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
      if (!codeVerifier) {
        throw new Error('Missing code verifier');
      }

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
          redirect_uri: this.redirectUri,
          code_verifier: codeVerifier,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${errorData}`);
      }

      const tokens = await tokenResponse.json();
      
      // Clean up temporary storage
      sessionStorage.removeItem('oauth_code_verifier');
      sessionStorage.removeItem('oauth_state');

      console.log('OAuth login successful');
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
    return this.redirectUri;
  }

  // Get client ID for configuration display
  getClientId(): string {
    return this.clientId;
  }
}

export const oauthService = new OAuthService();
