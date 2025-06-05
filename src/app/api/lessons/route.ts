import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attendance } = await request.json();

    if (!Array.isArray(attendance) || attendance.length === 0) {
      return NextResponse.json(
        { error: "Invalid attendance data" },
        { status: 400 }
      );
    }

    // Get the teacher's lesson for this class
    const lesson = await prisma.lesson.findFirst({
      where: {
        classId: attendance[0].classId,
        teacherId: session.user.id,
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "You don't teach this class" },
        { status: 403 }
      );
    }

    // Check if attendance already exists for this date/lesson/students
    const existingAttendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: new Date(attendance[0].date),
          lt: new Date(
            new Date(attendance[0].date).getTime() + 24 * 60 * 60 * 1000
          ),
        },
        lessonId: lesson.id,
        studentId: {
          in: attendance.map((a: any) => a.studentId),
        },
      },
    });

    if (existingAttendance.length > 0) {
      // Update existing records
      await Promise.all(
        attendance.map(async (record: any) => {
          const existing = existingAttendance.find(
            (ea) => ea.studentId === record.studentId
          );

          if (existing) {
            return prisma.attendance.update({
              where: { id: existing.id },
              data: { present: record.present },
            });
          } else {
            return prisma.attendance.create({
              data: {
                date: new Date(record.date),
                present: record.present,
                studentId: record.studentId,
                lessonId: lesson.id,
              },
            });
          }
        })
      );
    } else {
      // Create new records
      await prisma.attendance.createMany({
        data: attendance.map((record: any) => ({
          date: new Date(record.date),
          present: record.present,
          studentId: record.studentId,
          lessonId: lesson.id,
        })),
      });
    }

    revalidatePath("/list/attendance");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving student attendance:", error);
    return NextResponse.json(
      { error: "Failed to save attendance" },
      { status: 500 }
    );
  }
}
