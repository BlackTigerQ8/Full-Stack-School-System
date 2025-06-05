"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Table from "./Table";

type Class = {
  id: number;
  name: string;
};

type Student = {
  id: string;
  name: string;
  surname: string;
  username: string;
};

type AttendanceRecord = {
  studentId: string;
  status: "present" | "absent" | "";
  saved: boolean;
};

type ExistingAttendance = {
  id: number;
  studentId: string;
  present: boolean;
  date: Date;
};

const TeacherAttendance = ({ classes }: { classes: Class[] }) => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceRecord>
  >({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [showSaveAll, setShowSaveAll] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

  // Fetch attendance when date changes
  useEffect(() => {
    if (selectedDate && selectedClass) {
      fetchAttendanceForDate();
    }
  }, [selectedDate, selectedClass]);

  const fetchStudents = async () => {
    setFetchingStudents(true);
    try {
      const response = await fetch(`/api/students?classId=${selectedClass}`);
      const data = await response.json();
      setStudents(data);

      if (selectedDate) {
        await fetchAttendanceForDate(data);
      } else {
        const initialAttendance: Record<string, AttendanceRecord> = {};
        data.forEach((student: Student) => {
          initialAttendance[student.id] = {
            studentId: student.id,
            status: "",
            saved: false,
          };
        });
        setAttendance(initialAttendance);
      }
    } catch (error) {
      toast.error("Failed to fetch students");
    } finally {
      setFetchingStudents(false);
    }
  };

  const fetchAttendanceForDate = async (studentList?: Student[]) => {
    if (!selectedClass || !selectedDate) return;

    try {
      const response = await fetch(
        `/api/attendance/student?date=${selectedDate}&classId=${selectedClass}`
      );
      if (response.ok) {
        const existingAttendance = await response.json();
        const studentsToUse = studentList || students;

        const updatedAttendance: Record<string, AttendanceRecord> = {};
        studentsToUse.forEach((student) => {
          const existing = existingAttendance.find(
            (att: ExistingAttendance) => att.studentId === student.id
          );
          updatedAttendance[student.id] = {
            studentId: student.id,
            status: existing ? (existing.present ? "present" : "absent") : "",
            saved: !!existing,
          };
        });
        setAttendance(updatedAttendance);
        setShowSaveAll(false);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  const handleAttendanceChange = (
    studentId: string,
    status: "present" | "absent"
  ) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        studentId,
        status,
        saved: false,
      },
    }));
  };

  const handleSingleSave = async (studentId: string) => {
    const record = attendance[studentId];
    if (!record || !record.status || !selectedClass) {
      toast.error("Please select attendance status");
      return;
    }

    setSaving((prev) => ({ ...prev, [studentId]: true }));

    try {
      const response = await fetch("/api/attendance/student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          date: selectedDate,
          present: record.status === "present",
          classId: selectedClass,
        }),
      });

      if (response.ok) {
        toast.success("Attendance saved successfully!");
        setAttendance((prev) => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            saved: true,
          },
        }));
        router.refresh();
      } else {
        const result = await response.json();
        toast.error(result.error || "Failed to save attendance");
      }
    } catch (error) {
      toast.error("An error occurred while saving attendance");
    } finally {
      setSaving((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  const markAllAs = (status: "present" | "absent") => {
    const updatedAttendance: Record<string, AttendanceRecord> = {};
    students.forEach((student) => {
      updatedAttendance[student.id] = {
        studentId: student.id,
        status,
        saved: false,
      };
    });
    setAttendance(updatedAttendance);
    setShowSaveAll(true);
  };

  const handleSaveAll = async () => {
    const unsavedRecords = Object.values(attendance).filter(
      (record) => record.status && !record.saved
    );

    if (unsavedRecords.length === 0) {
      toast.error("No unsaved records to save");
      return;
    }

    setSavingAll(true);
    try {
      const attendanceData = unsavedRecords.map((record) => ({
        studentId: record.studentId,
        date: selectedDate,
        present: record.status === "present",
        classId: selectedClass!,
      }));

      const response = await fetch("/api/attendance/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attendance: attendanceData,
          type: "student",
          classId: selectedClass,
        }),
      });

      if (response.ok) {
        toast.success("All attendance saved successfully!");
        const updatedAttendance = { ...attendance };
        unsavedRecords.forEach((record) => {
          updatedAttendance[record.studentId].saved = true;
        });
        setAttendance(updatedAttendance);
        setShowSaveAll(false);
        router.refresh();
      } else {
        const result = await response.json();
        toast.error(result.error || "Failed to save attendance");
      }
    } catch (error) {
      toast.error("An error occurred while saving attendance");
    } finally {
      setSavingAll(false);
    }
  };

  const columns = [
    {
      header: "Student",
      accessor: "student",
    },
    {
      header: "Student ID",
      accessor: "studentId",
      className: "hidden md:table-cell",
    },
    {
      header: "Attendance",
      accessor: "attendance",
    },
    {
      header: "Action",
      accessor: "action",
    },
  ];

  const renderRow = (student: Student) => {
    const record = attendance[student.id];
    const isUnsaved = record && record.status && !record.saved;
    const isSaving = saving[student.id];

    return (
      <tr
        key={student.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-customPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">
          <div className="font-medium text-gray-900">
            {student.name} {student.surname}
          </div>
        </td>
        <td className="hidden md:table-cell">{student.username}</td>
        <td>
          <select
            value={record?.status || ""}
            onChange={(e) =>
              handleAttendanceChange(
                student.id,
                e.target.value as "present" | "absent"
              )
            }
            className={`px-3 py-1 rounded-full text-sm font-medium border-0 focus:ring-2 focus:ring-offset-2 ${
              record?.status === "present"
                ? "bg-green-100 text-green-800 focus:ring-green-500"
                : record?.status === "absent"
                ? "bg-red-100 text-red-800 focus:ring-red-500"
                : "bg-gray-100 text-gray-800 focus:ring-gray-500"
            }`}
          >
            <option value="">Select</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </td>
        <td>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSingleSave(student.id)}
              disabled={!record?.status || record.saved || isSaving}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                record?.saved
                  ? "bg-green-100 text-green-800 cursor-default"
                  : isUnsaved
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSaving ? "Saving..." : record?.saved ? "Saved" : "Save"}
            </button>
            {record?.saved && <span className="text-xs text-green-600">✓</span>}
          </div>
        </td>
      </tr>
    );
  };

  const unsavedCount = Object.values(attendance).filter(
    (record) => record.status && !record.saved
  ).length;

  return (
    <div className="space-y-6">
      {/* Date and Class Selection */}
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Class
          </label>
          <select
            value={selectedClass || ""}
            onChange={(e) => setSelectedClass(Number(e.target.value))}
            className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a class</option>
            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Actions */}
        {students.length > 0 && (
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => markAllAs("present")}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Mark All Present
            </button>
            <button
              onClick={() => markAllAs("absent")}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Mark All Absent
            </button>
            {showSaveAll && unsavedCount > 0 && (
              <button
                onClick={handleSaveAll}
                disabled={savingAll}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
              >
                {savingAll ? "Saving..." : `Save All (${unsavedCount})`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Students List */}
      {fetchingStudents ? (
        <div className="text-center py-8">Loading students...</div>
      ) : students.length > 0 ? (
        <Table columns={columns} renderRow={renderRow} data={students} />
      ) : selectedClass ? (
        <div className="text-center py-8 text-gray-500">
          No students found in this class
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Please select a class to view students
        </div>
      )}
    </div>
  );
};

export default TeacherAttendance;
