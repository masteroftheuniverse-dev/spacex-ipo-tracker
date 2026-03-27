export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle function routes
    if (url.pathname.startsWith('/subscribe')) {
      const { onRequestPost, onRequestOptions } = await import('./functions/subscribe.js');
      if (request.method === 'OPTIONS') {
        return onRequestOptions();
      }
      return onRequestPost({ request, env });
    }
    
    if (url.pathname.startsWith('/prediction-markets')) {
      const { onRequestGet } = await import('./functions/prediction-markets.js');
      return onRequestGet();
    }
    
    // Serve static files — fallback to index.html for client-side routing
    if (url.pathname === '/' || url.pathname === '') {
      return env.ASSETS.fetch('/' + 'index.html');
    }
    
    // Try to fetch the file
    let response = await env.ASSETS.fetch(request);
    if (response.status === 404 && !url.pathname.includes('.')) {
      // No extension, might be a SPA route — serve index.html
      response = await env.ASSETS.fetch('/' + 'index.html');
    }
    
    return response;
  }
};
