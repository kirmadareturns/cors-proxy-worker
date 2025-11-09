export default {
  async fetch(request, env) {
    const url = new URL(request.url).searchParams.get("url");
    if (!url) {
      return new Response("Missing ?url=", { status: 400 });
    }
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    const text = await res.text();
    return new Response(text, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain;charset=utf-8"
      }
    });
  }
}
