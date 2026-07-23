import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Page not found</h1>
      <Link to="/track" className="text-primary font-medium hover:underline">
        Back to Track My Repair
      </Link>
    </div>
  );
}
