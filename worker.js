export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/transcript") {
      const videoId = url.searchParams.get("v");
      const lang = url.searchParams.get("lang") || "en";

      if (!videoId) {
        return new Response(JSON.stringify({ error: "Missing video ID" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const ytURL = `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}`;

      try {
        const res = await fetch(ytURL, {
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        });

        if (!res.ok) {
          return new Response(JSON.stringify({ error: "Transcript not available" }), {
            status: res.status,
            headers: { "Content-Type": "application/json" }
          });
        }

        const xml = await res.text();

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=86400"
          }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Failed to fetch" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return new Response("Transcript Proxy Running");
  }
};
