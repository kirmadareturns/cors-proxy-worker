export async function onRequest(context) {
  const req = context.request;
  const url = new URL(req.url);
  const videoId = url.searchParams.get("v");
  const lang = url.searchParams.get("lang") || "en";

  if (!videoId) {
    return new Response(JSON.stringify({ error: "Missing video ID (v param)" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // helper to fetch with UA and return text
  async function fetchText(u) {
    const res = await fetch(u, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible)" },
      cf: { cacheTtl: 86400, cacheEverything: true } // Cloudflare hint
    });
    if (!res.ok) throw new Error("fetch-failed:" + res.status);
    return await res.text();
  }

  // 1) Try direct timedtext endpoint (simple, fast)
  try {
    const ttUrl = `https://www.youtube.com/api/timedtext?lang=${encodeURIComponent(lang)}&v=${encodeURIComponent(videoId)}`;
    const xml = await fetchText(ttUrl);
    if (xml && xml.trim().length > 0 && !xml.startsWith("<html")) {
      return new Response(xml, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=86400"
        }
      });
    }
  } catch (e) {
    // fallthrough to next method
    // console.log("timedtext failed", e);
  }

  // 2) Fetch watch page and parse ytInitialPlayerResponse
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&bpctr=9999999999`;
    const html = await fetchText(watchUrl);

    // Try to extract ytInitialPlayerResponse JSON. There are a few variants.
    // We attempt a couple of regex matches to be robust.
    let jsonStr = null;
    const patterns = [
      /ytInitialPlayerResponse\s*=\s*(\{.+?\});/, // common
      /var ytInitialPlayerResponse\s*=\s*(\{.+?\});/, // older
      /window\["ytInitialPlayerResponse"\]\s*=\s*(\{.+?\});/ // other variant
    ];
    for (const p of patterns) {
      const m = html.match(new RegExp(p.source, "s"));
      if (m && m[1]) {
        jsonStr = m[1];
        break;
      }
    }

    if (!jsonStr) {
      // try a looser approach: find "playerResponse" block
      const m2 = html.match(/"captions":\s*\{.+?\}\s*,\s*"videoDetails"/s);
      if (m2) {
        // try to locate the beginning of the object
        const startIdx = html.lastIndexOf("{", m2.index);
        const endIdx = html.indexOf("};", m2.index);
        if (startIdx !== -1 && endIdx !== -1) {
          jsonStr = html.slice(startIdx, endIdx + 1);
        }
      }
    }

    if (!jsonStr) {
      // give up
      return new Response(JSON.stringify({ error: "Could not locate player response" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    let player;
    try {
      player = JSON.parse(jsonStr);
    } catch (err) {
      // sometimes JSON includes unescaped sequences; try a safer eval parse
      try {
        // eslint-disable-next-line no-eval
        player = eval("(" + jsonStr + ")");
      } catch (e) {
        return new Response(JSON.stringify({ error: "Failed to parse player response" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // Locate captionTracks
    const captionTracks =
      player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ||
      player?.captions?.playerCaptionsRenderer?.captionTracks ||
      null;

    if (!captionTracks || captionTracks.length === 0) {
      return new Response(JSON.stringify({ error: "No captions found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // prefer exact match on language, else pick first
    let chosen = captionTracks.find(t => t.languageCode === lang) || captionTracks[0];
    let baseUrl = chosen.baseUrl || chosen.baseUrl || null;

    if (!baseUrl) {
      return new Response(JSON.stringify({ error: "Caption track has no baseUrl" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // try fetching as vtt (widely supported); fallback to default if vtt fails
    const vttUrl = baseUrl + (baseUrl.includes("?") ? "&" : "?") + "fmt=vtt";
    try {
      const vtt = await fetchText(vttUrl);
      if (vtt && vtt.trim().length > 0) {
        return new Response(vtt, {
          headers: {
            "Content-Type": "text/vtt; charset=utf-8",
            "Cache-Control": "public, max-age=86400"
          }
        });
      }
    } catch (e) {
      // fallback
    }

    // fallback to baseUrl (often returns XML timedtext)
    try {
      const fallback = await fetchText(baseUrl);
      return new Response(fallback, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=86400"
        }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Failed to fetch captions from baseUrl" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: "Unexpected error", details: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
