import { NavLink, useNavigate } from "react-router-dom";
import { mobileNav } from "./navItems";
import { cn } from "@/utils/cn";

export function MobileBottomNav() {
  const navigate = useNavigate();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 lg:hidden">
      <div className="glass-strong flex items-center justify-around rounded-xl px-2 py-1.5">
        {mobileNav.map((item, idx) => {
          const isUpload = item.label === "Upload";
          if (isUpload) {
            return (
              <button
                key={idx}
                onClick={() => navigate("/app/files")}
                className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-glass"
              >
                <item.icon className="h-5 w-5" />
              </button>
            );
          }
          return (
            <NavLink
              key={idx}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-[10px] font-medium text-soft",
                  isActive && "text-accent",
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
