// Mirrors ifix-repairtrack-api's src/types.ts JOB_STATUSES / STATUS_LABELS.
//
// Every other page in this app uses the API's own current_status_label /
// status_label rather than a frontend copy — but the "pick a new status"
// control on the staff Job Detail page needs the full ordered list of
// *possible* statuses, including ones a given job hasn't reached yet, and no
// endpoint exists to fetch that list. This hardcoded copy is the one
// unavoidable exception. If the backend enum ever changes, update this to
// match — nothing here re-derives it automatically.
export const JOB_STATUSES = [
  { value: 'received', label: 'Device Received' },
  { value: 'diagnosing', label: 'Diagnosing Issue' },
  { value: 'awaiting_parts', label: 'Awaiting Parts' },
  { value: 'in_progress', label: 'Repair In Progress' },
  { value: 'quality_check', label: 'Quality Check' },
  { value: 'ready_for_collection', label: 'Ready for Collection' },
  { value: 'collected', label: 'Collected' },
];

export function statusRank(status) {
  return JOB_STATUSES.findIndex((s) => s.value === status);
}
