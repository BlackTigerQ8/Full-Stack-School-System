"use client";

import Table from "./Table";

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

const StudentAttendance = ({
  attendanceHistory,
}: {
  attendanceHistory: AttendanceRecord[];
}) => {
  const presentCount = attendanceHistory.filter(
    (record) => record.present
  ).length;
  const totalCount = attendanceHistory.length;
  const attendanceRate = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

  const columns = [
    {
      header: "Date",
      accessor: "date",
    },
    {
      header: "Subject",
      accessor: "subject",
      className: "hidden md:table-cell",
    },
    {
      header: "Class",
      accessor: "class",
      className: "hidden md:table-cell",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden lg:table-cell",
    },
    {
      header: "Status",
      accessor: "status",
    },
  ];

  const renderRow = (record: AttendanceRecord) => (
    <tr
      key={record.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-customPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        {new Intl.DateTimeFormat("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(record.date))}
      </td>
      <td className="hidden md:table-cell">{record.lesson.subject.name}</td>
      <td className="hidden md:table-cell">{record.lesson.class.name}</td>
      <td className="hidden lg:table-cell">
        {record.lesson.teacher.name} {record.lesson.teacher.surname}
      </td>
      <td>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            record.present
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {record.present ? "Present" : "Absent"}
        </span>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
          <div className="text-sm text-gray-600">Total Days</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">
            {presentCount}
          </div>
          <div className="text-sm text-gray-600">Present</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">
            {totalCount - presentCount}
          </div>
          <div className="text-sm text-gray-600">Absent</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">
            {attendanceRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Attendance Rate</div>
        </div>
      </div>

      {/* Attendance History */}
      {attendanceHistory.length > 0 ? (
        <Table
          columns={columns}
          renderRow={renderRow}
          data={attendanceHistory}
        />
      ) : (
        <div className="text-center py-8 text-gray-500">
          No attendance records found
        </div>
      )}
    </div>
  );
};

export default StudentAttendance;
