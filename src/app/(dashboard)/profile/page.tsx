import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import ProfileCard from "@/components/ProfileCard";
import InfoCard, { InfoField } from "@/components/InfoCard";

// Function to get user profile data based on role
const getUserProfileData = async (userId: string, role: string) => {
  try {
    switch (role.toLowerCase()) {
      case "admin":
        const admin = await prisma.admin.findUnique({
          where: { id: userId },
          include: { user: true },
        });
        return {
          ...admin,
          role: "Admin",
          profileType: "admin",
        };

      case "teacher":
        const teacher = await prisma.teacher.findUnique({
          where: { id: userId },
          include: {
            user: true,
            subjects: { select: { id: true, name: true } },
            classes: {
              select: {
                id: true,
                name: true,
                grade: { select: { level: true } },
                _count: { select: { students: true } },
              },
            },
          },
        });
        return {
          ...teacher,
          role: "Teacher",
          profileType: "teacher",
        };

      case "student":
        const student = await prisma.student.findUnique({
          where: { id: userId },
          include: {
            user: true,
            parent: { select: { name: true, surname: true, phone: true } },
            class: {
              select: {
                name: true,
                supervisor: { select: { name: true, surname: true } },
                grade: { select: { level: true } },
              },
            },
            grade: { select: { level: true } },
            results: {
              take: 5,
              orderBy: { id: "desc" },
              include: {
                exam: { select: { title: true } },
                assignment: { select: { title: true } },
              },
            },
          },
        });
        return {
          ...student,
          role: "Student",
          profileType: "student",
        };

      case "parent":
        const parent = await prisma.parent.findUnique({
          where: { id: userId },
          include: {
            user: true,
            students: {
              select: {
                id: true,
                name: true,
                surname: true,
                class: {
                  select: {
                    name: true,
                    grade: { select: { level: true } },
                  },
                },
              },
            },
          },
        });
        return {
          ...parent,
          role: "Parent",
          profileType: "parent",
        };

      default:
        return null;
    }
  } catch (error) {
    console.error("Error fetching user profile data:", error);
    return null;
  }
};

const ProfilePage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const userData = await getUserProfileData(session.user.id, session.user.role);

  if (!userData) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading profile data. Please try again later.
        </div>
      </div>
    );
  }

  const isAdmin = session.user.role.toLowerCase() === "admin";

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Profile</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <Link
              href="/list/students"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 text-sm"
            >
              Manage Users
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="lg:col-span-2">
          <ProfileCard userData={userData} />
        </div>

        {/* Right Sidebar - Role-specific Information */}
        <div className="space-y-6">
          {/* Account Info */}
          <InfoCard title="Account Info">
            <div className="space-y-3">
              <InfoField label="Role" value={userData.role} />
              <InfoField
                label="Member Since"
                value={
                  userData.user?.createdAt
                    ? new Date(userData.user.createdAt).toLocaleDateString()
                    : "N/A"
                }
              />
              <InfoField
                label="Last Updated"
                value={
                  userData.user?.updatedAt
                    ? new Date(userData.user.updatedAt).toLocaleDateString()
                    : "N/A"
                }
              />
            </div>
          </InfoCard>

          {/* Role-specific Information */}
          {userData.profileType === "student" && (
            <>
              {/* Class Information */}
              <InfoCard title="Class Information">
                <div className="space-y-3">
                  <InfoField
                    label="Class"
                    value={(userData as any).class?.name || "N/A"}
                  />
                  <InfoField
                    label="Grade"
                    value={`Grade ${(userData as any).grade?.level || "N/A"}`}
                  />
                  {(userData as any).class?.supervisor && (
                    <InfoField
                      label="Class Supervisor"
                      value={`${(userData as any).class.supervisor.name} ${
                        (userData as any).class.supervisor.surname
                      }`}
                    />
                  )}
                </div>
              </InfoCard>

              {/* Parent Information */}
              {(userData as any).parent && (
                <InfoCard title="Parent Information">
                  <div className="space-y-3">
                    <InfoField
                      label="Parent Name"
                      value={`${(userData as any).parent.name} ${
                        (userData as any).parent.surname
                      }`}
                    />
                    {(userData as any).parent.phone && (
                      <InfoField
                        label="Parent Phone"
                        value={(userData as any).parent.phone}
                      />
                    )}
                  </div>
                </InfoCard>
              )}

              {/* Recent Results */}
              {(userData as any).results &&
                (userData as any).results.length > 0 && (
                  <InfoCard title="Recent Results">
                    <div className="space-y-3">
                      {(userData as any).results.map((result: any) => (
                        <div
                          key={result.id}
                          className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {result.exam?.title || result.assignment?.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {result.exam ? "Exam" : "Assignment"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">
                              {result.score}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </InfoCard>
                )}
            </>
          )}

          {userData.profileType === "teacher" && (
            <>
              {/* Subjects */}
              {(userData as any).subjects &&
                (userData as any).subjects.length > 0 && (
                  <InfoCard title="Teaching Subjects">
                    <div className="space-y-2">
                      {(userData as any).subjects.map((subject: any) => (
                        <div
                          key={subject.id}
                          className="bg-blue-50 px-3 py-2 rounded-lg"
                        >
                          <p className="text-sm font-medium text-blue-900">
                            {subject.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </InfoCard>
                )}

              {/* Classes */}
              {(userData as any).classes &&
                (userData as any).classes.length > 0 && (
                  <InfoCard title="Supervising Classes">
                    <div className="space-y-3">
                      {(userData as any).classes.map((classItem: any) => (
                        <div
                          key={classItem.id}
                          className="border border-gray-200 rounded-lg p-3"
                        >
                          <p className="font-medium text-gray-900">
                            {classItem.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Grade {classItem.grade?.level}
                          </p>
                          <p className="text-xs text-gray-400">
                            {classItem._count.students} students
                          </p>
                        </div>
                      ))}
                    </div>
                  </InfoCard>
                )}
            </>
          )}

          {userData.profileType === "parent" &&
            (userData as any).students &&
            (userData as any).students.length > 0 && (
              <InfoCard title="My Children">
                <div className="space-y-3">
                  {(userData as any).students.map((student: any) => (
                    <div
                      key={student.id}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <p className="font-medium text-gray-900">
                        {student.name} {student.surname}
                      </p>
                      <p className="text-sm text-gray-500">
                        {student.class?.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        Grade {student.class?.grade?.level}
                      </p>
                    </div>
                  ))}
                </div>
              </InfoCard>
            )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> Profile information is read-only for
              security purposes.
              {isAdmin
                ? " As an admin, you can edit user information through the management pages."
                : " Contact your administrator if you need to update any information."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
