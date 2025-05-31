import { Day, PrismaClient, UserSex } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcryptjs";

async function main() {
  // ADMIN Users & Profiles
  const admin1User = await prisma.user.create({
    data: {
      id: "admin1",
      email: "admin1@school.com",
      username: "admin1",
      password: await bcrypt.hash("password123", 12),
      role: "admin",
    },
  });

  await prisma.admin.create({
    data: {
      id: admin1User.id,
      username: admin1User.username,
      civilId: "1111111111",
    },
  });

  // GRADES
  for (let i = 1; i <= 6; i++) {
    await prisma.grade.create({
      data: { level: i },
    });
  }

  // SUBJECTS
  const subjects = [
    "Mathematics",
    "Science",
    "English",
    "History",
    "Geography",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Art",
  ];
  for (const name of subjects) {
    await prisma.subject.create({ data: { name } });
  }

  // TEACHER Users & Profiles
  for (let i = 1; i <= 15; i++) {
    const teacherUser = await prisma.user.create({
      data: {
        id: `teacher${i}`,
        email: `teacher${i}@school.com`,
        username: `teacher${i}`,
        password: await bcrypt.hash("password123", 12),
        role: "teacher",
      },
    });

    await prisma.teacher.create({
      data: {
        id: teacherUser.id,
        username: teacherUser.username,
        civilId: `3333333${String(i).padStart(3, "0")}`,
        name: `TName${i}`,
        surname: `TSurname${i}`,
        email: `teacher${i}@example.com`,
        phone: `123-456-789${i}`,
        address: `Address${i}`,
        bloodType: "A+",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        subjects: { connect: [{ id: (i % 10) + 1 }] },
        birthday: new Date(
          new Date().setFullYear(new Date().getFullYear() - 30)
        ),
      },
    });
  }

  // CLASS (moved after TEACHER)
  for (let i = 1; i <= 6; i++) {
    await prisma.class.create({
      data: {
        name: `${i}A`,
        gradeId: i,
        capacity: Math.floor(Math.random() * (20 - 15 + 1)) + 15,
      },
    });
  }

  // Update teachers with classes after classes exist
  for (let i = 1; i <= 15; i++) {
    await prisma.teacher.update({
      where: { id: `teacher${i}` },
      data: {
        classes: { connect: [{ id: (i % 6) + 1 }] },
      },
    });
  }

  // LESSON
  for (let i = 1; i <= 30; i++) {
    await prisma.lesson.create({
      data: {
        name: `Lesson${i}`,
        day: Day[
          Object.keys(Day)[
            Math.floor(Math.random() * Object.keys(Day).length)
          ] as keyof typeof Day
        ],
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)),
        endTime: new Date(new Date().setHours(new Date().getHours() + 3)),
        subjectId: (i % 10) + 1,
        classId: (i % 6) + 1,
        teacherId: `teacher${(i % 15) + 1}`,
      },
    });
  }

  // PARENT Users & Profiles
  for (let i = 1; i <= 25; i++) {
    const parentUser = await prisma.user.create({
      data: {
        id: `parentId${i}`,
        email: `parent${i}@school.com`,
        username: `parentId${i}`,
        password: await bcrypt.hash("password123", 12),
        role: "parent",
      },
    });

    await prisma.parent.create({
      data: {
        id: parentUser.id,
        username: parentUser.username,
        civilId: `4444444${String(i).padStart(3, "0")}`,
        name: `PName ${i}`,
        surname: `PSurname ${i}`,
        email: `parent${i}@example.com`,
        phone: `123-456-789${i}`,
        address: `Address${i}`,
      },
    });
  }

  // STUDENT Users & Profiles
  for (let i = 1; i <= 50; i++) {
    const studentUser = await prisma.user.create({
      data: {
        id: `student${i}`,
        email: `student${i}@school.com`,
        username: `student${i}`,
        password: await bcrypt.hash("password123", 12),
        role: "student",
      },
    });

    await prisma.student.create({
      data: {
        id: studentUser.id,
        username: studentUser.username,
        name: `SName${i}`,
        surname: `SSurname ${i}`,
        civilId: `1234567890${i}`,
        email: `student${i}@example.com`,
        phone: `987-654-321${i}`,
        address: `Address${i}`,
        bloodType: "O-",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        parentId: `parentId${Math.ceil(i / 2) % 25 || 25}`,
        gradeId: (i % 6) + 1,
        classId: (i % 6) + 1,
        birthday: new Date(
          new Date().setFullYear(new Date().getFullYear() - 10)
        ),
      },
    });
  }

  // EXAM
  for (let i = 1; i <= 10; i++) {
    await prisma.exam.create({
      data: {
        title: `Exam ${i}`,
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)),
        endTime: new Date(new Date().setHours(new Date().getHours() + 2)),
        lessonId: (i % 30) + 1,
      },
    });
  }

  // ASSIGNMENT
  for (let i = 1; i <= 10; i++) {
    await prisma.assignment.create({
      data: {
        title: `Assignment ${i}`,
        startDate: new Date(new Date().setHours(new Date().getHours() + 1)),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
        lessonId: (i % 30) + 1,
      },
    });
  }

  // RESULT
  for (let i = 1; i <= 10; i++) {
    await prisma.result.create({
      data: {
        score: 90,
        studentId: `student${i}`,
        ...(i <= 5 ? { examId: i } : { assignmentId: i - 5 }),
      },
    });
  }

  // ATTENDANCE
  for (let i = 1; i <= 10; i++) {
    await prisma.attendance.create({
      data: {
        date: new Date(),
        present: true,
        studentId: `student${i}`,
        lessonId: (i % 30) + 1,
      },
    });
  }

  // EVENT
  for (let i = 1; i <= 5; i++) {
    await prisma.event.create({
      data: {
        title: `Event ${i}`,
        description: `Description for Event ${i}`,
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)),
        endTime: new Date(new Date().setHours(new Date().getHours() + 2)),
        classId: (i % 5) + 1,
      },
    });
  }

  // ANNOUNCEMENT
  for (let i = 1; i <= 5; i++) {
    await prisma.announcement.create({
      data: {
        title: `Announcement ${i}`,
        description: `Description for Announcement ${i}`,
        date: new Date(),
        classId: (i % 5) + 1,
      },
    });
  }

  console.log("Seeding completed successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
