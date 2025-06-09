import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { Class, Lesson, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import { getRole } from "@/lib/utils";
import { redirect } from "next/navigation";
import DateFilter from "@/components/DateFilter";

type ArchivedLessonList = Lesson & {
  teacher: Teacher;
  subject: Subject;
  class: Class;
};

const columns = [
  {
    header: "Subject Name",
    accessor: "name",
  },
  {
    header: "Class",
    accessor: "class",
  },
  {
    header: "Teacher",
    accessor: "teacher",
  },
  {
    header: "Archive Date",
    accessor: "updatedAt",
  },
];

const renderRow = (item: ArchivedLessonList) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-customPurpleLight"
  >
    <td className="p-4">{item.subject.name}</td>
    <td className="p-4">{item.class.name}</td>
    <td className="p-4">{item.teacher.name + " " + item.teacher.surname}</td>
    <td className="p-4">{new Date(item.updatedAt).toLocaleDateString()}</td>
  </tr>
);

const ArchivedLessonsPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { role } = await getRole();

  // Only admin can access this page
  if (role !== "admin") {
    redirect("/");
  }

  const { page, search, date, teacher } = searchParams;
  const p = page ? Number(page) : 1;

  const query: Prisma.LessonWhereInput = {
    archived: true,
  };

  // Search functionality
  if (search) {
    query.OR = [
      { subject: { name: { contains: search, mode: "insensitive" } } },
      {
        teacher: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { surname: { contains: search, mode: "insensitive" } },
          ],
        },
      },
      { class: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Date filter
  if (date) {
    const filterDate = new Date(date);
    query.updatedAt = {
      gte: filterDate,
      lt: new Date(filterDate.setDate(filterDate.getDate() + 1)),
    };
  }

  // Teacher filter
  if (teacher) {
    query.teacher = {
      OR: [
        { name: { contains: teacher, mode: "insensitive" } },
        { surname: { contains: teacher, mode: "insensitive" } },
      ],
    };
  }

  const [data, count] = await prisma.$transaction([
    prisma.lesson.findMany({
      where: query,
      include: {
        teacher: { select: { name: true, surname: true } },
        subject: { select: { name: true } },
        class: { select: { name: true } },
      },
      take: ITEMS_PER_PAGE,
      skip: ITEMS_PER_PAGE * (p - 1),
      orderBy: { updatedAt: "desc" },
    }),
    prisma.lesson.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Archived Lessons</h1>
        <div className="flex items-center gap-4">
          <DateFilter />
          <TableSearch />
        </div>
      </div>

      <Table columns={columns} renderRow={renderRow} data={data} />

      <Pagination page={p} count={count} />
    </div>
  );
};

export default ArchivedLessonsPage;
