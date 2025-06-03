import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { Grade, Prisma } from "@prisma/client";
import Image from "next/image";
import { getRole } from "@/lib/utils";
import FormContainer from "@/components/FormContainer";

type GradeList = Grade & {
  _count: {
    students: number;
    classess: number;
  };
};

const columns = [
  { header: "Grade Level", accessor: "level" },
  {
    header: "Classes",
    accessor: "classCount",
    className: "hidden md:table-cell",
  },
  {
    header: "Students",
    accessor: "studentCount",
    className: "hidden md:table-cell",
  },
  { header: "Actions", accessor: "action" },
];

const renderRow = (item: GradeList, role: string | undefined) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-customPurpleLight"
  >
    <td className="flex items-center gap-4 p-4">
      <div className="flex flex-col">
        <h3 className="font-semibold">Grade {item.level}</h3>
      </div>
    </td>
    <td className="hidden md:table-cell">{item._count.classess}</td>
    <td className="hidden md:table-cell">{item._count.students}</td>
    <td>
      <div className="flex items-center gap-2">
        {role === "admin" && (
          <>
            <FormContainer table="grade" type="update" data={item} />
            <FormContainer table="grade" type="delete" id={item.id} />
          </>
        )}
      </div>
    </td>
  </tr>
);

const GradeListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;
  const role = await getRole();

  // Build query for search
  const query: Prisma.GradeWhereInput = {};

  const [data, count] = await prisma.$transaction([
    prisma.grade.findMany({
      where: query,
      include: {
        _count: {
          select: {
            students: true,
            classess: true,
          },
        },
      },
      orderBy: { level: "asc" },
      take: ITEMS_PER_PAGE,
      skip: ITEMS_PER_PAGE * (p - 1),
    }),
    prisma.grade.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Grades</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-customYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-customYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role && role.role === "admin" && (
              <FormContainer table="grade" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table
        columns={columns}
        renderRow={(item: GradeList) =>
          renderRow(item, role?.role || undefined)
        }
        data={data}
      />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default GradeListPage;
