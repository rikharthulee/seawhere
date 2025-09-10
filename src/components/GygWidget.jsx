"use client";

/**
 * GetYourGuide widget wrapper.
 *
 * Behavior:
 * - If `tourId` is provided: renders Availability widget
 * - Else if `locationId` is provided: renders City widget
 * - Else: falls back to Generic (auto) widget
 */
export default function GygWidget({
  partnerId = "WVS8AHI",
  className = "",
  // Optional IDs to choose the widget type
  tourId,
  locationId,
  // Optional display controls
  localeCode = "en-US",
  currency = "GBP",
  variant = "horizontal",
}) {
  const hasTour = !!tourId;
  const hasLocation = !!locationId;

  if (hasTour) {
    // Availability widget for a specific tour
    return (
      <div className={className}>
        <div
          data-gyg-href="https://widget.getyourguide.com/default/availability.frame"
          data-gyg-tour-id={String(tourId)}
          data-gyg-locale-code={localeCode}
          data-gyg-currency={currency}
          data-gyg-widget="availability"
          data-gyg-variant={variant}
          data-gyg-partner-id={partnerId}
        >
          <span>
            Powered by {" "}
            <a target="_blank" rel="sponsored" href="https://www.getyourguide.com/">
              GetYourGuide
            </a>
          </span>
        </div>
      </div>
    );
  }

  if (hasLocation) {
    // City widget for destination pages
    return (
      <div className={className}>
        <div
          data-gyg-href="https://widget.getyourguide.com/default/city.frame"
          data-gyg-location-id={String(locationId)}
          data-gyg-locale-code={localeCode}
          data-gyg-widget="city"
          data-gyg-partner-id={partnerId}
        />
      </div>
    );
  }

  // Generic widget fallback
  return (
    <div className={className}>
      <div data-gyg-widget="auto" data-gyg-partner-id={partnerId} />
    </div>
  );
}
