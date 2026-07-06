import { NavLink, Outlet, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle.jsx";
import UnitToggle from "./UnitToggle.jsx";

const NAV = [
  {
    to: "/today",
    label: "Today",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M6 6l1.5 1.5M16.5 16.5 18 18M18 6l-1.5 1.5M7.5 16.5 6 18" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/compare",
    label: "Compare",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M12 4v16" strokeLinecap="round" />
        <path d="M7 8 4 12l3 4M17 8l3 4-3 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Layout() {
  const location = useLocation();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/aurora.svg" alt="" width="38" height="38" />
          <div>
            <strong>Aurora</strong>
            <span>Live weather in color</span>
          </div>
          <ThemeToggle />
        </div>

        <nav className="sidenav" aria-label="Primary">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to}>
              <span className="ico" aria-hidden="true">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="side-controls">
          <UnitToggle />
        </div>

        <div className="sidebar-foot">
          <p>
            Data by{" "}
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
              Open-Meteo
            </a>
          </p>
          <p className="muted">Icons hand-drawn in SVG.</p>
          <p className="credit">Developed by Vincent Enimedez</p>
        </div>
      </aside>

      <main className="main">
        <div key={location.pathname} className="page-fade">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
