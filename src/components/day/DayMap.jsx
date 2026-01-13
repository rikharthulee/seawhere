"use client";

import { useMemo, useState } from "react";
import { GoogleMap, InfoWindowF, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { resolveImageUrl } from "@/lib/imageUrl";

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

  const isStopPin = (pin) =>
    pin.kind === "itinerary_stop" || pin.kind === "trip_stop";

  const getMarkerIcon = (pin) => {
    if (!window?.google?.maps?.SymbolPath) return undefined;
    const isOptional = Boolean(pin.isOptional);
    const color = isOptional ? "#f97316" : "#0ea5e9";
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 7,
      fillColor: color,
      fillOpacity: 0.9,
      strokeColor: color,
      strokeWeight: 1,
    };
  };

  const stopTypeLabel = (pin) => {
    if (!pin?.stopType) return "Stop";
    return pin.stopType.replace(/_/g, " ");
  };

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
            icon={getMarkerIcon(pin)}
            onClick={() => setActivePin(pin)}
          />
        ))}
        {activePin ? (
          <InfoWindowF
            position={{ lat: activePin.lat, lng: activePin.lng }}
            onCloseClick={() => setActivePin(null)}
          >
            <div className="text-sm max-w-[180px]">
              <div className="font-medium">{activePin.name || "Stop"}</div>
              {activePin.image ? (
                <img
                  src={resolveImageUrl(activePin.image)}
                  alt={activePin.name || "Stop"}
                  className="mt-2 h-32 w-32 rounded object-cover"
                />
              ) : null}
              {isStopPin(activePin) ? (
                <>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {stopTypeLabel(activePin)}
                  </div>
                  {activePin.description ? (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {activePin.description}
                    </div>
                  ) : null}
                  <a
                    href={`https://www.google.com/maps?q=${activePin.lat},${activePin.lng}`}
                    className="mt-2 inline-block text-xs underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Google Maps
                  </a>
                </>
              ) : (
                <>
                  {activePin.description ? (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {activePin.description}
                    </div>
                  ) : null}
                  {activePin.href ? (
                    <a
                      href={activePin.href}
                      className="mt-2 inline-block text-xs underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View details
                    </a>
                  ) : null}
                </>
              )}
            </div>
          </InfoWindowF>
        ) : null}
      </GoogleMap>
    </div>
  );
}
