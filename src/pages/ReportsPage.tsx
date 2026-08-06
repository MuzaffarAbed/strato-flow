import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../services/stratoApi';

const reportTypes = [
  { id: 'workitems-by-status', label: 'Work Items by Status' },
  { id: 'workitems-by-priority', label: 'Work Items by Priority' },
  { id: 'hours-by-user', label: 'Hours Logged by User' },
  { id: 'blocked-work', label: 'Blocked Work Report' },
  { id: 'completed', label: 'Completed Work Items' },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('workitems-by-status');

  const { data, isLoading } = useQuery({
    queryKey: ['reports', selectedReport],
    queryFn: () => reportsApi.getReport(selectedReport),
  });

  const reportData = data as { reportName?: string; rows?: Record<string, unknown>[]; chartData?: { label: string; value: number }[] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-gray-500 text-sm">Generate and export work management reports</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {reportTypes.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedReport(r.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedReport === r.id ? 'bg-primary text-background' : 'bg-card border border-border hover:border-primary'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        {isLoading ? (
          <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-primary">{reportData?.reportName || selectedReport}</h3>
              <button className="px-3 py-1.5 text-sm border border-border rounded-lg hover:border-primary">Export CSV</button>
            </div>

            {reportData?.chartData && reportData.chartData.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {reportData.chartData.map((c, i) => (
                  <div key={i} className="bg-background rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{c.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{c.label}</p>
                  </div>
                ))}
              </div>
            )}

            {reportData?.rows && reportData.rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-gray-500">
                      {Object.keys(reportData.rows[0]).map((key) => (
                        <th key={key} className="pb-2 pr-4">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.rows.map((row, i) => (
                      <tr key={i} className="border-b border-border/50">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="py-2 pr-4">{String(val ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No data available for this report</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
