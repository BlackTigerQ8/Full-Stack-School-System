import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const attendance = await prisma.teacherAttendance.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error fetching teacher attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

// Helper function to remove replacements when teacher becomes present
async function removeReplacementsForPresentTeacher(
  teacherId: string,
  date: Date
) {
  try {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find and delete all replacements for this teacher on this date
    const removedReplacements = await prisma.teacherReplacement.deleteMany({
      where: {
        originalTeacherId: teacherId,
        date: {
          gte: targetDate,
          lt: nextDay,
        },
      },
    });

    console.log(
      `Removed ${
        removedReplacements.count
      } replacements for teacher ${teacherId} on ${date.toDateString()}`
    );

    return removedReplacements.count;
  } catch (error) {
    console.error("Error removing replacements:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== POST /api/attendance/teacher called ===");

    const session = await getServerSession(authOptions);
    console.log(
      "Session user:",
      session?.user?.id,
      "Role:",
      session?.user?.role
    );

    if (!session?.user || session.user.role !== "admin") {
      console.log("Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    const { teacherId, date, present, attendance: bulkAttendance } = body;

    // Handle bulk attendance
    if (bulkAttendance && Array.isArray(bulkAttendance)) {
      console.log(
        "Processing bulk attendance:",
        bulkAttendance.length,
        "records"
      );

      const results = [];
      for (const record of bulkAttendance) {
        try {
          const startDate = new Date(record.date);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);

          const existing = await prisma.teacherAttendance.findFirst({
            where: {
              teacherId: record.teacherId,
              date: {
                gte: startDate,
                lt: endDate,
              },
            },
          });

          // Check if this is a change from absent to present
          const wasAbsent = existing && !existing.present;
          const nowPresent = record.present;

          let replacementsRemoved = 0;
          if (wasAbsent && nowPresent) {
            // Remove replacements for this teacher on this date
            replacementsRemoved = await removeReplacementsForPresentTeacher(
              record.teacherId,
              new Date(record.date)
            );
          }

          if (existing) {
            const updated = await prisma.teacherAttendance.update({
              where: { id: existing.id },
              data: { present: record.present },
            });
            results.push({
              teacherId: record.teacherId,
              action: "updated",
              data: updated,
              replacementsRemoved,
            });
          } else {
            const created = await prisma.teacherAttendance.create({
              data: {
                date: new Date(record.date),
                present: record.present,
                teacherId: record.teacherId,
              },
            });
            results.push({
              teacherId: record.teacherId,
              action: "created",
              data: created,
              replacementsRemoved,
            });
          }
        } catch (error) {
          console.error(
            `Error processing attendance for teacher ${record.teacherId}:`,
            error
          );
          results.push({
            teacherId: record.teacherId,
            action: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      console.log("Bulk attendance results:", results);
      revalidatePath("/list/attendance");
      revalidatePath("/list/schedules");
      return NextResponse.json({ success: true, results });
    }

    // Handle single attendance
    if (!teacherId || !date || present === undefined) {
      console.log("Missing required fields:", { teacherId, date, present });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Processing single attendance for teacher:", teacherId);

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    console.log("Date range:", { startDate, endDate });

    const existingAttendance = await prisma.teacherAttendance.findFirst({
      where: {
        teacherId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    console.log("Existing attendance found:", existingAttendance);

    // Check if this is a change from absent to present
    const wasAbsent = existingAttendance && !existingAttendance.present;
    const nowPresent = present;

    let replacementsRemoved = 0;
    if (wasAbsent && nowPresent) {
      console.log(
        "Teacher changed from absent to present - removing replacements"
      );
      replacementsRemoved = await removeReplacementsForPresentTeacher(
        teacherId,
        new Date(date)
      );
    }

    let result;
    if (existingAttendance) {
      console.log("Updating existing record with ID:", existingAttendance.id);
      result = await prisma.teacherAttendance.update({
        where: { id: existingAttendance.id },
        data: { present },
      });
      console.log("Updated record:", result);
    } else {
      console.log("Creating new attendance record");
      result = await prisma.teacherAttendance.create({
        data: {
          date: new Date(date),
          present,
          teacherId,
        },
      });
      console.log("Created record:", result);
    }

    revalidatePath("/list/attendance");
    revalidatePath("/list/schedules");

    const responseMessage =
      replacementsRemoved > 0
        ? `Attendance updated and ${replacementsRemoved} replacement(s) removed`
        : "Attendance updated successfully";

    return NextResponse.json({
      success: true,
      data: result,
      replacementsRemoved,
      message: responseMessage,
    });
  } catch (error) {
    console.error("=== ERROR in POST /api/attendance/teacher ===");
    console.error("Error details:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "");
    return NextResponse.json(
      {
        error: "Failed to save attendance",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
