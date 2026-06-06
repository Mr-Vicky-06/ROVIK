import Link from "next/link";
import { 
  LayoutDashboard, 
  PlusCircle, 
  UploadCloud, 
  BrainCircuit, 
  History, 
  AlertTriangle, 
  CheckCircle 
} from "lucide-react";

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { name: "Dashboard", href: "/orders", icon: LayoutDashboard },
    { name: "Create Order", href: "/orders/create", icon: PlusCircle },
    { name: "File Import", href: "/orders/smart-import", icon: BrainCircuit },
    { name: "Validation Center", href: "/orders/validation-center", icon: AlertTriangle },
    { name: "Import History", href: "/orders/history", icon: History },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 border-r bg-white dark:bg-zinc-900 px-4 py-6">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-indigo-500" />
            Order Ingestion
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ROVIK Operational Gateway</p>
        </div>
        
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors"
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
