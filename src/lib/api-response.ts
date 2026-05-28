import { NextResponse } from "next/server"

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function apiHandler<T>(
  handler: () => Promise<T>,
): Promise<NextResponse> {
  try {
    const data = await handler()
    return apiSuccess(data)
  } catch (error) {
    if (error instanceof ApiError) {
      return apiError(error.message, error.statusCode)
    }

    console.error("[API_ERROR]", error)
    return apiError("Erro interno do servidor", 500)
  }
}
