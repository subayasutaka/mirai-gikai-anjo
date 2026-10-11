type UsageRow = {
  state: string;
  actual_usd: number | null;
  reserved_usd: number;
  duration_ms: number | null;
};
export function summarizePilotUsage(rows: UsageRow[]) {
  const completed = rows.filter((row) => row.state === "completed");
  return {
    accepted: rows.length,
    completed: completed.length,
    cost: rows.reduce((sum, row) => sum + (row.actual_usd ?? 0), 0),
    reserved: rows.reduce((sum, row) => sum + row.reserved_usd, 0),
    averageSeconds: completed.length
      ? completed.reduce((sum, row) => sum + (row.duration_ms ?? 0), 0) /
        completed.length /
        1000
      : null,
  };
}
