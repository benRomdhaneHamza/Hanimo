package cordova.plugin.nativegeocoder;

import android.location.Address;
import android.location.Geocoder;
import android.os.Build;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.List;
import java.util.Locale;

class NativeGeocoderOptions {
    boolean useLocale = true;
    String defaultLocale = null;
    int maxResults = 1;
}

public class NativeGeocoder extends CordovaPlugin {
    private static int MAX_RESULTS_COUNT = 5;
    private Geocoder geocoder;

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        System.out.print("NativeGeocoder initialized");
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        if (action.equals("reverseGeocode")) {
            double latitude = args.getDouble(0);
            double longitude = args.getDouble(1);
            JSONObject options = null;
            try {
                options = args.getJSONObject(2);
            } catch (JSONException e) {
                e.printStackTrace();
            }

            this.reverseGeocode(latitude, longitude, options, callbackContext);
            return true;
        }

        if (action.equals("forwardGeocode")) {
            String addressString = args.getString(0);
            JSONObject options = null;
            try {
                options = args.getJSONObject(1);
            } catch (JSONException e) {
                e.printStackTrace();
            }
            this.forwardGeocode(addressString, options, callbackContext);
            return true;
        }

        return false;
    }

    /**
     * Reverse geocode a given latitude and longitude to find location address
     * @param latitude
     * @param longitude
     * @param options
     * @param callbackContext
     */
    private void reverseGeocode(double latitude, double longitude, JSONObject options, CallbackContext callbackContext) throws JSONException{

        if (latitude == 0 || longitude == 0) {
            PluginResult r = new PluginResult(PluginResult.Status.ERROR, "Expected two non-empty double arguments.");
            callbackContext.sendPluginResult(r);
            return;
        }

        if (!Geocoder.isPresent()) {
            PluginResult r = new PluginResult(PluginResult.Status.ERROR, "Geocoder is not present on this device/emulator.");
            callbackContext.sendPluginResult(r);
            return;
        }

        NativeGeocoderOptions geocoderOptions = getNativeGeocoderOptions(options);
        geocoder = createGeocoderWithOptions(geocoderOptions);

        try {
            List<Address> geoResults = geocoder.getFromLocation(latitude, longitude, geocoderOptions.maxResults);
            if (geoResults.size() > 0) {
                int maxResultObjects = geoResults.size() >= geocoderOptions.maxResults ? geoResults.size() : geoResults.size();
                JSONArray resultObj = new JSONArray();

                for (int i = 0; i < maxResultObjects; i++) {
                    Address address = geoResults.get(i);

                    // https://developer.android.com/reference/android/location/Address.html
                    JSONObject placemark = new JSONObject();
                    placemark.put("countryCode", address.getCountryCode());
                    placemark.put("countryName", address.getCountryName());
                    placemark.put("postalCode", address.getPostalCode());
                    placemark.put("administrativeArea", address.getAdminArea());
                    placemark.put("subAdministrativeArea", address.getSubAdminArea());
                    placemark.put("locality", address.getLocality());
                    placemark.put("subLocality", address.getSubLocality());
                    placemark.put("thoroughfare", address.getThoroughfare());
                    placemark.put("subThoroughfare", address.getSubThoroughfare());

                    resultObj.put(placemark);
                }

                callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, resultObj));
            } else {
                PluginResult r = new PluginResult(PluginResult.Status.ERROR, "Cannot get an address.");
                callbackContext.sendPluginResult(r);
            }
        }
        catch (Exception e) {
            PluginResult r = new PluginResult(PluginResult.Status.ERROR, "Geocoder:getFromLocation Error: " + e.getMessage());
            callbackContext.sendPluginResult(r);
        }
    }


    /**
     * Forward geocode a given address to find coordinates
     * @param addressString
     * @param options
     * @param callbackContext
     */
    private void forwardGeocode(String addressString, JSONObject options, CallbackContext callbackContext) throws JSONException {
        if (addressString == null || addressString.length() == 0) {
            PluginResult r = new PluginResult(PluginResult.Status.ERROR, "Expected a non-empty string argument.");
            callbackContext.sendPluginResult(r);
            return;
        }

        if (!Geocoder.isPresent()) {
            PluginResult r = new PluginResult(PluginResult.Status.ERROR, "Geocoder is not present on this device/emulator.");
            callbackContext.sendPluginResult(r);
            return;
        }

        NativeGeocoderOptions geocoderOptions = getNativeGeocoderOptions(options);
        geocoder = createGeocoderWithOptions(geocoderOptions);

        try {
            List<Address> geoResults = geocoder.getFromLocationName(addressString, geocoderOptions.maxResults);

            if (geoResults.size() > 0) {
                int maxResultObjects = geoResults.size() >= geocoderOptions.maxResults ? geoResults.size() : geoResults.size();
                JSONArray resultObj = new JSONArray();

                for (int i = 0; i < maxResultObjects; i++) {
                    Address address = geoResults.get(i);

                    try {
                        String latitude = String.valueOf(address.getLatitude());
                        String longitude = String.valueOf(address.getLongitude());

                        if (!latitude.isEmpty() && !longitude.isEmpty()) {
                            JSONObject coordinates = new JSONObject();
                            coordinates.put("latitude", latitude);
                            coordinates.put("longitude", longitude);
                            resultObj.put(coordinates);
                        }
                    }
                    catch (RuntimeException e) {
                        e.printStackTrace();
                    }
                }

                if (resultObj.length() == 0) {
                    PluginResult r = new PluginResult(PluginResult.Status.ERROR, "Cannot get latitude and/or longitude.");
                    callbackContext.sendPluginResult(r);
                } else {
                    callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, resultObj));
                }

            } else {
                PluginResult r = new PluginResult(PluginResult.Status.ERROR, "Cannot find a location.");
                callbackContext.sendPluginResult(r);
            }
        }
        catch (Exception e) {
            PluginResult r = new PluginResult(PluginResult.Status.ERROR, "Geocoder:getFromLocationName Error: " +e.getMessage());
            callbackContext.sendPluginResult(r);
        }
    }

    /**
     * Get a valid NativeGeocoderOptions object
     * @param options
     * @return NativeGeocoderOptions
     */
    private NativeGeocoderOptions getNativeGeocoderOptions(JSONObject options) throws JSONException {
        NativeGeocoderOptions geocoderOptions = new NativeGeocoderOptions();

        if (options != null) {
            if (options.has("useLocale")) {
                geocoderOptions.useLocale = options.getBoolean("useLocale");
            } else {
                geocoderOptions.useLocale = true;
            }
            if (options.has("defaultLocale")) {
                geocoderOptions.defaultLocale = options.getString("defaultLocale");
            } else {
                geocoderOptions.defaultLocale = null;
            }
            if (options.has("maxResults")) {
                geocoderOptions.maxResults = options.getInt("maxResults");

                if (geocoderOptions.maxResults > 0) {
                    geocoderOptions.maxResults = geocoderOptions.maxResults > MAX_RESULTS_COUNT ? MAX_RESULTS_COUNT : geocoderOptions.maxResults;
                } else {
                    geocoderOptions.maxResults = 1;
                }

            } else {
                geocoderOptions.maxResults = 1;
            }
        } else {
            geocoderOptions.useLocale = true;
            geocoderOptions.defaultLocale = null;
            geocoderOptions.maxResults = 1;
        }

        return geocoderOptions;
    }

    /**
     * Create a Geocoder with NativeGeocoderOptions
     * @param geocoderOptions
     * @return Geocoder
     */
    private Geocoder createGeocoderWithOptions(NativeGeocoderOptions geocoderOptions) {
        if (geocoderOptions.defaultLocale != null && !geocoderOptions.defaultLocale.isEmpty()) {
            Locale locale;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                locale = Locale.forLanguageTag(geocoderOptions.defaultLocale);
            } else {
                locale = Locale.ENGLISH;
                String parts[] = geocoderOptions.defaultLocale.split("-|_", -1);
                if (parts.length == 1)
                    locale = new Locale(parts[0]);
                else if (parts.length == 2 || (parts.length == 3 && parts[2].startsWith("#")))
                    locale = new Locale(parts[0], parts[1]);
                else
                    locale = new Locale(parts[0], parts[1], parts[2]);
            }
            geocoder = new Geocoder(cordova.getActivity().getApplicationContext(), locale);
        } else {
            if (geocoderOptions.useLocale) {
                geocoder = new Geocoder(cordova.getActivity().getApplicationContext(), Locale.getDefault());
            } else {
                geocoder = new Geocoder(cordova.getActivity().getApplicationContext(), Locale.ENGLISH);
            }
        }
        return geocoder;
    }

}