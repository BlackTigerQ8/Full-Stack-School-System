"use client";

import { useState } from "react";
import { archiveCurrentSchedule } from "@/lib/actions";
import { toast } from "react-toastify";

const ArchiveScheduleButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [archiveName, setArchiveName] = useState("");

  const handleArchive = async () => {
    if (!archiveName) {
      toast.error("Please enter a name for the archive");
      return;
    }

    const result = await archiveCurrentSchedule(archiveName);

    if (result.success) {
      toast.success("Schedule archived successfully");
      setIsModalOpen(false);
      setArchiveName("");
    } else {
      toast.error("Failed to archive schedule");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-500 text-white px-3 py-1.5 text-sm rounded-md hover:bg-blue-600"
      >
        Archive Current Schedule
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-semibold mb-4">
              Archive Current Schedule
            </h2>
            <p className="text-gray-600 mb-4">
              This will archive all current lessons and allow you to start
              creating a new schedule. Archived lessons will still be available
              for reference.
            </p>
            <input
              type="text"
              value={archiveName}
              onChange={(e) => setArchiveName(e.target.value)}
              placeholder="Enter archive name (e.g., Fall 2024)"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ArchiveScheduleButton;
