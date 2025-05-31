import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const lessons = await prisma.lesson.findMany({
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

    // Transform lessons to calendar event format
    const calendarEvents = lessons.map((lesson) => ({
      id: lesson.id,
      title: `${lesson.subject.name} - ${lesson.class.name}`,
      start: lesson.startTime,
      end: lesson.endTime,
      allDay: false,
      resource: {
        lessonId: lesson.id,
        subjectId: lesson.subjectId,
        classId: lesson.classId,
        teacherId: lesson.teacherId,
        teacher: `${lesson.teacher.name} ${lesson.teacher.surname}`,
      },
    }));

    return NextResponse.json(calendarEvents);
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, startTime, endTime, subjectId, classId, teacherId, day } =
      body;

    const lesson = await prisma.lesson.create({
      data: {
        name,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        subjectId: parseInt(subjectId),
        classId: parseInt(classId),
        teacherId,
        day,
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
      id: lesson.id,
      title: `${lesson.subject.name} - ${lesson.class.name}`,
      start: lesson.startTime,
      end: lesson.endTime,
      allDay: false,
    });
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    );
  }
}
