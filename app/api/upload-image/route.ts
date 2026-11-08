import { getInsforgeUploadClient } from "../../../lib/insforge-server.ts";
import { NextResponse } from "next/server.js";
import fs from "node:fs/promises";
import path from "node:path";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function POST(request: Request) {
  try {
    let currentUserId: string | null = null;
    try {
      const { auth } = await import("@clerk/nextjs/server");
      const session = await auth();
      currentUserId = session.userId;
    } catch {
      // Demo fallback when Clerk credentials are not active or in raw Node ESM
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

    const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;
    const key = `images/${effectiveUserId}/${fileName}`;
    const bucket = "media";

    // 1. Attempt upload to remote InsForge storage
    try {
      const { data, error } = await insforge.storage
        .from(bucket)
        .upload(key, file);

      if (!error && data?.url) {
        return NextResponse.json({
          image: {
            key: data?.key || key,
            url: data?.url,
          },
        });
      }
      console.warn("[Upload API] Remote storage unavailable, switching to resilient local storage:", error?.message);
    } catch (storageErr: any) {
      console.warn("[Upload API] Remote storage exception, switching to resilient local storage:", storageErr?.message);
    }

    // 2. Resilient Fallback: Save to local public/uploads directory for offline & development support
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads", effectiveUserId);
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, fileName);
    await fs.writeFile(filePath, buffer);

    const localUrl = `/uploads/${effectiveUserId}/${fileName}`;

    return NextResponse.json({
      image: {
        key: `local://${key}`,
        url: localUrl,
      },
    });
  } catch (error: any) {
    console.error("Error uploading image:", error);
    return NextResponse.json({ error: error?.message || "Failed to upload image" }, { status: 500 });
  }
}
