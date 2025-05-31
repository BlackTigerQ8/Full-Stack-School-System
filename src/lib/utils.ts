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
