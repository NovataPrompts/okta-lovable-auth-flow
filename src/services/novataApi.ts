
import { tokenManager } from './tokenManager';

// Novata API service for making authenticated requests
class NovataApiService {
  private readonly baseUrl = 'https://api.novata.com/apis/novata';

  // Make authenticated API call to Novata
  async callApi(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = tokenManager.getToken();
    
    if (!token) {
      throw new Error('No access token available. Please log in first.');
    }

    try {
      console.log(`Making API call to: ${this.baseUrl}${endpoint}`);
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('API call successful:', data);
      return data;
    } catch (error) {
      console.error('Novata API error:', error);
      throw error;
    }
  }

  // Get current user info
  async getCurrentUser(): Promise<any> {
    return this.callApi('/me');
  }

  // Test API connectivity
  async testConnection(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const data = await this.getCurrentUser();
      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export const novataApi = new NovataApiService();
