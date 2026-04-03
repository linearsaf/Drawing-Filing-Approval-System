import { NextResponse } from "next/server";
import { z } from "zod";

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function parseJson<T>(request: Request, schema: z.ZodSchema<T>) {
  const json = await request.json();
  const result = schema.safeParse(json);

  if (!result.success) {
    throw new HttpError(422, "Request body tidak valid.", result.error.flatten());
  }

  return result.data;
}

export function parseQuery<T>(url: string, schema: z.ZodSchema<T>) {
  const params = Object.fromEntries(new URL(url).searchParams.entries());
  const result = schema.safeParse(params);

  if (!result.success) {
    throw new HttpError(422, "Query parameter tidak valid.", result.error.flatten());
  }

  return result.data;
}

export function apiSuccess(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function apiError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details ?? null
      },
      { status: error.status }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: "Request body tidak valid.",
        details: error.flatten()
      },
      { status: 422 }
    );
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY"
  ) {
    return NextResponse.json(
      {
        error: "Data sudah digunakan. Pastikan nilai unik seperti drawing number tidak duplikat."
      },
      { status: 409 }
    );
  }

  console.error(error);

  return NextResponse.json(
    {
      error: "Terjadi kesalahan pada server."
    },
    { status: 500 }
  );
}
