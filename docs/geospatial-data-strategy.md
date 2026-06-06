# Geospatial Data Strategy

## Initial Region

Start with Chennai only. Avoid full-country OpenStreetMap extracts during Stage 1.

## Target Storage

Geospatial and routing assets should stay between 2 GB and 8 GB:

- Clipped `.osm.pbf` extract
- OSRM `.osrm*` preprocessing outputs
- Optional compressed boundary files
- Lightweight road category metadata

## OSRM Workflow

1. Download or produce Chennai regional extract.
2. Clip to the operational service boundary.
3. Run OSRM preprocessing with the required profile.
4. Store only the active profile assets.
5. Delete temporary expansion/extract intermediates after validation.

## Profiles

Stage 1 should prioritize:

- Bike/scooter urban profile
- Car/van fallback profile

Truck, EV battery-aware, and advanced restrictions should be added after the dispatch workflow is stable.

## PostGIS Strategy

Use PostGIS for:

- Rider latest location
- Rider telemetry raw and aggregate tables
- Delivery dropoffs
- Depot and zone geometry
- Heatmap and proximity queries
- Geofencing later

Use OSRM for:

- Road-network distances
- Durations
- Route geometry
- Matrix costs for optimization

Do not use PostGIS shortest path as the primary routing engine in Stage 1.
