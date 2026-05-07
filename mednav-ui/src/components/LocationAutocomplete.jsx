import { useRef, useEffect, useState } from "react";
import { MapPin, Navigation, X } from "lucide-react";

/**
 * Google Places Autocomplete for locality search.
 * Returns city name + lat/lng coordinates to the parent.
 */
export default function LocationAutocomplete({ value, onChange, disabled }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [inputValue, setInputValue] = useState(value || "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.warn("[LocationAutocomplete] Google Maps SDK not loaded yet.");
      return;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["(regions)"], // Localities, cities, sublocalities
      componentRestrictions: { country: "in" }, // Restrict to India
      fields: ["geometry", "formatted_address", "name", "address_components"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const displayName = place.formatted_address || place.name || "";

      // Extract the city name from address_components
      let cityName = "";
      if (place.address_components) {
        for (const comp of place.address_components) {
          if (comp.types.includes("locality")) {
            cityName = comp.long_name;
            break;
          }
          if (comp.types.includes("administrative_area_level_2")) {
            cityName = comp.long_name;
          }
        }
      }
      if (!cityName) cityName = place.name || "Unknown";

      setInputValue(displayName);
      onChange({
        displayName,
        city: cityName,
        lat,
        lng,
      });
    });

    autocompleteRef.current = autocomplete;

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  // Use browser geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Reverse geocode to get address
        try {
          const geocoder = new window.google.maps.Geocoder();
          const result = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
          if (result.results && result.results[0]) {
            const addr = result.results[0];
            let cityName = "";
            for (const comp of addr.address_components) {
              if (comp.types.includes("locality")) {
                cityName = comp.long_name;
                break;
              }
            }
            setInputValue(addr.formatted_address);
            onChange({
              displayName: addr.formatted_address,
              city: cityName || "Current Location",
              lat: latitude,
              lng: longitude,
            });
          }
        } catch (e) {
          console.error("Reverse geocode failed:", e);
          setInputValue(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          onChange({
            displayName: "Current Location",
            city: "Current Location",
            lat: latitude,
            lng: longitude,
          });
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Could not get your location. Please enter it manually.");
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleClear = () => {
    setInputValue("");
    onChange(null);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="relative">
      <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
        <MapPin className="w-4 h-4 text-slate-400" />
        Your Location
      </label>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MapPin className="w-4 h-4 text-blue-500" />
          </div>
          <input
            ref={inputRef}
            type="text"
            required
            className="block w-full pl-10 pr-10 py-3 text-base font-bold text-slate-800 border-2 border-slate-100 bg-slate-50/50 hover:bg-slate-50 focus:outline-none focus:border-blue-500 focus:bg-white rounded-xl transition-all placeholder:font-medium placeholder-slate-400"
            placeholder="Search locality, area, or city..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={disabled}
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={disabled || isLoading}
          className="flex items-center gap-1.5 px-4 py-3 bg-blue-50 text-blue-700 font-bold text-sm border-2 border-blue-100 rounded-xl hover:bg-blue-100 hover:border-blue-200 transition-all disabled:opacity-50 whitespace-nowrap"
          title="Use my current location"
        >
          <Navigation className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Locating..." : "Use GPS"}
        </button>
      </div>
      <p className="mt-1.5 text-[10px] text-slate-400 font-medium">
        Distance to hospitals is calculated from this location
      </p>
    </div>
  );
}
