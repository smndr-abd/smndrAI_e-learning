"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createUploadUrl, registerFile } from "@/app/admin/actions";
import { ALLOWED_EXTENSIONS, BUCKET, MAX_FILE_BYTES, MAX_FILE_MB, extOf } from "@/lib/files";

export default function FileUploader({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setMsg({ kind: "error", text: "Choose a file first." });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setMsg({ kind: "error", text: `That file is bigger than ${MAX_FILE_MB} MB.` });
      return;
    }
    if (!ALLOWED_EXTENSIONS.includes(extOf(file.name))) {
      setMsg({ kind: "error", text: `Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}` });
      return;
    }

    setBusy(true);
    setMsg(null);
    try {
      // 1) ask the server (admins only) for a one-time upload link
      const start = await createUploadUrl(lessonId, file.name, file.size);
      if (start.error || !start.path || !start.token) {
        throw new Error(start.error ?? "Could not start the upload.");
      }
      // 2) send the file straight to private storage
      const supabase = createClient();
      const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(start.path, start.token, file);
      if (error) throw new Error(error.message);
      // 3) record it against the lesson
      const done = await registerFile(lessonId, start.path, file.name, file.size, file.type || "application/octet-stream");
      if (done.error) throw new Error(done.error);

      setMsg({ kind: "ok", text: `Uploaded ${file.name}` });
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setMsg({ kind: "error", text: err instanceof Error ? err.message : "Upload failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <label>
        // Choose a file (max {MAX_FILE_MB} MB: {ALLOWED_EXTENSIONS.join(", ")})
        <input ref={inputRef} type="file" accept={ALLOWED_EXTENSIONS.map((x) => `.${x}`).join(",")} />
      </label>
      <button className="btn secondary" type="submit" disabled={busy}>
        {busy ? "Uploading..." : "Upload file"}
      </button>
      {msg && <div className={msg.kind === "ok" ? "notice ok" : "notice error"}>{msg.text}</div>}
    </form>
  );
}
