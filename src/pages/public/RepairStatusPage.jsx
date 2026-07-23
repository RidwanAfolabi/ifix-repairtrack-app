import { useParams } from 'react-router-dom';

export default function RepairStatusPage() {
  const { jobId } = useParams();
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center text-gray-400">
      <h1 className="text-xl font-semibold text-gray-700 mb-2">Repair Card</h1>
      <p className="text-sm font-mono">{jobId}</p>
      <p className="text-sm mt-2">Wired up in Phase 2.</p>
    </div>
  );
}
