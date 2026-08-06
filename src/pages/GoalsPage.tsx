import { useQuery } from '@tanstack/react-query';
import { goalsApi } from '../services/stratoApi';

export default function GoalsPage() {
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.getAll(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Goals</h1>
        <p className="text-gray-500 text-sm">Track organizational goals and linked work items</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => (
            <div key={g.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{g.goalTitle}</h3>
                <span className={`text-xs px-2 py-1 rounded ${g.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {g.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">{g.goalDescription || 'No description'}</p>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">{g.workItemCount} work items</span>
                <span className="text-primary">{Math.round(g.progressPercent)}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${g.progressPercent}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
