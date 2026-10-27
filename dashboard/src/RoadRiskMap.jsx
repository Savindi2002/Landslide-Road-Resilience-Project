
import { useCallback, useEffect, useMemo, useState } from 'react'
import GraphTheoryRoute from './GraphTheoryRoute'
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './RoadRiskMap.css'

const MAP_CENTER = [6.68, 80.4]
const MAP_ZOOM = 10

const ROADS_URL = '/data/roads.geojson'
const HOSPITALS_URL = '/data/hospitals.geojson'

const RISK_THRESHOLDS = { low: 0.45, high: 0.65 }

function getRoadRisk(feature) {
  const raw = feature?.properties?.risk_proxy_score
  if (raw === null || raw === undefined || raw === '') return null

  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

function getRiskCategory(risk) {
  if (risk === null || risk === undefined) return 'unknown'
  if (risk < RISK_THRESHOLDS.low) return 'low'
  if (risk < RISK_THRESHOLDS.high) return 'medium'
  return 'high'
}

function getRiskLabel(risk) {
  const labels = {
    low: 'Lower estimated risk',
    medium: 'Moderate estimated risk',
    high: 'Higher estimated risk',
    unknown: 'Risk score unavailable',
  }

  return labels[getRiskCategory(risk)]
}

function getRoadColor(feature) {
  const colors = {
    low: '#2e9d67',
    medium: '#e6a23c',
    high: '#d94b4b',
    unknown: '#89939d',
  }

  return colors[getRiskCategory(getRoadRisk(feature))]
}

function roadStyle(feature) {
  const key = getEdgeKey(feature)
  const closed = key && feature.properties?._unused

  return {
    color: getRoadColor(feature),
    weight: 3,
    opacity: 0.85,
  }
}

function getFacilityName(feature) {
  const p = feature?.properties || {}

  return (
    p.name ||
    p['name:en'] ||
    p.official_name ||
    p.operator ||
    p.healthcare ||
    'Healthcare facility'
  )
}

function getValidPoint(feature) {
  const coordinates = feature?.geometry?.coordinates

  if (
    feature?.geometry?.type !== 'Point' ||
    !Array.isArray(coordinates) ||
    coordinates.length < 2
  ) {
    return null
  }

  const [longitude, latitude] = coordinates

  if (
    !Number.isFinite(Number(longitude)) ||
    !Number.isFinite(Number(latitude)) ||
    Math.abs(Number(latitude)) > 90 ||
    Math.abs(Number(longitude)) > 180
  ) {
    return null
  }

  return [Number(latitude), Number(longitude)]
}

function calculateDistanceKm(a, b) {
  if (!a || !b) return Infinity

  const radians = (degrees) => (degrees * Math.PI) / 180
  const earthRadiusKm = 6371

  const lat1 = radians(a[0])
  const lat2 = radians(b[0])
  const deltaLat = radians(b[0] - a[0])
  const deltaLon = radians(b[1] - a[1])

  const value =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) ** 2

  return (
    earthRadiusKm *
    2 *
    Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
  )
}

// Keep this key format identical to GraphTheoryRoute.jsx.
function getEdgeKey(feature) {
  const p = feature?.properties || {}
  const { u, v } = p

  if (u == null || v == null || String(u) === String(v)) {
    return null
  }

  return [String(u), String(v)].sort().join('|')
}

// Find the nearest graph endpoint to a hospital.
// GraphTheoryRoute independently snaps the starting location to a node.
function findNearestGraphNode(roads, position) {
  if (!roads?.features || !position) return null

  let nearest = null
  let nearestDistance = Infinity

  for (const feature of roads.features) {
    const p = feature.properties || {}
    const coordinates = feature.geometry?.coordinates

    if (
      p.u == null ||
      p.v == null ||
      feature.geometry?.type !== 'LineString' ||
      !Array.isArray(coordinates) ||
      coordinates.length < 2
    ) {
      continue
    }

    const first = coordinates[0]
    const last = coordinates[coordinates.length - 1]

    if (
      !Array.isArray(first) ||
      !Array.isArray(last) ||
      first.length < 2 ||
      last.length < 2
    ) {
      continue
    }

    const start = [Number(first[1]), Number(first[0])]
    const end = [Number(last[1]), Number(last[0])]

    if (
      !start.every(Number.isFinite) ||
      !end.every(Number.isFinite)
    ) {
      continue
    }

    const startDistance = calculateDistanceKm(position, start)
    const endDistance = calculateDistanceKm(position, end)

    if (startDistance < nearestDistance) {
      nearestDistance = startDistance
      nearest = String(p.u)
    }

    if (endDistance < nearestDistance) {
      nearestDistance = endDistance
      nearest = String(p.v)
    }
  }

  return nearest
}

function createHospitalIcon() {
  return L.divIcon({
    className: 'landsafe-hospital-icon',
    html: '<span>+</span>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -13],
  })
}

function createLocationIcon() {
  return L.divIcon({
    className: 'landsafe-location-icon',
    html: '<span></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

const hospitalIcon = createHospitalIcon()
const locationIcon = createLocationIcon()

function FlyToLocation({ position, zoom = 13 }) {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom, { duration: 0.8 })
    }
  }, [map, position, zoom])

  return null
}

function CurrentLocationMarker({ position }) {
  if (!position) return null

  return (
    <Marker position={position} icon={locationIcon}>
      <Popup>
        <strong>Your current location</strong>
        <br />
        Used as the starting point for route planning.
      </Popup>
    </Marker>
  )
}

/* CSV export helpers */

function csvCell(value) {
  let text = ''

  if (value === null || value === undefined) {
    text = ''
  } else if (typeof value === 'object') {
    text = JSON.stringify(value)
  } else {
    text = String(value)
  }

  if (/^[\s]*[=+\-@]/.test(text)) {
    text = `'${text}`
  }

  return `"${text.replace(/"/g, '""')}"`
}

function downloadRoadsCsv(features) {
  if (!features?.length) {
    window.alert('No road segments match the current filters.')
    return
  }

  const keys = [
    ...new Set(
      features.flatMap((feature) =>
        Object.keys(feature.properties || {}),
      ),
    ),
  ]

  const headers = keys.includes('risk_proxy_score')
    ? keys
    : [...keys, 'risk_proxy_score']

  const rows = features.map((feature) => {
    const properties = feature.properties || {}

    return headers.map((key) =>
      key === 'risk_proxy_score'
        ? csvCell(getRoadRisk(feature))
        : csvCell(properties[key]),
    )
  })

  const csv = [
    headers.map(csvCell).join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\r\n')

  const blob = new Blob(['\uFEFF', csv], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'landsafe-filtered-roads.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()

  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function getRoadTitle(feature) {
  const p = feature?.properties || {}
  return p.name || p.ref || p.highway || 'Unnamed road segment'
}

export default function RoadRiskMap() {
  const [roads, setRoads] = useState(null)
  const [hospitals, setHospitals] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  const [roadSearch, setRoadSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')
  const [selectedRoad, setSelectedRoad] = useState(null)

  const [hospitalSearch, setHospitalSearch] = useState('')
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationMessage, setLocationMessage] = useState('')
  const [routeStatus, setRouteStatus] = useState('')
  const [showRoute, setShowRoute] = useState(false)
  const [routeComparison, setRouteComparison] = useState(null)

  // Multiple simulated closed connections.
  const [closedEdgeKeys, setClosedEdgeKeys] = useState([])

  useEffect(() => {
    let cancelled = false

    async function loadMapData() {
      setLoading(true)
      setLoadError('')

      try {
        const [roadsResponse, hospitalsResponse] = await Promise.all([
          fetch(ROADS_URL),
          fetch(HOSPITALS_URL),
        ])

        if (!roadsResponse.ok) {
          throw new Error(
            'Could not load roads.geojson. Check dashboard/public/data/roads.geojson.',
          )
        }

        if (!hospitalsResponse.ok) {
          throw new Error(
            'Could not load hospitals.geojson. Check dashboard/public/data/hospitals.geojson.',
          )
        }

        const [roadsData, hospitalsData] = await Promise.all([
          roadsResponse.json(),
          hospitalsResponse.json(),
        ])

        if (!cancelled) {
          setRoads(roadsData)
          setHospitals(hospitalsData)
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error.message || 'Unable to load map data.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadMapData()

    return () => {
      cancelled = true
    }
  }, [])

  const validFacilities = useMemo(() => {
    if (!hospitals?.features) return []

    return hospitals.features
      .map((feature, index) => {
        const position = getValidPoint(feature)
        if (!position) return null

        return {
          feature,
          position,
          name: getFacilityName(feature),
          id:
            feature.properties?.osm_id ??
            feature.properties?.id ??
            `${getFacilityName(feature)}-${index}`,
        }
      })
      .filter(Boolean)
  }, [hospitals])

  const filteredRoads = useMemo(() => {
    if (!roads?.features) return null

    const query = roadSearch.trim().toLowerCase()

    const features = roads.features.filter((feature) => {
      const p = feature.properties || {}
      const risk = getRoadRisk(feature)
      const category = getRiskCategory(risk)

      const searchableText = [
        p.name,
        p.highway,
        p.ref,
        p.osm_id,
        p.id,
        p.u,
        p.v,
        p.road_id,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(' ')
        .toLowerCase()

      const matchesSearch = !query || searchableText.includes(query)
      const matchesRisk =
        riskFilter === 'all' || category === riskFilter

      return matchesSearch && matchesRisk
    })

    return { ...roads, features }
  }, [roads, roadSearch, riskFilter])

  const riskStatistics = useMemo(() => {
    const features = filteredRoads?.features || []

    const counts = {
      low: 0,
      medium: 0,
      high: 0,
      unknown: 0,
    }

    features.forEach((feature) => {
      counts[getRiskCategory(getRoadRisk(feature))] += 1
    })

    return {
      total: features.length,
      allRoads: roads?.features?.length || 0,
      counts,
      highRiskShare: features.length
        ? (counts.high / features.length) * 100
        : 0,
    }
  }, [filteredRoads, roads])

  const filteredHospitals = useMemo(() => {
    const query = hospitalSearch.trim().toLowerCase()
    if (!query) return validFacilities

    return validFacilities.filter((facility) => {
      const p = facility.feature.properties || {}

      const searchableText = [
        facility.name,
        p.amenity,
        p.healthcare,
        p.operator,
        p['name:en'],
        p.address,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [validFacilities, hospitalSearch])

  const nearestHospitals = useMemo(() => {
    if (!currentLocation) return []

    return validFacilities
      .map((facility) => ({
        ...facility,
        distanceKm: calculateDistanceKm(
          currentLocation,
          facility.position,
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5)
  }, [currentLocation, validFacilities])

  // Snap the selected hospital to its nearest graph endpoint.
  const destinationNodeId = useMemo(() => {
    if (!selectedHospital || !roads) return null

    return findNearestGraphNode(roads, selectedHospital.position)
  }, [roads, selectedHospital])

  const resetRoadFilters = () => {
    setRoadSearch('')
    setRiskFilter('all')
    setSelectedRoad(null)
  }

  const findCurrentLocation = () => {
    setLocationMessage('')

    if (!navigator.geolocation) {
      setLocationMessage(
        'Your browser does not support location access.',
      )
      return
    }

    setLocationMessage('Finding your current location...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation([
          position.coords.latitude,
          position.coords.longitude,
        ])
        setLocationMessage('Your current location was found.')
      },
      (error) => {
        const messages = {
          1: 'Location permission was denied. Allow location access in your browser settings.',
          2: 'Your location is currently unavailable.',
          3: 'Location request timed out. Please try again.',
        }

        setLocationMessage(
          messages[error.code] || 'Unable to get your current location.',
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      },
    )
  }

  const selectHospital = (facility) => {
    setSelectedHospital(facility)
    setShowRoute(false)
    setRouteStatus('')
  }

  const handleRouteStatus = useCallback((message) => {
    setRouteStatus(message)
  }, [])

  const handleRouteComparison = useCallback((comparison) => {
    setRouteComparison(comparison)
  }, [])

  const selectRoad = useCallback((feature) => {
    setSelectedRoad({
      feature,
      properties: { ...(feature.properties || {}) },
      risk: getRoadRisk(feature),
    })
  }, [])

  const toggleRoadClosure = useCallback((feature) => {
    const key = getEdgeKey(feature)

    if (!key) {
      setRouteStatus(
        'This road has no valid u/v graph-node IDs, so it cannot be closed in the graph simulation.',
      )
      return
    }

    setClosedEdgeKeys((previous) => {
      const isAlreadyClosed = previous.includes(key)

      return isAlreadyClosed
        ? previous.filter((item) => item !== key)
        : [...previous, key]
    })

    setShowRoute(true)
    setRouteStatus('')
  }, [])

  const reopenRoad = useCallback((key) => {
    setClosedEdgeKeys((previous) =>
      previous.filter((item) => item !== key),
    )
    setShowRoute(true)
    setRouteStatus('')
  }, [])

  // Clear selection if filtering removes its road.
  useEffect(() => {
    if (!selectedRoad || !filteredRoads?.features) return

    if (!filteredRoads.features.includes(selectedRoad.feature)) {
      setSelectedRoad(null)
    }
  }, [filteredRoads, selectedRoad])

  const roadOnEachFeature = (feature, layer) => {
    const p = feature.properties || {}
    const risk = getRoadRisk(feature)

    const slope = p.slope_mean ?? p.mean_slope ?? p.slope
    const length = p.length_m ?? p.length ?? p.length_metres
    const edgeKey = getEdgeKey(feature)
    const isClosed = edgeKey && closedEdgeKeys.includes(edgeKey)

    layer.setStyle({
      ...roadStyle(feature),
      ...(isClosed
        ? { color: '#242424', weight: 5, dashArray: '6 5', opacity: 1 }
        : {}),
    })

    const popup = document.createElement('div')
    popup.className = 'landsafe-road-popup'

    const title = document.createElement('strong')
    title.textContent = String(getRoadTitle(feature))
    popup.appendChild(title)

    const details = [
      `Estimated risk score: ${risk === null ? 'Unavailable' : risk.toFixed(3)}`,
      `Risk category: ${getRiskLabel(risk)}`,
      `Simulated status: ${isClosed ? 'CLOSED' : 'Not marked closed'}`,
      ...(slope !== undefined && slope !== null
        ? [`Mean slope: ${slope}`]
        : []),
      ...(length !== undefined && length !== null
        ? [`Road length: ${length} m`]
        : []),
      ...(p.highway ? [`Road type: ${p.highway}`] : []),
      ...(p.osm_id !== undefined ? [`OSM ID: ${p.osm_id}`] : []),
    ]

    details.forEach((detail) => {
      const paragraph = document.createElement('p')
      paragraph.textContent = detail
      popup.appendChild(paragraph)
    })

    const selectButton = document.createElement('button')
    selectButton.type = 'button'
    selectButton.className = 'road-popup-select'
    selectButton.textContent = 'View road details'
    selectButton.addEventListener('click', () => selectRoad(feature))
    popup.appendChild(selectButton)

    const closureButton = document.createElement('button')
    closureButton.type = 'button'
    closureButton.className = 'road-popup-select'
    closureButton.textContent = isClosed
      ? 'Reopen this road'
      : 'Mark road closed'

    closureButton.addEventListener('click', () => {
      selectRoad(feature)
      toggleRoadClosure(feature)
      layer.closePopup()
    })

    popup.appendChild(closureButton)
    layer.bindPopup(popup)

    layer.on({
      click: () => selectRoad(feature),
      mouseover: (event) => {
        if (!closedEdgeKeys.includes(getEdgeKey(feature))) {
          event.target.setStyle({ weight: 6, opacity: 1 })
        }
      },
      mouseout: (event) => {
        const closed = closedEdgeKeys.includes(getEdgeKey(feature))

        event.target.setStyle({
          ...roadStyle(feature),
          ...(closed
            ? {
                color: '#242424',
                weight: 5,
                dashArray: '6 5',
                opacity: 1,
              }
            : {}),
        })
      },
    })
  }

  return (
    <section className="road-risk-page">
      <header className="road-risk-heading">
        <span className="road-risk-eyebrow">
          LANDSLIDE RESILIENCE RESEARCH
        </span>
        <h2>LANDSAFE Road Risk &amp; Healthcare Access</h2>
        <p>
          Explore modelled road risk, inspect available road attributes,
          and compare routes when selected roads are marked closed.
        </p>
      </header>

      <div className="road-filter-panel">
        <div className="road-filter-field">
          <label htmlFor="road-search">Search road segments</label>
          <input
            id="road-search"
            type="search"
            value={roadSearch}
            onChange={(event) => setRoadSearch(event.target.value)}
            placeholder="Road name, road type, or node ID..."
          />
        </div>

        <div className="road-filter-field">
          <label htmlFor="risk-filter">Estimated risk category</label>
          <select
            id="risk-filter"
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value)}
          >
            <option value="all">All risk categories</option>
            <option value="low">Lower score (&lt; 0.45)</option>
            <option value="medium">Moderate score (0.45–0.649)</option>
            <option value="high">Higher score (≥ 0.65)</option>
            <option value="unknown">Score unavailable</option>
          </select>
        </div>

        <button
          type="button"
          className="road-filter-reset"
          onClick={resetRoadFilters}
        >
          Reset filters
        </button>
      </div>

      <p className="road-filter-count" aria-live="polite">
        Showing {riskStatistics.total.toLocaleString()} of{' '}
        {riskStatistics.allRoads.toLocaleString()} road segments
      </p>

      <div className="road-stats-grid">
        <article className="road-stat-card">
          <span className="road-stat-label">Matching roads</span>
          <strong>{riskStatistics.total.toLocaleString()}</strong>
          <small>Road segments after filtering</small>
        </article>

        <article className="road-stat-card stat-high">
          <span className="road-stat-label">Higher risk</span>
          <strong>{riskStatistics.counts.high.toLocaleString()}</strong>
          <small>{riskStatistics.highRiskShare.toFixed(1)}% of matching roads</small>
        </article>

        <article className="road-stat-card stat-medium">
          <span className="road-stat-label">Moderate risk</span>
          <strong>{riskStatistics.counts.medium.toLocaleString()}</strong>
          <small>Scores from 0.45 to below 0.65</small>
        </article>

        <article className="road-stat-card stat-low">
          <span className="road-stat-label">Lower risk</span>
          <strong>{riskStatistics.counts.low.toLocaleString()}</strong>
          <small>Scores below 0.45</small>
        </article>

        <article className="road-stat-card stat-unknown">
          <span className="road-stat-label">Unavailable scores</span>
          <strong>{riskStatistics.counts.unknown.toLocaleString()}</strong>
          <small>Missing or invalid scores</small>
        </article>
      </div>

      <div className="road-export-row">
        <div>
          <strong>Export road data</strong>
          <p>Download the segments matching your current filters.</p>
        </div>

        <button
          type="button"
          className="road-export-button"
          disabled={!riskStatistics.total}
          onClick={() =>
            downloadRoadsCsv(filteredRoads?.features || [])
          }
        >
          Export filtered roads CSV
        </button>
      </div>

      <div className="hospital-tools-panel">
        <div className="road-filter-field">
          <label htmlFor="hospital-search">
            Search healthcare facilities
          </label>
          <input
            id="hospital-search"
            type="search"
            value={hospitalSearch}
            onChange={(event) => setHospitalSearch(event.target.value)}
            placeholder="Search hospital or facility name..."
          />
        </div>

        <button
          type="button"
          className="road-filter-reset"
          onClick={findCurrentLocation}
        >
          Use my location
        </button>
      </div>

      {locationMessage && (
        <p className="map-status-message" aria-live="polite">
          {locationMessage}
        </p>
      )}

      {loading && (
        <p className="map-status-message">
          Loading road and healthcare data...
        </p>
      )}

      {loadError && (
        <div className="map-error" role="alert">
          <strong>Map data could not be loaded.</strong>
          <p>{loadError}</p>
          <p>
            Check that roads.geojson and hospitals.geojson exist in
            dashboard/public/data.
          </p>
        </div>
      )}

      {!loading && !loadError && (
        <>
          <div className="map-layout">
            <aside className="hospital-sidebar">
              <h3>Healthcare facilities</h3>
              <p>
                {filteredHospitals.length} matching mapped facilities
              </p>

              <div className="hospital-results">
                {filteredHospitals.length === 0 && (
                  <p>No matching facilities were found.</p>
                )}

                {filteredHospitals.map((facility) => (
                  <button
                    type="button"
                    className={`hospital-result ${
                      selectedHospital?.id === facility.id ? 'selected' : ''
                    }`}
                    key={facility.id}
                    onClick={() => selectHospital(facility)}
                  >
                    <strong>{facility.name}</strong>
                    <span>
                      {facility.position[0].toFixed(4)},{' '}
                      {facility.position[1].toFixed(4)}
                    </span>
                  </button>
                ))}
              </div>

              {selectedHospital && (
                <div className="selected-hospital-panel">
                  <h4>Selected facility</h4>
                  <p>{selectedHospital.name}</p>

                  {currentLocation && (
                    <p>
                      Straight-line distance:{' '}
                      {calculateDistanceKm(
                        currentLocation,
                        selectedHospital.position,
                      ).toFixed(2)} km
                    </p>
                  )}

                  <button
                    type="button"
                    className="road-filter-reset"
                    disabled={!currentLocation || !destinationNodeId}
                    onClick={() => {
                      if (!currentLocation) {
                        setRouteStatus('Find your current location first.')
                        return
                      }

                      if (!destinationNodeId) {
                        setRouteStatus(
                          'Could not connect this facility to the supplied road graph.',
                        )
                        return
                      }

                      setShowRoute(true)
                      setRouteStatus('Calculating route...')
                    }}
                  >
                    Calculate route
                  </button>

                  {destinationNodeId && (
                    <p className="map-status-message">
                      Nearest graph node: {destinationNodeId}
                    </p>
                  )}

                  <button
                    type="button"
                    className="clear-selection-button"
                    onClick={() => {
                      setSelectedHospital(null)
                      setShowRoute(false)
                      setRouteStatus('')
                    }}
                  >
                    Clear selection
                  </button>
                </div>
              )}

              {routeStatus && (
                <p className="map-status-message" aria-live="polite">
                  {routeStatus}
                </p>
              )}

              {showRoute && routeComparison && (
                <section className="route-comparison" aria-live="polite">
                  <h4>Route comparison</h4>
                  <p className="route-comparison-intro">
                    Compare the usual route with the route calculated after
                    excluding the roads marked closed.
                  </p>
                  <div className="route-comparison-grid">
                    <article className="route-comparison-card">
                      <span>Usual route</span>
                      <strong>
                        {routeComparison.original
                          ? `${(routeComparison.original.distanceMetres / 1000).toFixed(2)} km`
                          : 'Not available'}
                      </strong>
                      {routeComparison.original && (
                        <small>{routeComparison.original.edgeCount} road segments</small>
                      )}
                    </article>
                    <article className="route-comparison-card">
                      <span>Route avoiding closed roads</span>
                      <strong>
                        {routeComparison.alternative
                          ? `${(routeComparison.alternative.distanceMetres / 1000).toFixed(2)} km`
                          : 'No route found'}
                      </strong>
                      {routeComparison.alternative && (
                        <small>{routeComparison.alternative.edgeCount} road segments</small>
                      )}
                    </article>
                    <article className="route-comparison-card route-comparison-extra">
                      <span>Extra distance</span>
                      <strong>
                        {routeComparison.additionalDistanceMetres === null
                          ? 'Unavailable'
                          : `${(routeComparison.additionalDistanceMetres / 1000).toFixed(2)} km`}
                      </strong>
                      <small>
                        {routeComparison.closedCount} road connection(s) marked closed
                      </small>
                    </article>
                  </div>
                  {!routeComparison.alternative && routeComparison.closedCount > 0 && (
                    <p className="route-comparison-warning">
                      No available route reaches this facility while the selected
                      roads remain closed. Try reopening one or more roads.
                    </p>
                  )}
                  <p className="route-comparison-note">
                    Distances are calculated from the supplied road data. This is
                    a demonstration and does not confirm current road conditions.
                  </p>
                </section>
              )}

              {nearestHospitals.length > 0 && (
                <div className="nearest-hospitals">
                                {/* Hospital Journey Summary */}
              {showRoute && selectedHospital && (
                <section
                  className="journey-summary"
                  aria-live="polite"
                  aria-label="Hospital journey summary"
                >
                  <div className="journey-summary-header">
                    <div>
                      <h4>Hospital Journey Summary</h4>
                      <p>
                        Review your selected healthcare facility and
                        the current route calculation.
                      </p>
                    </div>

                    <span className="journey-summary-badge">
                      LANDSAFE
                    </span>
                  </div>

                  <div className="journey-summary-details">
                    <article className="journey-summary-item">
                      <span>Selected healthcare facility</span>
                      <strong>{selectedHospital.name}</strong>
                    </article>

                    <article className="journey-summary-item">
                      <span>Starting point</span>
                      <strong>
                        {currentLocation
                          ? `${currentLocation[0].toFixed(4)}, ${currentLocation[1].toFixed(4)}`
                          : 'Location not selected'}
                      </strong>
                    </article>

                    <article className="journey-summary-item">
                      <span>Simulated road closures</span>
                      <strong>
                        {closedEdgeKeys.length}{' '}
                        {closedEdgeKeys.length === 1
                          ? 'connection'
                          : 'connections'}
                      </strong>
                    </article>

                    <article className="journey-summary-item">
                      <span>Alternative route result</span>
                      <strong>
                        {!routeComparison
                          ? 'Waiting for route calculation'
                          : routeComparison.alternative
                            ? 'An alternative route was found'
                            : 'No alternative route found'}
                      </strong>
                    </article>

                    <article className="journey-summary-item">
                      <span>Usual route distance</span>
                      <strong>
                        {routeComparison?.original
                          ? `${(
                              routeComparison.original.distanceMetres / 1000
                            ).toFixed(2)} km`
                          : 'Not available'}
                      </strong>
                    </article>

                    <article className="journey-summary-item">
                      <span>Alternative route distance</span>
                      <strong>
                        {routeComparison?.alternative
                          ? `${(
                              routeComparison.alternative.distanceMetres / 1000
                            ).toFixed(2)} km`
                          : 'Not available'}
                      </strong>
                    </article>

                    <article className="journey-summary-item">
                      <span>Additional distance</span>
                      <strong>
                        {routeComparison?.additionalDistanceMetres == null
                          ? 'Not available'
                          : `${(
                              routeComparison.additionalDistanceMetres / 1000
                            ).toFixed(2)} km`}
                      </strong>
                    </article>

                    <article className="journey-summary-item">
                      <span>Road connections marked closed</span>
                      <strong>
                        {routeComparison?.closedCount ??
                          closedEdgeKeys.length}
                      </strong>
                    </article>
                  </div>

                  {!routeComparison && (
                    <p className="journey-summary-status">
                      {routeStatus || 'Waiting for the route calculation.'}
                    </p>
                  )}

                  {routeComparison &&
                    !routeComparison.alternative &&
                    closedEdgeKeys.length > 0 && (
                      <p className="journey-summary-warning">
                        No alternative route was found with the selected
                        connections excluded. Try reopening one or more
                        connections and calculate the route again.
                      </p>
                    )}

                  <div className="journey-summary-notice">
                    <strong>Important travel information</strong>
                    <p>
                      LANDSAFE uses the project's supplied road data and
                      simulated road closures. It does not provide live
                      road conditions, verified landslide warnings, or
                      confirmation that a road is safe. Check official
                      updates before travelling.
                    </p>
                  </div>
                </section>
              )}
                  <h4>Nearest facilities</h4>
                  {nearestHospitals.map((facility) => (
                    <button
                      type="button"
                      className="nearest-hospital"
                      key={facility.id}
                      onClick={() => selectHospital(facility)}
                    >
                      <span>{facility.name}</span>
                      <strong>{facility.distanceKm.toFixed(2)} km</strong>
                    </button>
                  ))}
                </div>
              )}

              <section className="closed-roads-panel">
                <h3>Simulated road closures</h3>
                <p>
                  {closedEdgeKeys.length} closed graph connection(s)
                </p>

                {closedEdgeKeys.length > 0 ? (
                  <>
                    <ul>
                      {closedEdgeKeys.map((key) => (
                        <li key={key}>
                          <span>{key}</span>
                          <button
                            type="button"
                            onClick={() => reopenRoad(key)}
                          >
                            Reopen
                          </button>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      className="clear-selection-button"
                      onClick={() => {
                        setClosedEdgeKeys([])
                        setShowRoute(true)
                        setRouteStatus('')
                      }}
                    >
                      Reopen all roads
                    </button>
                  </>
                ) : (
                  <p>No roads are currently marked closed.</p>
                )}
              </section>
            </aside>

            <div className="road-map-wrapper">
              <MapContainer
                center={MAP_CENTER}
                zoom={MAP_ZOOM}
                scrollWheelZoom
                className="road-risk-map"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {filteredRoads && (
                  <GeoJSON
                    key={`roads-${roadSearch}-${riskFilter}-${closedEdgeKeys.join(',')}`}
                    data={filteredRoads}
                    style={(feature) => {
                      const key = getEdgeKey(feature)
                      const closed = key && closedEdgeKeys.includes(key)

                      return {
                        ...roadStyle(feature),
                        ...(closed
                          ? {
                              color: '#242424',
                              weight: 5,
                              dashArray: '6 5',
                              opacity: 1,
                            }
                          : {}),
                      }
                    }}
                    onEachFeature={roadOnEachFeature}
                  />
                )}

                {validFacilities.map((facility) => (
                  <Marker
                    key={facility.id}
                    position={facility.position}
                    icon={hospitalIcon}
                    eventHandlers={{
                      click: () => selectHospital(facility),
                    }}
                  >
                    <Popup>
                      <strong>{facility.name}</strong>
                      <br />
                      <button
                        type="button"
                        onClick={() => selectHospital(facility)}
                      >
                        Select this facility
                      </button>
                    </Popup>
                  </Marker>
                ))}

                <CurrentLocationMarker position={currentLocation} />

                {selectedHospital && (
                  <FlyToLocation
                    position={selectedHospital.position}
                    zoom={13}
                  />
                )}

                {currentLocation && !selectedHospital && (
                  <FlyToLocation position={currentLocation} zoom={13} />
                )}

                {showRoute && currentLocation && selectedHospital && (
                  <GraphTheoryRoute
                    roads={roads}
                    start={currentLocation}
                    destinationNodeId={destinationNodeId}
                    closedEdgeKeys={closedEdgeKeys}
                    onStatus={handleRouteStatus}
                    onComparison={handleRouteComparison}
                  />
                )}
              </MapContainer>

              <div className="risk-legend">
                <h4>Estimated road risk</h4>
                <span>
                  <i className="legend-dot low-risk" />
                  Lower (&lt; 0.45)
                </span>
                <span>
                  <i className="legend-dot medium-risk" />
                  Moderate (0.45–0.649)
                </span>
                <span>
                  <i className="legend-dot high-risk" />
                  Higher (≥ 0.65)
                </span>
                <span>
                  <i className="legend-dot unknown-risk" />
                  Unavailable
                </span>
                <span>
                  <i
                    className="legend-dot"
                    style={{ background: '#242424' }}
                  />
                  Simulated closed connection
                </span>
              </div>
            </div>
          </div>

          {selectedRoad && (
            <section
              className="selected-road-panel"
              aria-live="polite"
              aria-label="Selected road details"
            >
              <div className="selected-road-header">
                <div>
                  <span className="selected-road-eyebrow">
                    ROAD EXPLORER
                  </span>
                  <h3>{getRoadTitle(selectedRoad.feature)}</h3>
                  <p>
                    Inspect road attributes and simulate a road closure.
                  </p>
                </div>

                <button
                  type="button"
                  className="clear-selection-button"
                  onClick={() => setSelectedRoad(null)}
                >
                  Clear selection
                </button>
              </div>

              <div className="selected-road-metrics">
                <article>
                  <span>Risk score</span>
                  <strong>
                    {selectedRoad.risk === null
                      ? 'Unavailable'
                      : selectedRoad.risk.toFixed(3)}
                  </strong>
                </article>

                <article>
                  <span>Risk category</span>
                  <strong>{getRiskLabel(selectedRoad.risk)}</strong>
                </article>

                <article>
                  <span>Road type</span>
                  <strong>
                    {selectedRoad.properties.highway || 'Not recorded'}
                  </strong>
                </article>
              </div>

              <div className="road-closure-controls">
                <h4>Road closure simulation</h4>
                <p>
                  This manually excludes the selected graph connection
                  from the route calculation. It does not report a verified
                  real-world road closure.
                </p>

                {getEdgeKey(selectedRoad.feature) ? (
                  <button
                    type="button"
                    className="road-filter-reset"
                    onClick={() =>
                      toggleRoadClosure(selectedRoad.feature)
                    }
                  >
                    {closedEdgeKeys.includes(
                      getEdgeKey(selectedRoad.feature),
                    )
                      ? 'Reopen this road'
                      : 'Mark road closed'}
                  </button>
                ) : (
                  <p>
                    This feature has no valid u/v node IDs and cannot be
                    toggled in the graph simulation.
                  </p>
                )}
              </div>

              <h4>Available road attributes</h4>

              <div className="selected-road-attributes">
                {Object.entries(selectedRoad.properties).map(([key, value]) => (
                  <div className="road-attribute" key={key}>
                    <span>{key.replace(/_/g, ' ')}</span>
                    <strong>
                      {value === null || value === undefined || value === ''
                        ? 'Not recorded'
                        : typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value)}
                    </strong>
                  </div>
                ))}

                {!Object.keys(selectedRoad.properties).length && (
                  <p>No road attributes are available for this segment.</p>
                )}
              </div>
            </section>
          )}

          <div className="map-disclaimer">
            <strong>Research demonstration only</strong>
            <p>
              Road colours represent modelled risk scores in the project
              dataset. They are not live landslide alerts, official
              road-closure notices, or guarantees of road safety. Black
              dashed roads indicate manually simulated graph closures.
              Healthcare locations may be incomplete. Routes
              are calculated from the supplied road network and do not
              verify real-world road conditions.
            </p>
          </div>
        </>
      )}
    </section>
  )
}
