import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { BrowserRouter, NavLink, Routes, Route, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import RoadRiskMap from './RoadRiskMap'
import EmergencyGuidance from './EmergencyGuidance'
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
          <NavLink to="/warnings">Warnings &amp; Help</NavLink>
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
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      <p className="page-description">{description}</p>
    </header>
  )
}


function HomePage() {
  const features = [
    {
      title: 'Road Risk Map',
      description:
        'Explore mapped road segments and their estimated landslide-risk scores.',
      image:
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
      imageAlt: 'Mountain landscape',
      icon: '⌖',
      link: '/map',
      action: 'Explore map',
      tone: 'green',
    },
    {
      title: 'Warnings & Help',
      description:
        'Find official disaster information, safety guidance, and emergency contacts.',
      image:
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
      imageAlt: 'Green landscape and hills',
      icon: '!',
      link: '/warnings',
      action: 'Get help',
      tone: 'orange',
    },
    {
      title: 'Hospital Access',
      description:
        'Explore healthcare locations and understand the road-network research.',
      image:
        'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=900&q=80',
      imageAlt: 'Hospital building',
      icon: '+',
      link: '/hospitals',
      action: 'View access',
      tone: 'blue',
    },
    {
      title: 'Research & Analysis',
      description:
        'Compare road-protection strategies and explore graph-theory findings.',
      image:
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80',
      imageAlt: 'Data analysis on a computer screen',
      icon: '▥',
      link: '/research',
      action: 'View research',
      tone: 'purple',
    },
  ]

  return (
    <div className="home-page">
      <section className="home-hero">
        <img
          className="home-hero-image"
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85"
          alt="Mountain landscape representing landslide-prone hill-country roads"
        />

        <div className="home-hero-overlay" />

        <div className="home-hero-content">
          <span className="home-eyebrow">
            LANDSLIDE RISK & ROAD ACCESS
          </span>

          <h1>
            Safer roads.
            <br />
            <span>Stronger communities.</span>
          </h1>

          <p>
            Explore road-risk research, understand healthcare access,
            and discover how data can support more resilient communities
            in Sri Lanka.
          </p>

          <div className="home-hero-actions">
            <Link to="/map" className="home-primary-button">
              Explore the map <span aria-hidden="true">→</span>
            </Link>

            <Link to="/research" className="home-secondary-button">
              View research
            </Link>
          </div>

          <div className="home-hero-caption">
            <span className="home-caption-dot" />
            Research prototype · Ratnapura District, Sri Lanka
          </div>
        </div>
      </section>

      <section className="home-welcome">
        <div>
          <p className="home-section-eyebrow">WELCOME TO LANDSAFE</p>
          <h2>Understand the risks. Make informed decisions.</h2>
          <p>
            A road-network research project exploring landslide risk
            and access to important community services.
          </p>
        </div>

        <div className="home-study-badge">
          <span aria-hidden="true">⌁</span>
          <div>
            <strong>Study area</strong>
            <span>Ratnapura District</span>
          </div>
        </div>
      </section>

      <section className="home-feature-section">
        <div className="home-section-heading">
          <div>
            <p className="home-section-eyebrow">EXPLORE THE DASHBOARD</p>
            <h2>Tools for safer, more resilient roads</h2>
          </div>
          <span className="home-feature-count">04 sections</span>
        </div>

        <div className="home-feature-grid">
          {features.map((feature) => (
            <Link
              className={`home-feature-card home-tone-${feature.tone}`}
              to={feature.link}
              key={feature.title}
            >
              <div className="home-feature-image-wrap">
                <img
                  src={feature.image}
                  alt={feature.imageAlt}
                  className="home-feature-image"
                  loading="lazy"
                />
                <span className="home-feature-icon" aria-hidden="true">
                  {feature.icon}
                </span>
              </div>

              <div className="home-feature-body">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>

                <span className="home-feature-link">
                  {feature.action}
                  <span aria-hidden="true"> →</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-emergency-panel">
        <div className="home-emergency-icon" aria-hidden="true">
          !
        </div>

        <div className="home-emergency-copy">
          <p className="home-section-eyebrow">EMERGENCY INFORMATION</p>
          <h2>Need urgent assistance?</h2>
          <p>
            Use official services for emergencies. Do not rely on this
            research prototype to confirm whether a road is safe or open.
          </p>
        </div>

        <div className="home-emergency-actions">
          <a className="home-emergency-button" href="tel:117">
            DMC · 117
          </a>
          <a className="home-emergency-button home-emergency-button-alt" href="tel:1990">
            Ambulance · 1990
          </a>
        </div>
      </section>

      <section className="home-safety-note">
        <span className="home-safety-icon" aria-hidden="true">✓</span>
        <div>
          <h3>Important safety notice</h3>
          <p>
            LANDSAFE presents research data and modelled scenarios. It is
            not a live landslide-warning system, and it cannot confirm
            current road closures or hospital operating status. Always
            check official warnings and road conditions before travelling.
          </p>
          <a href={DMC_URL} target="_blank" rel="noreferrer">
            Visit the Disaster Management Centre →
          </a>
        </div>
      </section>
    </div>
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
        title="Warnings &amp; Emergency Help"
        description="Use official sources for current warnings and urgent assistance."
      />

      <section className="home-grid">
        <article className="feature-card">
          <span className="feature-icon">!</span>
          <h2>Disaster Management Centre</h2>
          <p>Check official disaster notices and warnings before travelling.</p>

          <a
            className="button"
            href={DMC_URL}
            target="_blank"
            rel="noreferrer"
          >
            Open DMC website ↗
          </a>

          <p><strong>Emergency contact: 117</strong></p>
          <a href="tel:117">Call 117 from your phone</a>
        </article>

        <article className="feature-card">
          <span className="feature-icon">+</span>
          <h2>Suwa Seriya ambulance</h2>
          <p>For a medical emergency, contact the official ambulance service.</p>

          <a className="button" href="tel:1990">
            Call 1990
          </a>

          <p>
            <a href={AMBULANCE_URL} target="_blank" rel="noreferrer">
              Official website ↗
            </a>
          </p>
        </article>
      </section>

      <section className="content-panel">
        <EmergencyGuidance />
      </section>

      <section className="notice-card">
        <h2>Before travelling in a landslide-prone area</h2>
        <ul>
          <li>Check official warnings and follow evacuation instructions.</li>
          <li>
            Do not cross a road affected by a landslide, flood or unstable slope.
          </li>
          <li>Do not use this prototype as confirmation that a route is open.</li>
          <li>If there is immediate danger, contact the relevant emergency service.</li>
        </ul>
      </section>
    </>
  )
}

function HospitalPage() {
  const [facilities, setFacilities] = useState([])
  const [search, setSearch] = useState('')
  const [userLocation, setUserLocation] = useState(null)
  const [locationMessage, setLocationMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadFacilities() {
      try {
        const response = await fetch('/data/hospitals.geojson')

        if (!response.ok) {
          throw new Error('Could not load healthcare facilities.')
        }

        const data = await response.json()

        const mapped = (data.features || [])
          .filter((feature) => {
            const coordinates = feature.geometry?.coordinates

            return (
              feature.geometry?.type === 'Point' &&
              Array.isArray(coordinates) &&
              Number.isFinite(coordinates[0]) &&
              Number.isFinite(coordinates[1]) &&
              Math.abs(coordinates[0]) <= 180 &&
              Math.abs(coordinates[1]) <= 90
            )
          })
          .map((feature, index) => {
            const properties = feature.properties || {}
            const [longitude, latitude] = feature.geometry.coordinates

            const name =
              properties.name ||
              properties.Name ||
              properties.facility ||
              properties.amenity ||
              `Healthcare facility ${index + 1}`

            return {
              id: feature.id ?? `${longitude}-${latitude}-${index}`,
              name: String(name),
              latitude,
              longitude,
              type:
                properties.amenity ||
                properties.healthcare ||
                'Healthcare facility',
            }
          })

        if (!cancelled) {
          setFacilities(mapped)

          if (mapped.length === 0) {
            setError('No valid healthcare locations were found in the dataset.')
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load facilities.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadFacilities()

    return () => {
      cancelled = true
    }
  }, [])

  function getDistanceKm(lat1, lon1, lat2, lon2) {
    const toRadians = (degrees) => (degrees * Math.PI) / 180
    const earthRadiusKm = 6371

    const dLat = toRadians(lat2 - lat1)
    const dLon = toRadians(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2

    return (
      earthRadiusKm *
      2 *
      Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    )
  }

  function findMyLocation() {
    if (!navigator.geolocation) {
      setLocationMessage('Your browser does not support location access.')
      return
    }

    setLocationMessage('Finding your location...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setLocationMessage('Your location was found.')
      },
      () => {
        setLocationMessage(
          'Location unavailable. Allow location access in your browser and try again.'
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }

  const visibleFacilities = facilities
    .map((facility) => ({
      ...facility,
      distance: userLocation
        ? getDistanceKm(
            userLocation.latitude,
            userLocation.longitude,
            facility.latitude,
            facility.longitude
          )
        : null,
    }))
    .filter((facility) =>
      `${facility.name} ${facility.type}`
        .toLowerCase()
        .includes(search.toLowerCase().trim())
    )
    .sort((a, b) => {
      if (a.distance == null || b.distance == null) return 0
      return a.distance - b.distance
    })

  function getDirectionsUrl(facility) {
    const destination = `${facility.latitude},${facility.longitude}`
    const origin = userLocation
      ? `&origin=${userLocation.latitude},${userLocation.longitude}`
      : ''

    return (
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${destination}${origin}&travelmode=driving`
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="HEALTHCARE ACCESS"
        title="Find healthcare facilities"
        description="Explore mapped healthcare locations in the research dataset and find directions to a selected facility."
      />

      <section className="content-panel hospital-page">
        <div className="hospital-toolbar">
          <div>
            <h2>Healthcare facilities</h2>
            <p>
              {loading
                ? 'Loading facility data...'
                : `${visibleFacilities.length} facilities found`}
            </p>
          </div>

          <button
            type="button"
            className="button"
            onClick={findMyLocation}
          >
            Find my location
          </button>
        </div>

        {locationMessage && (
          <p className="hospital-status" role="status">
            {locationMessage}
          </p>
        )}

        <label className="hospital-search">
          Search facilities
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by facility name or type..."
          />
        </label>

        {loading && <p>Loading healthcare locations...</p>}

        {!loading && error && (
          <div className="notice-card" role="alert">
            <p>{error}</p>
            <p>
              Check that the file exists at{' '}
              <code>dashboard/public/data/hospitals.geojson</code>.
            </p>
          </div>
        )}

        {!loading && !error && visibleFacilities.length === 0 && (
          <div className="notice-card">
            No matching facilities. Try another search.
          </div>
        )}

        <div className="hospital-list">
          {visibleFacilities.map((facility) => (
            <article className="hospital-card" key={facility.id}>
              <div className="hospital-card-heading">
                <span className="hospital-icon" aria-hidden="true">+</span>

                <div>
                  <h3>{facility.name}</h3>
                  <p>{facility.type}</p>
                </div>
              </div>

              <div className="hospital-details">
                <span>
                  <strong>Coordinates:</strong>{' '}
                  {facility.latitude.toFixed(4)},{' '}
                  {facility.longitude.toFixed(4)}
                </span>

                {facility.distance != null && (
                  <span>
                    <strong>Straight-line distance:</strong>{' '}
                    {facility.distance.toFixed(1)} km
                  </span>
                )}
              </div>

              <a
                className="button hospital-directions"
                href={getDirectionsUrl(facility)}
                target="_blank"
                rel="noreferrer"
              >
                Get directions ↗
              </a>
            </article>
          ))}
        </div>

        <div className="notice-card hospital-safety-notice">
          <h3>Important safety information</h3>
          <p>
            Distances shown are straight-line estimates, not road distances.
            Directions open Google Maps and may not reflect landslide risks,
            road closures, traffic conditions, or hospital operating status.
            Confirm current conditions before travelling.
          </p>
          <p>
            For emergencies in Sri Lanka, call DMC 117 or Suwa Seriya
            ambulance 1990 as appropriate.
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

    const blob = new Blob([report], {
      type: 'text/plain;charset=utf-8',
    })

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
          <p>
            It creates a text file on your device for you to review and share.
          </p>
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
            <input
              name="location"
              required
              placeholder="e.g. village, road name, nearby landmark"
            />
          </label>

          <label>
            Date observed (if known)
            <input name="date" type="date" />
          </label>

          <label>
            Description
            <textarea
              name="description"
              required
              rows="5"
              placeholder="Describe what you observed. Avoid entering private personal information."
            />
          </label>

          <button className="button" type="submit">
            Download report
          </button>
        </form>
      </section>
    </>
  )
}



function ResearchPage() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedFailure, setSelectedFailure] = useState('5')

  useEffect(() => {
    let cancelled = false

    async function loadResults() {
      try {
        const response = await fetch('/data/research-results.json')

        if (!response.ok) {
          throw new Error('Could not load the research results file.')
        }

        const data = await response.json()

        if (
          !data.summary ||
          !Array.isArray(data.strategies) ||
          !Array.isArray(data.connectivity)
        ) {
          throw new Error('The research results file has an invalid format.')
        }

        if (!cancelled) {
          setResults(data)
          setError('')
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'An unexpected error occurred.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadResults()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <section className="research-dashboard">
        <h1>Research &amp; Analysis</h1>
        <p>Loading research results...</p>
      </section>
    )
  }

  if (error || !results) {
    return (
      <section className="research-dashboard">
        <h1>Research &amp; Analysis</h1>
        <p role="alert">
          {error || 'Research results are unavailable.'}
        </p>
        <p>
          Check that the file exists at{' '}
          <code>dashboard/public/data/research-results.json</code>.
        </p>
      </section>
    )
  }

  const {
    summary,
    strategies,
    connectivity,
    notes = {},
    optimization,
    randomTrialComparison = [],
    sensitivity = [],
  } = results

  const formatPercent = (value, digits = 3) => {
    if (
      value == null ||
      value === '' ||
      !Number.isFinite(Number(value))
    ) {
      return '—'
    }

    return `${Number(value).toFixed(digits)}%`
  }

  const formatNumber = (value, digits = 2) => {
    if (
      value == null ||
      value === '' ||
      !Number.isFinite(Number(value))
    ) {
      return '—'
    }

    return Number(value).toFixed(digits)
  }

  const formatCount = (value) => {
    if (
      value == null ||
      value === '' ||
      !Number.isFinite(Number(value))
    ) {
      return '—'
    }

    return Number(value).toLocaleString()
  }

  // Identify strategies with comparable fixed-failure results.
  const comparableStrategies = strategies.filter(
    (strategy) =>
      strategy.name !== 'No protection' &&
      strategy.reachabilityPercent != null &&
      strategy.reachabilityPercent !== '' &&
      Number.isFinite(Number(strategy.reachabilityPercent))
  )

  const bestStrategy = comparableStrategies.reduce(
    (best, strategy) =>
      !best ||
      Number(strategy.reachabilityPercent) >
        Number(best.reachabilityPercent)
        ? strategy
        : best,
    null
  )

  const designFailurePercent =
    summary.designFailurePercent ?? summary.disruptionPercent

  // Find all failure levels available in the random-trial dataset.
  const failureLevels = [
    ...new Set(
      randomTrialComparison
        .map((item) => Number(item.failurePercent))
        .filter(Number.isFinite)
    ),
  ].sort((a, b) => a - b)

  const activeFailure = failureLevels.some(
    (level) => String(level) === selectedFailure
  )
    ? selectedFailure
    : String(
        failureLevels.includes(5)
          ? 5
          : failureLevels[0] ?? ''
      )

  // Group chart bars by strategy for the selected failure level.
  const chartData = randomTrialComparison
    .filter(
      (item) => String(item.failurePercent) === activeFailure
    )
    .map((item) => ({
      strategy: item.strategy,
      meanReachablePercent: Number(item.meanReachablePercent),
    }))
    .filter((item) =>
      Number.isFinite(item.meanReachablePercent)
    )

  return (
    <section className="research-dashboard">
      <PageHeader
        eyebrow="GRAPH THEORY RESEARCH"
        title="Research &amp; Analysis"
        description="Compare road-protection strategies under modelled road-disruption scenarios."
      />

      <div className="research-notice">
        <strong>Research prototype:</strong> these results represent
        simulated scenarios, not live landslide warnings or guaranteed
        road-access information.
        <p>
          {notes.interpretation ||
            'Check official warnings and road conditions before travelling.'}
        </p>
      </div>

      {/* Research summary */}
      <section className="research-stat-grid">
        <article className="research-stat">
          <span>Unique road segments</span>
          <strong>{formatCount(summary.roadSegments)}</strong>
        </article>

        <article className="research-stat">
          <span>Mapped healthcare facilities</span>
          <strong>{formatCount(summary.healthcareFacilities)}</strong>
        </article>

        <article className="research-stat">
          <span>Road-length budget</span>
          <strong>{formatPercent(summary.budgetPercent, 1)}</strong>
          <p>{formatNumber(summary.budgetLengthKm, 1)} km</p>
        </article>

        <article className="research-stat">
          <span>Optimization design-failure scenario</span>
          <strong>{formatPercent(designFailurePercent, 1)}</strong>
          <p>
            {summary.designFailedRoadCount != null
              ? `${formatCount(summary.designFailedRoadCount)} roads failed in the design scenario`
              : 'Simulated road disruption'}
          </p>
        </article>
      </section>

      {/* Strategy comparison */}
      <section className="research-panel">
        <h2>Strategy comparison</h2>
        <p>
          Road selections are compared with the fixed-failure-set
          evaluation where matching results are available. A dash means
          that a comparable result is unavailable.
        </p>

        <div className="research-table-wrapper">
          <table className="research-table">
            <thead>
              <tr>
                <th>Strategy</th>
                <th>Roads selected</th>
                <th>Selected length</th>
                <th>Mean risk</th>
                <th>Centrality</th>
                <th>Reachability</th>
              </tr>
            </thead>

            <tbody>
              {strategies.map((strategy) => (
                <tr key={strategy.name}>
                  <td>{strategy.name}</td>
                  <td>{formatCount(strategy.roadsSelected)}</td>
                  <td>{formatNumber(strategy.lengthKm)} km</td>
                  <td>
                    {strategy.meanRisk == null
                      ? '—'
                      : formatNumber(strategy.meanRisk, 3)}
                  </td>
                  <td>
                    {strategy.centrality == null
                      ? '—'
                      : formatNumber(strategy.centrality, 3)}
                  </td>
                  <td>{formatPercent(strategy.reachabilityPercent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="research-footnote">
          {notes.budgetDefinition ||
            'The budget is measured by selected road length, not monetary cost.'}
        </p>
      </section>

      {/* Fixed-failure-set connectivity */}
      <section className="research-panel">
        <h2>Healthcare-network reachability</h2>
        <p>
          The same initial failed-road set is used to compare strategies.
          This is separate from the optimization design scenario.
        </p>

        <div className="research-bars">
          {connectivity.map((item) => {
            const value = Number(item.reachabilityPercent)
            const valid =
              item.reachabilityPercent != null &&
              item.reachabilityPercent !== '' &&
              Number.isFinite(value)

            return (
              <div className="research-bar-row" key={item.name}>
                <div className="research-bar-label">
                  <span>{item.name}</span>
                  <strong>
                    {valid ? formatPercent(value) : '—'}
                  </strong>
                </div>

                <div
                  className="research-bar-track"
                  role="img"
                  aria-label={`${item.name}: ${
                    valid ? formatPercent(value) : 'unavailable'
                  } reachability`}
                >
                  <div
                    className="research-bar-fill"
                    style={{
                      width: `${
                        valid ? Math.max(0, Math.min(100, value)) : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <p className="research-footnote">
          {notes.fairComparison ||
            'Reachability is a modelled network measure, not a live road-status indicator.'}
        </p>
      </section>

      {/* Optimization experiment */}
      {optimization && (
        <section className="research-panel">
          <h2>Hospital-access optimization</h2>
          <p>
            This optimization experiment uses its own design-failure
            scenario. Its result should not be directly compared with
            the fixed-failure-set percentages above.
          </p>

          <div className="research-stat-grid">
            <article className="research-stat">
              <span>Modelled node reachability</span>
              <strong>
                {formatPercent(optimization.reachablePercent)}
              </strong>
              <p>
                {formatCount(optimization.reachableNodeCount)}
                {' '}reachable nodes
              </p>
            </article>

            <article className="research-stat">
              <span>Roads selected</span>
              <strong>
                {formatCount(optimization.selectedRoadCount)}
              </strong>
              <p>Selected by the optimization model</p>
            </article>

            <article className="research-stat">
              <span>Protected road length</span>
              <strong>
                {formatNumber(optimization.protectedLengthKm)} km
              </strong>
              <p>
                {formatNumber(optimization.budgetRemainingKm)} km
                {' '}of budget length remaining
              </p>
            </article>

            <article className="research-stat">
              <span>Solver status</span>
              <strong>{optimization.status || 'Not available'}</strong>
              <p>
                {optimization.optimalityProven
                  ? 'Optimality proven by solver'
                  : 'Optimality not confirmed'}
              </p>
            </article>
          </div>

          {optimization.limitation && (
            <p className="research-footnote">
              Limitation: {optimization.limitation}
            </p>
          )}
        </section>
      )}

      {/* Findings */}
      <section className="research-panel">
        <h2>Key findings</h2>

        {comparableStrategies.length > 0 ? (
          <>
            <ul>
              {comparableStrategies
                .slice()
                .sort(
                  (a, b) =>
                    Number(b.reachabilityPercent) -
                    Number(a.reachabilityPercent)
                )
                .map((strategy) => (
                  <li key={strategy.name}>
                    <strong>{strategy.name}:</strong>{' '}
                    {formatPercent(strategy.reachabilityPercent)}
                    {' '}modelled reachability, selecting{' '}
                    {formatCount(strategy.roadsSelected)}
                    {' '}road segments.
                  </li>
                ))}
            </ul>

            {bestStrategy && (
              <p>
                In the fixed-failure-set comparison,{' '}
                <strong>{bestStrategy.name}</strong> has the highest
                reported reachability (
                {formatPercent(bestStrategy.reachabilityPercent)}).
                This does not guarantee real-world performance.
              </p>
            )}
          </>
        ) : (
          <p>
            No comparable strategy reachability results are available.
          </p>
        )}
      </section>

      {/* Random-trial chart and table */}
      {randomTrialComparison.length > 0 && (
        <section className="research-panel">
          <h2>Random-trial comparison</h2>
          <p>
            Compare mean reachability across repeated simulations.
            Select a failure level to compare strategies under the
            same simulated disruption percentage.
          </p>

          <div className="research-chart-controls">
            <label htmlFor="research-failure-level">
              Simulated road-failure percentage
            </label>

            <select
              id="research-failure-level"
              value={activeFailure}
              onChange={(event) =>
                setSelectedFailure(event.target.value)
              }
            >
              {failureLevels.map((level) => (
                <option key={level} value={String(level)}>
                  {level}% failure
                </option>
              ))}
            </select>
          </div>

          {chartData.length > 0 ? (
            <div className="research-chart">
              <ResponsiveContainer width="100%" height={340}>
                <BarChart
                  data={chartData}
                  margin={{
                    top: 15,
                    right: 15,
                    left: 5,
                    bottom: 55,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="strategy"
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                    height={80}
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />

                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toFixed(2)}%`,
                      'Mean reachability',
                    ]}
                  />

                  <Legend />

                  <Bar
                    dataKey="meanReachablePercent"
                    name="Mean reachability"
                    fill="#21a68a"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p>
              No valid chart results are available for this failure level.
            </p>
          )}

          <p className="research-footnote">
            The chart shows reported mean reachability for each strategy
            at the selected failure level. It does not represent live
            road conditions.
          </p>

          <div className="research-table-wrapper">
            <table className="research-table">
              <thead>
                <tr>
                  <th>Failure scenario</th>
                  <th>Strategy</th>
                  <th>Trials</th>
                  <th>Mean reachability</th>
                  <th>Standard deviation</th>
                  <th>Mean distance</th>
                </tr>
              </thead>

              <tbody>
                {randomTrialComparison.map((item, index) => (
                  <tr
                    key={`${item.failurePercent}-${item.strategy}-${index}`}
                  >
                    <td>{item.failurePercent}%</td>
                    <td>{item.strategy}</td>
                    <td>{formatCount(item.trials)}</td>
                    <td>{formatPercent(item.meanReachablePercent)}</td>
                    <td>{formatNumber(item.sdReachablePercent, 3)}</td>
                    <td>{formatNumber(item.meanDistanceKm)} km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Sensitivity analysis */}
      {sensitivity.length > 0 && (
        <section className="research-panel">
          <h2>Sensitivity analysis</h2>
          <p>
            Examine how network reachability changes at different
            simulated road-failure percentages.
          </p>

          <div className="research-table-wrapper">
            <table className="research-table">
              <thead>
                <tr>
                  <th>Failure scenario</th>
                  <th>Strategy</th>
                  <th>Roads closed</th>
                  <th>Reachable nodes</th>
                  <th>Reachability</th>
                </tr>
              </thead>

              <tbody>
                {sensitivity.map((item, index) => (
                  <tr
                    key={`${item.failurePercent}-${item.strategy}-${index}`}
                  >
                    <td>{item.failurePercent}%</td>
                    <td>{item.strategy}</td>
                    <td>{formatCount(item.closedRoads)}</td>
                    <td>
                      {formatCount(item.reachableNodes)}
                      {' / '}
                      {formatCount(item.totalNodes)}
                    </td>
                    <td>{formatPercent(item.reachabilityPercent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Data-driven recommendation */}
      <section className="research-panel research-recommendation">
        <h2>Research Recommendation</h2>

        {bestStrategy ? (
          <>
            <p>
              Based on the fixed-failure-set evaluation, the strategy
              with the highest reported modelled reachability is:
            </p>

            <div className="recommendation-result">
              <span>Best reported strategy</span>
              <h3>{bestStrategy.name}</h3>
              <strong>
                {formatPercent(bestStrategy.reachabilityPercent)}
              </strong>
              <span>Modelled network reachability</span>
            </div>

            <p>
              This result suggests that the selected strategy may help
              preserve network access under the evaluated disruption
              scenario. Further testing across additional failure
              scenarios is needed before making a real-world recommendation.
            </p>

            <ul>
              <li>
                <strong>Budget constraint:</strong> road protection is
                limited by the model's road-length budget.
              </li>
              <li>
                <strong>Evaluation:</strong> this finding uses the
                fixed-failure-set results, not the separate optimization
                experiment.
              </li>
              <li>
                <strong>Practical limitation:</strong> modelled
                reachability does not guarantee that roads are safe,
                open, or accessible in real conditions.
              </li>
            </ul>
          </>
        ) : (
          <p>
            A recommendation is unavailable because no comparable
            strategy reachability results were found.
          </p>
        )}
      </section>

      {/* Limitations and future improvements */}
      <section className="research-limitations">
        <h2>Research Limitations &amp; Future Improvements</h2>

        <p>
          LANDSAFE provides a graph-theoretical approach to exploring
          road-network resilience and healthcare accessibility under
          simulated landslide-related disruptions. The findings should
          be interpreted in light of the following limitations.
        </p>

        <h3>1. Road-risk estimation</h3>
        <p>
          Road-risk scores are model-based estimates derived from
          available road and terrain features. They are not official
          landslide susceptibility assessments or live warnings.
          The scores may not represent every factor contributing to
          an actual landslide.
        </p>

        <h3>2. Simulated road failures</h3>
        <p>
          The evaluation uses simulated road disruptions rather than
          a fully calibrated model of real landslide occurrence.
          Randomly selected failed roads may not reflect the actual
          location, timing, frequency, or severity of future landslides.
        </p>

        <h3>3. Healthcare facility coverage</h3>
        <p>
          The analysis uses mapped healthcare facilities available
          in the project dataset. Some facilities may be missing,
          incorrectly mapped, or unavailable for emergency services.
          Therefore, the results may not represent access to every
          healthcare facility in the study area.
        </p>

        <h3>4. Network reachability</h3>
        <p>
          Reachability measures the proportion of road-network nodes
          that remain connected to a mapped healthcare facility under
          a modelled scenario. Reachable nodes are a proxy for access;
          they do not directly measure the population served, travel
          time, ambulance availability, or actual road safety.
        </p>

        <h3>5. Road-length budget</h3>
        <p>
          The protection budget is constrained by road length rather
          than actual construction, maintenance, or landslide-mitigation
          costs. Roads of equal length may have different protection
          costs, engineering requirements, and practical feasibility.
        </p>

        <h3>6. Optimization assumptions</h3>
        <p>
          The hospital-access optimization results depend on the
          selected design-failure scenario, graph representation,
          objective function, and budget constraint. The reported
          solution does not guarantee optimal performance under every
          possible disruption scenario or real-world condition.
        </p>

        <h3>7. Data quality and completeness</h3>
        <p>
          The analysis depends on the completeness and accuracy of
          available road-network, terrain, and healthcare data.
          Missing road attributes, mapping errors, and infrastructure
          changes may affect risk estimates and network results.
        </p>

        <h3>Future improvements</h3>
        <ul>
          <li>
            Incorporate verified historical landslide inventories and
            rainfall observations to improve risk estimation.
          </li>
          <li>
            Validate predicted road risks against observed landslide
            events and official hazard information.
          </li>
          <li>
            Test protection strategies across multiple failure
            scenarios and different budget levels.
          </li>
          <li>
            Include population distribution, travel time, and
            emergency-service requirements when suitable data are
            available.
          </li>
          <li>
            Extend the budget model to include estimated mitigation
            costs and engineering feasibility.
          </li>
          <li>
            Update road and healthcare datasets regularly and compare
            model outputs with local authority information.
          </li>
        </ul>

        <p className="research-footnote">
          LANDSAFE is a research prototype intended to support
          exploration of road-network resilience. Its outputs should
          not be used as a substitute for official landslide warnings,
          verified road conditions, or professional engineering
          assessments.
        </p>
      </section>
    </section>
  )
}


export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
