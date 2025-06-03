import Image from "next/image";

interface ProfileCardProps {
  userData: any;
  children?: React.ReactNode;
}

const ProfileCard = ({ userData, children }: ProfileCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Image */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100">
              <Image
                src={userData.img || "/avatar.png"}
                alt="Profile"
                width={120}
                height={120}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white"></div>
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {userData.name && userData.surname
                ? `${userData.name} ${userData.surname}`
                : userData.username}
            </h2>
            <p className="text-sm text-gray-500 bg-blue-100 px-3 py-1 rounded-full inline-block mt-1">
              {userData.role}
            </p>
          </div>
        </div>

        {/* Profile Information */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProfileField label="Username" value={userData.username} />
            <ProfileField label="Email" value={userData.user?.email || "N/A"} />
            {userData.civilId && (
              <ProfileField label="Civil ID" value={userData.civilId} />
            )}
            {userData.phone && (
              <ProfileField label="Phone" value={userData.phone} />
            )}
            {userData.address && (
              <ProfileField
                label="Address"
                value={userData.address}
                className="md:col-span-2"
              />
            )}
            {userData.birthday && (
              <ProfileField
                label="Birthday"
                value={new Date(userData.birthday).toLocaleDateString()}
              />
            )}
            {userData.bloodType && (
              <ProfileField label="Blood Type" value={userData.bloodType} />
            )}
            {userData.sex && (
              <ProfileField
                label="Gender"
                value={userData.sex === "MALE" ? "Male" : "Female"}
              />
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

interface ProfileFieldProps {
  label: string;
  value: string;
  className?: string;
}

const ProfileField = ({ label, value, className = "" }: ProfileFieldProps) => {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-500">{label}</label>
      <p className="text-gray-900 font-medium">{value}</p>
    </div>
  );
};

export default ProfileCard;
export { ProfileField };
