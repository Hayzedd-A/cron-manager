import { connectToDatabase } from "@/lib/db";
import { Service } from "@/models/service";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const body = await req.json();
    const { name, url, query } = body;

    if (!name || !url ) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const existingService = await Service.countDocuments({userId: session.user.id})
    if (existingService >= 5) return NextResponse.json({error: "maximum number of services reached"}, {status: 406})
    const service = await Service.create({
      userId: session.user.id,
      name,
      url,
      query,
    });

    return NextResponse.json(
      { message: "Service created", service },
      { status: 201 }
    );
  } catch (error) {
    console.error("[CREATE_SERVICE_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const services = await Service.find({ userId: session.user.id }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ services }, { status: 200 });
  } catch (error) {
    console.error("[GET_SERVICES_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
