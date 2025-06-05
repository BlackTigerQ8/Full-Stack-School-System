import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { attendance, type } = body;

    if (!attendance || !Array.isArray(attendance)) {
      return NextResponse.json(
        { error: "Invalid attendance data" },
        { status: 400 }
      );
    }

    if (type === "teacher" && session.user.role === "admin") {
      // Handle teacher attendance (Admin functionality)
      const teacherAttendanceData = attendance.map((record: any) => ({
        date: new Date(record.date),
        present: record.present,
        teacherId: record.teacherId,
      }));

      // Delete existing records for this date and these teachers
      const targetDate = new Date(attendance[0].date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const teacherIds = attendance.map((record: any) => record.teacherId);

      await prisma.teacherAttendance.deleteMany({
        where: {
          date: {
            gte: targetDate,
            lt: nextDay,
          },
          teacherId: {
            in: teacherIds,
          },
        },
      });

      // Create new records
      await prisma.teacherAttendance.createMany({
        data: teacherAttendanceData,
      });

      revalidatePath("/list/attendance");
      return NextResponse.json({ success: true });
    } else if (type === "student" && session.user.role === "teacher") {
      // Handle student attendance (Teacher functionality)
      const { classId } = body;

      if (!classId) {
        return NextResponse.json(
          { error: "Class ID is required for student attendance" },
          { status: 400 }
        );
      }

      // Find a lesson for this class and teacher
      const lesson = await prisma.lesson.findFirst({
        where: {
          classId: parseInt(classId),
          teacherId: session.user.id,
        },
      });

      if (!lesson) {
        return NextResponse.json(
          { error: "No lesson found for this class" },
          { status: 404 }
        );
      }

      const targetDate = new Date(attendance[0].date);
      targetDate.setHours(12, 0, 0, 0);

      // Delete existing records for this date and lesson
      const studentIds = attendance.map((record: any) => record.studentId);

      await prisma.attendance.deleteMany({
        where: {
          date: targetDate,
          lessonId: lesson.id,
          studentId: {
            in: studentIds,
          },
        },
      });

      // Create new records
      const studentAttendanceData = attendance.map((record: any) => ({
        date: targetDate,
        present: record.present,
        studentId: record.studentId,
        lessonId: lesson.id,
      }));

      await prisma.attendance.createMany({
        data: studentAttendanceData,
      });

      revalidatePath("/list/attendance");
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Unauthorized for this operation" },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Error saving bulk attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
