import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import prisma from "@/lib/prisma";
import { Class, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { getRole } from "@/lib/utils";
import FormContainer from "@/components/FormContainer";
import { getTranslations } from "next-intl/server";

type TeacherList = Teacher & { subjects: Subject[] } & { classes: Class[] };

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page, ...queryParams } = searchParams;
  const p = page ? Number(page) : 1;
  const { role } = await getRole();

  // Get translations on the server side
  const t = await getTranslations("teachers");

  const columns = [
    {
      header: t("headers.info"),
      accessor: "info",
    },
    {
      header: t("headers.teacherId"),
      accessor: "teacherId",
      className: "hidden md:table-cell",
    },
    {
      header: t("headers.subjects"),
      accessor: "subjects",
      className: "hidden md:table-cell",
    },
    {
      header: t("headers.classes"),
      accessor: "classes",
      className: "hidden md:table-cell",
    },
    {
      header: t("headers.phone"),
      accessor: "phone",
      className: "hidden lg:table-cell",
    },
    {
      header: t("headers.address"),
      accessor: "address",
      className: "hidden lg:table-cell",
    },
    ...(role === "admin"
      ? [
          {
            header: t("headers.actions"),
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: TeacherList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-customPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.img || "/noAvatar.png"}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">
            {item.name} {item.surname}
          </h3>
          <p className="text-xs text-gray-500">{item?.email}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.username}</td>
      <td className="hidden md:table-cell">
        {item.subjects.map((subject) => subject.name).join(", ")}
      </td>
      <td className="hidden md:table-cell">
        {item.classes.map((classItem) => classItem.name).join(", ")}
      </td>
      <td className="hidden md:table-cell">{item.phone}</td>
      <td className="hidden md:table-cell">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/teachers/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-customSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
          {role === "admin" && (
            <FormContainer table="teacher" type="delete" id={item.id} />
          )}
        </div>
      </td>
    </tr>
  );

  // Database query logic (same as before)
  const query: Prisma.TeacherWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId": {
            const classId = parseInt(value);
            if (!isNaN(classId)) {
              query.lessons = {
                some: {
                  classId: classId,
                },
              };
            }
            break;
          }
          case "search": {
            query.OR = [
              {
                name: {
                  contains: value,
                  mode: "insensitive",
                },
              },
              {
                surname: {
                  contains: value,
                  mode: "insensitive",
                },
              },
              {
                AND: [
                  {
                    name: {
                      contains: value.split(" ")[0] || "",
                      mode: "insensitive",
                    },
                  },
                  {
                    surname: {
                      contains: value.split(" ")[1] || value.split(" ")[0],
                      mode: "insensitive",
                    },
                  },
                ],
              },
            ];
            break;
          }
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.teacher.findMany({
      where: query,
      include: {
        subjects: true,
        classes: true,
      },
      take: ITEMS_PER_PAGE,
      skip: ITEMS_PER_PAGE * (Number(p) - 1),
    }),
    prisma.teacher.count({
      where: query,
    }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">{t("title")}</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-customYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-customYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              <FormContainer table="teacher" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={Number(page)} count={count} />
    </div>
  );
};

export default TeacherListPage;
