// Enhanced API client for MSA performance optimization
import { apiCache, CacheKeys } from './cache';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTime?: number;
  credentials?: 'include' | 'omit' | 'same-origin';
}

interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
  cached?: boolean;
  duration?: number;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class OptimizedApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders
    };
  }

  private async makeRequest<T>(
    url: string,
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 10000,
      retries = 3,
      cache = method === 'GET',
      cacheTime = 5 * 60 * 1000, // 5 minutes
      credentials = 'include'
    } = options;

    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    const cacheKey = cache ? `api:${method}:${fullUrl}:${JSON.stringify(body || {})}` : null;

    // Check cache for GET requests
    if (cache && cacheKey) {
      const cached = apiCache.get(cacheKey);
      if (cached) {
        return {
          data: cached.data,
          status: cached.status,
          headers: new Headers(cached.headers),
          cached: true
        };
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 1; attempt <= retries; attempt++) {
      const startTime = Date.now();

      try {
        const response = await fetch(fullUrl, {
          method,
          headers: {
            ...this.defaultHeaders,
            ...headers
          },
          body: body ? JSON.stringify(body) : undefined,
          credentials,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        // Log slow requests
        if (duration > 2000) {
          console.warn(`🐌 Slow API request (${duration}ms): ${method} ${url}`);
        }

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `API Error: ${response.status} ${response.statusText}`;

          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }

          throw new ApiError(errorMessage, response.status, response);
        }

        const contentType = response.headers.get('content-type');
        let data: T;

        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = (await response.text()) as unknown as T;
        }

        // Cache successful GET requests
        if (cache && cacheKey && method === 'GET') {
          const cacheData = {
            data,
            status: response.status,
            headers: Object.fromEntries(response.headers.entries())
          };
          apiCache.set(cacheKey, cacheData, cacheTime);
        }

        return {
          data,
          status: response.status,
          headers: response.headers,
          cached: false,
          duration
        };

      } catch (error: any) {
        lastError = error;
        console.error(`🚨 API request attempt ${attempt}/${retries} failed:`, {
          url: fullUrl,
          method,
          error: error.message,
          attempt
        });

        // Don't retry on certain errors
        if (
          error.name === 'AbortError' ||
          (error instanceof ApiError && error.status >= 400 && error.status < 500) ||
          attempt === retries
        ) {
          break;
        }

        // Wait before retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    clearTimeout(timeoutId);
    throw lastError || new Error('Request failed after all retries');
  }

  // HTTP method helpers
  async get<T>(url: string, options: Omit<ApiOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'GET' });
  }

  async post<T>(url: string, body?: any, options: Omit<ApiOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'POST', body });
  }

  async put<T>(url: string, body?: any, options: Omit<ApiOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'PUT', body });
  }

  async patch<T>(url: string, body?: any, options: Omit<ApiOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'PATCH', body });
  }

  async delete<T>(url: string, options: Omit<ApiOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'DELETE' });
  }

  // Batch requests for multiple API calls
  async batch<T>(requests: Array<{
    url: string;
    options?: ApiOptions;
  }>): Promise<Array<ApiResponse<T> | Error>> {
    const promises = requests.map(({ url, options }) =>
      this.makeRequest<T>(url, options).catch(error => error)
    );

    return Promise.all(promises);
  }

  // Health check endpoint
  async healthCheck(): Promise<{ healthy: boolean; latency: number }> {
    const startTime = Date.now();

    try {
      await this.get('/api/health', { timeout: 5000, cache: false });
      return {
        healthy: true,
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime
      };
    }
  }

  // Clear cache
  clearCache(): void {
    apiCache.clear();
  }
}

// Create default instance
export const apiClient = new OptimizedApiClient();

// Service-specific API clients
export class AuthApi {
  private client = apiClient;

  async login(email: string, password: string) {
    return this.client.post<{
      message: string;
      user: { id: string; email: string; name: string };
    }>('/api/auth/login', { email, password }, { cache: false });
  }

  async logout() {
    return this.client.post<{ message: string }>('/api/auth/logout', {}, { cache: false });
  }

  async getCurrentUser() {
    return this.client.get<{
      user: { id: string; email: string; name: string } | null;
    }>('/api/auth/me', {
      cache: true,
      cacheTime: 2 * 60 * 1000 // 2 minutes
    });
  }

  async register(email: string, password: string, name: string) {
    return this.client.post<{
      message: string;
      user: { id: string; email: string; name: string };
    }>('/api/auth/register', { email, password, name }, { cache: false });
  }
}

export class BoardApi {
  private client = apiClient;

  async getPosts(page: number = 1, limit: number = 10, categoryId?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(categoryId && { categoryId })
    });

    return this.client.get<{
      posts: any[];
      total: number;
      hasMore: boolean;
    }>(`/api/board/posts?${params}`, {
      cache: true,
      cacheTime: 3 * 60 * 1000 // 3 minutes
    });
  }

  async getPost(id: string) {
    return this.client.get<{ post: any }>(`/api/board/posts/${id}`, {
      cache: true,
      cacheTime: 5 * 60 * 1000 // 5 minutes
    });
  }

  async getCategories() {
    return this.client.get<{ categories: any[] }>('/api/board/categories', {
      cache: true,
      cacheTime: 10 * 60 * 1000 // 10 minutes
    });
  }

  async createPost(post: { title: string; content: string; categoryId: string }) {
    return this.client.post<{ post: any }>('/api/board/posts', post, { cache: false });
  }

  async likePost(id: string) {
    return this.client.post<{ liked: boolean; likeCount: number }>(`/api/board/posts/${id}/like`, {}, { cache: false });
  }
}

// Export service instances
export const authApi = new AuthApi();
export const boardApi = new BoardApi();