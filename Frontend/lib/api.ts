// Returns the API base URL depending on the environment (localhost or network)
export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    // If running on localhost, use localhost backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    // Otherwise, use the network backend URL from env or fallback to current host
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    // Fallback: use the same host as frontend but port 5000
    return `${window.location.protocol}//${hostname}:5000`;
  }
  // SSR fallback
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
}
