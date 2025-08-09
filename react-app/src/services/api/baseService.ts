// Use proxy in development, environment variable in production
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_BASE_URL || ""
    : "";

export class BaseApiService {
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const fullUrl = `${API_BASE_URL}${endpoint}`;

    // Get auth token from localStorage
    const token = localStorage.getItem("auth_token");

    const response = await fetch(fullUrl, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        localStorage.removeItem("auth_token");
        window.location.href = "/login";
        return Promise.reject(new Error("Authentication failed"));
      }

      const errorData = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(errorData.error || "API request failed");
    }

    return response.json();
  }

  protected get apiBaseUrl(): string {
    return API_BASE_URL;
  }
}
