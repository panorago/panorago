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

type LoadGoogleMapsOpts = {
  /** Load Places library (admin pickers / nearby). */
  places?: boolean;
  /**
   * Load Directions / Routes. Default true for place detail maps;
   * explore map can skip until a pin is selected.
   */
  routes?: boolean;
};

function routesNotLoaded(): never {
  throw new Error("Google Maps routes library was not loaded");
}

export async function loadGoogleMaps(
  apiKey: string,
  opts?: LoadGoogleMapsOpts,
): Promise<GoogleMapsBundle> {
  if (configuredKey !== apiKey) {
    setOptions({
      key: apiKey,
      v: "weekly",
    });
    configuredKey = apiKey;
  }

  const wantRoutes = opts?.routes !== false;

  const [mapsLib, markerLib, coreLib, routesLib] = await Promise.all([
    importLibrary("maps"),
    importLibrary("marker"),
    importLibrary("core"),
    wantRoutes ? importLibrary("routes") : Promise.resolve(null),
  ]);

  let places: typeof google.maps.places | undefined;
  if (opts?.places) {
    places = (await importLibrary("places")) as typeof google.maps.places;
  }

  return {
    Map: mapsLib.Map,
    Marker: markerLib.Marker,
    Animation: markerLib.Animation,
    DirectionsService: routesLib
      ? routesLib.DirectionsService
      : (routesNotLoaded as unknown as typeof google.maps.DirectionsService),
    DirectionsRenderer: routesLib
      ? routesLib.DirectionsRenderer
      : (routesNotLoaded as unknown as typeof google.maps.DirectionsRenderer),
    TravelMode: routesLib
      ? routesLib.TravelMode
      : (routesNotLoaded as unknown as typeof google.maps.TravelMode),
    LatLngBounds: coreLib.LatLngBounds,
    Size: coreLib.Size,
    Point: coreLib.Point,
    places,
  };
}
