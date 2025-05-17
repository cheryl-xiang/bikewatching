// Import Mapbox and D3 as an ESM module
import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';


mapboxgl.accessToken = 'pk.eyJ1IjoiYzN4aWFuZyIsImEiOiJjbWFyamoyMnUwYzRyMmlvczAzNjdzbnoxIn0.S6tEiE7XeYRerXjN-TgcgQ';

// Initialize the map
const map = new mapboxgl.Map({
  container: 'map', 
  style: 'mapbox://styles/c3xiang/cmarmzkrz01fn01sico0p2knv', 
  center: [-71.09415, 42.36027], // [longitude, latitude]
  zoom: 12, 
  minZoom: 5,
  maxZoom: 18, 
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

    let jsonData;
    const jsonurl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
    jsonData = await d3.json(jsonurl);

    let stations = jsonData.data.stations;

    const svg = d3.select('#map').select('svg');

    const circles = svg
        .selectAll('circle')
        .data(stations)
        .enter()
        .append('circle')
        .attr('r', 5) // Radius of the circle
        .attr('fill', 'steelblue') // Circle fill color
        .attr('stroke', 'white') // Circle border color
        .attr('stroke-width', 1) // Circle border thickness
        .attr('opacity', 0.8); // Circle opacity

    // Function to update circle positions when the map moves/zooms
    function updatePositions() {
        circles
        .attr('cx', (d) => getCoords(d).cx) // Set the x-position using projected coordinates
        .attr('cy', (d) => getCoords(d).cy); // Set the y-position using projected coordinates
    }

    // Initial position update when map loads
    updatePositions();

    //Dynamically update positions
    map.on('move', updatePositions); 
    map.on('zoom', updatePositions); 
    map.on('resize', updatePositions); 
    map.on('moveend', updatePositions); 


});

function getCoords(station) {
    const point = new mapboxgl.LngLat(+station.lon, +station.lat);
    const { x, y } = map.project(point);
    return { cx: x, cy: y };
}
