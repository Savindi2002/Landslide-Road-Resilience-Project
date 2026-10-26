
import { useEffect, useMemo, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Polyline,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './RoadRiskMap.css'

const DATA_URL = '/data/roads.geojson'
const HOSPITALS_URL = '/data/hospitals.geojson'

const hospitalIcon = L.divIcon({
  className: 'hospital-marker',
  html: '<span>✚</span>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
})

function riskColor(score) {
  if (score >= 0.65) return '#dc2626'
  if (score >= 0.45) return '#f59e0b'
  return '#16a34a'
}

function MapContents({ data }) {
  const map = useMap()

  useEffect(() => {
    if (!data?.features?.length) return

    const layer = L.geoJSON(data)
    const bounds = layer.getBounds()

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [20, 20],
        maxZoom: 12,
      })
    }
  }, [data, map])

  function onEachRoad(feature, layer) {
    const p = feature.properties || {}

    const popup = document.createElement('div')
    popup.className = 'road-popup'

    const heading = document.createElement('strong')
    heading.textContent =
      p.name || `Road segment ${p.u ?? ''}–${p.v ?? ''}`

    const score = Number(p.risk_proxy_score)
    const risk = document.createElement('p')

    risk.textContent =
      `Estimated risk score: ${
        p.risk_proxy_score != null &&
        p.risk_proxy_score !== '' &&
        Number.isFinite(score)
          ? score.toFixed(3)
          : 'Unavailable'
      }`

    const slopeValue = Number(p.slope_mean_deg)
    const slope = document.createElement('p')

    slope.textContent =
      `Mean slope: ${
        p.slope_mean_deg != null &&
        p.slope_mean_deg !== '' &&
        Number.isFinite(slopeValue)
          ? `${slopeValue.toFixed(2)}°`
          : 'Unavailable'
      }`

    const distanceValue = Number(p.nearest_landslide_m)
    const distance = document.createElement('p')

    distance.textContent =
      `Nearest mapped landslide: ${
        p.nearest_landslide_m != null &&
        p.nearest_landslide_m !== '' &&
        Number.isFinite(distanceValue)
          ? `${distanceValue.toFixed(0)} m`
          : 'Unavailable'
      }`

    const note = document.createElement('small')
    note.textContent =
      'Research estimate only. Not a live warning or safety guarantee.'

    popup.append(heading, risk, slope, distance, note)
    layer.bindPopup(popup)
  }

  return (
    <GeoJSON
      data={data}
      style={(feature) => {
        const value = feature?.properties?.risk_proxy_score
        const score = Number(value)

        const valid =
          value != null &&
          value !== '' &&
          Number.isFinite(score)

        return {
          color: valid ? riskColor(score) : '#64748b',
          weight: valid && score >= 0.65 ? 3 : 2,
          opacity: 0.85,
        }
      }}
      onEachFeature={onEachRoad}
    />
  )
}

function HospitalMarkers({ hospitals, selectedHospital }) {
  const map = useMap()

  useEffect(() => {
    if (!selectedHospital) return

    const coordinates = selectedHospital.geometry?.coordinates

    if (
      selectedHospital.geometry?.type !== 'Point' ||
      !Array.isArray(coordinates) ||
      coordinates.length < 2
    ) {
      return
    }

    const [longitude, latitude] = coordinates

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return
    }

    map.flyTo([latitude, longitude], 15, {
      duration: 0.8,
    })

    const timer = window.setTimeout(() => {
      map.eachLayer((layer) => {
        if (
          layer instanceof L.Marker &&
          layer.options.icon === hospitalIcon
        ) {
          const position = layer.getLatLng()

          if (
            Math.abs(position.lat - latitude) < 0.000001 &&
            Math.abs(position.lng - longitude) < 0.000001
          ) {
            layer.openPopup()
          }
        }
      })
    }, 900)

    return () => window.clearTimeout(timer)
  }, [selectedHospital, map])

  function onEachHospital(feature, layer) {
    const p = feature.properties || {}

    const popup = document.createElement('div')
    popup.className = 'hospital-popup'

    const title = document.createElement('strong')
    title.textContent = p.name || 'Unnamed healthcare facility'
    popup.append(title)

    if (p.phone) {
      const phone = document.createElement('p')
      phone.textContent = `Phone: ${p.phone}`
      popup.append(phone)
    }

    if (p.website) {
      try {
        const url = new URL(p.website)

        if (
          url.protocol === 'http:' ||
          url.protocol === 'https:'
        ) {
          const link = document.createElement('a')
          link.href = url.href
          link.target = '_blank'
          link.rel = 'noopener noreferrer'
          link.textContent = 'Healthcare facility website'
          popup.append(link)
        }
      } catch {
        // Ignore invalid website values.
      }
    }

    const note = document.createElement('p')
    note.textContent =
      'Facility information may be incomplete. Confirm details before travelling.'
    popup.append(note)

    layer.bindPopup(popup)
  }

  return (
    <GeoJSON
      key="hospital-markers"
      data={hospitals}
      pointToLayer={(_feature, latlng) =>
        L.marker(latlng, { icon: hospitalIcon })
      }
      onEachFeature={onEachHospital}
    />
  )
}

function HospitalRoute({ origin, destination }) {
  const map = useMap()

  const [route, setRoute] = useState(null)
  const [routeError, setRouteError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadRoute() {
      if (!origin || !destination) {
        setRoute(null)
        setRouteError('')
        setLoading(false)
        return
      }

      setRoute(null)
      setRouteError('')
      setLoading(true)

      try {
        const url =
          'https://router.project-osrm.org/route/v1/driving/' +
          `${origin.lng},${origin.lat};` +
          `${destination.lng},${destination.lat}` +
          '?overview=full&geometries=geojson'

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Route request failed.')
        }

        const result = await response.json()

        if (result.code !== 'Ok' || !result.routes?.length) {
          throw new Error('No route found.')
        }

        const coordinates =
          result.routes[0].geometry.coordinates.map(
            ([lng, lat]) => [lat, lng]
          )

        if (!cancelled) {
          setRoute(coordinates)

          const bounds = L.latLngBounds(coordinates)

          map.fitBounds(bounds, {
            padding: [35, 35],
            maxZoom: 15,
          })
        }
      } catch {
        if (!cancelled) {
          setRouteError(
            'Unable to find a route. Check your internet connection and try again.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadRoute()

    return () => {
      cancelled = true
    }
  }, [origin, destination, map])

  return (
    <>
      {route && (
        <Polyline
          positions={route}
          pathOptions={{
            color: '#2563eb',
            weight: 5,
            opacity: 0.9,
          }}
        />
      )}

      {loading && (
        <div className="route-status">
          Finding route...
        </div>
      )}

      {routeError && (
        <div className="route-status route-error">
          {routeError}
        </div>
      )}
    </>
  )
}

export default function RoadRiskMap() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const [hospitals, setHospitals] = useState(null)
  const [hospitalError, setHospitalError] = useState('')
  const [hospitalSearch, setHospitalSearch] = useState('')
  const [selectedHospital, setSelectedHospital] = useState(null)

  const [origin, setOrigin] = useState(null)
  const [routeMessage, setRouteMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    fetch(DATA_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Road data error (${response.status})`)
        }

        return response.json()
      })
      .then((geojson) => {
        if (!cancelled) setData(geojson)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    fetch(HOSPITALS_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Healthcare data error (${response.status})`
          )
        }

        return response.json()
      })
      .then((geojson) => {
        if (!cancelled) setHospitals(geojson)
      })
      .catch((err) => {
        if (!cancelled) setHospitalError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const hospitalResults = useMemo(() => {
    if (!hospitals?.features) return []

    const search = hospitalSearch.trim().toLowerCase()

    return hospitals.features
      .filter((feature) => {
        const p = feature.properties || {}

        const searchableText = [
          p.name,
          p.facility_id,
          p.amenity,
          p.healthcare,
          p.emergency,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return searchableText.includes(search)
      })
      .slice(0, 8)
  }, [hospitals, hospitalSearch])

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setRouteMessage(
        'Your browser does not support location access.'
      )
      return
    }

    setRouteMessage('Getting your current location...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })

        setRouteMessage(
          'Location saved. Select a healthcare facility.'
        )
      },
      () => {
        setRouteMessage(
          'Could not get your location. Allow location access and try again.'
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }

  function clearRoute() {
    setOrigin(null)
    setSelectedHospital(null)
    setRouteMessage('Route cleared.')
  }

  if (error) {
    return <div className="map-message">Map error: {error}</div>
  }

  if (!data) {
    return (
      <div className="map-message">
        Loading Ratnapura road data...
      </div>
    )
  }

  return (
    <div className="road-map-wrapper">
      <section className="route-controls">
        <h3>Find a route to a healthcare facility</h3>

        <div className="route-buttons">
          <button
            type="button"
            onClick={useCurrentLocation}
          >
            Use My Current Location
          </button>

          <button
            type="button"
            onClick={clearRoute}
          >
            Clear Route
          </button>
        </div>

        {routeMessage && (
          <p role="status">{routeMessage}</p>
        )}

        <p className="route-note">
          This prototype route may not reflect landslides,
          road closures or current road conditions.
        </p>
      </section>

      <section className="hospital-search">
        <label htmlFor="hospital-search">
          Find a hospital or healthcare facility
        </label>

        <input
          id="hospital-search"
          type="search"
          value={hospitalSearch}
          onChange={(event) =>
            setHospitalSearch(event.target.value)
          }
          placeholder="Search by name or facility type..."
        />

        {hospitalError && (
          <p className="map-message">
            Healthcare data error: {hospitalError}
          </p>
        )}

        {hospitals && (
          <div className="hospital-results">
            {hospitalResults.length > 0 ? (
              hospitalResults.map((feature, index) => (
                <button
                  type="button"
                  key={
                    feature.properties?.facility_id ??
                    `${feature.properties?.name ?? 'facility'}-${index}`
                  }
                  onClick={() => {
                    setSelectedHospital(feature)

                    setRouteMessage(
                      origin
                        ? 'Requesting route to selected facility...'
                        : 'Facility selected. Set your current location to request a route.'
                    )
                  }}
                >
                  ✚{' '}
                  {feature.properties?.name ||
                    `Healthcare facility ${
                      feature.properties?.facility_id ?? index + 1
                    }`}
                </button>
              ))
            ) : (
              <p>No matching facilities found.</p>
            )}
          </div>
        )}
      </section>

      <div className="map-legend">
        <span>
          <i className="legend-dot low" />
          Lower estimated risk
        </span>

        <span>
          <i className="legend-dot medium" />
          Moderate estimated risk
        </span>

        <span>
          <i className="legend-dot high" />
          Higher estimated risk
        </span>

        <span>
          <i className="legend-dot hospital" />
          Healthcare facilities
        </span>

        <span>
          <i className="legend-dot route-dot" />
          Requested route
        </span>
      </div>

      <MapContainer
        center={[6.68, 80.4]}
        zoom={10}
        className="road-map"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapContents data={data} />

        {hospitals && (
          <HospitalMarkers
            hospitals={hospitals}
            selectedHospital={selectedHospital}
          />
        )}

        {selectedHospital?.geometry?.type === 'Point' &&
          Array.isArray(
            selectedHospital.geometry.coordinates
          ) &&
          selectedHospital.geometry.coordinates.length >= 2 && (
            <HospitalRoute
              origin={origin}
              destination={{
                lng: selectedHospital.geometry.coordinates[0],
                lat: selectedHospital.geometry.coordinates[1],
              }}
            />
          )}
      </MapContainer>

      <p className="map-disclaimer">
        Risk categories are preliminary thresholds applied to
        research scores, not validated warning levels. Route
        information does not verify road closures or current
        landslide conditions. Facility information may be incomplete.
        Confirm conditions with official sources before travelling.
      </p>
    </div>
  )
}
