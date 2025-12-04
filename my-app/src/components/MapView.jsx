import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapView({ current, checkpoints }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !current) return;
    if (mapInstanceRef.current) return; // Prevent re-initialization

    try {
      const map = new maplibregl.Map({
        container: mapRef.current,
        style: "https://demotiles.maplibre.org/style.json",
        center: current,
        zoom: 14,
        attributionControl: false
      });

      mapInstanceRef.current = map;

      // Add current location marker
      new maplibregl.Marker({ color: "#007aff" })
        .setLngLat(current)
        .addTo(map);

      // Handle map load and add route if checkpoints exist
      map.on("load", () => {
        console.log('MapView loaded successfully');
        
        if (checkpoints?.length > 1) {
          map.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: { type: "LineString", coordinates: checkpoints },
            },
          });

          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            paint: { "line-color": "#ff6600", "line-width": 4 },
          });

          // Fit bounds to show entire route
          const bounds = new maplibregl.LngLatBounds();
          checkpoints.forEach((coord) => bounds.extend(coord));
          map.fitBounds(bounds, { padding: 50 });
        }
      });

      // Add error handler
      map.on("error", (e) => {
        console.error('MapView error:', e);
      });

    } catch (error) {
      console.error('Error initializing MapView:', error);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [current, checkpoints]);

  return (
    <div 
      className="w-full h-[350px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800" 
      ref={mapRef}
      style={{ minHeight: '350px' }}
    />
  );
}