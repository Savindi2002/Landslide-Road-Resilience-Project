import { useEffect, useMemo, useState } from 'react'
import { Polyline, CircleMarker, Popup } from 'react-leaflet'

const EARTH_RADIUS_M = 6371000

function distanceMetres(a, b) {
  const radians = (degrees) => (degrees * Math.PI) / 180
  const lat1 = radians(a[0])
  const lat2 = radians(b[0])
  const deltaLat = radians(b[0] - a[0])
  const deltaLon = radians(b[1] - a[1])
  const h = Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function edgeKey(u, v) {
  return [String(u), String(v)].sort().join('|')
}

function buildNetwork(roads) {
  const graph = new Map()
  const edges = []
  const addNode = (id, coordinate) => {
    const key = String(id)
    if (!graph.has(key)) graph.set(key, { coordinate, edges: [] })
  }

  for (const feature of roads?.features || []) {
    const p = feature.properties || {}
    const coords = feature.geometry?.coordinates
    if (p.u == null || p.v == null || String(p.u) === String(p.v) ||
        feature.geometry?.type !== 'LineString' || !Array.isArray(coords) || coords.length < 2) continue
    const first = coords[0]
    const last = coords[coords.length - 1]
    if (!Array.isArray(first) || !Array.isArray(last) || first.length < 2 || last.length < 2) continue
    const start = [Number(first[1]), Number(first[0])]
    const end = [Number(last[1]), Number(last[0])]
    if (![...start, ...end].every(Number.isFinite)) continue

    addNode(p.u, start)
    addNode(p.v, end)
    const rawLength = Number(p.length)
    const edge = {
      key: edgeKey(p.u, p.v),
      u: String(p.u),
      v: String(p.v),
      length: Number.isFinite(rawLength) && rawLength > 0 ? rawLength : distanceMetres(start, end),
      coordinates: coords,
    }
    edges.push(edge)
    graph.get(String(p.u)).edges.push(edge)
    graph.get(String(p.v)).edges.push(edge)
  }
  return { graph, edges }
}

function nearestNode(graph, position) {
  let nearest = null
  let best = Infinity
  for (const [id, node] of graph) {
    const distance = distanceMetres(position, node.coordinate)
    if (distance < best) {
      best = distance
      nearest = id
    }
  }
  return nearest
}

function shortestRoute(graph, start, destination, closedKeys) {
  if (!graph.has(start) || !graph.has(destination)) return null
  const distances = new Map()
  const previous = new Map()
  const unvisited = new Set(graph.keys())
  for (const node of unvisited) distances.set(node, Infinity)
  distances.set(start, 0)

  while (unvisited.size) {
    let current = null
    let best = Infinity
    for (const node of unvisited) {
      const value = distances.get(node)
      if (value < best) { best = value; current = node }
    }
    if (current === null || best === Infinity) break
    if (current === destination) break
    unvisited.delete(current)

    for (const edge of graph.get(current).edges) {
      if (closedKeys.has(edge.key)) continue
      const next = edge.u === current ? edge.v : edge.u
      if (!unvisited.has(next)) continue
      const candidate = best + edge.length
      if (candidate < distances.get(next)) {
        distances.set(next, candidate)
        previous.set(next, { node: current, edge })
      }
    }
  }

  if (start !== destination && !previous.has(destination)) return null
  const routeEdges = []
  let current = destination
  while (current !== start) {
    const step = previous.get(current)
    if (!step) return null
    routeEdges.push(step.edge)
    current = step.node
  }
  routeEdges.reverse()

  const coordinates = []
  for (const edge of routeEdges) {
    let points = edge.coordinates.map(([lon, lat]) => [Number(lat), Number(lon)])
    // GeoJSON coordinates can be stored in either endpoint direction.
    if (points.length && distanceMetres(points[0], graph.get(edge.u).coordinate) >
        distanceMetres(points[points.length - 1], graph.get(edge.u).coordinate)) {
      points = points.reverse()
    }
    if (!coordinates.length) coordinates.push(...points)
    else {
      const last = coordinates[coordinates.length - 1]
      const first = points[0]
      if (first && Math.abs(last[0] - first[0]) < 1e-8 && Math.abs(last[1] - first[1]) < 1e-8) {
        coordinates.push(...points.slice(1))
      } else coordinates.push(...points)
    }
  }

  if (start === destination && coordinates.length === 0) {
    const point = graph.get(start)?.coordinate
    if (point) coordinates.push(point)
  }
  return { coordinates, distanceMetres: distances.get(destination), edgeCount: routeEdges.length }
}

export default function GraphTheoryRoute({
  roads,
  start,
  destinationNodeId,
  closedEdgeKey,
  closedEdgeKeys = [],
  onStatus,
  onComparison,
}) {
  const [route, setRoute] = useState(null)
  const network = useMemo(() => buildNetwork(roads), [roads])
  const closedKeys = useMemo(() => new Set([
    ...(closedEdgeKeys || []),
    ...(closedEdgeKey ? [closedEdgeKey] : []),
  ]), [closedEdgeKeys, closedEdgeKey])

  useEffect(() => {
    if (!start || destinationNodeId == null) {
      setRoute(null)
      onStatus?.('')
      onComparison?.(null)
      return
    }

    const startNode = nearestNode(network.graph, start)
    const destination = String(destinationNodeId)
    if (startNode == null || !network.graph.has(destination)) {
      setRoute(null)
      onStatus?.('Could not connect your location or the selected facility to the supplied road data.')
      onComparison?.(null)
      return
    }

    const original = shortestRoute(network.graph, startNode, destination, new Set())
    const alternative = shortestRoute(network.graph, startNode, destination, closedKeys)
    setRoute(alternative)
    onComparison?.({
      original: original ? { distanceMetres: original.distanceMetres, edgeCount: original.edgeCount } : null,
      alternative: alternative ? { distanceMetres: alternative.distanceMetres, edgeCount: alternative.edgeCount } : null,
      additionalDistanceMetres: original && alternative
        ? alternative.distanceMetres - original.distanceMetres
        : null,
      closedCount: closedKeys.size,
    })

    if (alternative) {
      onStatus?.(closedKeys.size
        ? `Route calculated while avoiding ${closedKeys.size} road connection(s) marked closed.`
        : 'Route calculated using the supplied road data.')
    } else {
      onStatus?.('No route was found with the selected road closures.')
    }
  }, [network, start, destinationNodeId, closedKeys, onStatus, onComparison])

  if (!route || !route.coordinates.length) return null
  return (
    <>
      <Polyline positions={route.coordinates} pathOptions={{ color: '#1769e0', weight: 6, opacity: 0.95 }}>
        <Popup>
          <strong>Calculated route</strong><br />
          Distance: {(route.distanceMetres / 1000).toFixed(2)} km<br />
          Road segments: {route.edgeCount}<br />
          Closed roads avoided: {closedKeys.size}<br />
          <small>This demonstration uses supplied road data and does not verify live road conditions.</small>
        </Popup>
      </Polyline>
      <CircleMarker center={route.coordinates[route.coordinates.length - 1]} radius={6}
        pathOptions={{ color: '#fff', fillColor: '#1769e0', fillOpacity: 1 }} />
    </>
  )
}
