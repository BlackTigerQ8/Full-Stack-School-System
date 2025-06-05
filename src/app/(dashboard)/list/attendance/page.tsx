import prisma from "@/lib/prisma";
import { getRole } from "@/lib/utils";
import AdminAttendance from "@/components/AdminAttendance";
import TeacherAttendance from "@/components/TeacherAttendance";
import StudentAttendance from "@/components/StudentAttendance";

type TeacherData = {
  id: string;
  name: string;
  surname: string;
  username: string;
};

type TeacherAttendanceRecord = {
  id: number;
  date: Date;
  present: boolean;
  teacherId: string;
};

type ClassData = {
  id: number;
  name: string;
};

type AttendanceRecord = {
  id: number;
  date: Date;
  present: boolean;
  student: { name: string; surname: string };
  lesson: {
    subject: { name: string };
    class: { name: string };
    teacher: { name: string; surname: string };
  };
};

const AttendancePage = async () => {
  const { role, currentUserId } = await getRole();

  // For Admin - get all teachers and their attendance
  let teachers: TeacherData[] = [];
  let teacherAttendance: TeacherAttendanceRecord[] = [];
  if (role === "admin") {
    teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        username: true,
      },
      orderBy: [{ name: "asc" }, { surname: "asc" }],
    });

    // Get today's teacher attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    teacherAttendance = await prisma.teacherAttendance.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
  }

  // For Teacher - get classes they teach
  let classes: ClassData[] = [];
  if (role === "teacher") {
    const teacherLessons = await prisma.lesson.findMany({
      where: { teacherId: currentUserId! },
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get unique classes
    const classMap = new Map<number, ClassData>();
    teacherLessons.forEach((lesson) => {
      classMap.set(lesson.class.id, lesson.class);
    });
    classes = Array.from(classMap.values());
  }

  // For Student/Parent - get attendance history
  let attendanceHistory: AttendanceRecord[] = [];
  if (role === "student" || role === "parent") {
    const whereCondition =
      role === "student"
        ? { studentId: currentUserId! }
        : { student: { parentId: currentUserId! } };

    attendanceHistory = await prisma.attendance.findMany({
      where: whereCondition,
      include: {
        student: { select: { name: true, surname: true } },
        lesson: {
          include: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
            teacher: { select: { name: true, surname: true } },
          },
        },
      },
      orderBy: { date: "desc" },
      take: 50,
    });
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">
          {role === "admin" && "Teacher Attendance"}
          {role === "teacher" && "Student Attendance"}
          {(role === "student" || role === "parent") && "Attendance History"}
        </h1>
      </div>

      {role === "admin" && (
        <AdminAttendance
          teachers={teachers}
          existingAttendance={teacherAttendance}
        />
      )}
      {role === "teacher" && <TeacherAttendance classes={classes} />}
      {(role === "student" || role === "parent") && (
        <StudentAttendance attendanceHistory={attendanceHistory} />
      )}
    </div>
  );
};

export default AttendancePage;
