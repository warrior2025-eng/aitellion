import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, PageHeader, Badge } from '../../components/patterns';

const STATUSES = ['PRESENT', 'ABSENT', 'HALF_DAY', 'WORK_FROM_HOME'];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const [date, setDate] = useState(todayIso());
  const queryClient = useQueryClient();

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => (await api.get('/hr/employees')).data,
  });

  const { data: records } = useQuery({
    queryKey: ['attendance', date],
    queryFn: async () => (await api.get('/hr/attendance', { params: { date } })).data,
  });

  const { data: summary } = useQuery({
    queryKey: ['attendance-summary', date],
    queryFn: async () => (await api.get('/hr/attendance/summary', { params: { date } })).data,
  });

  const markMutation = useMutation({
    mutationFn: (payload: { employeeId: string; status: string }) =>
      api.post('/hr/attendance', { ...payload, date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', date] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary', date] });
    },
  });

  function statusFor(employeeId: string) {
    return records?.find((r: any) => r.employee.id === employeeId)?.status;
  }

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Mark and review daily attendance."
        actions={
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-volt"
          />
        }
      />

      {summary && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <p className="text-sm text-text-muted">Present</p>
            <p className="mt-2 font-display text-xl font-semibold text-text">{summary.counts.PRESENT}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-muted">Absent</p>
            <p className="mt-2 font-display text-xl font-semibold text-text">{summary.counts.ABSENT}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-muted">Half day</p>
            <p className="mt-2 font-display text-xl font-semibold text-text">{summary.counts.HALF_DAY}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-muted">WFH</p>
            <p className="mt-2 font-display text-xl font-semibold text-text">{summary.counts.WORK_FROM_HOME}</p>
          </Card>
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-text-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Current status</th>
                <th className="px-5 py-3 font-medium">Mark as</th>
              </tr>
            </thead>
            <tbody>
              {employees?.map((emp: any) => {
                const current = statusFor(emp.id);
                return (
                  <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                    <td className="px-5 py-3 font-medium text-text">{emp.fullName}</td>
                    <td className="px-5 py-3">{current ? <Badge label={current} /> : <span className="text-text-faint">Not marked</span>}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={() => markMutation.mutate({ employeeId: emp.id, status: s })}
                            className={`rounded-full border px-2.5 py-1 text-xs transition ${
                              current === s
                                ? 'border-volt bg-volt/15 text-volt-soft'
                                : 'border-border text-text-muted hover:border-volt hover:text-volt-soft'
                            }`}
                          >
                            {s.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}