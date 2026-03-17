import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KPICard({ title, value, subtitle, icon: Icon, trend, color = 'blue', size = 'default' }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400';

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-sm text-gray-500 font-medium leading-tight">{title}</p>
        {Icon && (
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div>
        <p className={`font-bold text-gray-900 ${size === 'lg' ? 'text-3xl' : 'text-2xl'}`}>{value}</p>
        {subtitle && (
          <p className={`text-xs mt-0.5 flex items-center gap-1 ${trendColor}`}>
            {trend && <TrendIcon size={12} />}
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
