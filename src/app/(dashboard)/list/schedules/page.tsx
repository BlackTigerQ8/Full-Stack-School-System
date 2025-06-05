import prisma from "@/lib/prisma";
import { getRole } from "@/lib/utils";
import { redirect } from "next/navigation";
import TeacherSchedulesManager from "@/components/TeacherSchedulesManager";

const TeacherSchedulesPage = async () => {
  const { role } = await getRole();

  // Only admin can access this page
  if (role !== "admin") {
    redirect("/");
  }

  // Get all teachers with their lessons and attendance
  const teachers = await prisma.teacher.findMany({
    include: {
      lessons: {
        include: {
          subject: true,
          class: true,
        },
        orderBy: [{ day: "asc" }, { startTime: "asc" }],
      },
      attendances: {
        orderBy: { date: "desc" },
        take: 30, // Last 30 attendance records
      },
    },
  });

  // Get today's teacher attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const todayAttendance = await prisma.teacherAttendance.findMany({
    where: {
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  // For now, return empty array for replacements until Prisma client is updated
  const todayReplacements: any[] = [];

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">
          Teacher Schedules & Replacements
        </h1>
      </div>

      <TeacherSchedulesManager
        teachers={teachers}
        todayAttendance={todayAttendance}
        todayReplacements={todayReplacements}
      />
    </div>
  );
};

export default TeacherSchedulesPage;
