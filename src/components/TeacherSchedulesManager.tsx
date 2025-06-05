"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { Day } from "@prisma/client";
import Table from "@/components/Table";

type Teacher = {
  id: string;
  name: string;
  surname: string;
  lessons: Array<{
    id: number;
    name: string;
    day: Day;
    startTime: Date;
    endTime: Date;
    subject: { name: string };
    class: { name: string };
  }>;
  attendances: Array<{
    id: number;
    date: Date;
    present: boolean;
  }>;
};

type TodayAttendance = {
  id: number;
  teacherId: string;
  present: boolean;
  date: Date;
};

type TodayReplacement = {
  id: number;
  date: Date;
  originalTeacher: { name: string; surname: string };
  replacementTeacher: { name: string; surname: string };
  lesson: {
    subject: { name: string };
    class: { name: string };
  };
};

type Assignment = {
  lessonId: number;
  originalTeacherId: string;
  replacementTeacherId: string;
  date: string;
};

const TeacherSchedulesManager = ({
  teachers,
  todayAttendance,
  todayReplacements,
}: {
  teachers: Teacher[];
  todayAttendance: TodayAttendance[];
  todayReplacements: TodayReplacement[];
}) => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);

  const today = new Date().toDateString();
  const isToday = new Date(selectedDate).toDateString() === today;

  // Get day of week for selected date
  const getDayOfWeek = (dateString: string): Day => {
    const date = new Date(dateString);
    const days: Day[] = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
    ];
    return days[date.getDay()] || "SUNDAY";
  };

  const selectedDay = getDayOfWeek(selectedDate);

  // Get teachers' attendance status for selected date
  const getTeacherAttendanceStatus = (teacherId: string): boolean | null => {
    if (!isToday) return null; // Only show attendance for today
    const attendance = todayAttendance.find(
      (att) => att.teacherId === teacherId
    );
    return attendance ? attendance.present : null;
  };

  // Get lessons for selected day
  const getLessonsForDay = () => {
    const lessonsMap = new Map();

    teachers.forEach((teacher) => {
      teacher.lessons.forEach((lesson) => {
        if (lesson.day === selectedDay) {
          const key = `${lesson.startTime}-${lesson.endTime}`;
          if (!lessonsMap.has(key)) {
            lessonsMap.set(key, []);
          }
          lessonsMap.get(key).push({
            ...lesson,
            teacher: teacher,
            isAbsent: getTeacherAttendanceStatus(teacher.id) === false,
          });
        }
      });
    });

    return Array.from(lessonsMap.entries())
      .sort(
        ([a], [b]) =>
          new Date(a.split("-")[0]).getTime() -
          new Date(b.split("-")[0]).getTime()
      )
      .map(([timeSlot, lessons]) => ({
        timeSlot,
        lessons: lessons.sort((a: any, b: any) =>
          a.teacher.name.localeCompare(b.teacher.name)
        ),
      }));
  };

  // Calculate replacement priority
  const calculateReplacementPriority = (teacher: Teacher): number => {
    // Factor 1: Weekly lesson count (lower is better)
    const weeklyLessons = teacher.lessons.length;

    // Factor 2: Attendance rate (lower attendance rate = higher priority for replacement)
    const totalAttendances = teacher.attendances.length;
    const presentCount = teacher.attendances.filter(
      (att) => att.present
    ).length;
    const attendanceRate =
      totalAttendances > 0 ? presentCount / totalAttendances : 1;

    // Calculate priority score (lower is better)
    return weeklyLessons * 0.6 + (1 - attendanceRate) * 0.4;
  };

  // Find best replacement teacher
  const findBestReplacement = (
    originalTeacherId: string,
    lessonTime: string
  ): Teacher | null => {
    const presentTeachers = teachers.filter((teacher) => {
      const attendanceStatus = getTeacherAttendanceStatus(teacher.id);
      return (
        teacher.id !== originalTeacherId &&
        (attendanceStatus === true || attendanceStatus === null)
      );
    });

    if (presentTeachers.length === 0) return null;

    // Filter out teachers who already have lessons at this time
    const [startTime] = lessonTime.split("-");
    const availableTeachers = presentTeachers.filter((teacher) => {
      return !teacher.lessons.some(
        (lesson) =>
          lesson.day === selectedDay &&
          lesson.startTime.toISOString() === new Date(startTime).toISOString()
      );
    });

    if (availableTeachers.length === 0) return null;

    // Sort by priority and return the best candidate
    return availableTeachers.sort(
      (a, b) =>
        calculateReplacementPriority(a) - calculateReplacementPriority(b)
    )[0];
  };

  // Handle replacement assignment
  const handleAssignReplacement = async (
    lessonId: number,
    originalTeacherId: string,
    replacementTeacherId: string
  ) => {
    setLoading(true);
    try {
      const response = await fetch("/api/teacher-replacement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          originalTeacherId,
          replacementTeacherId,
          date: selectedDate,
        }),
      });

      if (response.ok) {
        toast.success("Replacement assigned successfully!");
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to assign replacement");
      }
    } catch (error) {
      toast.error("Error assigning replacement");
    } finally {
      setLoading(false);
    }
  };

  // Auto-assign all replacements for absent teachers
  const handleAutoAssignAll = async () => {
    setLoading(true);
    const assignments: Assignment[] = [];

    getLessonsForDay().forEach(({ timeSlot, lessons }) => {
      lessons.forEach((lesson: any) => {
        if (lesson.isAbsent) {
          const bestReplacement = findBestReplacement(
            lesson.teacher.id,
            timeSlot
          );
          if (bestReplacement) {
            assignments.push({
              lessonId: lesson.id,
              originalTeacherId: lesson.teacher.id,
              replacementTeacherId: bestReplacement.id,
              date: selectedDate,
            });
          }
        }
      });
    });

    if (assignments.length === 0) {
      toast.info("No replacements needed");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/teacher-replacement/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments }),
      });

      if (response.ok) {
        toast.success(
          `${assignments.length} replacements assigned successfully!`
        );
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to assign replacements");
      }
    } catch (error) {
      toast.error("Error assigning replacements");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const lessonsForDay = getLessonsForDay();

  // Transform lessons data for the Table component
  const scheduleData = lessonsForDay.flatMap(({ timeSlot, lessons }) => {
    const [startTime, endTime] = timeSlot.split("-");
    return lessons.map((lesson: any) => ({
      ...lesson,
      timeSlot: `${formatTime(startTime)} - ${formatTime(endTime)}`,
      teacherName: `${lesson.teacher.name} ${lesson.teacher.surname}`,
      subjectClass: `${lesson.subject.name} - ${lesson.class.name}`,
      weeklyLessons: lesson.teacher.lessons.length,
    }));
  });

  const scheduleColumns = [
    {
      header: "Time Slot",
      accessor: "timeSlot",
    },
    {
      header: "Teacher",
      accessor: "teacher",
    },
    {
      header: "Subject - Class",
      accessor: "subjectClass",
    },
    {
      header: "Status",
      accessor: "status",
    },
    ...(isToday
      ? [
          {
            header: "Action",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderScheduleRow = (item: any) => (
    <tr
      key={`${item.timeSlot}-${item.id}`}
      className={`border-b border-gray-200 text-sm hover:bg-customPurpleLight ${
        item.isAbsent ? "bg-red-50" : "even:bg-slate-50"
      }`}
    >
      <td className="p-4 font-medium text-gray-900">{item.timeSlot}</td>
      <td className="p-4">
        <div className="flex flex-col">
          <div className="font-medium text-gray-900">{item.teacherName}</div>
          <div className="text-xs text-gray-500">
            Weekly Lessons: {item.weeklyLessons}
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="font-medium">{item.subject.name}</div>
        <div className="text-gray-500 text-xs">{item.class.name}</div>
      </td>
      <td className="p-4">
        {isToday ? (
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              item.isAbsent
                ? "bg-red-100 text-red-800"
                : getTeacherAttendanceStatus(item.teacher.id) === true
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {item.isAbsent
              ? "Absent"
              : getTeacherAttendanceStatus(item.teacher.id) === true
              ? "Present"
              : "Unknown"}
          </span>
        ) : (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            Scheduled
          </span>
        )}
      </td>
      {isToday && (
        <td className="p-4">
          {item.isAbsent ? (
            <div className="space-y-2">
              {(() => {
                const bestReplacement = findBestReplacement(
                  item.teacher.id,
                  `${item.startTime.toISOString()}-${item.endTime.toISOString()}`
                );
                return bestReplacement ? (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">
                      Suggested: {bestReplacement.name}{" "}
                      {bestReplacement.surname}
                    </div>
                    <button
                      onClick={() =>
                        handleAssignReplacement(
                          item.id,
                          item.teacher.id,
                          bestReplacement.id
                        )
                      }
                      disabled={loading}
                      className="px-3 py-1 bg-customSky text-white text-xs rounded hover:bg-customSkyLight disabled:opacity-50"
                    >
                      Assign
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-red-600">
                    No replacement available
                  </span>
                );
              })()}
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
      )}
    </tr>
  );

  // Statistics table data
  const statsData = teachers
    .sort(
      (a, b) =>
        calculateReplacementPriority(a) - calculateReplacementPriority(b)
    )
    .map((teacher) => {
      const totalAttendances = teacher.attendances.length;
      const presentCount = teacher.attendances.filter(
        (att) => att.present
      ).length;
      const attendanceRate =
        totalAttendances > 0 ? (presentCount / totalAttendances) * 100 : 100;
      const priorityScore = calculateReplacementPriority(teacher);

      return {
        id: teacher.id,
        teacherName: `${teacher.name} ${teacher.surname}`,
        weeklyLessons: teacher.lessons.length,
        attendanceRate,
        priorityScore,
      };
    });

  const statsColumns = [
    {
      header: "Teacher",
      accessor: "teacher",
    },
    {
      header: "Weekly Lessons",
      accessor: "weeklyLessons",
    },
    {
      header: "Attendance Rate",
      accessor: "attendanceRate",
    },
    {
      header: "Priority Score",
      accessor: "priorityScore",
    },
  ];

  const renderStatsRow = (item: any) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-customPurpleLight"
    >
      <td className="p-4 font-medium text-gray-900">{item.teacherName}</td>
      <td className="p-4 text-gray-900">{item.weeklyLessons}</td>
      <td className="p-4">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            item.attendanceRate >= 90
              ? "bg-green-100 text-green-800"
              : item.attendanceRate >= 80
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {item.attendanceRate.toFixed(1)}%
        </span>
      </td>
      <td className="p-4">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            item.priorityScore < 2
              ? "bg-green-100 text-green-800"
              : item.priorityScore < 4
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {item.priorityScore.toFixed(2)}
        </span>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Date Selection and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-customSky"
          />
          <span className="text-sm text-gray-600 capitalize">
            {selectedDay.toLowerCase()}
          </span>
        </div>

        {isToday && (
          <button
            onClick={handleAutoAssignAll}
            disabled={loading}
            className="px-4 py-2 bg-customPurple text-white rounded-md hover:bg-customPurpleLight disabled:opacity-50"
          >
            {loading ? "Assigning..." : "Auto-Assign All Replacements"}
          </button>
        )}
      </div>

      {/* Replacement Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">
          📋 Replacement System Info
        </h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>
            • Replacements are assigned{" "}
            <strong>only for the selected date</strong> - not permanently
          </p>
          <p>• Original lesson schedule remains unchanged</p>
          <p>• Each replacement is tied to a specific date and lesson</p>
          <p>
            • Teachers can only be replaced when marked as absent for that day
          </p>
          <p>
            • <strong>Auto-removal:</strong> If admin changes teacher attendance
            from &quot;absent&quot; to &quot;present&quot;, all replacements for
            that teacher on that day will be automatically removed
          </p>
        </div>
      </div>

      {/* Today's Replacements Summary */}
      {isToday && todayReplacements.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-3">
            Today&apos;s Active Replacements
          </h3>
          <div className="grid gap-2">
            {todayReplacements.map((replacement) => (
              <div
                key={replacement.id}
                className="flex items-center justify-between bg-white p-3 rounded border"
              >
                <div>
                  <span className="font-medium">
                    {replacement.lesson.subject.name} -{" "}
                    {replacement.lesson.class.name}
                  </span>
                  <div className="text-sm text-gray-600">
                    Original: {replacement.originalTeacher.name}{" "}
                    {replacement.originalTeacher.surname}
                    {" → "}
                    Replacement: {replacement.replacementTeacher.name}{" "}
                    {replacement.replacementTeacher.surname}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">
            Daily Schedule -{" "}
            {selectedDay.charAt(0) + selectedDay.slice(1).toLowerCase()}
          </h3>
        </div>
        {scheduleData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No lessons scheduled for {selectedDay.toLowerCase()}
          </div>
        ) : (
          <Table
            columns={scheduleColumns}
            renderRow={renderScheduleRow}
            data={scheduleData}
          />
        )}
      </div>

      {/* Teacher Statistics */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">
            Teacher Statistics & Priority
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Lower priority scores indicate higher priority for replacement
            assignments
          </p>
        </div>
        <Table
          columns={statsColumns}
          renderRow={renderStatsRow}
          data={statsData}
        />
      </div>
    </div>
  );
};

export default TeacherSchedulesManager;
