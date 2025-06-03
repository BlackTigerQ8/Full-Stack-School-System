interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const InfoCard = ({ title, children, className = "" }: InfoCardProps) => {
  return (
    <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      {children}
    </div>
  );
};

interface InfoFieldProps {
  label: string;
  value: string | React.ReactNode;
}

const InfoField = ({ label, value }: InfoFieldProps) => {
  return (
    <div>
      <label className="text-sm font-medium text-gray-500">{label}</label>
      <div className="text-gray-900 font-medium">{value}</div>
    </div>
  );
};

export default InfoCard;
export { InfoField };
