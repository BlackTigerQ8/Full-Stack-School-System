"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function DateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams.toString());

    if (e.target.value) {
      params.set("date", e.target.value);
    } else {
      params.delete("date");
    }

    router.push(`?${params.toString()}`);
  };

  return (
    <input
      type="date"
      className="p-2 border rounded"
      onChange={handleDateChange}
      value={searchParams.get("date") || ""}
    />
  );
}
