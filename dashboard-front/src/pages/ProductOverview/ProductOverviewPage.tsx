
import { PublicNavbar } from "../LandingPage/PublicNavbar"

export default function ProductOverviewPage() {

const publicLightNavTheme = {
  textPrimaryClassName: "text-slate-900",
  cardBorderClassName: "border-slate-200",
  accentColor: "#4B67FF",
  buttonPrimaryColor: "#4B67FF",
};


  return (
    // HIGHLIGHT: richer background, same light palette
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50 text-slate-800">

        <PublicNavbar
        textPrimaryClassName={publicLightNavTheme.textPrimaryClassName}
        cardBorderClassName={publicLightNavTheme.cardBorderClassName}
        accentColor={publicLightNavTheme.accentColor}
        buttonPrimaryColor={publicLightNavTheme.buttonPrimaryColor}
      />  
      <main className="max-w-6xl mx-auto px-6 lg:px-10 py-16 space-y-20">

        {/* SECTION 1 — HERO */}
        <section className="space-y-6">
          {/* HIGHLIGHT: pill + brand cue */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/70 px-3 py-1 text-xs font-medium text-blue-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            01 · Product overview
          </div>

          <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900">
            One operations brain for your whole fleet.
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            See vehicles, drivers, cash-ins and service data in one live dashboard.
            Built for African taxi and logistics operators.
          </p>
        </section>


        {/* SECTION 9 — FINAL CTA */}
        <section className="text-center space-y-6">
          {/* HIGHLIGHT: gradient CTA strip */}
          <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 px-6 py-10 md:px-10 md:py-12 text-white shadow-lg">
            <h2 className="text-3xl font-semibold">
              Give us four weeks. We’ll tell you exactly which cars are worth keeping.
            </h2>

            <p className="mt-3 text-sm md:text-base text-blue-100 max-w-2xl mx-auto">
              Start with your current fleet, even if it is only two cars. We will help you
              get to a clean, honest picture of profit per vehicle and per driver.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <button className="px-6 py-3 rounded-full bg-white text-blue-700 font-semibold shadow hover:bg-blue-50 transition">
                Request an implementation call
              </button>
              <button className="px-6 py-3 rounded-full border border-blue-100 text-white/90 bg-white/10 hover:bg-white/15 transition">
                View sample dashboard
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 2 — PAIN & CONTEXT */}
        <section
          className="grid lg:grid-cols-2 gap-16 rounded-3xl border border-slate-100 
                     bg-white/80 p-6 md:p-8 shadow-sm"
        >
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">
              Your problem isn’t drivers. It’s blind spots.
            </h2>
            <p className="text-slate-600">
              Most operators don’t fail because the business is bad. They fail because
              they can’t see what’s actually happening inside their fleet.
            </p>

            <ul className="space-y-3 text-slate-600">
              <li>• Paper cash-in books that disappear</li>
              <li>• Fuel jumps wiping out weekly profit</li>
              <li>• No proof when a driver blames the garage</li>
              <li>• Only discovering losses when cash is already gone</li>
            </ul>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="font-semibold mb-3 text-slate-900">
                A typical week <span className="italic">without</span> Trogern
              </h3>
              <ul className="text-slate-600 space-y-2">
                <li>• Inconsistent cash-ins</li>
                <li>• No visibility on fuel-to-profit ratio</li>
                <li>• Guesswork on which cars to prioritise</li>
                <li>• Delayed decisions</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl shadow-sm">
              <h3 className="font-semibold mb-3 text-blue-900">
                The same week <span className="italic">with</span> Trogern
              </h3>
              <ul className="text-blue-800 space-y-2">
                <li>• Daily profit per vehicle</li>
                <li>• Driver vs vehicle comparison</li>
                <li>• Automated alerts for anomalies</li>
                <li>• One source of truth</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 3 — PRODUCT DIAGRAM */}
        <section
          className="space-y-8 rounded-3xl border border-blue-100 
                     bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 
                     p-6 md:p-8 shadow-sm"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                02 · How it fits into your operation
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">How Trogern works</h2>
            </div>
            <span className="hidden md:inline-flex rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-100">
              Inputs → Engine → Outputs
            </span>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="space-y-3 rounded-2xl bg-white/70 border border-blue-100 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Inputs</h3>
              <ul className="text-slate-700 space-y-2 text-sm">
                <li>• Daily cash-ins</li>
                <li>• Fuel & expenses</li>
                <li>• Driver shifts</li>
                <li>• Vehicle service data</li>
                <li>• Mileage (manual / GPS)</li>
              </ul>
            </div>

            <div className="space-y-3 rounded-2xl bg-white/80 border border-blue-100 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Trogern Engine</h3>
              <ul className="text-slate-700 space-y-2 text-sm">
                <li>• Cleans and structures your data</li>
                <li>• Calculates daily/weekly profit</li>
                <li>• Tracks anomalies</li>
                <li>• Predicts upcoming risks</li>
              </ul>
            </div>

            <div className="space-y-3 rounded-2xl bg-white/70 border border-blue-100 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Outputs</h3>
              <ul className="text-slate-700 space-y-2 text-sm">
                <li>• Live fleet dashboard</li>
                <li>• Alerts & recommendations</li>
                <li>• Monthly profitability</li>
                <li>• Export-ready reports</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 4 — MODULE GRID */}
        <section
          className="space-y-8 rounded-3xl border border-slate-100 
                     bg-white/80 p-6 md:p-8 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                03 · What’s inside
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">All modules included</h2>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="font-semibold mb-2 text-slate-900">Fleet & Vehicles</h3>
              <ul className="text-slate-600 space-y-1 text-sm">
                <li>• Register vehicles with full purchase data</li>
                <li>• Track mileage & usage</li>
                <li>• Profit per km / route analysis</li>
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="font-semibold mb-2 text-slate-900">Drivers & Shifts</h3>
              <ul className="text-slate-600 space-y-1 text-sm">
                <li>• Track driver performance</li>
                <li>• Compare output per route</li>
                <li>• Flag underperformance early</li>
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="font-semibold mb-2 text-slate-900">Cash-ins & Expenses</h3>
              <ul className="text-slate-600 space-y-1 text-sm">
                <li>• Record daily cash-ins</li>
                <li>• All expenses linked per vehicle</li>
                <li>• Live profit tracking</li>
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="font-semibold mb-2 text-slate-900">Service & Maintenance</h3>
              <ul className="text-slate-600 space-y-1 text-sm">
                <li>• Service intervals & reminders</li>
                <li>• Tyre tracking & lifetime estimation</li>
                <li>• Predictive maintenance</li>
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="font-semibold mb-2 text-slate-900">Alerts & Decisions</h3>
              <ul className="text-slate-600 space-y-1 text-sm">
                <li>• Cash-in target drops</li>
                <li>• Fuel–profit mismatches</li>
                <li>• High repair frequency alerts</li>
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="font-semibold mb-2 text-slate-900">Reports & Exports</h3>
              <ul className="text-slate-600 space-y-1 text-sm">
                <li>• Monthly statements</li>
                <li>• CSV and Excel exports</li>
                <li>• Investor-ready summaries</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 5 — DECISION INTELLIGENCE */}
        <section
          className="space-y-8 rounded-3xl border border-blue-100 
                     bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 
                     p-6 md:p-8 shadow-sm"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              04 · Decision intelligence
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              Turn every week into a data-driven decision
            </h2>
          </div>

          <div className="space-y-6">
            <div className="bg-white/80 border border-blue-100 p-6 rounded-2xl shadow-sm">
              <h3 className="font-semibold mb-2 text-slate-900">
                Scenario: Cash-ins dropped 25%
              </h3>
              <p className="text-slate-700 text-sm">
                Trogern highlights fuel spend spikes + driver change + route mileage mismatch.
                Shows the real cause instead of guessing.
              </p>
            </div>

            <div className="bg-white/80 border border-blue-100 p-6 rounded-2xl shadow-sm">
              <h3 className="font-semibold mb-2 text-slate-900">
                Scenario: Car always in the garage
              </h3>
              <p className="text-slate-700 text-sm">
                Trogern calculates maintenance cost per km. If it exceeds revenue per km,
                system flags the car for retirement or route change.
              </p>
            </div>

            <div className="bg-white/80 border border-blue-100 p-6 rounded-2xl shadow-sm">
              <h3 className="font-semibold mb-2 text-slate-900">
                Scenario: Fuel prices jump
              </h3>
              <p className="text-slate-700 text-sm">
                Trogern calculates new breakeven lines and suggests new cash-in targets to stay profitable.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6 — IMPLEMENTATION FLOW */}
        <section
          className="space-y-8 rounded-3xl border border-slate-100 
                     bg-white/80 p-6 md:p-8 shadow-sm"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              05 · Rollout plan
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              How to deploy Trogern in your operation
            </h2>
          </div>

          <ol className="space-y-6 text-slate-700 text-sm">
            <li>
              <strong className="text-slate-900">1. Set up your fleet</strong><br />
              Add vehicles, purchase data, drivers and weekly targets.
            </li>
            <li>
              <strong className="text-slate-900">2. Start logging daily cash-ins</strong><br />
              Operator captures cash-ins and expenses each evening.
            </li>
            <li>
              <strong className="text-slate-900">3. Weekly review</strong><br />
              Compare vehicles, drivers, and routes. Make one strategic move per week.
            </li>
            <li>
              <strong className="text-slate-900">4. Scale</strong><br />
              Add remaining vehicles, accountant access, and optional GPS feeds.
            </li>
          </ol>
        </section>

        {/* SECTION 7 — TRUST / SECURITY */}
        <section
          className="space-y-8 rounded-3xl border border-blue-100 
                     bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 
                     p-6 md:p-8 shadow-sm"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              06 · Trust
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              Security & Reliability
            </h2>
          </div>

          <ul className="space-y-3 text-slate-700 text-sm">
            <li>• Hosted on Google Cloud / Firebase</li>
            <li>• Your data remains yours — export anytime</li>
            <li>• Role-based access (owner / operator / accountant)</li>
            <li>• Automatic backups, designed for low-bandwidth environments</li>
          </ul>
        </section>

        {/* SECTION 8 — FAQ */}
        <section
          className="space-y-8 rounded-3xl border border-slate-100 
                     bg-white/80 p-6 md:p-8 shadow-sm"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              07 · FAQ
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6 text-slate-700 text-sm">
            <p>
              <strong className="text-slate-900">Do I need GPS tracking to start?</strong><br />
              No. Trogern works with manual mileage and cash-ins.
            </p>

            <p>
              <strong className="text-slate-900">Is this useful for 2–5 vehicles?</strong><br />
              Yes. Visibility matters even more when the fleet is small.
            </p>

            <p>
              <strong className="text-slate-900">Can operators use it from their phones?</strong><br />
              Yes, fully responsive and mobile-friendly.
            </p>

            <p>
              <strong className="text-slate-900">Can I export my data?</strong><br />
              CSV/Excel/PDF supported.
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}