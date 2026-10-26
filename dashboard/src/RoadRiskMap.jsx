
import { useEffect, useMemo, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Polyline,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './RoadRiskMap.css'

const MAP_CENTER = [6.68, 80.4]
const MAP_ZOOM = 10

const ROADS_URL = '/data/roads.geojson'
const HOSPITALS_URL = '/data/hospitals.geojson'

const ROUTING_URL = 'https://router.project-osrm.org/route/v1/driving'

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
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
    2 *
    earthRadiusKm *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  )
}

function getFacilityName(feature, index = 0) {
  const properties = feature?.properties || {}

  return (
    properties.name ||
    properties.operator ||
    `Healthcare facility ${properties.facility_id || index + 1}`
  )
}

function getRoadRisk(feature) {
  const properties = feature?.properties || {}
  const value = Number(properties.risk_proxy_score)

  return Number.isFinite(value) ? value : null
}

function getRoadColor(feature) {
  const risk = getRoadRisk(feature)

  if (risk === null) return '#7b8794'
  if (risk >= 0.65) return '#dc2626'
  if (risk >= 0.45) return '#f59e0b'

  return '#16a34a'
}

function roadStyle(feature) {
  return {
    color: getRoadColor(feature),
    weight: 3,
    opacity: 0.8,
  }
}

function createHospitalIcon() {
  return L.divIcon({
    className: 'hospital-marker-container',
    html: '<div class="hospital-marker">✚</div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -13],
  })
}

function getValidPoint(feature) {
  if (feature?.geometry?.type !== 'Point') return null

  const coordinates = feature.geometry.coordinates

  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 2 ||
    !Number.isFinite(Number(coordinates[0])) ||
    !Number.isFinite(Number(coordinates[1]))
  ) {
    return null
  }

  const [lng, lat] = coordinates.map(Number)

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null
  }

  return { lat, lng }
}

function CurrentLocationMarker({ position }) {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 13, {
        duration: 0.8,
      })
    }
  }, [position, map])

  if (!position) return null

  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={L.divIcon({
        className: 'current-location-container',
        html: '<div class="current-location-dot"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      })}
    />
  )
}

function HospitalRoute({
  origin,
  destination,
  onRouteStatus,
}) {
  const map = useMap()
  const [routeCoordinates, setRouteCoordinates] = useState([])
  const [routeInfo, setRouteInfo] = useState(null)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function loadRoute() {
      setRouteCoordinates([])
      setRouteInfo(null)

      if (!origin || !destination) {
        onRouteStatus({
          type: 'idle',
          message: '',
        })
        return
      }

      onRouteStatus({
        type: 'loading',
        message: 'Finding a route...',
      })

      try {
        const url =
          `${ROUTING_URL}/` +
          `${origin.lng},${origin.lat};` +
          `${destination.lng},${destination.lat}` +
          '?overview=full&geometries=geojson'

        const response = await fetch(url, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('The routing service could not be reached.')
        }

        const data = await response.json()

        if (data.code !== 'Ok' || !data.routes?.length) {
          throw new Error('No route was returned for this destination.')
        }

        const route = data.routes[0]

        const coordinates = route.geometry.coordinates.map(
          ([lng, lat]) => [lat, lng]
        )

        if (cancelled) return

        setRouteCoordinates(coordinates)
        setRouteInfo({
          distanceKm: route.distance / 1000,
          durationMinutes: route.duration / 60,
        })

        onRouteStatus({
          type: 'success',
          message: 'Route found. Verify current road conditions before travelling.',
        })

        if (coordinates.length > 0) {
          map.fitBounds(coordinates, {
            padding: [40, 40],
            maxZoom: 14,
          })
        }
      } catch (error) {
        if (error.name === 'AbortError' || cancelled) return

        onRouteStatus({
          type: 'error',
          message:
            error.message ||
            'Could not calculate the route. Please try again.',
        })
      }
    }

    loadRoute()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [
    origin,
    destination,
    map,
    onRouteStatus,
  ])

  return (
    <>
      {routeCoordinates.length > 0 && (
        <Polyline
          positions={routeCoordinates}
          pathOptions={{
            color: '#2563eb',
            weight: 6,
            opacity: 0.9,
          }}
        />
      )}

      {routeInfo && (
        <></>
      )}
    </>
  )
}

export default function RoadRiskMap() {
  const [roads, setRoads] = useState(null)
  const [hospitals, setHospitals] = useState(null)

  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState('')

  const [origin, setOrigin] = useState(null)
  const [locationStatus, setLocationStatus] = useState('')
  const [locationError, setLocationError] = useState('')

  const [selectedHospital, setSelectedHospital] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [showNearest, setShowNearest] = useState(true)

  const [routeStatus, setRouteStatus] = useState({
    type: 'idle',
    message: '',
  })

  useEffect(() => {
    let cancelled = false

    async function loadMapData() {
      setLoading(true)
      setDataError('')

      try {
        const [roadsResponse, hospitalsResponse] = await Promise.all([
          fetch(ROADS_URL),
          fetch(HOSPITALS_URL),
        ])

        if (!roadsResponse.ok) {
          throw new Error('Could not load roads.geojson.')
        }

        if (!hospitalsResponse.ok) {
          throw new Error('Could not load hospitals.geojson.')
        }

        const [roadsData, hospitalsData] = await Promise.all([
          roadsResponse.json(),
          hospitalsResponse.json(),
        ])

        if (cancelled) return

        setRoads(roadsData)
        setHospitals(hospitalsData)
      } catch (error) {
        if (!cancelled) {
          setDataError(
            `${error.message} Check the files in dashboard/public/data/.`
          )
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
        const point = getValidPoint(feature)

        if (!point) return null

        return {
          feature,
          index,
          ...point,
          name: getFacilityName(feature, index),
        }
      })
      .filter(Boolean)
  }, [hospitals])

  const nearestHospitals = useMemo(() => {
    if (!origin) return []

    return validFacilities
      .map((facility) => ({
        ...facility,
        distanceKm: calculateDistanceKm(
          origin.lat,
          origin.lng,
          facility.lat,
          facility.lng
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5)
  }, [origin, validFacilities])

  const filteredHospitals = useMemo(() => {
    const query = searchText.trim().toLowerCase()

    if (!query) return validFacilities.slice(0, 8)

    return validFacilities
      .filter(({ feature, name }) => {
        const properties = feature.properties || ''

        const searchableText = [
          name,
          properties.facility_id,
          properties.amenity,
          properties.healthcare,
          properties.emergency,
          properties.operator,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return searchableText.includes(query)
      })
      .slice(0, 10)
  }, [validFacilities, searchText])

  const selectedPoint = useMemo(() => {
    return selectedHospital ? getValidPoint(selectedHospital) : null
  }, [selectedHospital])

  const handleRouteStatus = useMemo(
    () => (status) => setRouteStatus(status),
    []
  )

  function useCurrentLocation() {
    setLocationError('')
    setLocationStatus('Requesting your location...')

    if (!navigator.geolocation) {
      setLocationStatus('')
      setLocationError(
        'Your browser does not support location access.'
      )
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newOrigin = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }

        setOrigin(newOrigin)
        setLocationStatus('Your current location is ready.')
        setLocationError('')
      },
      (error) => {
        setLocationStatus('')

        const messages = {
          1: 'Location permission was denied. Allow location access in your browser settings.',
          2: 'Your location could not be determined. Check your device location settings.',
          3: 'Location request timed out. Please try again.',
        }

        setLocationError(
          messages[error.code] ||
            'Unable to get your current location.'
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    )
  }

  function chooseFacility(feature) {
    setSelectedHospital(feature)
    setRouteStatus({
      type: 'idle',
      message: '',
    })
  }

  function clearRoute() {
    setSelectedHospital(null)
    setRouteStatus({
      type: 'idle',
      message: '',
    })
  }

  function openFacilityInMap(facility) {
    chooseFacility(facility.feature)
  }

  function hospitalPointToLayer(feature, latlng) {
    const marker = L.marker(latlng, {
      icon: createHospitalIcon(),
    })

    const name = getFacilityName(feature)
    const properties = feature.properties || {}

    const popup = document.createElement('div')
    popup.className = 'hospital-popup'

    const title = document.createElement('strong')
    title.textContent = name
    popup.appendChild(title)

    const type = properties.healthcare || properties.amenity
    if (type) {
      const typeLine = document.createElement('p')
      typeLine.textContent = `Type: ${type}`
      popup.appendChild(typeLine)
    }

    if (properties.phone) {
      const phoneLine = document.createElement('p')
      phoneLine.textContent = `Phone: ${properties.phone}`
      popup.appendChild(phoneLine)
    }

    const note = document.createElement('p')
    note.textContent =
      'Verify the facility services and availability before travelling.'
    popup.appendChild(note)

    marker.bindPopup(popup)

    return marker
  }

  function roadOnEachFeature(feature, layer) {
    const properties = feature.properties || {}
    const risk = getRoadRisk(feature)

    const popup = document.createElement('div')
    popup.className = 'road-popup'

    const title = document.createElement('strong')
    title.textContent =
      properties.name ||
      `Road segment ${properties.u ?? properties.osm_id ?? ''}`
    popup.appendChild(title)

    const riskLine = document.createElement('p')
    riskLine.textContent =
      risk === null
        ? 'Risk proxy score: unavailable'
        : `Risk proxy score: ${risk.toFixed(3)}`
    popup.appendChild(riskLine)

    if (Number.isFinite(Number(properties.slope_mean_deg))) {
      const slopeLine = document.createElement('p')
      slopeLine.textContent =
        `Mean slope: ${Number(properties.slope_mean_deg).toFixed(2)}°`
      popup.appendChild(slopeLine)
    }

    if (Number.isFinite(Number(properties.nearest_landslide_m))) {
      const landslideLine = document.createElement('p')
      landslideLine.textContent =
        `Nearest mapped landslide: ${Number(properties.nearest_landslide_m).toFixed(0)} m`
      popup.appendChild(landslideLine)
    }

    const disclaimer = document.createElement('p')
    disclaimer.textContent =
      'This is a research risk estimate, not an official warning or live road-closure status.'
    popup.appendChild(disclaimer)

    layer.bindPopup(popup)
  }

  if (loading) {
    return (
      <div className="map-message">
        Loading LANDSAFE map data...
      </div>
    )
  }

  if (dataError) {
    return (
      <div className="map-message map-error">
        <strong>Unable to load map data</strong>
        <p>{dataError}</p>
        <p>
          Expected files: <code>public/data/roads.geojson</code> and{' '}
          <code>public/data/hospitals.geojson</code>
        </p>
      </div>
    )
  }

  return (
    <div className="road-map-wrapper">
      <div className="route-controls">
        <h2>LANDSAFE Road Risk & Healthcare Access</h2>

        <p className="map-intro">
          Explore estimated road-risk levels, locate mapped healthcare
          facilities, and request a route from your current location.
        </p>

        <div className="route-buttons">
          <button
            type="button"
            className="location-button"
            onClick={useCurrentLocation}
          >
            Use My Current Location
          </button>

          <button
            type="button"
            className="clear-route-button"
            onClick={clearRoute}
          >
            Clear Route
          </button>
        </div>

        {locationStatus && (
          <p className="route-status">{locationStatus}</p>
        )}

        {locationError && (
          <p className="route-error">{locationError}</p>
        )}

        <div className="hospital-search">
          <label htmlFor="hospital-search-input">
            Search healthcare facilities
          </label>

          <input
            id="hospital-search-input"
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search by name or facility type..."
          />

          {searchText.trim() && (
            <div className="hospital-results">
              {filteredHospitals.length === 0 && (
                <p>No matching mapped facilities found.</p>
              )}

              {filteredHospitals.map((facility) => (
                <button
                  type="button"
                  className="hospital-result"
                  key={`${facility.lat}-${facility.lng}-${facility.index}`}
                  onClick={() => openFacilityInMap(facility)}
                >
                  <span>{facility.name}</span>
                  <small>
                    {facility.feature.properties?.healthcare ||
                      facility.feature.properties?.amenity ||
                      'Healthcare facility'}
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>

        <section className="nearest-hospitals">
          <button
            type="button"
            className="nearest-toggle"
            onClick={() => setShowNearest((value) => !value)}
            aria-expanded={showNearest}
          >
            <span>Nearest Healthcare Facilities</span>
            <span>{showNearest ? '−' : '+'}</span>
          </button>

          {showNearest && (
            <>
              {!origin && (
                <p>
                  Share your location to rank mapped facilities by
                  approximate distance.
                </p>
              )}

              {origin && nearestHospitals.length === 0 && (
                <p>No valid mapped healthcare points are available.</p>
              )}

              {origin && nearestHospitals.length > 0 && (
                <div className="nearest-hospital-list">
                  {nearestHospitals.map((facility, index) => (
                    <div
                      className="nearest-hospital-item"
                      key={`${facility.lat}-${facility.lng}-${facility.index}`}
                    >
                      <div className="nearest-hospital-details">
                        <strong>
                          {index + 1}. {facility.name}
                        </strong>

                        <p>
                          {facility.distanceKm.toFixed(2)} km away
                          <span> · straight-line distance</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => openFacilityInMap(facility)}
                      >
                        Get Route
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="nearest-hospital-note">
                Nearest by distance does not mean clinically suitable.
                Facility names and services may be incomplete.
              </p>
            </>
          )}
        </section>

        {selectedHospital && (
          <div className="selected-facility">
            <strong>Selected facility</strong>
            <p>{getFacilityName(selectedHospital)}</p>

            {!origin && (
              <p>
                Share your current location to request a route.
              </p>
            )}
          </div>
        )}

        {routeStatus.message && (
          <p
            className={
              routeStatus.type === 'error'
                ? 'route-error'
                : 'route-status'
            }
            role="status"
          >
            {routeStatus.message}
          </p>
        )}

        <div className="map-legend">
          <strong>Road risk proxy</strong>

          <span>
            <i className="legend-dot low" /> Lower estimate
          </span>

          <span>
            <i className="legend-dot medium" /> Moderate estimate
          </span>

          <span>
            <i className="legend-dot high" /> Higher estimate
          </span>

          <span>
            <i className="legend-dot hospital" /> Healthcare facility
          </span>

          <span>
            <i className="legend-dot route-dot" /> Requested route
          </span>
        </div>
      </div>

      <div className="road-map">
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          scrollWheelZoom
          className="leaflet-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {roads && (
            <GeoJSON
              key="road-risk-layer"
              data={roads}
              style={roadStyle}
              onEachFeature={roadOnEachFeature}
            />
          )}

          {hospitals && (
            <GeoJSON
              key="healthcare-layer"
              data={hospitals}
              pointToLayer={hospitalPointToLayer}
            />
          )}

          <CurrentLocationMarker position={origin} />

          {origin && selectedPoint && (
            <HospitalRoute
              origin={origin}
              destination={selectedPoint}
              onRouteStatus={handleRouteStatus}
            />
          )}
        </MapContainer>
      </div>

      <div className="map-disclaimer">
        <strong>Important safety information</strong>
        <p>
          Road colours show a research risk proxy, not an official
          landslide alert. The route service does not verify live
          landslides, road closures, traffic, or hospital availability.
          Confirm conditions with official sources before travelling.
        </p>
        <p>
          Sri Lanka Disaster Management Centre: <strong>117</strong>
          {' · '}
          Suwa Seriya ambulance: <strong>1990</strong>
        </p>
      </div>
    </div>
  )
}
