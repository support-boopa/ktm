import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { QuickActions } from "./QuickActions";
import { ParticleBackground } from "@/components/ui/ParticleBackground";
import { AnnouncementBanner } from "@/components/ui/AnnouncementBanner";
import { AchievementPopup } from "@/components/ui/AchievementPopup";
import { useAchievements } from "@/hooks/useAchievements";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { newAchievement, clearNewAchievement } = useAchievements();

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      <AnnouncementBanner />
      <Navbar />
      <main className="pt-16 relative z-10 pb-20 md:pb-0">{children}</main>
      <Footer />
      <QuickActions />
      <AchievementPopup achievement={newAchievement} onClose={clearNewAchievement} />
    </div>
  );
};
