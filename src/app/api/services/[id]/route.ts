import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db"; // adjust path as needed
import { Service } from "@/models/service"; // adjust path as needed
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const service = await Service.findOne({ _id: id, userId: session.user.id });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Status updated", service });
  } catch (error) {
    console.error("[GET_SERVICE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to get service" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const body = await req.json();
    const { active } = body;

    const service = await Service.findOne({ _id: id, userId: session.user.id });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found or unauthorized" },
        { status: 404 }
      );
    }

    service.active = active;
    await service.save();

    return NextResponse.json({ message: "Status updated", service });
  } catch (error) {
    console.error("[UPDATE_SERVICE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const body = await req.json();
    const { name, url, params } = body;

    const service = await Service.findOne({ _id: id, userId: session.user.id });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found or unauthorized" },
        { status: 404 }
      );
    }

    if (name) service.name = name;
    if (url) service.url = url;
    if (params) service.params = params;

    await service.save();

    return NextResponse.json({
      message: "Service updated successfully",
      service,
    });
  } catch (error) {
    console.error("[UPDATE_SERVICE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const service = await Service.deleteOne({
      _id: id,
      userId: session.user.id,
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("[DELETE_SERVICE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
