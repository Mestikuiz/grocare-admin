import { SidebarProvider } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      {/* Dark bg shows through rounded corners */}
      <div className="h-screen overflow-hidden" style={{ background: "#1A1A1A" }}>
        <AppHeader />
        <AppSidebar />
        {/* Content — ml for sidebar, pt for header, fills remaining height */}
        <div className="lg:ml-[240px] pt-14 h-screen">
          {/* Rounded corner wrapper — overflow-hidden clips scrollbar inside the curve */}
          <div className="h-full rounded-tr-2xl overflow-hidden" style={{ background: "#F6F7F7" }}>
            {/* Actual scroll container — scrollbar hidden so it never touches the corner */}
            <div className="h-full overflow-y-auto main-scroll">
              <main className="p-6">
                <Outlet />
              </main>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
