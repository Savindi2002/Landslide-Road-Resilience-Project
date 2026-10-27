
import { useEffect, useMemo, useState } from 'react'
import { Polyline, CircleMarker, Popup } from 'react-leaflet'

const EARTH_RADIUS_M = 6371000

function distanceMetres(a, b) {
  const rad = (degrees) => degrees * Math.PI / 180
  const dLat = rad(b[0] - a[0])
  const dLon = rad(b[1] - a[1])
  const lat1 = rad(a[0])
  const lat2 = rad(b[0])

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon / 2) ** 2

  return 2 * EARTH_RADIUS_M *
    Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function edgeKey(u, v) {
  return [String(u), String(v)].sort().join('|')
}

function buildGraph(roads) {
  const graph = new Map()
  const edges = []

  function addNode(id, coordinate) {
    const key = String(id)
    if (!graph.has(key)) {
      graph.set(key, { coordinate, edges: [] })
    }
  }

  for (const feature of roads?.features || []) {
    const p = feature.properties || {}
    const u = p.u
    const v = p.v
    const coordinates = feature.geometry?.coordinates

    if (
      u == null || v == null ||
      String(u) === String(v) ||
      !Array.isArray(coordinates) ||
      coordinates.length < 2
    ) continue

    const first = coordinates[0]
    const last = coordinates[coordinates.length - 1]

    // GeoJSON uses [longitude, latitude].
    addNode(u, [first[1], first[0]])
    addNode(v, [last[1], last[0]])

    const rawLength = Number(p.length)
    const length = Number.isFinite(rawLength) && rawLength > 0
      ? rawLength
      : distanceMetres(
          [first[1], first[0]],
          [last[1], last[0]],
        )

    const edge = {
      key: edgeKey(u, v),
      u: String(u),
      v: String(v),
      length,
      coordinates,
      risk: Number(p.risk_proxy_score),
    }

    edges.push(edge)
    graph.get(String(u)).edges.push(edge)
    graph.get(String(v)).edges.push(edge)
  }

  return { graph, edges }
}

function findNearestNode(graph, position) {
  let nearest = null
  let bestDistance = Infinity

  for (const [id, node] of graph) {
    const distance = distanceMetres(position, node.coordinate)
    if (distance < bestDistance) {
      bestDistance = distance
      nearest = id
    }
  }

  return nearest
}

// Dijkstra's algorithm: road length is the edge weight.
function dijkstra(graph, start, destination, closedEdgeKey) {
  if (!graph.has(start) || !graph.has(destination)) return null

  const distances = new Map([[start, 0]])
  const previous = new Map()
  const visited = new Set()
  const queue = [{ node: start, distance: 0 }]

  while (queue.length) {
    queue.sort((a, b) => a.distance - b.distance)
    const current = queue.shift()

    if (visited.has(current.node)) continue
    visited.add(current.node)

    if (current.node === destination) break

    for (const edge of graph.get(current.node).edges) {
      if (closedEdgeKey && edge.key === closedEdgeKey) continue

      const next =
        edge.u === current.node ? edge.v : edge.u

      if (visited.has(next)) continue

      const candidate = current.distance + edge.length

      if (candidate < (distances.get(next) ?? Infinity)) {
        distances.set(next, candidate)
        previous.set(next, { node: current.node, edge })
        queue.push({ node: next, distance: candidate })
      }
    }
  }

  if (!distances.has(destination)) return null

  const pathEdges = []
  let cursor = destination

  while (cursor !== start) {
    const step = previous.get(cursor)
    if (!step) return null
    pathEdges.unshift({
      ...step.edge,
      from: step.node,
      to: cursor,
    })
    cursor = step.node
  }

  const coordinates = []

  for (const item of pathEdges) {
    const points = item.coordinates.map(
      ([longitude, latitude]) => [latitude, longitude],
    )

    const ordered = item.from === item.u
      ? points
      : [...points].reverse()

    if (coordinates.length) ordered.shift()
    coordinates.push(...ordered)
  }

  return {
    coordinates,
    distanceMetres: distances.get(destination),
    edgeCount: pathEdges.length,
  }
}

export default function GraphTheoryRoute({
  roads,
  start,
  destinationNodeId,
  closedEdgeKey,
  onStatus,
}) {
  const [result, setResult] = useState(null)

  const network = useMemo(() => buildGraph(roads), [roads])

  useEffect(() => {
    if (!start || destinationNodeId == null) {
      setResult(null)
      onStatus('')
      return
    }

    const startNode = findNearestNode(network.graph, start)
    const destination = String(destinationNodeId)

    if (!startNode || !network.graph.has(destination)) {
      setResult(null)
      onStatus('Could not connect the start or hospital to the road graph.')
      return
    }

    const route = dijkstra(
      network.graph,
      startNode,
      destination,
      closedEdgeKey,
    )

    setResult(route)

    if (route) {
      onStatus(
        closedEdgeKey
          ? 'Alternative route calculated using Graph Theory.'
          : 'Shortest graph route calculated using Dijkstra’s algorithm.',
      )
    } else {
      onStatus('No route was found in the current graph.')
    }
  }, [network, start, destinationNodeId, closedEdgeKey, onStatus])

  if (!result) return null

  return (
    <>
      <Polyline
        positions={result.coordinates}
        pathOptions={{
          color: '#1769e0',
          weight: 6,
          opacity: 0.95,
        }}
      >
        <Popup>
          <strong>Graph Theory route</strong>
          <br />
          Algorithm: Dijkstra
          <br />
          Distance: {(result.distanceMetres / 1000).toFixed(2)} km
          <br />
          Road segments: {result.edgeCount}
          <br />
          <small>
            Calculated from the supplied road graph.
            This is not a safety guarantee.
          </small>
        </Popup>
      </Polyline>

      {result.coordinates.length > 0 && (
        <CircleMarker
          center={result.coordinates[result.coordinates.length - 1]}
          radius={6}
          pathOptions={{ color: '#fff', fillColor: '#1769e0', fillOpacity: 1 }}
        />
      )}
    </>
  )
}
