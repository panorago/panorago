import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let configuredKey: string | null = null;

export type GoogleMapsBundle = {
  Map: typeof google.maps.Map;
  Marker: typeof google.maps.Marker;
  Animation: typeof google.maps.Animation;
  DirectionsService: typeof google.maps.DirectionsService;
  DirectionsRenderer: typeof google.maps.DirectionsRenderer;
  TravelMode: typeof google.maps.TravelMode;
  LatLngBounds: typeof google.maps.LatLngBounds;
  Size: typeof google.maps.Size;
  Point: typeof google.maps.Point;
  places?: typeof google.maps.places;
};

export async function loadGoogleMaps(
  apiKey: string,
  opts?: { places?: boolean },
): Promise<GoogleMapsBundle> {
  if (configuredKey !== apiKey) {
    setOptions({
      key: apiKey,
      v: "weekly",
    });
    configuredKey = apiKey;
  }

  const [mapsLib, markerLib, routesLib, coreLib] = await Promise.all([
    importLibrary("maps"),
    importLibrary("marker"),
    importLibrary("routes"),
    importLibrary("core"),
  ]);

  let places: typeof google.maps.places | undefined;
  if (opts?.places) {
    places = (await importLibrary("places")) as typeof google.maps.places;
  }

  return {
    Map: mapsLib.Map,
    Marker: markerLib.Marker,
    Animation: markerLib.Animation,
    DirectionsService: routesLib.DirectionsService,
    DirectionsRenderer: routesLib.DirectionsRenderer,
    TravelMode: routesLib.TravelMode,
    LatLngBounds: coreLib.LatLngBounds,
    Size: coreLib.Size,
    Point: coreLib.Point,
    places,
  };
}
