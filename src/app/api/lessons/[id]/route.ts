import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "teacher"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lessonId = parseInt(params.id);
    const body = await request.json();
    const { startTime, endTime, name } = body;

    // Update lesson with new times
    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        ...(name && { name }),
      },
      include: {
        subject: true,
        class: true,
        teacher: {
          select: {
            name: true,
            surname: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: updatedLesson.id,
      title: `${updatedLesson.subject.name} - ${updatedLesson.class.name}`,
      start: updatedLesson.startTime,
      end: updatedLesson.endTime,
      allDay: false,
      resource: {
        lessonId: updatedLesson.id,
        subjectId: updatedLesson.subjectId,
        classId: updatedLesson.classId,
        teacherId: updatedLesson.teacherId,
        teacher: `${updatedLesson.teacher.name} ${updatedLesson.teacher.surname}`,
      },
    });
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json(
      { error: "Failed to update lesson" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lessonId = parseInt(params.id);

    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    return NextResponse.json({ message: "Lesson deleted successfully" });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    );
  }
}
