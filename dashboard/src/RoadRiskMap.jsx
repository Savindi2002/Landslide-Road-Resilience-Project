import { useEffect, useMemo, useState } from 'react'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './RoadRiskMap.css'

const DATA_URL = '/data/roads.geojson'

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
        map.fitBounds(bounds, { padding: [20, 20], maxZoom: 12 })
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
    heading.textContent = p.name || `Road segment ${p.u ?? ''}–${p.v ?? ''}`

    const risk = document.createElement('p')
    risk.textContent = `Estimated risk score: ${
      validScore ? score.toFixed(3) : 'Unavailable'
    }`

    const slope = document.createElement('p')
    slope.textContent = `Mean slope: ${
      Number.isFinite(Number(p.slope_mean_deg))
        ? `${Number(p.slope_mean_deg).toFixed(2)}°`
        : 'Unavailable'
    }`

    const distance = document.createElement('p')
    const distanceValue = Number(p.nearest_landslide_m)
    distance.textContent = `Nearest mapped landslide: ${
      Number.isFinite(distanceValue)
        ? `${distanceValue.toFixed(0)} m`
        : 'Unavailable'
    }`

    const note = document.createElement('small')
    note.textContent =
      'Model estimate only; this is not a live warning or a safety guarantee.'

    popup.append(heading, risk, slope, distance, note)
    layer.bindPopup(popup)

    layer.setStyle({
      color: validScore ? riskColor(score) : '#64748b',
      weight: validScore && score >= 0.65 ? 3 : 2,
      opacity: 0.85,
    })
  }

  return (
    <GeoJSON
      data={data}
      style={(feature) => {
        const score = Number(feature?.properties?.risk_proxy_score)
        return {
          color: Number.isFinite(score) ? riskColor(score) : '#64748b',
          weight: Number.isFinite(score) && score >= 0.65 ? 3 : 2,
          opacity: 0.85,
        }
      }}
      onEachFeature={onEachRoad}
    />
  )
}

export default function RoadRiskMap() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    fetch(DATA_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load road data (${response.status})`)
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

  if (error) {
    return <div className="map-message">Map error: {error}</div>
  }

  if (!data) {
    return <div className="map-message">Loading Ratnapura road data…</div>
  }

  return (
    <div className="road-map-wrapper">
      <div className="map-legend">
        <span><i className="legend-dot low" /> Lower estimated risk</span>
        <span><i className="legend-dot medium" /> Moderate estimated risk</span>
        <span><i className="legend-dot high" /> Higher estimated risk</span>
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
      </MapContainer>

      <p className="map-disclaimer">
        Risk categories are preliminary visual thresholds applied to the
        existing risk scores. They are not validated warning levels.
        Map tiles require an internet connection.
      </p>
    </div>
  )
}
