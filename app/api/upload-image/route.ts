import { getInsforgeUploadClient } from "@/lib/insforge-server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function POST(request: Request) {
  try {
    let currentUserId: string | null = null;
    try {
      const session = await auth();
      currentUserId = session.userId;
    } catch {
      // Demo fallback when Clerk credentials are not yet active
    }

    const effectiveUserId = currentUserId || "user_demo_101";
    const insforge = getInsforgeUploadClient();
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    const key = `images/${effectiveUserId}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const bucket = "media";

    const { data, error } = await insforge.storage
      .from(bucket)
      .upload(key, file);

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }

    return NextResponse.json({
      image: {
        key: data?.key,
        url: data?.url,
      },
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
