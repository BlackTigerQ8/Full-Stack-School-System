import { Day, PrismaClient, UserSex } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcryptjs";

// Arabic names data
const maleFirstNames = [
  "عبدالله",
  "خالد",
  "محمد",
  "أحمد",
  "سالم",
  "فهد",
  "عبدالعزيز",
  "بدر",
  "نواف",
  "فيصل",
  "سعد",
  "تركي",
  "مشعل",
  "رائد",
  "ماجد",
  "وليد",
  "عبدالرحمن",
  "يوسف",
  "حمد",
  "طلال",
  "عبدالمجيد",
  "سلطان",
  "مبارك",
  "جاسم",
  "راشد",
  "منصور",
  "عادل",
  "صالح",
  "ناصر",
  "عمر",
];

const femaleFirstNames = [
  "فاطمة",
  "عائشة",
  "مريم",
  "نورا",
  "سارة",
  "هند",
  "رغد",
  "شيماء",
  "دانة",
  "لطيفة",
  "أمل",
  "منى",
  "نادية",
  "سميرة",
  "رنا",
  "هالة",
  "ريم",
  "نوال",
  "سلمى",
  "زينب",
  "جواهر",
  "عبير",
  "أسماء",
  "خديجة",
  "ملاك",
  "شهد",
  "غادة",
  "نور",
  "رهف",
  "بدرية",
];

const lastNames = [
  "العنزي",
  "الحربي",
  "المطيري",
  "العتيبي",
  "الرشيد",
  "الشمري",
  "الدوسري",
  "القحطاني",
  "الغامدي",
  "الزهراني",
  "الجهني",
  "البلوي",
  "الثبيتي",
  "السبيعي",
  "الخالدي",
  "النفيعي",
  "الرويلي",
  "العازمي",
  "الرقيبي",
  "الصباح",
  "العجمي",
  "الكندري",
  "الفهد",
  "المنصور",
  "الديحاني",
  "الهاجري",
  "الفضلي",
  "البناي",
  "الكعبي",
  "الصالح",
];

// Kuwaiti addresses
const kuwaitiAreas = [
  "السالمية",
  "حولي",
  "الفروانية",
  "الجهراء",
  "الأحمدي",
  "مبارك الكبير",
  "الفحيحيل",
  "الرقة",
  "المنقف",
  "الفنطاس",
  "الشعب",
  "القادسية",
  "بيان",
  "صباح السالم",
  "جنوب السرة",
  "العديلية",
  "الجابرية",
  "كيفان",
];

// Realistic school subjects in Arabic/English
const subjects = [
  "الرياضيات - Mathematics",
  "العلوم - Science",
  "اللغة العربية - Arabic Language",
  "اللغة الإنجليزية - English Language",
  "التاريخ - History",
  "الجغرافيا - Geography",
  "الفيزياء - Physics",
  "الكيمياء - Chemistry",
  "الأحياء - Biology",
  "الحاسوب - Computer Science",
  "التربية الإسلامية - Islamic Education",
  "التربية الفنية - Art Education",
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

// NEW: Create lesson schedule without conflicts
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
  const timeSlots = [8, 9, 10, 11, 12, 13, 14, 15];

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
    "درس الرياضيات",
    "حصة العلوم",
    "اللغة العربية",
    "اللغة الإنجليزية",
    "التاريخ الإسلامي",
    "الجغرافيا",
    "الفيزياء التطبيقية",
    "تجارب الكيمياء",
    "علم الأحياء",
    "الحاسوب",
    "التربية الإسلامية",
    "الفنون",
  ];

  // Track teacher schedules to avoid conflicts
  const teacherSchedules: Map<string, Set<string>> = new Map();

  // Initialize teacher schedules
  for (let i = 1; i <= 15; i++) {
    teacherSchedules.set(`teacher${i}`, new Set());
  }

  // Create realistic schedules for each teacher
  for (let teacherIndex = 1; teacherIndex <= 15; teacherIndex++) {
    const teacherId = `teacher${teacherIndex}`;
    const teacherSlots = teacherSchedules.get(teacherId)!;

    // Each teacher gets 4-6 lessons per week
    const lessonsPerWeek = 4 + Math.floor(Math.random() * 3); // 4-6 lessons

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
          classId: (schedule.length % 6) + 1,
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
  // Clear existing data
  await prisma.result.deleteMany();
  await prisma.attendance.deleteMany();
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

  // ADMIN Users & Profiles - Create two admins
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

  // GRADES
  for (let i = 1; i <= 6; i++) {
    await prisma.grade.create({
      data: { level: i },
    });
  }

  // SUBJECTS
  for (const name of subjects) {
    await prisma.subject.create({ data: { name } });
  }

  // TEACHER Users & Profiles
  for (let i = 1; i <= 15; i++) {
    const isMale = Math.random() > 0.5;
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
        address: `${getRandomElement(kuwaitiAreas)}, الكويت`,
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

  // CLASSES
  const classNames = [
    "الأولى أ",
    "الثانية أ",
    "الثالثة أ",
    "الرابعة أ",
    "الخامسة أ",
    "السادسة أ",
  ];
  for (let i = 1; i <= 6; i++) {
    await prisma.class.create({
      data: {
        name: classNames[i - 1],
        gradeId: i,
        capacity: 25 + Math.floor(Math.random() * 10),
        supervisorId: `teacher${((i - 1) % 15) + 1}`,
      },
    });
  }

  // Update teachers with classes
  for (let i = 1; i <= 15; i++) {
    await prisma.teacher.update({
      where: { id: `teacher${i}` },
      data: {
        classes: { connect: [{ id: ((i - 1) % 6) + 1 }] },
      },
    });
  }

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

  // PARENT Users & Profiles
  for (let i = 1; i <= 25; i++) {
    const isMale = Math.random() > 0.5;
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
        address: `${getRandomElement(kuwaitiAreas)}, الكويت`,
      },
    });
  }

  // STUDENT Users & Profiles
  for (let i = 1; i <= 50; i++) {
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
        address: `${getRandomElement(kuwaitiAreas)}, الكويت`,
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
        parentId: `parent${((i - 1) % 25) + 1}`,
        gradeId: ((i - 1) % 6) + 1,
        classId: ((i - 1) % 6) + 1,
        birthday: new Date(
          2010 + Math.floor(Math.random() * 8),
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28)
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

console.log("تم إنشاء البيانات بنجاح - Seeding completed successfully!");
console.log("المسؤولين: admin1, admin2");
console.log("كلمة المرور للجميع: 123123");

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
