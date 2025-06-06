
import { tokenManager } from './tokenManager';

// Novata API service for making authenticated requests to sandbox
class NovataApiService {
  private readonly baseUrl = 'https://api.sandbox.novata.com/apis/novata';

  // Make authenticated API call to Novata sandbox
  async callApi(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = tokenManager.getToken();
    
    if (!token) {
      throw new Error('No access token available. Please log in first.');
    }

    try {
      console.log(`Making API call to sandbox: ${this.baseUrl}${endpoint}`);
      
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
      console.log('Sandbox API call successful:', data);
      return data;
    } catch (error) {
      console.error('Novata Sandbox API error:', error);
      throw error;
    }
  }

  // Test sandbox API with detailed logging
  async testSandboxApi(): Promise<{ success: boolean; data?: any; error?: string; details?: any }> {
    const token = tokenManager.getToken();
    
    console.log('=== TESTING SANDBOX API CORS & AUTH ===');
    console.log('Token available:', !!token);
    console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'None');
    console.log('Target URL:', `${this.baseUrl}/me`);
    console.log('Current domain:', window.location.origin);
    
    if (!token) {
      return { 
        success: false, 
        error: 'No access token available',
        details: { step: 'token-check' }
      };
    }

    try {
      console.log('🚀 Making fetch request to sandbox API...');
      
      const response = await fetch(`${this.baseUrl}/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response received:');
      console.log('- Status:', response.status);
      console.log('- Status Text:', response.statusText);
      console.log('- Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Response body:', errorText);
        
        if (response.status === 401) {
          return {
            success: false,
            error: 'Authentication failed - token may be invalid for sandbox API audience',
            details: { status: 401, body: errorText, step: 'auth-failed' }
          };
        }
        
        return {
          success: false,
          error: `API error (${response.status}): ${errorText}`,
          details: { status: response.status, body: errorText, step: 'api-error' }
        };
      }

      const data = await response.json();
      console.log('✅ Success! API response:', data);
      
      return { 
        success: true, 
        data,
        details: { status: response.status, step: 'success' }
      };
      
    } catch (error) {
      console.log('❌ Fetch Error:', error);
      
      // Check if it's a CORS error
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.log('🚫 This is likely a CORS error - the sandbox API doesn\'t allow this domain');
        return {
          success: false,
          error: 'CORS error - sandbox API doesn\'t allow requests from this preview domain',
          details: { type: 'cors', step: 'fetch-failed' }
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown fetch error',
        details: { type: 'unknown', step: 'fetch-failed' }
      };
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
