
// In-memory token management (no localStorage/sessionStorage persistence)
class TokenManager {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private refreshCallback: (() => void) | null = null;

  // Set access token with optional expiry
  setToken(token: string, expiresIn?: number): void {
    this.accessToken = token;
    this.tokenExpiry = expiresIn ? Date.now() + (expiresIn * 1000) : null;
    
    console.log('💾 TokenManager: Access token stored in memory', {
      tokenLength: token.length,
      hasExpiry: !!this.tokenExpiry,
      expiryTime: this.tokenExpiry ? new Date(this.tokenExpiry).toISOString() : 'no expiry set'
    });
    
    if (this.refreshCallback) {
      console.log('🔄 TokenManager: Triggering auth state refresh callback');
      this.refreshCallback();
    }
  }

  // Get current access token
  getToken(): string | null {
    if (this.accessToken && this.tokenExpiry && Date.now() >= this.tokenExpiry) {
      console.log('⏰ TokenManager: Token expired, clearing from memory');
      this.clearToken();
      return null;
    }
    
    if (this.accessToken) {
      console.log('✅ TokenManager: Valid token retrieved from memory');
    } else {
      console.log('❌ TokenManager: No token available');
    }
    
    return this.accessToken;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const hasValidToken = this.getToken() !== null;
    console.log('🔍 TokenManager: Authentication check:', hasValidToken);
    return hasValidToken;
  }

  // Clear token from memory
  clearToken(): void {
    const hadToken = !!this.accessToken;
    this.accessToken = null;
    this.tokenExpiry = null;
    
    console.log('🗑️ TokenManager: Token cleared from memory', { hadToken });
    
    if (this.refreshCallback) {
      console.log('🔄 TokenManager: Triggering auth state refresh callback after clear');
      this.refreshCallback();
    }
  }

  // Set callback for token changes
  onTokenChange(callback: () => void): void {
    this.refreshCallback = callback;
    console.log('📞 TokenManager: Auth state change callback registered');
  }

  // Get token info for debugging
  getTokenInfo(): { hasToken: boolean; expiresAt: string | null } {
    const info = {
      hasToken: !!this.accessToken,
      expiresAt: this.tokenExpiry ? new Date(this.tokenExpiry).toISOString() : null,
    };
    
    console.log('📊 TokenManager: Token info requested:', info);
    return info;
  }
}

export const tokenManager = new TokenManager();
