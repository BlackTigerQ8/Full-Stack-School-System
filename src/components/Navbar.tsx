import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import LanguageToggle from "./LanguageToggle";
import { useTranslations } from "next-intl";

const getUserProfileImage = async (
  userId: string,
  role: string
): Promise<string | null> => {
  try {
    switch (role.toLowerCase()) {
      case "admin":
        // Admin doesn't have img field in schema, return null
        return null;

      case "teacher":
        const teacher = await prisma.teacher.findUnique({
          where: { id: userId },
          select: { img: true },
        });
        return teacher?.img || null;

      case "student":
        const student = await prisma.student.findUnique({
          where: { id: userId },
          select: { img: true },
        });
        return student?.img || null;

      case "parent":
        // Parent doesn't have img field in schema, return null
        return null;

      default:
        return null;
    }
  } catch (error) {
    console.error("Error fetching user profile image:", error);
    return null;
  }
};

const Navbar = async () => {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const role = user?.role;

  // Fetch user profile image
  let userImage: string | null = null;
  if (user?.id && role) {
    userImage = await getUserProfileImage(user.id, role);
  }

  return (
    <div className="flex items-center justify-between p-4">
      {/* SEARCH BAR */}
      <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
        <Image src="/search.png" alt="" width={14} height={14} />
        <input
          type="text"
          placeholder="Search..."
          className="w-[200px] p-2 bg-transparent outline-none"
        />
      </div>
      {/* ICONS AND USER */}
      <div className="flex items-center gap-6 justify-end w-full">
        {/* Language Toggle */}
        <LanguageToggle />

        <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer">
          <Image src="/message.png" alt="" width={20} height={20} />
        </div>
        <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative">
          <Image src="/announcement.png" alt="" width={20} height={20} />
          <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs">
            1
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs leading-3 font-medium">
            {user?.username || user?.email}
          </span>
          <span className="text-[10px] text-gray-500 text-right">
            {role ? role.charAt(0).toUpperCase() + role.slice(1) : "User"}
          </span>
        </div>
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
          <Image
            src={userImage || "/avatar.png"}
            alt=""
            width={36}
            height={36}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
