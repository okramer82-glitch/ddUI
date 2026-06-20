import { navigate } from "../lib/router.js";

export default function Onboarding() {
  return (
    <div className="view view--narrow">
      <div className="onb">
        <div className="onb__top"><h1 className="view__title">Welcome to Doty</h1>
          <div className="dots"><span className="dot-on" /><span /><span /><span /><span /></div></div>
        <p className="muted onb__tag">"Open the app, tap once, and everything is managed."</p>

        <section className="onb__step"><span className="onb__num">1</span><div>
          <h3>Who are you?</h3>
          <div className="row"><select className="sel"><option>Founder</option><option>Sales lead</option><option>Ops</option></select>
            <select className="sel"><option>Software</option><option>Agency</option><option>Finance</option></select></div>
        </div></section>

        <section className="onb__step"><span className="onb__num">2</span><div>
          <h3>Connect your tools</h3>
          <div className="connectors">
            <button className="conn is-done">Slack ✓</button><button className="conn is-done">Gmail ✓</button>
            <button className="conn">Drive</button><button className="conn">CRM ▾</button><button className="conn conn--add">+ more</button>
          </div>
          <div className="backfill"><span className="muted">Backfill running in background</span>
            <span className="cost__bar"><span className="cost__fill" style={{ width: "60%" }} /></span><span className="muted">60%</span></div>
        </div></section>

        <section className="onb__step"><span className="onb__num">3</span><div>
          <h3>Quick interview <span className="muted">💬 AI Interviewer</span></h3>
          <div className="interview"><p>"What's the one thing you can't drop the ball on?"</p>
            <input className="cmd__input interview__in" placeholder="Type your answer…" /></div>
        </div></section>

        <section className="onb__step"><span className="onb__num">4</span><div>
          <h3>Pick a starter template</h3>
          <div className="connectors"><button className="conn tpl">Agency</button><button className="conn tpl is-done">Sales</button><button className="conn tpl">Founder</button></div>
        </div></section>

        <button className="btn btn--primary btn--lg" onClick={() => navigate("#/pulse")}>Build my workspace →</button>
      </div>
    </div>
  );
}
