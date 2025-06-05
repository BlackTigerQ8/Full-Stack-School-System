"use client";

import { useEffect, useState } from "react";

type AttendanceSummary = {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendanceRate: number;
};

const AttendanceSummary = ({
  studentId,
  period = "month",
}: {
  studentId?: string;
  period?: "week" | "month" | "year";
}) => {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [studentId, period]);

  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (studentId) params.append("studentId", studentId);
      params.append("period", period);

      const response = await fetch(`/api/attendance/summary?${params}`);
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error("Error fetching attendance summary:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>;
  }

  if (!summary) {
    return <div className="text-center text-gray-500">No data available</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">
        Attendance Summary ({period})
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {summary.totalDays}
          </div>
          <div className="text-sm text-gray-600">Total Days</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {summary.presentDays}
          </div>
          <div className="text-sm text-gray-600">Present</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {summary.absentDays}
          </div>
          <div className="text-sm text-gray-600">Absent</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {summary.attendanceRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Attendance Rate</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Attendance Rate</span>
          <span>{summary.attendanceRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              summary.attendanceRate >= 90
                ? "bg-green-500"
                : summary.attendanceRate >= 75
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${summary.attendanceRate}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceSummary;
