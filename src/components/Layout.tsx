import { Link, useLocation } from "react-router-dom";
import { Home, Calculator, Video, User } from "lucide-react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, path: "/", label: "Home" },
    { icon: Calculator, path: "/calculator", label: "Calculator" },
    { icon: Video, path: "/videos", label: "Videos" },
    { icon: User, path: "/profile", label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">{children}</main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ icon: Icon, path, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center p-2 ${
                isActive(path)
                  ? "text-primary"
                  : "text-gray-500 hover:text-primary"
              }`}
            >
              <Icon size={24} />
              <span className="text-xs mt-1">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;