import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId, originalTeacherId, replacementTeacherId, date } =
      await request.json();

    if (!lessonId || !originalTeacherId || !replacementTeacherId || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if replacement already exists for this lesson and date
    const existingReplacement = await prisma.teacherReplacement.findUnique({
      where: {
        date_lessonId: {
          date: new Date(date),
          lessonId: parseInt(lessonId),
        },
      },
    });

    if (existingReplacement) {
      return NextResponse.json(
        { error: "Replacement already exists for this lesson" },
        { status: 400 }
      );
    }

    // Create the replacement record
    const replacement = await prisma.teacherReplacement.create({
      data: {
        date: new Date(date),
        originalTeacherId,
        replacementTeacherId,
        lessonId: parseInt(lessonId),
      },
      include: {
        originalTeacher: {
          select: { name: true, surname: true },
        },
        replacementTeacher: {
          select: { name: true, surname: true },
        },
        lesson: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
    });

    revalidatePath("/list/schedules");

    return NextResponse.json({
      message: "Replacement assigned successfully",
      replacement,
    });
  } catch (error) {
    console.error("Error creating teacher replacement:", error);
    return NextResponse.json(
      { error: "Failed to assign replacement" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    const where: any = {};
    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);

      where.date = {
        gte: targetDate,
        lt: nextDay,
      };
    }

    const replacements = await prisma.teacherReplacement.findMany({
      where,
      include: {
        originalTeacher: {
          select: { name: true, surname: true },
        },
        replacementTeacher: {
          select: { name: true, surname: true },
        },
        lesson: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(replacements);
  } catch (error) {
    console.error("Error fetching teacher replacements:", error);
    return NextResponse.json(
      { error: "Failed to fetch replacements" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId");
    const date = searchParams.get("date");
    const lessonId = searchParams.get("lessonId");

    if (!teacherId && !date && !lessonId) {
      return NextResponse.json(
        {
          error:
            "At least one parameter (teacherId, date, or lessonId) is required",
        },
        { status: 400 }
      );
    }

    const where: any = {};

    if (teacherId) where.originalTeacherId = teacherId;

    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);

      where.date = {
        gte: targetDate,
        lt: nextDay,
      };
    }

    if (lessonId) where.lessonId = parseInt(lessonId);

    const deletedReplacements = await prisma.teacherReplacement.deleteMany({
      where,
    });

    revalidatePath("/list/schedules");

    return NextResponse.json({
      message: `${deletedReplacements.count} replacement(s) removed successfully`,
      count: deletedReplacements.count,
    });
  } catch (error) {
    console.error("Error deleting teacher replacements:", error);
    return NextResponse.json(
      { error: "Failed to delete replacements" },
      { status: 500 }
    );
  }
}
