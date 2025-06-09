"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Table from "./Table";

type Teacher = {
  id: string;
  name: string;
  surname: string;
  username: string;
};

type AttendanceRecord = {
  teacherId: string;
  status: "present" | "absent" | "";
  saved: boolean;
};

type ExistingAttendance = {
  id: number;
  teacherId: string;
  present: boolean;
  date: Date;
};

const AdminAttendance = ({
  teachers,
  existingAttendance,
}: {
  teachers: Teacher[];
  existingAttendance: ExistingAttendance[];
}) => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceRecord>
  >({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [showSaveAll, setShowSaveAll] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  // Initialize attendance records
  useEffect(() => {
    const initialAttendance: Record<string, AttendanceRecord> = {};
    teachers.forEach((teacher) => {
      const existing = existingAttendance.find(
        (att) => att.teacherId === teacher.id
      );
      initialAttendance[teacher.id] = {
        teacherId: teacher.id,
        status: existing ? (existing.present ? "present" : "absent") : "",
        saved: !!existing,
      };
    });
    setAttendance(initialAttendance);
    setShowSaveAll(false);
  }, [teachers, existingAttendance]);

  // Fetch attendance when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAttendanceForDate();
    }
  }, [selectedDate]);

  const fetchAttendanceForDate = async () => {
    try {
      const response = await fetch(
        `/api/attendance/teacher?date=${selectedDate}`
      );
      if (response.ok) {
        const data = await response.json();
        const updatedAttendance: Record<string, AttendanceRecord> = {};
        teachers.forEach((teacher) => {
          const existing = data.find(
            (att: any) => att.teacherId === teacher.id
          );
          updatedAttendance[teacher.id] = {
            teacherId: teacher.id,
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
    teacherId: string,
    status: "present" | "absent"
  ) => {
    setAttendance((prev) => ({
      ...prev,
      [teacherId]: {
        teacherId,
        status,
        saved: false,
      },
    }));
  };

  const handleSingleSave = async (teacherId: string) => {
    const record = attendance[teacherId];
    if (!record || !record.status) {
      toast.error("Please select attendance status");
      return;
    }

    setSaving((prev) => ({ ...prev, [teacherId]: true }));

    try {
      console.log("Saving single attendance:", {
        teacherId,
        date: selectedDate,
        present: record.status === "present",
      });

      const response = await fetch("/api/attendance/teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacherId,
          date: selectedDate,
          present: record.status === "present",
        }),
      });

      const result = await response.json();
      console.log("Save response:", result);

      if (response.ok) {
        // Show different messages based on whether replacements were removed
        if (result.replacementsRemoved > 0) {
          toast.success(
            `Attendance saved! Automatically removed ${result.replacementsRemoved} replacement(s) for this teacher.`
          );
        } else {
          toast.success("Attendance saved successfully!");
        }

        setAttendance((prev) => ({
          ...prev,
          [teacherId]: {
            ...prev[teacherId],
            saved: true,
          },
        }));
        router.refresh();
      } else {
        console.error("Save failed:", result);
        toast.error(result.error || "Failed to save attendance");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("An error occurred while saving attendance");
    } finally {
      setSaving((prev) => ({ ...prev, [teacherId]: false }));
    }
  };

  const markAllAs = (status: "present" | "absent") => {
    const updatedAttendance: Record<string, AttendanceRecord> = {};
    teachers.forEach((teacher) => {
      updatedAttendance[teacher.id] = {
        teacherId: teacher.id,
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
        teacherId: record.teacherId,
        date: selectedDate,
        present: record.status === "present",
      }));

      console.log("Saving all attendance:", attendanceData);

      const response = await fetch("/api/attendance/teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attendance: attendanceData,
        }),
      });

      const result = await response.json();
      console.log("Save all response:", result);

      if (response.ok) {
        // Calculate total replacements removed
        const totalReplacementsRemoved =
          result.results?.reduce(
            (total: number, res: any) => total + (res.replacementsRemoved || 0),
            0
          ) || 0;

        let successMessage = `Saved attendance for ${unsavedRecords.length} teachers!`;
        if (totalReplacementsRemoved > 0) {
          successMessage += ` Automatically removed ${totalReplacementsRemoved} replacement(s).`;
        }

        toast.success(successMessage);

        // Mark all as saved
        const updatedAttendance = { ...attendance };
        unsavedRecords.forEach((record) => {
          updatedAttendance[record.teacherId].saved = true;
        });
        setAttendance(updatedAttendance);
        setShowSaveAll(false);
        router.refresh();
      } else {
        console.error("Save all failed:", result);
        toast.error(result.error || "Failed to save attendance");
      }
    } catch (error) {
      console.error("Save all error:", error);
      toast.error("An error occurred while saving attendance");
    } finally {
      setSavingAll(false);
    }
  };

  const columns = [
    {
      header: "Teacher",
      accessor: "teacher",
    },
    {
      header: "Teacher ID",
      accessor: "teacherId",
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

  const renderRow = (teacher: Teacher) => {
    const record = attendance[teacher.id];
    const isUnsaved = record && record.status && !record.saved;
    const isSaving = saving[teacher.id];

    return (
      <tr
        key={teacher.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-customPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">
          <div className="font-medium text-gray-900">
            {teacher.name} {teacher.surname}
          </div>
        </td>
        <td className="hidden md:table-cell">{teacher.username}</td>
        <td>
          <select
            value={record?.status || ""}
            onChange={(e) =>
              handleAttendanceChange(
                teacher.id,
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
              onClick={() => handleSingleSave(teacher.id)}
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
      {/* Date Selection */}
      <div className="flex items-center gap-4 md:flex-row flex-col justify-between">
        <div className="flex-1 md:w-1/2 w-full">
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

        {/* Bulk Actions */}
        <div className="flex flex-wrap gap-2 mt-6 md:w-1/2 w-full">
          <button
            onClick={() => markAllAs("present")}
            className="flex-1 min-w-[100px] px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm sm:text-base"
          >
            Mark All Present
          </button>
          <button
            onClick={() => markAllAs("absent")}
            className="flex-1 min-w-[100px] px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm sm:text-base"
          >
            Mark All Absent
          </button>
          {showSaveAll && unsavedCount > 0 && (
            <button
              onClick={handleSaveAll}
              disabled={savingAll}
              className="flex-1 min-w-[140px] px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition-colors text-sm sm:text-base"
            >
              {savingAll ? "Saving..." : `Save All (${unsavedCount})`}
            </button>
          )}
        </div>
      </div>

      {/* Teachers Table */}
      <Table columns={columns} renderRow={renderRow} data={teachers} />
    </div>
  );
};

export default AdminAttendance;
