import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET } from "@/lib/files";

// Download gate. The database decides who may see a file (RLS: free preview
// lessons, or enrolled students). If allowed, we hand out a link that expires in 60 seconds.
export async function GET(_req: Request, { params }: { params: { fileId: string } }) {
  const supabase = createClient();
  const admin = createAdminClient();

  let { data: file } = await supabase
    .from("lesson_files")
    .select("id, name, storage_path")
    .eq("id", params.fileId)
    .maybeSingle();

  // Admins may download any file, even without being enrolled.
  if (!file) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (profile?.role === "admin") {
        const res = await admin
          .from("lesson_files")
          .select("id, name, storage_path")
          .eq("id", params.fileId)
          .maybeSingle();
        file = res.data;
      }
    }
  }
  if (!file) return new NextResponse("Not found", { status: 404 });

  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(file.storage_path, 60, { download: file.name });
  if (error || !data) return new NextResponse("Could not create the download link", { status: 500 });

  return NextResponse.redirect(data.signedUrl);
}
