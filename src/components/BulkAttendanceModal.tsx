"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

type Student = {
  id: string;
  name: string;
  surname: string;
  username: string;
};

type Lesson = {
  id: number;
  name: string;
  subject: { name: string };
  class: { name: string };
};

type AttendanceRecord = {
  studentId: string;
  status: "present" | "absent" | "late" | "excused";
};

const BulkAttendanceModal = ({
  isOpen,
  onClose,
  role,
}: {
  isOpen: boolean;
  onClose: () => void;
  role: string;
}) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceRecord>
  >({});
  const [loading, setLoading] = useState(false);

  // Fetch teacher's lessons
  useEffect(() => {
    if (isOpen && role === "teacher") {
      fetchLessons();
    }
  }, [isOpen, role]);

  // Fetch students when lesson is selected
  useEffect(() => {
    if (selectedLesson) {
      fetchStudents();
    }
  }, [selectedLesson]);

  const fetchLessons = async () => {
    try {
      const response = await fetch(
        `/api/lessons?teacherId=${session?.user?.id}`
      );
      const data = await response.json();
      setLessons(data);
    } catch (error) {
      toast.error("Failed to fetch lessons");
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/students?lessonId=${selectedLesson}`);
      const data = await response.json();
      setStudents(data);

      // Initialize attendance records
      const initialAttendance: Record<string, AttendanceRecord> = {};
      data.forEach((student: Student) => {
        initialAttendance[student.id] = {
          studentId: student.id,
          status: "present",
        };
      });
      setAttendance(initialAttendance);
    } catch (error) {
      toast.error("Failed to fetch students");
    }
  };

  const handleAttendanceChange = (
    studentId: string,
    status: "present" | "absent" | "late" | "excused"
  ) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!selectedLesson || !selectedDate) {
      toast.error("Please select a lesson and date");
      return;
    }

    setLoading(true);
    try {
      const attendanceData = Object.values(attendance).map((record) => ({
        date: selectedDate,
        present: record.status === "present",
        studentId: record.studentId,
        lessonId: selectedLesson,
        status: record.status,
      }));

      const response = await fetch("/api/attendance/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ attendance: attendanceData }),
      });

      if (response.ok) {
        toast.success("Attendance saved successfully!");
        router.refresh();
        onClose();
      } else {
        toast.error("Failed to save attendance");
      }
    } catch (error) {
      toast.error("An error occurred while saving attendance");
    } finally {
      setLoading(false);
    }
  };

  const markAllAs = (status: "present" | "absent") => {
    const updatedAttendance: Record<string, AttendanceRecord> = {};
    students.forEach((student) => {
      updatedAttendance[student.id] = {
        studentId: student.id,
        status,
      };
    });
    setAttendance(updatedAttendance);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Take Class Attendance</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Image src="/close.png" alt="Close" width={16} height={16} />
          </button>
        </div>

        {/* Date and Lesson Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lesson
            </label>
            <select
              value={selectedLesson || ""}
              onChange={(e) => setSelectedLesson(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a lesson</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.subject.name} - {lesson.class.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {students.length > 0 && (
          <div className="flex gap-2 mb-4">
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
          </div>
        )}

        {/* Students List */}
        {students.length > 0 && (
          <div className="space-y-2 mb-6">
            <h3 className="font-medium text-gray-900">
              Students ({students.length})
            </h3>
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Student
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">
                      Student ID
                    </th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-900">
                      Attendance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="font-medium text-gray-900">
                          {student.name} {student.surname}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {student.username}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-center gap-2">
                          {["present", "absent", "late", "excused"].map(
                            (status) => (
                              <button
                                key={status}
                                onClick={() =>
                                  handleAttendanceChange(
                                    student.id,
                                    status as any
                                  )
                                }
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                  attendance[student.id]?.status === status
                                    ? status === "present"
                                      ? "bg-green-500 text-white"
                                      : status === "absent"
                                      ? "bg-red-500 text-white"
                                      : status === "late"
                                      ? "bg-yellow-500 text-white"
                                      : "bg-blue-500 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                              >
                                {status.charAt(0).toUpperCase() +
                                  status.slice(1)}
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedLesson || students.length === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkAttendanceModal;
