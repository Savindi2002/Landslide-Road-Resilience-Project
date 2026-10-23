
import './App.css'

function App() {
  const strategies = [
    { name: 'Risk-Based', reachability: 72.995, protected: '568 km' },
    { name: 'Centrality-Based', reachability: 85.047, protected: '567 km' },
    { name: 'Combined Strategy', reachability: 85.0, protected: '568 km' },
  ]

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>LANDSAFE</h2>
        <p className="sidebar-subtitle">Road Resilience Analytics</p>

        <nav>
          <a className="active" href="#overview">Overview</a>
          <a href="#strategies">Protection Strategies</a>
          <a href="#map">Road Risk Map</a>
          <a href="#simulation">Simulation</a>
        </nav>

        <div className="sidebar-note">
          <span>RESEARCH AREA</span>
          <strong>Ratnapura District</strong>
          <p>Sri Lanka</p>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div>
            <p className="eyebrow">GRAPH THEORY · ROAD NETWORK ANALYSIS</p>
            <h1>Landslide Road Resilience Dashboard</h1>
            <p className="subtitle">
              Exploring road protection strategies and healthcare accessibility.
            </p>
          </div>
          <span className="status">Research Prototype</span>
        </header>

        <section className="metrics">
          <article className="metric-card">
            <p>Road segments</p>
            <h2>14,535</h2>
            <span>Unique road segments</span>
          </article>
          <article className="metric-card">
            <p>Healthcare facilities</p>
            <h2>30</h2>
            <span>Mapped facilities</span>
          </article>
          <article className="metric-card">
            <p>Protection budget</p>
            <h2>10%</h2>
            <span>Of total road length</span>
          </article>
          <article className="metric-card">
            <p>Graph nodes</p>
            <h2>12,635</h2>
            <span>Road network locations</span>
          </article>
        </section>

        <section className="panel" id="strategies">
          <div className="section-heading">
            <div>
              <p className="eyebrow">STRATEGY EVALUATION</p>
              <h2>Road Network Reachability</h2>
            </div>
            <span className="tag">10% failure scenario</span>
          </div>

          <p className="panel-description">
            Percentage of road-network nodes reachable from a healthcare source
            under the reported disruption scenario.
          </p>

          <div className="strategy-list">
            {strategies.map((strategy) => (
              <div className="strategy-row" key={strategy.name}>
                <div className="strategy-label">
                  <strong>{strategy.name}</strong>
                  <span>{strategy.reachability.toFixed(3)}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${strategy.reachability}%` }}
                  />
                </div>
                <small>Protected road length: {strategy.protected}</small>
              </div>
            ))}
          </div>

          <p className="note">
            Note: These are illustrative dashboard values based on earlier
            project summaries. Verify the strategy labels and figures against
            your final simulation output before using them in your report.
          </p>
        </section>

        <section className="bottom-grid">
          <article className="panel" id="map">
            <p className="eyebrow">GEOGRAPHIC VIEW</p>
            <h2>Road Risk Map</h2>
            <div className="map-placeholder">
              <span className="map-symbol">⌖</span>
              <h3>Ratnapura Road Network</h3>
              <p>Next: load your road geometries and risk scores.</p>
            </div>
          </article>

          <article className="panel" id="simulation">
            <p className="eyebrow">WHAT-IF ANALYSIS</p>
            <h2>Disruption Simulation</h2>
            <p className="panel-description">
              The next version will let you adjust road failures and protection
              budgets to compare network resilience.
            </p>
            <div className="simulation-item">
              <span>Failure scenarios</span>
              <strong>2% · 5% · 10%</strong>
            </div>
            <div className="simulation-item">
              <span>Random trials</span>
              <strong>30 per scenario</strong>
            </div>
            <div className="simulation-item">
              <span>Optimization objective</span>
              <strong>Preserve accessibility</strong>
            </div>
          </article>
        </section>

        <footer>
          Landslide Road Resilience Research · Ratnapura, Sri Lanka
        </footer>
      </main>
    </div>
  )
}

export default App
