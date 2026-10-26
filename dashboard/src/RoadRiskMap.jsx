
import { useEffect, useMemo, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  GeoJSON,
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
    if (data?.features?.length) {
      const layer = L.geoJSON(data)
      const bounds = layer.getBounds()

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [20, 20],
          maxZoom: 12,
        })
      }
    }
  }, [data, map])

  function onEachRoad(feature, layer) {
    const p = feature.properties || {}
    const score = Number(p.risk_proxy_score)
    const validScore = Number.isFinite(score)

    const popup = document.createElement('div')
    popup.className = 'road-popup'

    const heading = document.createElement('strong')
    heading.textContent =
      p.name || `Road segment ${p.u ?? ''}–${p.v ?? ''}`

    const risk = document.createElement('p')
    risk.textContent = `Estimated risk score: ${
      validScore ? score.toFixed(3) : 'Unavailable'
    }`

    const slope = document.createElement('p')
    const slopeValue = Number(p.slope_mean_deg)

    slope.textContent = `Mean slope: ${
      p.slope_mean_deg != null &&
      p.slope_mean_deg !== '' &&
      Number.isFinite(slopeValue)
        ? `${slopeValue.toFixed(2)}°`
        : 'Unavailable'
    }`

    const distance = document.createElement('p')
    const distanceValue = Number(p.nearest_landslide_m)

    distance.textContent = `Nearest mapped landslide: ${
      p.nearest_landslide_m != null &&
      p.nearest_landslide_m !== '' &&
      Number.isFinite(distanceValue)
        ? `${distanceValue.toFixed(0)} m`
        : 'Unavailable'
    }`

    const note = document.createElement('small')
    note.textContent =
      'Model estimate only; this is not a live warning or a safety guarantee.'

    popup.append(heading, risk, slope, distance, note)
    layer.bindPopup(popup)
  }

  return (
    <GeoJSON
      data={data}
      style={(feature) => {
        const score = Number(feature?.properties?.risk_proxy_score)
        const validScore =
          feature?.properties?.risk_proxy_score != null &&
          feature.properties.risk_proxy_score !== '' &&
          Number.isFinite(score)

        return {
          color: validScore ? riskColor(score) : '#64748b',
          weight: validScore && score >= 0.65 ? 3 : 2,
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
    title.textContent = p.name || 'Unnamed facility'
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
          link.textContent = 'Hospital website'
          popup.append(link)
        }
      } catch {
        // Ignore invalid website values.
      }
    }

    const note = document.createElement('p')
    note.textContent =
      'Location from the research dataset. Confirm details before travelling.'
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

export default function RoadRiskMap() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const [hospitals, setHospitals] = useState(null)
  const [hospitalError, setHospitalError] = useState('')
  const [hospitalSearch, setHospitalSearch] = useState('')
  const [selectedHospital, setSelectedHospital] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetch(DATA_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Could not load road data (${response.status})`
          )
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
            `Could not load hospital locations (${response.status})`
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
        const name =
          feature.properties?.name || 'Unnamed facility'

        return name.toLowerCase().includes(search)
      })
      .slice(0, 8)
  }, [hospitals, hospitalSearch])

  if (error) {
    return <div className="map-message">Map error: {error}</div>
  }

  if (!data) {
    return (
      <div className="map-message">
        Loading Ratnapura road data…
      </div>
    )
  }

  return (
    <div className="road-map-wrapper">
      <div className="hospital-search">
        <label htmlFor="hospital-search">
          Find a hospital
        </label>

        <input
          id="hospital-search"
          type="search"
          value={hospitalSearch}
          onChange={(event) =>
            setHospitalSearch(event.target.value)
          }
          placeholder="Search by hospital name..."
        />

        {hospitalError && (
          <p className="map-message">
            Hospital data error: {hospitalError}
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
                    `${feature.properties?.name ?? 'hospital'}-${index}`
                  }
                  onClick={() => setSelectedHospital(feature)}
                >
                  ✚ {feature.properties?.name || 'Unnamed facility'}
                </button>
              ))
            ) : (
              <p>No matching hospitals found.</p>
            )}
          </div>
        )}
      </div>

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
          Hospitals
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
      </MapContainer>

      <p className="map-disclaimer">
        Risk categories are preliminary visual thresholds applied
        to the existing risk scores. They are not validated
        warning levels. Hospital locations and contact details
        should be verified before travel. Map tiles require an
        internet connection.
      </p>
    </div>
  )
}
