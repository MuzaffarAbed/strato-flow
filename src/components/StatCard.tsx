interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  className?: string;
}

export default function StatCard({ title, value, icon, color = 'text-primary', className = '' }: StatCardProps) {
  return (
    <div className={`bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        {icon && <div className="text-primary/60">{icon}</div>}
      </div>
    </div>
  );
}
