
import { BrowserRouter, NavLink, Routes, Route, Link } from 'react-router-dom'
import RoadRiskMap from './RoadRiskMap'
import './App.css'

const DMC_URL = 'https://www.dmc.gov.lk/'
const AMBULANCE_URL = 'https://www.1990.lk/'

function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-icon">L</span>
          <span>
            <strong>LANDSAFE</strong>
            <small>Community Safety</small>
          </span>
        </Link>

        <p className="nav-heading">PUBLIC SERVICES</p>
        <nav className="side-nav">
          <NavLink end to="/">Home</NavLink>
          <NavLink to="/map">Road Risk Map</NavLink>
          <NavLink to="/warnings">Warnings & Help</NavLink>
          <NavLink to="/hospitals">Hospital Access</NavLink>
          <NavLink to="/report">Report a Road Problem</NavLink>
        </nav>

        <p className="nav-heading">RESEARCH</p>
        <nav className="side-nav">
          <NavLink to="/research">Road Planning</NavLink>
        </nav>

        <div className="sidebar-location">
          <small>INITIAL STUDY AREA</small>
          <strong>Ratnapura District</strong>
          <span>Sri Lanka</span>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/warnings" element={<WarningsPage />} />
          <Route path="/hospitals" element={<HospitalPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
        <footer>
          LANDSAFE · Research prototype · Ratnapura, Sri Lanka
        </footer>
      </main>
    </div>
  )
}

function PageHeader({ eyebrow, title, description }) {
  return (
    <header className="page-header">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="page-description">{description}</p>
    </header>
  )
}

function HomePage() {
  return (
    <>
      <PageHeader
        eyebrow="COMMUNITY ROAD SAFETY"
        title="Know the risks. Find reliable help."
        description="Explore estimated road risks and access official emergency information for Sri Lanka."
      />

      <section className="emergency-banner">
        <div>
          <span className="eyebrow">NEED EMERGENCY HELP?</span>
          <h2>Contact the official services directly</h2>
          <p>Do not rely on this research map to decide whether a road is safe.</p>
        </div>
        <div className="emergency-actions">
          <a className="button button-light" href="tel:117">Call DMC · 117</a>
          <a className="button button-light" href="tel:1990">Call ambulance · 1990</a>
        </div>
      </section>

      <section className="home-grid">
        <Link className="feature-card" to="/map">
          <span className="feature-icon">⌖</span>
          <h2>Explore the road map</h2>
          <p>View road segments and their estimated risk scores.</p>
          <span className="card-link">Open map →</span>
        </Link>

        <Link className="feature-card" to="/warnings">
          <span className="feature-icon">!</span>
          <h2>Warnings & emergency help</h2>
          <p>Open official disaster information and emergency contacts.</p>
          <span className="card-link">Get help →</span>
        </Link>

        <Link className="feature-card" to="/hospitals">
          <span className="feature-icon">+</span>
          <h2>Hospital access</h2>
          <p>Learn what our road-network analysis can tell us about healthcare access.</p>
          <span className="card-link">Explore access →</span>
        </Link>

        <Link className="feature-card" to="/report">
          <span className="feature-icon">✎</span>
          <h2>Report a road problem</h2>
          <p>Prepare a report about a damaged or blocked road.</p>
          <span className="card-link">Prepare report →</span>
        </Link>
      </section>

      <section className="notice-card">
        <h2>Important safety information</h2>
        <p>
          The map uses research data, not live road-closure or live landslide
          warning feeds. A low estimated score does not mean a road is safe.
          Always check official warnings before travelling.
        </p>
        <a href={DMC_URL} target="_blank" rel="noreferrer">
          Visit the Disaster Management Centre →
        </a>
      </section>
    </>
  )
}

function MapPage() {
  return (
    <>
      <PageHeader
        eyebrow="PUBLIC MAP"
        title="Ratnapura Road Risk Map"
        description="Select a road segment to inspect the available research attributes."
      />
      <section className="content-panel">
        <RoadRiskMap />
      </section>
    </>
  )
}

function WarningsPage() {
  return (
    <>
      <PageHeader
        eyebrow="OFFICIAL INFORMATION"
        title="Warnings & Emergency Help"
        description="Use official sources for current warnings and urgent assistance."
      />

      <section className="home-grid">
        <article className="feature-card">
          <span className="feature-icon">!</span>
          <h2>Disaster Management Centre</h2>
          <p>Check official disaster notices and warnings before travelling.</p>
          <a className="button" href={DMC_URL} target="_blank" rel="noreferrer">
            Open DMC website ↗
          </a>
          <p><strong>Emergency contact: 117</strong></p>
          <a href="tel:117">Call 117 from your phone</a>
        </article>

        <article className="feature-card">
          <span className="feature-icon">+</span>
          <h2>Suwa Seriya ambulance</h2>
          <p>For a medical emergency, contact the official ambulance service.</p>
          <a className="button" href="tel:1990">Call 1990</a>
          <p><a href={AMBULANCE_URL} target="_blank" rel="noreferrer">
            Official website ↗
          </a></p>
        </article>
      </section>

      <section className="notice-card">
        <h2>Before travelling in a landslide-prone area</h2>
        <ul>
          <li>Check official warnings and follow evacuation instructions.</li>
          <li>Do not cross a road affected by a landslide, flood or unstable slope.</li>
          <li>Do not use this prototype as confirmation that a route is open.</li>
          <li>If there is immediate danger, contact the relevant emergency service.</li>
        </ul>
      </section>
    </>
  )
}

function HospitalPage() {
  return (
    <>
      <PageHeader
        eyebrow="HEALTHCARE ACCESS"
        title="Understand hospital accessibility"
        description="Our research studies how road disruptions may affect connections to mapped healthcare facilities."
      />

      <section className="content-panel">
        <h2>What this page can currently show</h2>
        <ul>
          <li>Healthcare facilities included in the research dataset.</li>
          <li>How road-network disruption affects network connectivity.</li>
          <li>Research comparisons between road-protection strategies.</li>
        </ul>

        <div className="notice-card">
          <h3>What it cannot do yet</h3>
          <p>
            This version does not calculate a verified live route to a hospital,
            confirm that a hospital is open, or know which roads are currently
            blocked. In an emergency, contact the official emergency services.
          </p>
        </div>
      </section>
    </>
  )
}

function ReportPage() {
  function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const report = [
      'LANDSAFE ROAD PROBLEM REPORT',
      `Problem: ${form.get('problem')}`,
      `Location: ${form.get('location')}`,
      `Description: ${form.get('description')}`,
      `Date observed: ${form.get('date') || 'Not provided'}`,
    ].join('\n')

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'landsafe-road-report.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHeader
        eyebrow="COMMUNITY CONTRIBUTION"
        title="Prepare a road problem report"
        description="Record details about a road problem. You can save the report and share it with the relevant authority."
      />

      <section className="content-panel report-panel">
        <div className="notice-card">
          <strong>This form does not send a report to an authority.</strong>
          <p>It creates a text file on your device for you to review and share.</p>
        </div>

        <form className="report-form" onSubmit={handleSubmit}>
          <label>
            Type of problem
            <select name="problem" required defaultValue="">
              <option value="" disabled>Select a problem</option>
              <option>Road blocked</option>
              <option>Landslide or fallen soil</option>
              <option>Cracked or damaged road</option>
              <option>Flooding on road</option>
              <option>Other road hazard</option>
            </select>
          </label>

          <label>
            Location or nearest landmark
            <input name="location" required placeholder="e.g. village, road name, nearby landmark" />
          </label>

          <label>
            Date observed (if known)
            <input name="date" type="date" />
          </label>

          <label>
            Description
            <textarea name="description" required rows="5" placeholder="Describe what you observed. Avoid entering private personal information." />
          </label>

          <button className="button" type="submit">Download report</button>
        </form>
      </section>
    </>
  )
}

function ResearchPage() {
  return (
    <>
      <PageHeader
        eyebrow="PLANNING & RESEARCH"
        title="Road resilience planning"
        description="A separate space for the graph-theory research and road-protection analysis."
      />

      <section className="content-panel">
        <h2>Current research scope</h2>
        <p>
          The study area is Ratnapura District. The model uses terrain and
          landslide-proximity indicators to estimate road risk and explores
          how a limited road-protection budget affects network connectivity.
        </p>
        <div className="stat-grid">
          <article className="stat-card">
            <span>Unique road segments</span>
            <strong>14,535</strong>
          </article>
          <article className="stat-card">
            <span>Mapped healthcare facilities</span>
            <strong>30</strong>
          </article>
          <article className="stat-card">
            <span>Protection budget scenario</span>
            <strong>10% of road length</strong>
          </article>
        </div>
        <p className="small-note">
          These are research dataset counts, not live service statistics.
          Risk scores are estimates and require validation against observed
          landslide and road-closure records.
        </p>
      </section>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
