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

let stationFlow = d3.scaleQuantize().domain([0, 1]).range([0, 0.5, 1]);
let radiusScale; 

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

    const jsonurl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
    const jsonData = await d3.json(jsonurl);
    let trips = await d3.csv(
        'https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv',
        (trip) => {
            trip.started_at = new Date(trip.started_at);
            trip.ended_at = new Date(trip.ended_at);
            return trip;
        },
    );

    const svg = d3.select('#map').select('svg');
    const stations = computeStationTraffic(jsonData.data.stations, trips);

    radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(stations, (d) => d.totalTraffic)])
        .range([0, 25]);

    const circles = svg
        .selectAll('circle')
        .data(stations, (d) => d.short_name)
        .enter()
        .append('circle')
        .attr('fill', 'steelblue')
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('opacity', 0.6)
        .style('pointer-events', 'auto')
        .style('--departure-ratio', (d) =>
            stationFlow(d.totalTraffic === 0 ? 0.5 : d.departures / d.totalTraffic)
        )
        .attr('r', (d) => radiusScale(d.totalTraffic))
        .each(function (d) {
            d3.select(this)
            .append('title')
            .text(
                `${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`
            );
        });

        

    // Function to update circle positions when the map moves/zooms
    function updatePositions() {
        circles
        .attr('cx', (d) => getCoords(d).cx) 
        .attr('cy', (d) => getCoords(d).cy); 
    }

    // Initial position update when map loads
    updatePositions();

    //Dynamically update positions
    map.on('move', updatePositions); 
    map.on('zoom', updatePositions); 
    map.on('resize', updatePositions); 
    map.on('moveend', updatePositions); 

    //Time slider updating
    const timeSlider = document.getElementById('time-slider');
    const selectedTime = document.getElementById('selected-time');
    const anyTimeLabel = document.getElementById('any-time');

    
    function updateTimeDisplay() {
        const timeFilter = Number(timeSlider.value);
        if (timeFilter === -1) {
            selectedTime.textContent = '';
            anyTimeLabel.style.display = 'block';
        } else {
            selectedTime.textContent = formatTime(timeFilter);
            anyTimeLabel.style.display = 'none';
        }
        updateScatterPlot(timeFilter);
    }

    function updateScatterPlot(timeFilter) {
        const filteredTrips = filterTripsbyTime(trips, timeFilter);
        timeFilter === -1
            ? radiusScale.range([0, 25])
            : radiusScale.range([3, 50]);

        // Recompute station traffic based on the filtered trips
        const filteredStations = computeStationTraffic(stations, filteredTrips);

        // Update the scatterplot by adjusting the radius of circles
        svg
            .selectAll('circle')
            .data(filteredStations, d => d.short_name)
            .join('circle')
            .attr('r', d => radiusScale(d.totalTraffic))
            .style('--departure-ratio', d => stationFlow(d.totalTraffic === 0 ? 0.5 : d.departures / d.totalTraffic))
            .attr('fill', 'steelblue')
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('opacity', 0.6)
            .style('pointer-events', 'auto')
            .each(function (d) {
                d3.select(this).select('title').remove();
                d3.select(this)
                .append('title')
                .text(`${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`);
        });
    
    }

    updatePositions();

    timeSlider.addEventListener('input', updateTimeDisplay);
    updateTimeDisplay();


});

function getCoords(station) {
    const point = new mapboxgl.LngLat(+station.lon, +station.lat);
    const { x, y } = map.project(point);
    return { cx: x, cy: y };
}

function computeStationTraffic(stations, trips) {
  const departures = d3.rollup(
    trips,
    (v) => v.length,
    (d) => d.start_station_id
  );

  const arrivals = d3.rollup(
    trips,
    (v) => v.length,
    (d) => d.end_station_id
  );

  return stations.map((station) => {
    let id = station.short_name;
    station.arrivals = arrivals.get(id) ?? 0;
    station.departures = departures.get(id) ?? 0;
    station.totalTraffic = station.arrivals + station.departures;
    return station;
  });
}

function minutesSinceMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function formatTime(minutes) {
  const date = new Date(0, 0, 0, 0, minutes); // Set hours & minutes
  return date.toLocaleString('en-US', { timeStyle: 'short' }); // Format as HH:MM AM/PM
}

function filterTripsbyTime(trips, timeFilter) {
  return timeFilter === -1
    ? trips // If no filter is applied (-1), return all trips
    : trips.filter((trip) => {
        // Convert trip start and end times to minutes since midnight
        const startedMinutes = minutesSinceMidnight(trip.started_at);
        const endedMinutes = minutesSinceMidnight(trip.ended_at);

        // Include trips that started or ended within 60 minutes of the selected time
        return (
          Math.abs(startedMinutes - timeFilter) <= 60 ||
          Math.abs(endedMinutes - timeFilter) <= 60
        );
      });
}