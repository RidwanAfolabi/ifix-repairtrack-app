import { useParams } from 'react-router-dom';

export default function JobDetailPage() {
  const { jobId } = useParams();
  return (
    <div className="p-8 text-gray-400">
      <h1 className="text-xl font-semibold text-gray-700 mb-2">Job Detail</h1>
      <p className="text-sm font-mono">{jobId}</p>
      <p className="text-sm mt-2">Wired up in Phase 4.</p>
    </div>
  );
}
