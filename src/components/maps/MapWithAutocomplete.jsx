"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import { GoogleMap, Autocomplete, Marker } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";

const containerStyle = {
  width: "100%",
  height: "250px",
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

const libraries = ["places"];

let googleMapsLoading = false;
let googleMapsLoaded = false;

const MapWithAutocomplete = ({
  setValue,
  onAddressChange,
  fieldNames = {
    address: "address",
    area: "area",
    city: "city",
    state: "state",
    country: "country",
    pincode: "pincode",
  },
}) => {
  const [markerPosition, setMarkerPosition] = useState(null);
  const [mapLoadError, setMapLoadError] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [addressData, setAddressData] = useState({
    address: "",
    area: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  });
  const [inputValue, setInputValue] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [selectedPredictionIndex, setSelectedPredictionIndex] = useState(-1);

  const autocompleteService = useRef(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const inputRef = useRef(null);
  const predictionsRef = useRef(null);

  useEffect(() => {
    if (typeof google !== "undefined" && typeof google.maps !== "undefined") {
      setIsScriptLoaded(true);
      googleMapsLoaded = true;
      return;
    }

    if (!googleMapsLoading && !googleMapsLoaded) {
      googleMapsLoading = true;

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(",")}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        googleMapsLoading = false;
        googleMapsLoaded = true;
        setIsScriptLoaded(true);
      };
      script.onerror = () => {
        googleMapsLoading = false;
        setMapLoadError("Failed to load Google Maps API. Please check your connection and API key.");
      };

      if (!document.querySelector(`script[src="${script.src}"]`)) {
        document.head.appendChild(script);
      } else {
        const existingScript = document.querySelector(`script[src="${script.src}"]`);
        existingScript.onload = script.onload;
        existingScript.onerror = script.onerror;
      }
    }
  }, [apiKey]);

  useEffect(() => {
    if (isScriptLoaded && window.google && window.google.maps) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }
  }, [isScriptLoaded]);

  useEffect(() => {
    if (!isScriptLoaded || !autocompleteService.current || inputValue.length < 3) {
      setPredictions([]);
      setSelectedPredictionIndex(-1);
      return;
    }

    const debounceTimer = setTimeout(() => {
      autocompleteService.current.getPlacePredictions(
        {
          input: inputValue,
          types: ["geocode", "establishment"],
        },
        (predictions, status) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
            setPredictions([]);
            setSelectedPredictionIndex(-1);
            return;
          }
          setPredictions(predictions);
        }
      );
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [inputValue, isScriptLoaded]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target) &&
        predictionsRef.current &&
        !predictionsRef.current.contains(event.target)
      ) {
        setShowPredictions(false);
        setSelectedPredictionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handlePlaceChanged = useCallback(
    (place) => {
      if (!place || !place.geometry || !place.geometry.location) {
        setValue(fieldNames.address, "Location not found - please try another address");
        return;
      }

      const newPosition = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      const components = {
        streetParts: [],
        area: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
      };

      const addressTypes = {
        streetNumber: ["street_number"],
        streetName: ["route"],
        intersection: ["intersection"],
        plusCode: ["plus_code"],
        premise: ["premise"],
        subpremise: ["subpremise"],
        floor: ["floor"],
        room: ["room"],
        parking: ["parking"],
        postBox: ["post_box"],
        establishment: ["establishment"],
        pointOfInterest: ["point_of_interest"],
        busStation: ["bus_station", "train_station", "transit_station"],
        neighborhood: ["neighborhood"],
        suburb: [
          "sublocality_level_2",
          "sublocality_level_3",
          "sublocality_level_4",
          "sublocality_level_5",
        ],
        village: ["village"],
        townSquare: ["town_square"],
        area: ["sublocality"],
        city: ["locality", "postal_town"],
        county: ["administrative_area_level_2"],
        state: ["administrative_area_level_1"],
        country: ["country"],
        postalCode: ["postal_code"],
        postalCodeSuffix: ["postal_code_suffix"],
      };

      if (place.address_components) {
        place.address_components.forEach((component) => {
          const isStreetComponent =
            addressTypes.streetNumber.some((t) => component.types.includes(t)) ||
            addressTypes.streetName.some((t) => component.types.includes(t)) ||
            addressTypes.intersection.some((t) => component.types.includes(t)) ||
            addressTypes.plusCode.some((t) => component.types.includes(t)) ||
            addressTypes.premise.some((t) => component.types.includes(t)) ||
            addressTypes.subpremise.some((t) => component.types.includes(t)) ||
            addressTypes.floor.some((t) => component.types.includes(t)) ||
            addressTypes.room.some((t) => component.types.includes(t)) ||
            addressTypes.parking.some((t) => component.types.includes(t)) ||
            addressTypes.postBox.some((t) => component.types.includes(t)) ||
            addressTypes.establishment.some((t) => component.types.includes(t)) ||
            addressTypes.pointOfInterest.some((t) => component.types.includes(t)) ||
            addressTypes.busStation.some((t) => component.types.includes(t)) ||
            addressTypes.neighborhood.some((t) => component.types.includes(t)) ||
            addressTypes.suburb.some((t) => component.types.includes(t)) ||
            addressTypes.village.some((t) => component.types.includes(t)) ||
            addressTypes.townSquare.some((t) => component.types.includes(t));

          if (isStreetComponent) {
            components.streetParts.push(component.long_name);
          }

          if (addressTypes.area.some((t) => component.types.includes(t))) {
            components.area = component.long_name;
          }
          if (addressTypes.city.some((t) => component.types.includes(t))) {
            components.city = component.long_name;
          }
          if (addressTypes.state.some((t) => component.types.includes(t))) {
            components.state = component.long_name.toUpperCase();
          }
          if (addressTypes.country.some((t) => component.types.includes(t))) {
            components.country = component.long_name;
          }
          if (addressTypes.postalCode.some((t) => component.types.includes(t))) {
            components.pincode = component.long_name;
          }
        });
      }

      const streetAddress = components.streetParts
        .filter((part, index, self) => {
          return (
            part &&
            part.trim().length > 0 &&
            self.indexOf(part) === index &&
            !components.streetParts.some((p, i) => i > index && p.includes(part))
          );
        })
        .join(", ")
        .replace(/,{2,}/g, ",")
        .trim();

      const newAddressData = {
        address: streetAddress || place.formatted_address || "",
        area: components.area,
        city: components.city,
        state: components.state,
        country: components.country,
        pincode: components.pincode,
      };

      setAddressData(newAddressData);
      setInputValue(place.formatted_address || streetAddress);
      setSelectedPredictionIndex(-1);

      if (onAddressChange) {
        onAddressChange(newAddressData);
      }

      setMarkerPosition(newPosition);

      if (mapRef.current) {
        mapRef.current.panTo(newPosition);
        mapRef.current.setZoom(15);
      }
    },
    [fieldNames.address, onAddressChange, setValue]
  );

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setShowPredictions(true);
    setSelectedPredictionIndex(-1);
  };

  const handlePredictionSelect = (prediction) => {
    setShowPredictions(false);
    setSelectedPredictionIndex(-1);

    const placesService = new window.google.maps.places.PlacesService(mapRef.current);
    placesService.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["address_components", "geometry", "formatted_address", "name"],
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          handlePlaceChanged(place);
        }
      }
    );
  };

  const handleKeyDown = (e) => {
    if (!showPredictions || predictions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedPredictionIndex((prev) =>
          prev < predictions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedPredictionIndex((prev) => (prev > -1 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedPredictionIndex >= 0) {
          handlePredictionSelect(predictions[selectedPredictionIndex]);
        }
        break;
      case "Escape":
        setShowPredictions(false);
        setSelectedPredictionIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-4">
      {isScriptLoaded ? (
        <div className="space-y-2">
          <div className="relative" ref={inputRef}>
            <div className="relative">
              <Input
                ref={inputRef}
                className="pl-10 pr-10 py-2 w-full input-focus-style"
                id="address-input"
                type="text"
                placeholder="Search any address"
                aria-label="Search for addresses worldwide"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => setShowPredictions(true)}
                onKeyDown={handleKeyDown}
              />
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>

            {showPredictions && predictions.length > 0 && (
              <div
                ref={predictionsRef}
                className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
              >
                {predictions.map((prediction, index) => (
                  <div key={prediction.place_id}>
                    <div
                      className={`px-4 py-2 cursor-pointer flex items-center ${
                        index === selectedPredictionIndex
                          ? "bg-gray-100"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => handlePredictionSelect(prediction)}
                    >
                      <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
                      <div>
                        <p className="font-medium">{prediction.structured_formatting.main_text}</p>
                        <p className="text-sm text-gray-500">
                          {prediction.structured_formatting.secondary_text}
                        </p>
                      </div>
                    </div>
                    {index < predictions.length - 1 && (
                      <hr className="border-t border-gray-200" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg overflow-hidden border">
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={markerPosition || defaultCenter}
              zoom={markerPosition ? 15 : 5}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{
                streetViewControl: false,
                mapTypeControl: true,
                fullscreenControl: false,
              }}
            >
              {markerPosition && <Marker position={markerPosition} />}
            </GoogleMap>
          </div>

        </div>
      ) : mapLoadError ? (
        <div className="text-sm text-destructive">{mapLoadError}</div>
      ) : (
        <div className="text-sm text-muted-foreground">Loading Google Maps...</div>
      )}
    </div>
  );
};

export default MapWithAutocomplete;