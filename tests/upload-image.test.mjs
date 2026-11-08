import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { POST } from "../app/api/upload-image/route.ts";

test("Upload API - Rejects request with missing file", async () => {
  const formData = new FormData();
  const req = new Request("http://localhost:3000/api/upload-image", {
    method: "POST",
    body: formData,
  });

  const res = await POST(req);
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.error, "No file provided");
});

test("Upload API - Rejects non-image file type", async () => {
  const blob = new Blob(["test text content"], { type: "text/plain" });
  const formData = new FormData();
  formData.append("file", blob, "test.txt");

  const req = new Request("http://localhost:3000/api/upload-image", {
    method: "POST",
    body: formData,
  });

  const res = await POST(req);
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.strictEqual(data.error, "File must be an image");
});

test("Upload API - Saves image successfully with local fallback when remote storage is unavailable", async () => {
  const blob = new Blob(["fake png image bytes"], { type: "image/png" });
  const formData = new FormData();
  formData.append("file", blob, "demo-upload.png");

  const req = new Request("http://localhost:3000/api/upload-image", {
    method: "POST",
    body: formData,
  });

  const res = await POST(req);
  assert.strictEqual(res.status, 200, "Should return 200 OK");
  const data = await res.json();
  assert.ok(data.image, "Should return image object");
  assert.ok(data.image.url, "Image should have URL");
  assert.ok(data.image.key, "Image should have key");

  // Verify the file was created if using local fallback
  if (data.image.url.startsWith("/uploads/")) {
    const localPath = path.join(process.cwd(), "public", data.image.url);
    const stat = await fs.stat(localPath);
    assert.ok(stat.size > 0, "Uploaded file should exist on disk");
  }
});
