import { auth } from "@clerk/nextjs/server";

export const getRole = async () => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;
  return { currentUserId, role };
};
