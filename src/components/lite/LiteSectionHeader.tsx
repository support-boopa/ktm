import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface LiteSectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
}

export const LiteSectionHeader = ({ title, subtitle, href }: LiteSectionHeaderProps) => {
  return (
    <div className="lite-section-header">
      <div>
        <h2 className="lite-section-title">{title}</h2>
        {subtitle && <p className="lite-section-subtitle">{subtitle}</p>}
      </div>
      {href && (
        <Link to={href} className="lite-view-all">
          عرض الكل
          <ArrowLeft size={14} />
        </Link>
      )}
    </div>
  );
};
