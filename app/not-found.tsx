import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070C]">
      <div className="text-center space-y-4 p-8">
        <h2 className="text-2xl font-semibold text-white">Page Not Found</h2>
        <p className="text-gray-400">Could not find the requested resource</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[#38BDF8] text-white rounded-full hover:bg-[#38BDF8]/90 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
