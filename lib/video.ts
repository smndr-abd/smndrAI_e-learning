export type VideoSource =
  | { kind: "iframe"; src: string }
  | { kind: "file"; src: string }
  | { kind: "link"; src: string };

// Turns a pasted video link into something the lesson page can show.
// Supports YouTube, Vimeo and direct .mp4 / .webm files. Anything else
// becomes a plain "Watch the video" link.
export function parseVideo(raw: string | null | undefined): VideoSource | null {
  if (!raw) return null;
  const url = raw.trim();
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\./, "");

  // YouTube
  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    if (/^[\w-]{11}$/.test(id)) {
      return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` };
    }
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    let id = u.searchParams.get("v");
    const m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]{11})/);
    if (!id && m) id = m[2];
    if (id && /^[\w-]{11}$/.test(id)) {
      return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` };
    }
  }

  // Vimeo (also handles unlisted links that carry a hash)
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = u.pathname.match(/(?:\/video)?\/(\d+)(?:\/([a-z0-9]+))?/i);
    if (m) {
      const h = m[2] ?? u.searchParams.get("h");
      return { kind: "iframe", src: `https://player.vimeo.com/video/${m[1]}${h ? `?h=${h}` : ""}` };
    }
  }

  // Direct video file
  if (/\.(mp4|webm)$/i.test(u.pathname)) return { kind: "file", src: url };

  return { kind: "link", src: url };
}