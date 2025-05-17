// Import Mapbox as an ESM module
import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';

//Mapbox access token here
mapboxgl.accessToken = 'pk.eyJ1IjoiYzN4aWFuZyIsImEiOiJjbWFyamoyMnUwYzRyMmlvczAzNjdzbnoxIn0.S6tEiE7XeYRerXjN-TgcgQ';

// Initialize the map
const map = new mapboxgl.Map({
  container: 'map', // ID of the div where the map will render
  style: 'mapbox://styles/c3xiang/cmarmzkrz01fn01sico0p2knv', // Map style
  center: [-71.09415, 42.36027], // [longitude, latitude]
  zoom: 12, // Initial zoom level
  minZoom: 5, // Minimum allowed zoom
  maxZoom: 18, // Maximum allowed zoom
});

map.on('load', async () => {
    //data sources for bike lanes
    map.addSource('boston_route', {
        type: 'geojson',
        data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson',
    });

    map.addSource('cambridge_route', {
      type: 'geojson',
      data: 'https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson'
    });
    
    //bike lane styling
    map.addLayer({
      id: 'bike-lanes-boston',
      type: 'line',
      source: 'boston_route',
      paint: {
        'line-color': '#4dd145',
        'line-width': 3,
        'line-opacity': 0.6
      }
    });
    
    map.addLayer({
      id: 'bike-lanes-cambridge',
      type: 'line',
      source: 'cambridge_route',
      paint: {
        'line-color': '#4dd145',
        'line-width': 3,
        'line-opacity': 0.6
      }
    });
});
