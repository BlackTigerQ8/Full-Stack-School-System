"use client";

import { useState } from "react";
import Image from "next/image";
import BulkAttendanceModal from "./BulkAttendanceModal";

const AttendanceActions = ({ role }: { role: string }) => {
  const [showBulkModal, setShowBulkModal] = useState(false);

  return (
    <>
      {role === "teacher" && (
        <button
          onClick={() => setShowBulkModal(true)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-customSky"
          title="Take Class Attendance"
        >
          <Image src="/attendance.png" alt="" width={14} height={14} />
        </button>
      )}

      {showBulkModal && (
        <BulkAttendanceModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          role={role}
        />
      )}
    </>
  );
};

export default AttendanceActions;
