
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'



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
    <span className="brand-icon">🛣️</span>
    <span>
      <strong>LANDSAFE</strong>
      <small>Safer roads, stronger communities</small>
    </span>
  </Link>

  <div className="sidebar-visual">
    <img
      src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80"
      alt="Mountain landscape"
    />
    <div className="sidebar-visual-overlay">
      <span>ROAD RESILIENCE</span>
      <strong>Connecting communities</strong>
    </div>
  </div>

  <p className="nav-heading">PUBLIC SERVICES</p>
  <nav className="side-nav">
    <NavLink end to="/">
      <span className="nav-icon">⌂</span> Home
    </NavLink>
    <NavLink to="/map">
      <span className="nav-icon">⌖</span> Road Risk Map
    </NavLink>
    <NavLink to="/warnings">
      <span className="nav-icon">⚠</span> Warnings &amp; Help
    </NavLink>
    <NavLink to="/hospitals">
      <span className="nav-icon">✚</span> Hospital Access
    </NavLink>
    <NavLink to="/report">
      <span className="nav-icon">▤</span> Report a Road Problem
    </NavLink>
  </nav>

  <p className="nav-heading">RESEARCH</p>
  <nav className="side-nav">
    <NavLink to="/research">
      <span className="nav-icon">▥</span> Road Planning
    </NavLink>
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

      <section className="map-hero-image">
        <img
          src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=85"
          alt="Mountain landscape with winding terrain"
        />
        <div className="map-hero-overlay">
          <span>LANDSAFE · SRI LANKA</span>
          <h2>Explore Road Risk</h2>
          <p>Understand road vulnerability across the Ratnapura region.</p>
        </div>
      </section>

      <section className="content-panel">
        <RoadRiskMap />
      </section>
    </>
  )
}



function WarningsPage() {
  return (
    <div className="warnings-page">

      {/* Warning hero banner */}
      <section className="warnings-hero">
        <div className="warnings-hero-content">
          <span className="warnings-eyebrow">
            ⚠ SAFETY & EMERGENCY INFORMATION
          </span>

          <h1>
            Stay Alert.
            <br />
            <span>Stay Safe.</span>
          </h1>

          <p>
            Check official disaster warnings, follow safety guidance,
            and get emergency assistance when needed.
          </p>

          <a className="warnings-hero-button" href={DMC_URL}
            target="_blank" rel="noreferrer">
            Check Official Warnings ↗
          </a>
        </div>

        <div className="warnings-hero-image">
          <img
            src="https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1000&q=85"
            alt="Dense forest in a mountainous landscape"
          />

          <div className="warnings-image-caption">
            <span>⚠</span>
            <div>
              <strong>Be prepared</strong>
              <p>Check official alerts before travelling</p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency contact cards */}
      <section className="warnings-contact-grid">

        <article className="warnings-contact-card">
          <img
            className="warnings-card-image"
            src="https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=85"
            alt="Forest and natural landscape"
            loading="lazy"
          />

          <div className="warnings-card-body">
            <span className="warnings-card-tag">OFFICIAL WARNINGS</span>
            <div className="warnings-card-icon dmc-icon">⚠</div>

            <h2>Disaster Management Centre</h2>
            <p>
              Check official disaster notices and warnings before travelling.
            </p>

            <a
              className="warnings-primary-button"
              href={DMC_URL}
              target="_blank"
              rel="noreferrer"
            >
              Open DMC website ↗
            </a>

            <div className="warnings-phone-row">
              <div>
                <span>Emergency contact</span>
                <strong>117</strong>
              </div>

              <a href="tel:117" className="warnings-call-button">
                Call 117
              </a>
            </div>
          </div>
        </article>

        <article className="warnings-contact-card">
          <img
            className="warnings-card-image"
            src="https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=85"
            alt="Hospital building"
            loading="lazy"
          />

          <div className="warnings-card-body">
            <span className="warnings-card-tag">MEDICAL EMERGENCY</span>
            <div className="warnings-card-icon ambulance-icon">✚</div>

            <h2>Suwa Seriya Ambulance</h2>
            <p>
              Contact the official ambulance service when urgent medical
              assistance is needed.
            </p>

            <a className="warnings-primary-button"
              href="tel:1990">
              Call 1990
            </a>

            <div className="warnings-phone-row">
              <div>
                <span>Official service</span>
                <strong>1990</strong>
              </div>

              <a
                href={AMBULANCE_URL}
                target="_blank"
                rel="noreferrer"
                className="warnings-call-button"
              >
                Website ↗
              </a>
            </div>
          </div>
        </article>

      </section>

      {/* Existing guidance */}
      <section className="content-panel">
        <EmergencyGuidance />
      </section>

      {/* Travel safety notice */}
      <section className="warnings-safety-panel">
        <div className="warnings-safety-icon">!</div>

        <div>
          <span className="warnings-card-tag">TRAVEL SAFETY</span>
          <h2>Before travelling in a landslide-prone area</h2>

          <ul>
            <li>
              Check official warnings and follow evacuation instructions.
            </li>
            <li>
              Do not cross a road affected by a landslide, flood,
              or unstable slope.
            </li>
            <li>
              Do not use this prototype as confirmation that a route is open.
            </li>
            <li>
              If there is immediate danger, contact the relevant
              emergency service.
            </li>
          </ul>
        </div>
      </section>

    </div>
  )
}



function HospitalPage() {
  const [facilities, setFacilities] = useState([])
  const [search, setSearch] = useState('')
  const [userLocation, setUserLocation] = useState(null)
  const [locationMessage, setLocationMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)

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

            return {
              id: feature.id ?? `${longitude}-${latitude}-${index}`,
              name: String(
                properties.name ||
                properties.Name ||
                properties.facility ||
                properties.amenity ||
                `Healthcare facility ${index + 1}`
              ),
              latitude,
              longitude,
              type: String(
                properties.amenity ||
                properties.healthcare ||
                properties.facility ||
                'Healthcare facility'
              ),
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
        setLocationMessage('Your location was found successfully.')
      },
      () => {
        setLocationMessage(
          'Location unavailable. Allow location access and try again.'
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

  const selectedFacility = visibleFacilities.find(
    (facility) => facility.id === selectedId
  )

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

  const hospitalImages = [
    'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
  ]

  return (
    <div className="hospital-page hospital-page-modern">

      {/* Hero banner */}
      <section className="hospital-hero">
        <div className="hospital-hero-content">
          <span className="hospital-hero-tag">
            <span>✚</span> HEALTHCARE ACCESS
          </span>

          <h1>
            Healthcare,
            <br />
            <span>Closer to You.</span>
          </h1>

          <p>
            Explore healthcare facilities in the research dataset,
            check approximate distances, and find directions to your
            selected destination.
          </p>

          <button
            type="button"
            className="hospital-hero-button"
            onClick={() =>
              document.getElementById('hospital-facility-list')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          >
            Explore facilities <span>→</span>
          </button>

          <div className="hospital-hero-points">
            <span>✓ Facility search</span>
            <span>✓ Location support</span>
            <span>✓ Map directions</span>
          </div>
        </div>

        <div className="hospital-hero-visual">
          <img
            src={hospitalImages[0]}
            alt="Hospital building"
          />

          <div className="hospital-floating-card">
            <div className="hospital-floating-icon">✚</div>
            <div>
              <strong>Healthcare directory</strong>
              <p>
                {loading
                  ? 'Loading facilities...'
                  : `${facilities.length} mapped facilities`}
              </p>
            </div>
          </div>

          <div className="hospital-hero-decoration">+</div>
        </div>
      </section>

      {/* Quick information cards */}
      <section className="hospital-quick-stats">
        <article className="hospital-stat-card">
          <div className="hospital-stat-icon blue">✚</div>
          <div>
            <span>Mapped facilities</span>
            <strong>{loading ? '...' : facilities.length}</strong>
          </div>
        </article>

        <article className="hospital-stat-card">
          <div className="hospital-stat-icon green">⌖</div>
          <div>
            <span>Your location</span>
            <strong className="hospital-stat-status">
              {userLocation ? 'Located' : 'Not set'}
            </strong>
          </div>
        </article>

        <article className="hospital-stat-card">
          <div className="hospital-stat-icon purple">↗</div>
          <div>
            <span>Search results</span>
            <strong>{loading ? '...' : visibleFacilities.length}</strong>
          </div>
        </article>
      </section>

      {/* Search and location controls */}
      <section className="hospital-directory-section" id="hospital-facility-list">
        <div className="hospital-section-heading">
          <div>
            <span className="hospital-section-eyebrow">YOUR DIRECTORY</span>
            <h2>Find a healthcare facility</h2>
            <p>Search the available locations and explore your options.</p>
          </div>

          <button
            type="button"
            className="hospital-location-button"
            onClick={findMyLocation}
          >
            <span>⌖</span> Find my location
          </button>
        </div>

        {locationMessage && (
          <p className="hospital-status" role="status">
            {locationMessage}
          </p>
        )}

        <label className="hospital-search-modern">
          <span>⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by hospital name or facility type..."
          />
          {search && (
            <button
              type="button"
              className="hospital-clear-search"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </label>

        {userLocation && (
          <div className="hospital-location-success">
            <span>✓</span>
            Your location is available. Facilities are sorted by
            approximate straight-line distance.
          </div>
        )}

        {loading && (
          <div className="hospital-loading">
            <div className="hospital-spinner" />
            <p>Loading healthcare facilities...</p>
          </div>
        )}

        {!loading && error && (
          <div className="notice-card" role="alert">
            <h3>Unable to load facilities</h3>
            <p>{error}</p>
            <p>
              Check that{' '}
              <code>dashboard/public/data/hospitals.geojson</code>{' '}
              exists and contains valid point locations.
            </p>
          </div>
        )}

        {!loading && !error && visibleFacilities.length === 0 && (
          <div className="hospital-empty-state">
            <span>⌕</span>
            <h3>No matching facilities</h3>
            <p>Try a different name or search term.</p>
            <button
              type="button"
              className="hospital-location-button"
              onClick={() => setSearch('')}
            >
              Clear search
            </button>
          </div>
        )}

        {/* Selected facility information */}
        {selectedFacility && !loading && (
          <section className="hospital-selected-panel">
            <div className="hospital-selected-heading">
              <div className="hospital-selected-icon">✚</div>
              <div>
                <span>SELECTED FACILITY</span>
                <h3>{selectedFacility.name}</h3>
                <p>{selectedFacility.type}</p>
              </div>
              <button
                type="button"
                className="hospital-close-selected"
                onClick={() => setSelectedId(null)}
                aria-label="Close selected facility"
              >
                ×
              </button>
            </div>

            <div className="hospital-selected-details">
              <div>
                <span>Latitude</span>
                <strong>{selectedFacility.latitude.toFixed(5)}</strong>
              </div>
              <div>
                <span>Longitude</span>
                <strong>{selectedFacility.longitude.toFixed(5)}</strong>
              </div>
              <div>
                <span>Straight-line distance</span>
                <strong>
                  {selectedFacility.distance == null
                    ? 'Set your location'
                    : `${selectedFacility.distance.toFixed(1)} km`}
                </strong>
              </div>
            </div>

            <a
              className="hospital-directions-button"
              href={getDirectionsUrl(selectedFacility)}
              target="_blank"
              rel="noreferrer"
            >
              Open directions in Google Maps ↗
            </a>
          </section>
        )}

        {/* Facility cards */}
        {!loading && !error && visibleFacilities.length > 0 && (
          <div className="hospital-list-modern">
            {visibleFacilities.map((facility, index) => (
              <article
                className={`hospital-card-modern ${
                  selectedId === facility.id ? 'selected' : ''
                }`}
                key={facility.id}
              >
                <div className="hospital-card-image-wrap">
                  <img
                    src={hospitalImages[index % hospitalImages.length]}
                    alt="Illustrative healthcare facility"
                    loading="lazy"
                  />

                  <span className="hospital-card-badge">
                    Healthcare facility
                  </span>
                </div>

                <div className="hospital-card-modern-body">
                  <div className="hospital-card-title-row">
                    <div className="hospital-card-symbol">✚</div>
                    <div className="hospital-card-title">
                      <h3>{facility.name}</h3>
                      <p>{facility.type}</p>
                    </div>
                  </div>

                  <div className="hospital-card-info">
                    <div className="hospital-info-row">
                      <span>⌖</span>
                      <div>
                        <small>Coordinates</small>
                        <strong>
                          {facility.latitude.toFixed(4)},{' '}
                          {facility.longitude.toFixed(4)}
                        </strong>
                      </div>
                    </div>

                    <div className="hospital-info-row">
                      <span>↔</span>
                      <div>
                        <small>Straight-line distance</small>
                        <strong>
                          {facility.distance == null
                            ? 'Set your location to calculate'
                            : `${facility.distance.toFixed(1)} km away`}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="hospital-card-actions">
                    <button
                      type="button"
                      className="hospital-view-button"
                      onClick={() =>
                        setSelectedId(
                          selectedId === facility.id ? null : facility.id
                        )
                      }
                    >
                      {selectedId === facility.id
                        ? 'Hide details'
                        : 'View details'}
                    </button>

                    <a
                      className="hospital-map-button"
                      href={getDirectionsUrl(facility)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Directions ↗
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Safety information */}
      <section className="hospital-safety-banner">
        <div className="hospital-safety-symbol">!</div>
        <div>
          <h3>Travel safely. Check conditions first.</h3>
          <p>
            Distances are straight-line estimates, not road distances.
            Google Maps directions may not reflect landslide risks,
            road closures, traffic, or current hospital operating status.
            Verify local conditions before travelling.
          </p>
          <div className="hospital-emergency-links">
            <span>🇱🇰 Sri Lanka emergency contacts</span>
            <a href="tel:117">DMC: 117</a>
            <a href="tel:1990">Ambulance: 1990</a>
          </div>
        </div>
      </section>
    </div>
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

      {/* Road safety picture */}
      <section className="report-hero-image">
        <img
          src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=85"
          alt="Mountainous terrain illustrating the importance of road safety"
        />
        <div className="report-hero-overlay">
          <span>LANDSAFE · COMMUNITY SAFETY</span>
          <h2>See a Road Hazard?</h2>
          <p>Help identify road problems and support safer journeys.</p>
        </div>
      </section>

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

      {/* Research picture banner */}
      <section className="research-hero-image">
        <img
          src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=85"
          alt="Mountain terrain representing landslide resilience research"
        />

        <div className="research-hero-overlay">
          <span>LANDSAFE · RESEARCH &amp; ANALYSIS</span>
          <h2>Building Resilient Road Networks</h2>
          <p>
            Explore graph theory, road-risk analysis, and
            strategies for protecting access to healthcare.
          </p>
        </div>
      </section>

      {/* Research notice */}
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

      {/* Healthcare-network reachability */}
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

      {/* Interactive Graph Theory Research Visualizations */}
      <section className="research-panel graph-theory-visuals">
        <h2>Interactive Graph Theory Visualizations</h2>
        <p>
          Explore how road protection, simulated road failures, and
          network connectivity relate to healthcare access in the
          Ratnapura study area. These are research results, not live
          road conditions.
        </p>

        {(() => {
          const COLORS = [
            '#0F766E',
            '#2563EB',
            '#EA580C',
            '#7C3AED',
            '#DB2777',
            '#0891B2',
            '#65A30D',
          ]

          const validStrategies = strategies.filter(
            (item) =>
              Number.isFinite(Number(item.roadsSelected)) &&
              item.roadsSelected != null
          )

          const roadSelectionData = validStrategies.map((item) => ({
            name: item.name,
            roads: Number(item.roadsSelected),
          }))

          const riskData = validStrategies
            .filter((item) => item.meanRisk != null)
            .map((item) => ({
              name: item.name,
              risk: Number(item.meanRisk),
              centrality: Number(item.centrality || 0),
            }))

          const reachabilityData = connectivity
            .filter(
              (item) =>
                item.reachabilityPercent != null &&
                Number.isFinite(Number(item.reachabilityPercent))
            )
            .map((item) => ({
              name: item.name,
              reachability: Number(item.reachabilityPercent),
            }))

          const failureData = sensitivity
            .filter(
              (item) =>
                item.failurePercent != null &&
                item.reachabilityPercent != null &&
                Number.isFinite(Number(item.reachabilityPercent))
            )
            .map((item) => ({
              failure: Number(item.failurePercent),
              strategy: item.strategy,
              reachability: Number(item.reachabilityPercent),
            }))

          const randomData = randomTrialComparison
            .filter(
              (item) =>
                item.failurePercent != null &&
                item.meanReachablePercent != null &&
                Number.isFinite(Number(item.meanReachablePercent))
            )
            .map((item) => ({
              failure: Number(item.failurePercent),
              strategy: item.strategy,
              meanReachability: Number(item.meanReachablePercent),
              distance: Number(item.meanDistanceKm || 0),
            }))

          const optimizationData = optimization
            ? [
                {
                  name: 'Budget used',
                  value:
                    Number(optimization.protectedLengthKm || 0) +
                      Number(optimization.budgetRemainingKm || 0) > 0
                      ? (Number(optimization.protectedLengthKm || 0) /
                          (Number(optimization.protectedLengthKm || 0) +
                            Number(optimization.budgetRemainingKm || 0))) *
                        100
                      : 0,
                },
                {
                  name: 'Budget remaining',
                  value:
                    Number(optimization.protectedLengthKm || 0) +
                      Number(optimization.budgetRemainingKm || 0) > 0
                      ? (Number(optimization.budgetRemainingKm || 0) /
                          (Number(optimization.protectedLengthKm || 0) +
                            Number(optimization.budgetRemainingKm || 0))) *
                        100
                      : 0,
                },
              ]
            : []

          const graphCard = (number, title, description, chart) => (
            <article className="graph-visual-card" key={number}>
              <div className="graph-visual-card-heading">
                <span className="graph-visual-number">
                  {String(number).padStart(2, '0')}
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </div>
              <div className="graph-visual-chart">{chart}</div>
            </article>
          )

          return (
            <div className="graph-visual-grid">
              {graphCard(
                1,
                'Roads selected by strategy',
                'Compare how many road segments each strategy selects.',
                roadSelectionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={roadSelectionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-15}
                        textAnchor="end"
                        height={75}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="roads"
                        name="Road segments"
                        radius={[7, 7, 0, 0]}
                      >
                        {roadSelectionData.map((item, index) => (
                          <Cell
                            key={item.name}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p>No road-selection data available.</p>
              )}

              {graphCard(
                2,
                'Strategy reachability',
                'Compare the percentage of network nodes that remain reachable.',
                reachabilityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reachabilityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-15}
                        textAnchor="end"
                        height={75}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        formatter={(value) =>
                          `${Number(value).toFixed(2)}%`
                        }
                      />
                      <Bar
                        dataKey="reachability"
                        name="Reachability"
                        radius={[7, 7, 0, 0]}
                      >
                        {reachabilityData.map((item, index) => (
                          <Cell
                            key={item.name}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p>No comparable reachability data available.</p>
              )}

              {graphCard(
                3,
                'Road risk by strategy',
                'Compare the reported average risk score for each strategy.',
                riskData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={riskData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-15}
                        textAnchor="end"
                        height={75}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="risk"
                        name="Mean risk"
                        stroke="#EA580C"
                        fill="#FDBA74"
                        strokeWidth={3}
                      />
                      <Area
                        type="monotone"
                        dataKey="centrality"
                        name="Centrality"
                        stroke="#7C3AED"
                        fill="#C4B5FD"
                        strokeWidth={3}
                      />
                      <Legend />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <p>No risk-score data available.</p>
              )}

              {graphCard(
                4,
                'Road selection distribution',
                'See how selected road segments are distributed across strategies.',
                roadSelectionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={roadSelectionData}
                        dataKey="roads"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {roadSelectionData.map((item, index) => (
                          <Cell
                            key={item.name}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p>No road-selection data available.</p>
              )}

              {graphCard(
                5,
                'Reachability under road failures',
                'Explore how reachability changes as the simulated failure percentage changes.',
                failureData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={failureData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="failure"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        labelFormatter={(value) =>
                          `Failure level: ${value}%`
                        }
                        formatter={(value, name) => [
                          `${Number(value).toFixed(2)}%`,
                          name,
                        ]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="reachability"
                        name="Reachability"
                        stroke="#2563EB"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <p>No sensitivity data available.</p>
              )}

              {graphCard(
                6,
                'Repeated simulation results',
                'Compare average reachability from the available random trials.',
                randomData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        dataKey="failure"
                        name="Failure percentage"
                        tickFormatter={(value) => `${value}%`}
                      />
                      <YAxis
                        type="number"
                        dataKey="meanReachability"
                        name="Mean reachability"
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value, name) => [
                          Number(value).toFixed(2),
                          name,
                        ]}
                      />
                      <Legend />
                      {Array.from(
                        new Set(randomData.map((item) => item.strategy))
                      ).map((strategy, index) => (
                        <Scatter
                          key={strategy}
                          name={strategy}
                          data={randomData.filter(
                            (item) => item.strategy === strategy
                          )}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </ScatterChart>
                  </ResponsiveContainer>
                ) : <p>No random-trial data available.</p>
              )}

              {graphCard(
                7,
                'Optimization budget use',
                'View the proportion of the selected road-length budget used and remaining.',
                optimizationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={optimizationData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                        label={({ name, value }) =>
                          `${name}: ${Number(value).toFixed(1)}%`
                        }
                      >
                        <Cell fill="#0F766E" />
                        <Cell fill="#F59E0B" />
                      </Pie>
                      <Tooltip
                        formatter={(value) =>
                          `${Number(value).toFixed(2)}%`
                        }
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p>Optimization budget data is unavailable.</p>
              )}
            </div>
          )
        })()}
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

      {/* Key findings */}
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

      {/* Random-trial comparison */}
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

      {/* Road-selection chart */}
      <section className="research-panel">
        <h2>Roads Selected by Strategy</h2>
        <p>Compare how many road segments each strategy selects.</p>
        <div className="research-chart">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={strategies}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="roadsSelected"
                name="Roads selected"
                radius={[6, 6, 0, 0]}
              >
                {strategies.map((item, index) => (
                  <Cell
                    key={item.name}
                    fill={['#0d9488', '#6366f1', '#f59e0b', '#ec4899'][index % 4]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Selected road length */}
      <section className="research-panel">
        <h2>Road Length Selected</h2>
        <p>Compare the total road length selected under each strategy.</p>
        <div className="research-chart">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={strategies}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip
                formatter={(value) => [
                  `${Number(value).toFixed(2)} km`,
                  'Selected length',
                ]}
              />
              <Bar
                dataKey="lengthKm"
                name="Length (km)"
                radius={[6, 6, 0, 0]}
              >
                {strategies.map((item, index) => (
                  <Cell
                    key={item.name}
                    fill={['#2563eb', '#14b8a6', '#a855f7', '#f97316'][index % 4]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Risk score */}
      <section className="research-panel">
        <h2>Average Road-Risk Score</h2>
        <p>Compare the reported average risk score for each strategy.</p>
        <div className="research-chart">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={strategies.filter(
                (item) =>
                  item.meanRisk != null &&
                  Number.isFinite(Number(item.meanRisk))
              )}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 1]} />
              <Tooltip
                formatter={(value) => [
                  Number(value).toFixed(3),
                  'Mean risk',
                ]}
              />
              <Bar
                dataKey="meanRisk"
                name="Mean risk"
                fill="#ef4444"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Reachability chart */}
      <section className="research-panel">
        <h2>Healthcare Network Reachability</h2>
        <p>
          Compare the percentage of network nodes that remain reachable.
        </p>
        <div className="research-chart">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={connectivity.filter(
                (item) =>
                  item.reachabilityPercent != null &&
                  item.reachabilityPercent !== '' &&
                  Number.isFinite(Number(item.reachabilityPercent))
              )}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                formatter={(value) => [
                  `${Number(value).toFixed(3)}%`,
                  'Reachability',
                ]}
              />
              <Bar
                dataKey="reachabilityPercent"
                name="Reachability"
                radius={[6, 6, 0, 0]}
              >
                {connectivity.map((item, index) => (
                  <Cell
                    key={`${item.name}-${index}`}
                    fill={['#16a34a', '#0ea5e9', '#8b5cf6', '#f59e0b'][index % 4]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Sensitivity chart */}
      {sensitivity.length > 0 && (
        <section className="research-panel">
          <h2>Effect of Increasing Road Failures</h2>
          <p>
            Explore how modelled reachability changes as more roads fail.
          </p>
          <div className="research-chart">
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={sensitivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="failurePercent"
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toFixed(2)}%`,
                    'Reachability',
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="reachabilityPercent"
                  name="Reachability"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="research-footnote">
            Each point represents a row in the sensitivity dataset. If
            several strategies share a failure level, the chart displays
            those rows in dataset order.
          </p>
        </section>
      )}

      {/* Optimization budget */}
      {optimization && (
        <section className="research-panel">
          <h2>Optimization Budget Use</h2>
          <p>
            Compare the road-length budget with selected and remaining lengths.
          </p>
          <div className="research-chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  {
                    name: 'Budget',
                    length: Number(optimization.budgetLengthKm),
                  },
                  {
                    name: 'Selected',
                    length: Number(optimization.protectedLengthKm),
                  },
                  {
                    name: 'Remaining',
                    length: Number(optimization.budgetRemainingKm),
                  },
                ].filter((item) => Number.isFinite(item.length))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toFixed(2)} km`,
                    'Road length',
                  ]}
                />
                <Bar dataKey="length" name="Road length" radius={[6, 6, 0, 0]}>
                  <Cell fill="#2563eb" />
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Sensitivity analysis table */}
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
