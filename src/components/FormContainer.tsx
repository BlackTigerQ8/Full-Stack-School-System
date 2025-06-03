import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type FormContainerProps = {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement"
    | "grade";
  type: "create" | "update" | "delete" | "createGrade";
  data?: any;
  id?: number | string;
};

// Common blood types for dropdowns
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData = {};

  // Get current user session
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
  const role = session?.user?.role?.toLowerCase();

  if (type !== "delete") {
    switch (table) {
      case "subject":
        const subjectTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
          orderBy: [{ name: "asc" }, { surname: "asc" }],
        });
        relatedData = { teachers: subjectTeachers };
        break;

      case "class":
        const classGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
          orderBy: { level: "asc" },
        });
        const classTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
          orderBy: [{ name: "asc" }, { surname: "asc" }],
        });
        relatedData = { teachers: classTeachers, grades: classGrades };
        break;

      case "teacher":
        const teacherSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
        relatedData = {
          subjects: teacherSubjects,
          bloodTypes: BLOOD_TYPES,
        };
        break;

      case "student":
        const studentGrades = await prisma.grade.findMany({
          select: { id: true, level: true },
          orderBy: { level: "asc" },
        });
        const studentClasses = await prisma.class.findMany({
          include: {
            _count: { select: { students: true } },
            grade: { select: { level: true } },
          },
          orderBy: { name: "asc" },
        });
        const studentParents = await prisma.parent.findMany({
          select: { id: true, name: true, surname: true },
          orderBy: [{ name: "asc" }, { surname: "asc" }],
        });
        relatedData = {
          classes: studentClasses,
          grades: studentGrades,
          parents: studentParents,
          bloodTypes: BLOOD_TYPES,
        };
        break;

      case "parent":
        relatedData = {
          bloodTypes: BLOOD_TYPES, // In case parent forms need blood types
        };
        break;

      case "lesson":
        const lessonSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
        const lessonClasses = await prisma.class.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
        const lessonTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
          orderBy: [{ name: "asc" }, { surname: "asc" }],
        });
        relatedData = {
          subjects: lessonSubjects,
          classes: lessonClasses,
          teachers: lessonTeachers,
        };
        break;

      case "exam":
        const examLessons = await prisma.lesson.findMany({
          where: {
            ...(role === "teacher" ? { teacherId: currentUserId! } : {}),
          },
          select: {
            id: true,
            name: true,
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
          orderBy: { name: "asc" },
        });
        relatedData = { lessons: examLessons };
        break;

      case "assignment":
        const assignmentLessons = await prisma.lesson.findMany({
          where: {
            ...(role === "teacher" ? { teacherId: currentUserId! } : {}),
          },
          select: {
            id: true,
            name: true,
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
          orderBy: { name: "asc" },
        });
        relatedData = { lessons: assignmentLessons };
        break;

      case "result":
        const resultExams = await prisma.exam.findMany({
          select: {
            id: true,
            title: true,
            lesson: {
              select: {
                name: true,
                subject: { select: { name: true } },
              },
            },
          },
          orderBy: { title: "asc" },
        });
        const resultAssignments = await prisma.assignment.findMany({
          select: {
            id: true,
            title: true,
            lesson: {
              select: {
                name: true,
                subject: { select: { name: true } },
              },
            },
          },
          orderBy: { title: "asc" },
        });
        const resultStudents = await prisma.student.findMany({
          select: {
            id: true,
            name: true,
            surname: true,
            class: { select: { name: true } },
          },
          orderBy: [{ name: "asc" }, { surname: "asc" }],
        });
        relatedData = {
          exams: resultExams,
          assignments: resultAssignments,
          students: resultStudents,
        };
        break;

      case "attendance":
        const attendanceStudents = await prisma.student.findMany({
          select: {
            id: true,
            name: true,
            surname: true,
            class: { select: { name: true } },
          },
          orderBy: [{ name: "asc" }, { surname: "asc" }],
        });
        const attendanceLessons = await prisma.lesson.findMany({
          where: {
            ...(role === "teacher" ? { teacherId: currentUserId! } : {}),
          },
          select: {
            id: true,
            name: true,
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
          orderBy: { name: "asc" },
        });
        relatedData = {
          students: attendanceStudents,
          lessons: attendanceLessons,
        };
        break;

      case "event":
        const eventClasses = await prisma.class.findMany({
          select: {
            id: true,
            name: true,
            grade: { select: { level: true } },
          },
          orderBy: { name: "asc" },
        });
        relatedData = { classes: eventClasses };
        break;

      case "announcement":
        const announcementClasses = await prisma.class.findMany({
          select: {
            id: true,
            name: true,
            grade: { select: { level: true } },
          },
          orderBy: { name: "asc" },
        });
        relatedData = { classes: announcementClasses };
        break;

      default:
        break;
    }
  }

  return (
    <div className="">
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
      />
    </div>
  );
};

export default FormContainer;
