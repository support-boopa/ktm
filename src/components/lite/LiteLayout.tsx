import { Link, useLocation } from "react-router-dom";
import { ReactNode } from "react";

interface LiteLayoutProps {
  children: ReactNode;
}

const navLinks = [
  { path: "/", label: "الرئيسية" },
  { path: "/games", label: "جميع الألعاب" },
  { path: "/top", label: "الأكثر مشاهدة" },
  { path: "/recent", label: "الأحدث" },
  { path: "/categories", label: "التصنيفات" },
];

export const LiteLayout = ({ children }: LiteLayoutProps) => {
  const location = useLocation();

  return (
    <div className="lite-page">
      {/* Navbar */}
      <nav className="lite-navbar">
        <div className="lite-navbar-content">
          <Link to="/" className="lite-logo">
            KTM
          </Link>
          <div className="lite-nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`lite-nav-link ${location.pathname === link.path ? "active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="lite-footer">
        <p className="lite-footer-text">
          © 2024 KTM Games. جميع الحقوق محفوظة.
        </p>
      </footer>
    </div>
  );
};
