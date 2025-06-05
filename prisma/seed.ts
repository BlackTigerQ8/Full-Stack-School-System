import { Day, PrismaClient, UserSex } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcryptjs";

// Arabian names in English transliteration
const maleFirstNames = [
  "Abdullah",
  "Khalid",
  "Mohammed",
  "Ahmed",
  "Salem",
  "Fahad",
  "Abdulaziz",
  "Badr",
  "Nawaf",
  "Faisal",
  "Saad",
  "Turki",
  "Mishaal",
  "Raed",
  "Majed",
  "Waleed",
  "Abdulrahman",
  "Youssef",
  "Hamad",
  "Talal",
  "Abdulmajeed",
  "Sultan",
  "Mubarak",
  "Jasim",
  "Rashid",
  "Mansour",
  "Adel",
  "Saleh",
  "Nasser",
  "Omar",
];

const femaleFirstNames = [
  "Fatima",
  "Aisha",
  "Maryam",
  "Nora",
  "Sarah",
  "Hind",
  "Raghad",
  "Shaima",
  "Dana",
  "Latifa",
  "Amal",
  "Mona",
  "Nadia",
  "Samira",
  "Rana",
  "Hala",
  "Reem",
  "Nawal",
  "Salma",
  "Zainab",
  "Jawaher",
  "Abeer",
  "Asma",
  "Khadija",
  "Malak",
  "Shahad",
  "Ghada",
  "Nour",
  "Rahaf",
  "Badriya",
];

const lastNames = [
  "Al-Anzi",
  "Al-Harbi",
  "Al-Mutairi",
  "Al-Otaibi",
  "Al-Rashid",
  "Al-Shammari",
  "Al-Dosari",
  "Al-Dhafiri",
  "Al-Majed",
  "Al-Thubaiti",
  "Al-Subiei",
  "Al-Khalidi",
  "Al-Nafiei",
  "Al-Ruwaili",
  "Al-Azmi",
  "Al-Raqibi",
  "Al-Sabah",
  "Al-Ajmi",
  "Al-Kandari",
  "Al-Fahad",
  "Al-Mansour",
  "Al-Deihani",
  "Al-Hajri",
  "Al-Fadhli",
  "Al-Binai",
  "Al-Kaabi",
  "Al-Saleh",
];

// Kuwaiti areas in English
const kuwaitiAreas = [
  "Salmiya",
  "Hawalli",
  "Farwaniya",
  "Jahra",
  "Ahmadi",
  "Mubarak Al-Kabeer",
  "Fahaheel",
  "Ruqqa",
  "Mangaf",
  "Fintas",
  "Shaab",
  "Qadisiya",
  "Bayan",
  "Sabah Al-Salem",
  "South Surra",
  "Adailiya",
  "Jabriya",
  "Kheiran",
];

// School subjects in English
const subjects = [
  "Mathematics",
  "Science",
  "Arabic Language",
  "English Language",
  "History",
  "Geography",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Islamic Education",
  "Art Education",
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateCivilId(): string {
  const prefix = Math.random() > 0.5 ? "2" : "3";
  const remaining = Math.floor(Math.random() * 10000000000)
    .toString()
    .padStart(11, "0");
  return prefix + remaining;
}

function generateKuwaitiPhone(): string {
  const firstDigit = getRandomElement(["9", "6", "5"]);
  const remaining = Math.floor(Math.random() * 10000000)
    .toString()
    .padStart(7, "0");
  return firstDigit + remaining;
}

// Create lesson schedule without conflicts
function createLessonSchedule() {
  const schedule: {
    teacherId: string;
    day: Day;
    startHour: number;
    endHour: number;
    subjectId: number;
    classId: number;
    name: string;
  }[] = [];

  // Define time slots (8 AM to 3 PM, 1-hour slots)
  const timeSlots = [8, 9, 10, 11, 12, 13, 14];

  // Days of the week (Kuwait work week)
  const workDays = [
    Day.SUNDAY,
    Day.MONDAY,
    Day.TUESDAY,
    Day.WEDNESDAY,
    Day.THURSDAY,
  ];

  // Subject names for lessons
  const lessonNames = [
    "Mathematics Class",
    "Science Laboratory",
    "Arabic Literature",
    "English Grammar",
    "Islamic History",
    "World Geography",
    "Applied Physics",
    "Chemistry Experiments",
    "Biology Study",
    "Computer Programming",
    "Islamic Studies",
    "Art Workshop",
  ];

  // Track teacher schedules to avoid conflicts
  const teacherSchedules: Map<string, Set<string>> = new Map();

  // Initialize teacher schedules
  for (let i = 1; i <= 20; i++) {
    teacherSchedules.set(`teacher${i}`, new Set());
  }

  // Create realistic schedules for each teacher
  for (let teacherIndex = 1; teacherIndex <= 20; teacherIndex++) {
    const teacherId = `teacher${teacherIndex}`;
    const teacherSlots = teacherSchedules.get(teacherId)!;

    // Each teacher gets 5-8 lessons per week
    const lessonsPerWeek = 5 + Math.floor(Math.random() * 4); // 5-8 lessons

    let lessonsScheduled = 0;
    let attempts = 0;
    const maxAttempts = 50;

    while (lessonsScheduled < lessonsPerWeek && attempts < maxAttempts) {
      attempts++;

      // Random day and time
      const day = getRandomElement(workDays);
      const startHour = getRandomElement(timeSlots.slice(0, -1)); // Ensure there's room for 1-hour lesson
      const endHour = startHour + 1;

      // Create unique slot identifier
      const slotId = `${day}-${startHour}`;

      // Check if teacher is already busy at this time
      if (!teacherSlots.has(slotId)) {
        // Add to teacher's schedule
        teacherSlots.add(slotId);

        // Create lesson
        schedule.push({
          teacherId,
          day,
          startHour,
          endHour,
          subjectId: ((teacherIndex - 1) % subjects.length) + 1,
          classId: (schedule.length % 8) + 1,
          name: getRandomElement(lessonNames),
        });

        lessonsScheduled++;
      }
    }
  }

  console.log(`✅ Created ${schedule.length} conflict-free lessons`);
  console.log(
    `✅ Teacher1 has ${
      schedule.filter((l) => l.teacherId === "teacher1").length
    } lessons`
  );

  return schedule;
}

async function main() {
  console.log("🧹 Clearing existing data...");

  // Clear existing data in proper order with error handling
  try {
    await prisma.result.deleteMany();
    await prisma.attendance.deleteMany();
  } catch (error) {
    console.log("Note: Some tables might not exist yet, continuing...");
  }

  try {
    await prisma.teacherAttendance.deleteMany();
  } catch (error) {
    console.log(
      "Note: TeacherAttendance table doesn't exist yet, will be created..."
    );
  }

  try {
    await prisma.assignment.deleteMany();
    await prisma.exam.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.event.deleteMany();
    await prisma.student.deleteMany();
    await prisma.parent.deleteMany();
    await prisma.teacher.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.class.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.grade.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    console.log("Note: Some cleanup operations failed, continuing...");
  }

  console.log("👨‍💼 Creating admin users...");

  // ADMIN Users & Profiles - Create three admins
  const admin1User = await prisma.user.create({
    data: {
      id: "admin1",
      email: "admin@school.edu.kw",
      username: "admin1",
      password: await bcrypt.hash("123123", 12),
      role: "admin",
    },
  });

  await prisma.admin.create({
    data: {
      id: admin1User.id,
      username: admin1User.username,
      civilId: generateCivilId(),
    },
  });

  const admin2User = await prisma.user.create({
    data: {
      id: "admin2",
      email: "supervisor@school.edu.kw",
      username: "admin2",
      password: await bcrypt.hash("123123", 12),
      role: "admin",
    },
  });

  await prisma.admin.create({
    data: {
      id: admin2User.id,
      username: admin2User.username,
      civilId: generateCivilId(),
    },
  });

  console.log("📚 Creating grades and subjects...");

  // GRADES - Create 6 grades (1st through 6th)
  for (let i = 1; i <= 6; i++) {
    await prisma.grade.create({
      data: { level: i },
    });
  }

  // SUBJECTS
  for (const name of subjects) {
    await prisma.subject.create({ data: { name } });
  }

  console.log("👨‍🏫 Creating teachers...");

  // TEACHER Users & Profiles - Create 20 teachers
  for (let i = 1; i <= 20; i++) {
    const isMale = Math.random() > 0.4; // 60% male, 40% female
    const firstName = isMale
      ? getRandomElement(maleFirstNames)
      : getRandomElement(femaleFirstNames);
    const lastName = getRandomElement(lastNames);

    const teacherUser = await prisma.user.create({
      data: {
        id: `teacher${i}`,
        email: `teacher${i}@school.edu.kw`,
        username: `teacher${i}`,
        password: await bcrypt.hash("123123", 12),
        role: "teacher",
      },
    });

    await prisma.teacher.create({
      data: {
        id: teacherUser.id,
        username: teacherUser.username,
        civilId: generateCivilId(),
        name: firstName,
        surname: lastName,
        email: `teacher${i}@school.edu.kw`,
        phone: generateKuwaitiPhone(),
        address: `${getRandomElement(kuwaitiAreas)}, Kuwait`,
        bloodType: getRandomElement([
          "A+",
          "B+",
          "AB+",
          "O+",
          "A-",
          "B-",
          "AB-",
          "O-",
        ]),
        sex: isMale ? UserSex.MALE : UserSex.FEMALE,
        subjects: { connect: [{ id: (i % subjects.length) + 1 }] },
        birthday: new Date(
          1980 + Math.floor(Math.random() * 20),
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28)
        ),
      },
    });
  }

  console.log("🏫 Creating classes...");

  // CLASSES - Create 8 classes
  const classNames = [
    "Grade 1-A",
    "Grade 2-A",
    "Grade 3-A",
    "Grade 4-A",
    "Grade 5-A",
    "Grade 6-A",
    "Grade 1-B",
    "Grade 2-B",
  ];
  for (let i = 1; i <= 8; i++) {
    await prisma.class.create({
      data: {
        name: classNames[i - 1],
        gradeId: ((i - 1) % 6) + 1,
        capacity: 25 + Math.floor(Math.random() * 15), // 25-40 students per class
        supervisorId: `teacher${((i - 1) % 20) + 1}`,
      },
    });
  }

  // Update teachers with classes
  for (let i = 1; i <= 20; i++) {
    await prisma.teacher.update({
      where: { id: `teacher${i}` },
      data: {
        classes: { connect: [{ id: ((i - 1) % 8) + 1 }] },
      },
    });
  }

  console.log("📅 Creating lessons schedule...");

  // LESSONS - Create conflict-free schedule
  const lessonSchedule = createLessonSchedule();

  // Get next Monday for lesson dates
  const today = new Date();
  const nextMonday = new Date(today);
  const daysUntilMonday = (1 - today.getDay() + 7) % 7;
  nextMonday.setDate(today.getDate() + daysUntilMonday);

  for (const lesson of lessonSchedule) {
    // Calculate the actual date based on the day
    const lessonDate = new Date(nextMonday);
    const dayOffset =
      lesson.day === Day.SUNDAY
        ? 6
        : lesson.day === Day.MONDAY
        ? 0
        : lesson.day === Day.TUESDAY
        ? 1
        : lesson.day === Day.WEDNESDAY
        ? 2
        : 3;
    lessonDate.setDate(nextMonday.getDate() + dayOffset);
    lessonDate.setHours(lesson.startHour, 0, 0, 0);

    const endTime = new Date(lessonDate);
    endTime.setHours(lesson.endHour, 0, 0, 0);

    await prisma.lesson.create({
      data: {
        name: lesson.name,
        day: lesson.day,
        startTime: lessonDate,
        endTime: endTime,
        subjectId: lesson.subjectId,
        classId: lesson.classId,
        teacherId: lesson.teacherId,
      },
    });
  }

  console.log("👨‍👩‍👧‍👦 Creating parents...");

  // PARENT Users & Profiles - Create 40 parents
  for (let i = 1; i <= 40; i++) {
    const isMale = Math.random() > 0.3; // 70% male, 30% female (more fathers as primary contacts)
    const firstName = isMale
      ? getRandomElement(maleFirstNames)
      : getRandomElement(femaleFirstNames);
    const lastName = getRandomElement(lastNames);

    const parentUser = await prisma.user.create({
      data: {
        id: `parent${i}`,
        email: `parent${i}@gmail.com`,
        username: `parent${i}`,
        password: await bcrypt.hash("123123", 12),
        role: "parent",
      },
    });

    await prisma.parent.create({
      data: {
        id: parentUser.id,
        username: parentUser.username,
        civilId: generateCivilId(),
        name: firstName,
        surname: lastName,
        email: `parent${i}@gmail.com`,
        phone: generateKuwaitiPhone(),
        address: `${getRandomElement(kuwaitiAreas)}, Kuwait`,
      },
    });
  }

  console.log("👦👧 Creating students...");

  // STUDENT Users & Profiles - Create 80 students
  for (let i = 1; i <= 80; i++) {
    const isMale = Math.random() > 0.5;
    const firstName = isMale
      ? getRandomElement(maleFirstNames)
      : getRandomElement(femaleFirstNames);
    const lastName = getRandomElement(lastNames);

    const studentUser = await prisma.user.create({
      data: {
        id: `student${i}`,
        email: `student${i}@student.school.edu.kw`,
        username: `student${i}`,
        password: await bcrypt.hash("123123", 12),
        role: "student",
      },
    });

    await prisma.student.create({
      data: {
        id: studentUser.id,
        username: studentUser.username,
        name: firstName,
        surname: lastName,
        civilId: generateCivilId(),
        email: `student${i}@student.school.edu.kw`,
        phone: generateKuwaitiPhone(),
        address: `${getRandomElement(kuwaitiAreas)}, Kuwait`,
        bloodType: getRandomElement([
          "A+",
          "B+",
          "AB+",
          "O+",
          "A-",
          "B-",
          "AB-",
          "O-",
        ]),
        sex: isMale ? UserSex.MALE : UserSex.FEMALE,
        parentId: `parent${((i - 1) % 40) + 1}`,
        gradeId: ((i - 1) % 6) + 1,
        classId: ((i - 1) % 8) + 1,
        birthday: new Date(
          2010 + Math.floor(Math.random() * 8),
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28)
        ),
      },
    });
  }

  console.log("📝 Creating exams and assignments...");

  // EXAMS - Create realistic exams
  const allLessons = await prisma.lesson.findMany();
  for (let i = 1; i <= 25; i++) {
    const lesson = getRandomElement(allLessons);
    const examDate = new Date();
    examDate.setDate(examDate.getDate() + Math.floor(Math.random() * 30) + 1); // Next 30 days

    await prisma.exam.create({
      data: {
        title: `${lesson.name} - Midterm Exam ${i}`,
        startTime: new Date(
          examDate.setHours(8 + Math.floor(Math.random() * 4), 0, 0, 0)
        ),
        endTime: new Date(examDate.setHours(examDate.getHours() + 2, 0, 0, 0)),
        lessonId: lesson.id,
      },
    });
  }

  // ASSIGNMENTS - Create realistic assignments
  for (let i = 1; i <= 30; i++) {
    const lesson = getRandomElement(allLessons);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 15)); // Next 15 days
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + 7); // 1 week to complete

    await prisma.assignment.create({
      data: {
        title: `${lesson.name} - Assignment ${i}`,
        startDate: startDate,
        dueDate: dueDate,
        lessonId: lesson.id,
      },
    });
  }

  console.log("📊 Creating exam and assignment results...");

  // RESULTS - Create realistic student results
  const allExams = await prisma.exam.findMany();
  const allAssignments = await prisma.assignment.findMany();
  const allStudents = await prisma.student.findMany();

  // Exam results
  for (const exam of allExams) {
    // Not all students take every exam, simulate some realistic participation
    const participatingStudents = allStudents.filter(() => Math.random() > 0.2); // 80% participation

    for (const student of participatingStudents) {
      // Generate realistic grades with normal distribution
      const baseScore = 70 + Math.random() * 30; // 70-100 base
      const finalScore = Math.max(
        0,
        Math.min(100, Math.floor(baseScore + (Math.random() - 0.5) * 20))
      );

      await prisma.result.create({
        data: {
          score: finalScore,
          studentId: student.id,
          examId: exam.id,
        },
      });
    }
  }

  // Assignment results
  for (const assignment of allAssignments) {
    const participatingStudents = allStudents.filter(
      () => Math.random() > 0.15
    ); // 85% participation

    for (const student of participatingStudents) {
      const baseScore = 75 + Math.random() * 25; // 75-100 base (assignments typically score higher)
      const finalScore = Math.max(
        0,
        Math.min(100, Math.floor(baseScore + (Math.random() - 0.5) * 15))
      );

      await prisma.result.create({
        data: {
          score: finalScore,
          studentId: student.id,
          assignmentId: assignment.id,
        },
      });
    }
  }

  console.log("📅 Creating attendance records...");

  // STUDENT ATTENDANCE - Create realistic attendance for past 30 days
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const attendanceDate = new Date();
    attendanceDate.setDate(attendanceDate.getDate() - dayOffset);

    // Skip weekends (Friday, Saturday in Kuwait)
    if (attendanceDate.getDay() === 5 || attendanceDate.getDay() === 6)
      continue;

    for (const lesson of allLessons) {
      // Get students in this lesson's class
      const classStudents = allStudents.filter(
        (s) => s.classId === lesson.classId
      );

      for (const student of classStudents) {
        // 92% attendance rate (realistic for schools)
        const isPresent = Math.random() > 0.08;

        await prisma.attendance.create({
          data: {
            date: attendanceDate,
            present: isPresent,
            studentId: student.id,
            lessonId: lesson.id,
          },
        });
      }
    }
  }

  // TEACHER ATTENDANCE - Create realistic teacher attendance for past 30 days
  const allTeachers = await prisma.teacher.findMany();
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const attendanceDate = new Date();
    attendanceDate.setDate(attendanceDate.getDate() - dayOffset);

    // Skip weekends
    if (attendanceDate.getDay() === 5 || attendanceDate.getDay() === 6)
      continue;

    for (const teacher of allTeachers) {
      // 95% attendance rate for teachers
      const isPresent = Math.random() > 0.05;

      await prisma.teacherAttendance.create({
        data: {
          date: attendanceDate,
          present: isPresent,
          teacherId: teacher.id,
        },
      });
    }
  }

  console.log("🎉 Creating events and announcements...");

  // EVENTS - Create school events
  const eventTitles = [
    "Science Fair 2024",
    "Sports Day",
    "Parent-Teacher Conference",
    "Art Exhibition",
    "National Day Celebration",
    "Mathematics Competition",
    "Reading Week",
    "Cultural Festival",
    "Field Trip to Kuwait Towers",
    "Graduation Ceremony",
  ];

  for (let i = 0; i < eventTitles.length; i++) {
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 60) + 1); // Next 60 days

    await prisma.event.create({
      data: {
        title: eventTitles[i],
        description: `Join us for the ${eventTitles[i]}. This will be an exciting event for students, teachers, and parents.`,
        startTime: new Date(eventDate.setHours(9, 0, 0, 0)),
        endTime: new Date(eventDate.setHours(15, 0, 0, 0)),
        classId: Math.random() > 0.3 ? (i % 8) + 1 : null, // 70% class-specific, 30% school-wide
      },
    });
  }

  // ANNOUNCEMENTS - Create school announcements
  const announcements = [
    {
      title: "New School Policy Updates",
      description:
        "Please review the updated school policies that will take effect next month. All students and parents should be familiar with these changes.",
    },
    {
      title: "Exam Schedule Released",
      description:
        "The final exam schedule for this semester has been published. Please check your class schedules and prepare accordingly.",
    },
    {
      title: "Library Hours Extended",
      description:
        "Starting this week, the school library will be open until 6 PM to provide more study time for students.",
    },
    {
      title: "Health and Safety Reminder",
      description:
        "Please ensure all students follow the health and safety guidelines. Remember to bring water bottles and wear appropriate uniforms.",
    },
    {
      title: "Parent Volunteer Opportunities",
      description:
        "We are looking for parent volunteers for upcoming school events. Please contact the administration office if you are interested.",
    },
    {
      title: "Technology Workshop for Students",
      description:
        "Free computer programming workshop will be held every Tuesday after school. Registration is open for grades 4-6.",
    },
  ];

  for (let i = 0; i < announcements.length; i++) {
    const announcement = announcements[i];
    const announcementDate = new Date();
    announcementDate.setDate(
      announcementDate.getDate() - Math.floor(Math.random() * 7)
    ); // Past week

    await prisma.announcement.create({
      data: {
        title: announcement.title,
        description: announcement.description,
        date: announcementDate,
        classId: Math.random() > 0.4 ? (i % 8) + 1 : null, // 60% class-specific, 40% school-wide
      },
    });
  }

  console.log("✅ Seeding completed successfully!");
  console.log("📋 Summary:");
  console.log("👨‍💼 Admins: 2 (admin1, admin2)");
  console.log("👨‍🏫 Teachers: 20 (teacher1-teacher20)");
  console.log("👦👧 Students: 80 (student1-student80)");
  console.log("👨‍👩‍👧‍👦 Parents: 40 (parent1-parent40)");
  console.log("🏫 Classes: 8");
  console.log("📚 Subjects: 12");
  console.log("📅 Lessons: ~120 (distributed across the week)");
  console.log("📝 Exams: 25");
  console.log("📄 Assignments: 30");
  console.log("📊 Results: ~4000 (exam + assignment results)");
  console.log("📅 Attendance Records: ~60,000 (student + teacher for 30 days)");
  console.log("🎉 Events: 10");
  console.log("📢 Announcements: 6");
  console.log("🔑 Default password for all users: 123123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("🔌 Database connection closed");
  })
  .catch(async (e) => {
    console.error("❌ Error during seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
