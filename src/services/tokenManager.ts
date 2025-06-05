
// In-memory token management (no localStorage/sessionStorage persistence)
class TokenManager {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private refreshCallback: (() => void) | null = null;

  // Set access token with optional expiry
  setToken(token: string, expiresIn?: number): void {
    this.accessToken = token;
    this.tokenExpiry = expiresIn ? Date.now() + (expiresIn * 1000) : null;
    console.log('Access token stored in memory');
    
    if (this.refreshCallback) {
      this.refreshCallback();
    }
  }

  // Get current access token
  getToken(): string | null {
    if (this.accessToken && this.tokenExpiry && Date.now() >= this.tokenExpiry) {
      console.log('Token expired, clearing from memory');
      this.clearToken();
      return null;
    }
    return this.accessToken;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  // Clear token from memory
  clearToken(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
    console.log('Token cleared from memory');
    
    if (this.refreshCallback) {
      this.refreshCallback();
    }
  }

  // Set callback for token changes
  onTokenChange(callback: () => void): void {
    this.refreshCallback = callback;
  }

  // Get token info for debugging
  getTokenInfo(): { hasToken: boolean; expiresAt: string | null } {
    return {
      hasToken: !!this.accessToken,
      expiresAt: this.tokenExpiry ? new Date(this.tokenExpiry).toISOString() : null,
    };
  }
}

export const tokenManager = new TokenManager();
