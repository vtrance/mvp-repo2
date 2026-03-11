import Link from "next/link";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-black font-sans">
      <aside className="min-w-[230px] w-64 shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 pt-0 pb-4 px-0">
        <div className="flex h-full flex-col">
          {/* Top section: logo */}
          <div className="mb-0 flex justify-center bg-[#4F5E6B] py-3">
            <Image
              src="/sidebar-logo.png"
              alt="VA Research Biobank"
              width={160}
              height={40}
              className="h-auto w-auto"
            />
          </div>

          {/* Rest of sidebar */}
          <div className="flex-1 bg-[#2F4050]">            
            <nav className="space-y-2 text-sm">
              <Link
                href="/dashboard"
                className="block text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white"
              >
                Overview
              </Link>
              <Link
                href="/dashboard/studies"
                className="block text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white"
              >
                Studies
              </Link>
              <Link
                href="/dashboard/study-search"
                className="block text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white"
              >
                Study search
              </Link>
            </nav>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 bg-[#EBEBEB]">
        {children}
      </main>
    </div>
  );
}
