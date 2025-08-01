export default function DashboardFooter() {
  return (
    <footer className="bg-white border-t px-4 py-3 w-full">
      <div className="text-center text-sm text-gray-500">
        © {new Date().getFullYear()} H-Office Express. All rights reserved.
      </div>
    </footer>
  );
}
