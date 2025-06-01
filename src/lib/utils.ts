import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export const getRole = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      currentUserId: null,
      role: null,
    };
  }

  return {
    currentUserId: session.user.id,
    role: session.user.role?.toLowerCase(),
  };
};

const getLatestSunday = (): Date => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const latestSunday = new Date(today);
  latestSunday.setDate(today.getDate() - dayOfWeek);
  latestSunday.setHours(0, 0, 0, 0);
  return latestSunday;
};

export const adjustScheduleToCurrentWeek = (
  lessons: { title: string; start: Date; end: Date }[]
): { title: string; start: Date; end: Date }[] => {
  const currentSunday = getLatestSunday();

  return lessons.map((lesson, index) => {
    // PRESERVE the original day of the week from the lesson
    const originalDayOfWeek = lesson.start.getDay(); // 0=Sunday, 1=Monday, etc.

    // Create new date for current week with SAME day of week
    const adjustedStartDate = new Date(currentSunday);
    adjustedStartDate.setDate(currentSunday.getDate() + originalDayOfWeek);

    // PRESERVE the EXACT ORIGINAL HOURS AND MINUTES from the database
    adjustedStartDate.setHours(
      lesson.start.getHours(),
      lesson.start.getMinutes(),
      lesson.start.getSeconds(),
      lesson.start.getMilliseconds()
    );

    // Create end date preserving original duration
    const adjustedEndDate = new Date(currentSunday);
    adjustedEndDate.setDate(currentSunday.getDate() + originalDayOfWeek);
    adjustedEndDate.setHours(
      lesson.end.getHours(),
      lesson.end.getMinutes(),
      lesson.end.getSeconds(),
      lesson.end.getMilliseconds()
    );

    return {
      title: lesson.title,
      start: adjustedStartDate,
      end: adjustedEndDate,
    };
  });
};
