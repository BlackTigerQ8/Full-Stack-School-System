"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

const EventCalendar = () => {
  const [value, onChange] = useState<Value>(new Date());

  const router = useRouter();

  useEffect(() => {
    if (value instanceof Date) {
      router.push(`?date=${value.toLocaleDateString("en-CA")}`);
    }
  }, [value, router]);

  return (
    <Calendar
      onChange={onChange}
      value={value}
      locale="ar-KW"
      formatDay={(locale, date) => date.getDate().toString()}
      formatMonthYear={(locale, date) =>
        date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      }
      formatShortWeekday={(locale, date) =>
        date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()
      }
    />
  );
};

export default EventCalendar;
