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

    const { assignments } = await request.json();

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { error: "Invalid assignments data" },
        { status: 400 }
      );
    }

    // Validate all assignments first
    for (const assignment of assignments) {
      if (
        !assignment.lessonId ||
        !assignment.originalTeacherId ||
        !assignment.replacementTeacherId ||
        !assignment.date
      ) {
        return NextResponse.json(
          { error: "Missing required fields in assignment" },
          { status: 400 }
        );
      }
    }

    // Check for existing replacements
    const existingReplacements = await prisma.teacherReplacement.findMany({
      where: {
        OR: assignments.map((assignment: any) => ({
          date: new Date(assignment.date),
          lessonId: parseInt(assignment.lessonId),
        })),
      },
    });

    if (existingReplacements.length > 0) {
      return NextResponse.json(
        { error: "Some replacements already exist" },
        { status: 400 }
      );
    }

    // Create all replacements
    const replacements = await prisma.teacherReplacement.createMany({
      data: assignments.map((assignment: any) => ({
        date: new Date(assignment.date),
        originalTeacherId: assignment.originalTeacherId,
        replacementTeacherId: assignment.replacementTeacherId,
        lessonId: parseInt(assignment.lessonId),
      })),
    });

    revalidatePath("/list/schedules");

    return NextResponse.json({
      message: `${replacements.count} replacements assigned successfully`,
      count: replacements.count,
    });
  } catch (error) {
    console.error("Error creating bulk teacher replacements:", error);
    return NextResponse.json(
      { error: "Failed to assign replacements" },
      { status: 500 }
    );
  }
}
