import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const classId = searchParams.get("classId");

    if (!date || !classId) {
      return NextResponse.json(
        { error: "Date and classId are required" },
        { status: 400 }
      );
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: targetDate,
          lt: nextDay,
        },
        lesson: {
          classId: parseInt(classId),
          teacherId: session.user.id,
        },
      },
      include: {
        student: {
          select: { id: true, name: true, surname: true },
        },
      },
    });

    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, date, present, classId } = body;

    if (!studentId || !date || present === undefined || !classId) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    const targetDate = new Date(date);
    targetDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

    // Check if attendance record already exists
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        date: targetDate,
        studentId,
        lessonId: lesson.id,
      },
    });

    let attendance;
    if (existingAttendance) {
      // Update existing record
      attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: { present },
      });
    } else {
      // Create new record
      attendance = await prisma.attendance.create({
        data: {
          date: targetDate,
          present,
          studentId,
          lessonId: lesson.id,
        },
      });
    }

    revalidatePath("/list/attendance");
    return NextResponse.json({ success: true, attendance });
  } catch (error) {
    console.error("Error saving student attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
