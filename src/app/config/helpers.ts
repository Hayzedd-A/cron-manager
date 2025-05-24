import { NextResponse } from "next/server";

export const response = (data: object, code: number = 500) => {
  return NextResponse.json(data, {status: code});
}