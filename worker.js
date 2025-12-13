export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // CORS headers for all responses
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE, PATCH",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
      "Access-Control-Max-Age": "86400"
    };

    // Handle OPTIONS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }

    if (url.pathname === "/transcript") {
      const videoId = url.searchParams.get("v");
      const lang = url.searchParams.get("lang") || "en";

      if (!videoId) {
        return new Response(JSON.stringify({ error: "Missing video ID" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const ytURL = `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}`;

      try {
        const res = await fetch(ytURL, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; CloudflareWorker)"
          }
        });

        if (!res.ok) {
          return new Response(JSON.stringify({ error: "Transcript not available", status: res.status }), {
            status: res.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const xml = await res.text();

        // Check if we got a valid response (not an error page)
        if (xml.includes("<html") || xml.includes("<!DOCTYPE")) {
          return new Response(JSON.stringify({ error: "Transcript not available - likely private or restricted video" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        return new Response(xml, {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=86400"
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ 
          error: "Failed to fetch transcript",
          message: e.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // Health check endpoint
    if (url.pathname === "/health" || url.pathname === "/") {
      return new Response(JSON.stringify({ 
        status: "CORS Proxy Worker Running",
        version: "1.0.0",
        endpoints: ["/transcript"]
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ 
      error: "Not found",
      availableEndpoints: ["/transcript", "/health"]
    }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};
