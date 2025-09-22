"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsRenderer,
} from "@react-google-maps/api";

export default function ExcursionRoute({
  origin = "Tokyo Station",
  destination = "Shinjuku Station",
  height = 520,
}) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY,
  });

  const [dirResult, setDirResult] = useState(null);
  const [modeUsed, setModeUsed] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [mapRef, setMapRef] = useState(null);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined" || !window.google?.maps)
      return;

    setErrMsg("");
    setModeUsed("");
    setDirResult(null);

    const svc = new window.google.maps.DirectionsService();

    const tryMode = (mode) =>
      svc.route({
        origin,
        destination,
        travelMode: window.google.maps.TravelMode[mode],
        provideRouteAlternatives: false,
        region: "jp",
      });

    // Try TRANSIT → DRIVING → WALKING
    svc
      .route({
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.TRANSIT,
        transitOptions: {
          departureTime: new Date(Date.now() + 60 * 60 * 1000),
        },
        region: "jp",
      })
      .then((res) => {
        setDirResult(res);
        setModeUsed("TRANSIT");
      })
      .catch(() => {
        tryMode("DRIVING")
          .then((res) => {
            setDirResult(res);
            setModeUsed("DRIVING");
          })
          .catch(() => {
            tryMode("WALKING")
              .then((res) => {
                setDirResult(res);
                setModeUsed("WALKING");
              })
              .catch((err) => {
                setErrMsg(err?.message || "No route found for any mode.");
              });
          });
      });
  }, [isLoaded, origin, destination]);

  useEffect(() => {
    if (!mapRef || !dirResult?.routes?.[0]?.bounds) return;
    try {
      mapRef.fitBounds(dirResult.routes[0].bounds);
    } catch {}
  }, [mapRef, dirResult]);

  const mapsUrl = useMemo(() => {
    const u = new URL("https://www.google.com/maps/dir/");
    u.searchParams.set("api", "1");
    u.searchParams.set(
      "origin",
      typeof origin === "string" ? origin : `${origin.lat},${origin.lng}`
    );
    u.searchParams.set(
      "destination",
      typeof destination === "string"
        ? destination
        : `${destination.lat},${destination.lng}`
    );
    if (modeUsed) u.searchParams.set("travelmode", modeUsed.toLowerCase());
    return u.toString();
  }, [origin, destination, modeUsed]);

  return (
    <div style={{ height, width: "100%" }}>
      {modeUsed ? (
        <div className="mb-2 rounded-md border border-emerald-300 bg-emerald-100/60 px-3 py-2 text-sm text-emerald-900">
          Showing route (mode: {modeUsed})
        </div>
      ) : null}
      {errMsg ? (
        <div className="mb-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errMsg}
        </div>
      ) : null}

      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mb-2 rounded border border-border px-3 py-1 hover:bg-accent"
      >
        Open in Google Maps
      </a>

      {isLoaded && (
        <GoogleMap
          mapContainerStyle={{ height: `${height}px`, width: "100%" }}
          center={{ lat: 35.681, lng: 139.767 }}
          zoom={12}
          options={{ streetViewControl: false, mapTypeControl: false }}
          onLoad={(map) => {
            setMapRef(map);
            if (dirResult?.routes?.[0]?.bounds) {
              map.fitBounds(dirResult.routes[0].bounds);
            }
          }}
        >
          {dirResult ? (
            <DirectionsRenderer
              options={{
                directions: dirResult,
                suppressMarkers: false,
                preserveViewport: false,
              }}
            />
          ) : null}
        </GoogleMap>
      )}
    </div>
  );
}
