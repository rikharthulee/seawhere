"use client";

import { useMemo, useState } from "react";
import { GoogleMap, InfoWindowF, MarkerF, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "360px",
};

export default function DayMap({ pins = [] }) {
  const [activePin, setActivePin] = useState(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  const center = useMemo(() => {
    if (pins.length === 0) return { lat: 0, lng: 0 };
    return { lat: pins[0].lat, lng: pins[0].lng };
  }, [pins]);

  if (!apiKey) {
    return (
      <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
        Map is unavailable because `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` is not
        set.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
        Failed to load Google Maps.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
        Loading map…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        onLoad={(map) => {
          if (!pins.length || !window?.google?.maps) return;
          const bounds = new window.google.maps.LatLngBounds();
          pins.forEach((pin) => bounds.extend({ lat: pin.lat, lng: pin.lng }));
          map.fitBounds(bounds);
          if (pins.length === 1) {
            map.setCenter({ lat: pins[0].lat, lng: pins[0].lng });
            map.setZoom(15);
          }
        }}
      >
        {pins.map((pin) => (
          <MarkerF
            key={pin.id || `${pin.lat}-${pin.lng}`}
            position={{ lat: pin.lat, lng: pin.lng }}
            label={pin.order ? String(pin.order) : undefined}
            onClick={() => setActivePin(pin)}
          />
        ))}
        {activePin ? (
          <InfoWindowF
            position={{ lat: activePin.lat, lng: activePin.lng }}
            onCloseClick={() => setActivePin(null)}
          >
            <div className="text-sm">
              <div className="font-medium">
                {activePin.name || "Stop"}
              </div>
              {activePin.href ? (
                <a
                  href={activePin.href}
                  className="text-xs underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  View details
                </a>
              ) : null}
            </div>
          </InfoWindowF>
        ) : null}
      </GoogleMap>
    </div>
  );
}
