// Analytics tracking utilities
export function trackPageView(path: string, startupId?: string) {
  // TODO: Implement real tracking - MongoDB or external service
  console.log('[Analytics]', { event: 'page_view', path, startupId, timestamp: new Date().toISOString() });
}

export function trackSearch(query: string, filters?: Record<string, string>) {
  console.log('[Analytics]', { event: 'search', query, filters, timestamp: new Date().toISOString() });
}

export function trackConnectionRequest(startupId: string, investorId: string) {
  console.log('[Analytics]', { event: 'connection_request', startupId, investorId, timestamp: new Date().toISOString() });
}
