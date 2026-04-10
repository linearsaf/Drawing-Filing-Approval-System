import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";

const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");

const contentTypeByExtension = new Map<string, string>([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
  [".gif", "image/gif"],
  [".pdf", "application/pdf"],
  [".txt", "text/plain; charset=utf-8"]
]);

function buildFilePath(parts: string[]) {
  const normalizedParts = parts.filter(Boolean);
  const resolvedPath = path.resolve(uploadsRoot, ...normalizedParts);

  if (resolvedPath !== uploadsRoot && !resolvedPath.startsWith(`${uploadsRoot}${path.sep}`)) {
    return null;
  }

  return resolvedPath;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: pathParts } = await context.params;
  const filePath = buildFilePath(pathParts);

  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const contentType = contentTypeByExtension.get(extension) ?? "application/octet-stream";

    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300"
      }
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
