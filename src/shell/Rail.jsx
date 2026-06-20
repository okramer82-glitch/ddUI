import { useHashRoute, navigate } from "../lib/router.js";

const NAV = [
  { route: "#/pulse",      icon: "🏠", label: "Home",       match: ["pulse"] },
  { route: "#/upskilling", icon: "🎓", label: "Upskilling", match: ["upskilling", "srs", "tutor", "skills", "gaps", "learning", "box"] },
  { route: "#/calendar",   icon: "📅", label: "Calendar",   match: ["calendar"] },
  { route: "#/projects",   icon: "🛰", label: "Projects & Team", match: ["projects"] },
  { route: "#/messaging",  icon: "💬", label: "Messages",        match: ["messaging"] },
  { route: "#/team",       icon: "👥", label: "Team Leader",      match: ["team"] },
  { route: "#/pm",         icon: "📋", label: "Projects / PM",    match: ["pm"] },
  { route: "#/org",        icon: "🌳", label: "Team Org Chart",   match: ["org"] },
];

export default function Rail() {
  const { base } = useHashRoute();
  return (
    <nav className="rail" aria-label="Navigation">
      <div className="rail__brand" title="Doty">F</div>
      {NAV.map((n) => (
        <button key={n.route} className={"rail__ws" + (n.match.includes(base) ? " is-active" : "")}
          title={n.label} onClick={() => navigate(n.route)}>{n.icon}</button>))}
      <div className="rail__spacer" />
      <button className={"rail__ws" + (base === "settings" ? " is-active" : "")} title="Settings" onClick={() => navigate("#/settings")}>⚙</button>
    </nav>
  );
}
