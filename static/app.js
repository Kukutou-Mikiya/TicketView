import Geohash from './latlon-geohash.js';
    // Fetch user's geolocation using ipinfo.io API
import { GapiKey, apiKey } from './apikey.js';
// declare global variables
let eventsData; // array of events data returned by Ticketmaster Event Search API
let sortedColumn = -1; // index of column to sort table by
let sortOrder = 1; // sort order, 1 for ascending and -1 for descending

export async function fetchLocation() {
  const response = await fetch("https://ipinfo.io/?token=508efef6f3e453");
  if (response.ok) {
      const data = await response.json();
      const location = data.loc.split(',');
      return {
            latitude: location[0],
            longitude: location[1]
          };
    } else {
      console.error('Request failed with status code: ' + response.status);
    }

  }

export const getLatLngFromAddress = (address) => {
  return fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GapiKey}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to retrieve location from address');
      }
      return response.json();
    })
    .then(data => {
      if (data.status === 'OK') {
        const location = data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng
        };
      } else {
        throw new Error('Failed to retrieve location from address');
      }
    });
};

  // Search events using form inputs
export async function search(e) {
  e.preventDefault();
  var form = e.target.form;
  if (form.reportValidity()==false){
    return
  }
  console.log('search is running')
  const keyword = document.getElementById("keyword").value;
  let distance = document.getElementById("distance").value;
  let category = document.getElementById("category").value;

  let location;
  if (document.getElementById("auto-detect").checked) {
    location = await fetchLocation();
  } else {
    location = await getLatLngFromAddress(document.getElementById("location").value);
    console.log(document.getElementById("location").value);
    console.log('Google loc:')
    console.log(location)
  }

  // Set default values for distance and category if not provided
  if (!distance) {
    distance = 10;
  }
  if (!category || category === "default") {
    category = "default";
  }

  // Make the GET request
  
  let geoPoint = Geohash.encode(location.latitude,location.longitude,9);  
  const url = `http://127.0.0.1:5000/events?keyword=${keyword}&distance=${distance}&category=${category}&geoPoint=${geoPoint}`;
  const response = await fetch(url);
  eventsData = await response.json();
  if (eventsData._embedded){
      eventsData = eventsData._embedded.events;
      displayEvents();
      document.getElementById("noResults").style.display = 'none';
  }
  else {
      document.getElementById("noResults").style.display = 'block';
  }
  return false;
  // Display the results in the result area

}

// Clear the form and result area
export function clearForm() {
  document.getElementById("keyword").value = "";
  document.getElementById("distance").value = "";
  document.getElementById("category").value = "default";
  document.getElementById("location").value = "";
  document.getElementById("auto-detect").checked = false;
  const tableBody = document.querySelector('#eventTable tbody');
    while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }
  var tableHead = document.getElementById("tableHead");
  tableHead.hidden = true;
  document.querySelector('#eventCard').style.display = 'none';
  document.querySelector('#venueDetails').style.display = 'none';
  document.getElementById("location-container").style.display = 'block';
  document.getElementById("location").setAttribute("required", "");
}


// display events in table
const displayEvents = () => {
  const tableBody = document.querySelector('#eventTable tbody');
  // remove any existing rows
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }

  // add new rows
  if (eventsData.length === 0) {
    document.querySelector('#noResults').style.display = 'block';
  } else {
    document.querySelector('#noResults').style.display = 'none';
    var tableHead = document.getElementById("tableHead");
    tableHead.hidden = false;
  
    eventsData.forEach(event => {
      const row = document.createElement('tr');

      // date column
      const dateCell = document.createElement('td');
      dateCell.innerHTML  = `${event.dates.start.localDate}<br>${event.dates.start.localTime}`;
      row.appendChild(dateCell);

      // icon column
      const iconCell = document.createElement('td');
      const icon = document.createElement('img');
      const image80 = event.images.find(image => image.width === 305);
      if (image80) {
        icon.src = image80.url;
        icon.width = 160;
        icon.height = 90;
      } else {
        icon.alt = 'No Event Image Available';
      }
      iconCell.appendChild(icon);
      row.appendChild(iconCell);

      // event name column
      const nameCell = document.createElement('td');
      const nameLink = document.createElement('a');
      nameLink.href = '';
      nameLink.textContent = event.name;
      nameLink.style.color = 'black';
      nameLink.style.textDecoration = 'none';
      nameLink.onmouseover = function() {
          this.style.color = 'blue';
      }
      nameLink.onmouseout = function() {
          this.style.color = 'black';
      }
      nameLink.addEventListener('click', (e) => {
        e.preventDefault();
        let venueName = '';
        if (event._embedded && event._embedded.venues && event._embedded.venues.length > 0) {
          venueName = event._embedded.venues[0].name;
        }
        displayEventCard(event.id, venueName);
      });
      nameCell.appendChild(nameLink);
      row.appendChild(nameCell);

      // genre column
      const genreCell = document.createElement('td');
      genreCell.textContent = event.classifications[0].segment.name;
      row.appendChild(genreCell);

      // venue name column
      const venueCell = document.createElement('td');
      venueCell.textContent = event._embedded.venues[0].name;
      row.appendChild(venueCell);

      tableBody.appendChild(row);
    });
  };
};

// handle sorting on table headers
export const sortTable = (columnIndex) => {
  // set sortedColumn to columnIndex if it's not already sorted by that column, or reverse the sort order if it is
  if (columnIndex !== sortedColumn) {
    sortedColumn = columnIndex;
    sortOrder = 1;
  } else {
    sortOrder = -sortOrder;
  }

  // sort table rows based on sortedColumn and sortOrder
  eventsData.sort((a, b) => {
    const aValue = getColumnField(a, sortedColumn);
    const bValue = getColumnField(b, sortedColumn);
    if (aValue < bValue) {
      return -sortOrder;
    } else if (aValue > bValue) {
      return sortOrder;
    } else {
      return 0;
    }
  });

  displayEvents();
};

// helper function to get field name based on column index
const getColumnField = (x, columnIndex) => {
  switch (columnIndex) { // add opening parenthesis here
    case 0:
      return x.dates.start.localDate;
    case 1:
      return ''; // icon column has no field
    case 2:
      return x.name;
    case 3:
      return x.classifications[0].segment.name;
    case 4:
      return x._embedded.venues[0].name;
    default:
      return '';
  }
};


// make API calls to Ticketmaster Event Details API and Venue Search API
// populate event card with detailed response data
// show and hide event card based on user clicking on event name in table rows
const displayEventCard = (eventId,venueName) => {
  document.querySelector('#eventCard').style.display = 'block';
  document.querySelector('#eventCard').scrollIntoView();
  // declare variables for API data
  let eventData = false;
  let venueData = false;

  // make API call to Ticketmaster Event Details API
  const eventUrl = `https://app.ticketmaster.com/discovery/v2/events/${eventId}.json?apikey=${apiKey}`;
  fetch(eventUrl)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Error retrieving event data');
    })
    .then(data => {
      eventData = data;
      if (venueData) { // check if venueData is already retrieved
        displayCardInfo();
      }
    })
    .catch(error => console.error(error));

  // make API call to Ticketmaster Venue Search API
  const venueUrl = `https://app.ticketmaster.com/discovery/v2/venues.json?keyword=${encodeURIComponent(venueName)}&apikey=${apiKey}`;

  fetch(venueUrl)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Error retrieving venue data');
    })
    .then(data => {
      venueData = data;
      if (eventData) { // check if eventData is already retrieved
        displayCardInfo();
      }
    })
    .catch(error => console.error(error));


  // display detailed event card once all API data is returned
  const displayCardInfo = () => {
    // populate event card with API data
    const cardEventName = document.querySelector('#cardEventName');
    cardEventName.style.display = 'block';
    if (eventData.name) {
      cardEventName.innerHTML = `${eventData.name}`;
    } else {
      cardEventName.style.display = 'none';
    }

    const cardDate = document.querySelector('#cardDate');
    cardDate.style.display = 'block';
    if (eventData.dates.start.localDate && eventData.dates.start.localTime) {
      cardDate.innerHTML = `<strong class="lime-text-size-14">Date</strong><br>${eventData.dates.start.localDate} ${eventData.dates.start.localTime}`;
    } else {
      cardDate.style.display = 'none';
    }

    const cardArtist = document.querySelector('#cardArtist');
    cardArtist.style.display = 'block';
    if (eventData._embedded.attractions && eventData._embedded.attractions.length > 0) {
      cardArtist.innerHTML = `<strong class="lime-text-size-14">Artist/Team</strong><br>${eventData._embedded.attractions.map(attraction => `<a href="${attraction.url}" style="text-decoration:none">${attraction.name}</a>`).join(' | ')}`;
    } else {
      cardArtist.style.display = 'none';
    }

    const cardVenue = document.querySelector('#cardVenue');
    cardVenue.style.display = 'block';
    if (eventData._embedded?.venues && eventData._embedded?.venues.length > 0) {
      cardVenue.innerHTML = `<strong class="lime-text-size-14">Venue</strong><br>${eventData._embedded.venues[0].name}`;
    } else {
      cardVenue.style.display = 'none';
    }

    const cardGenres = document.querySelector('#cardGenres');
    cardGenres.style.display = 'block';
    if (eventData.classifications && eventData.classifications.length > 0) {
      cardGenres.innerHTML = `<strong class="lime-text-size-14">Genres</strong><br>${eventData.classifications.map(classification => {
        const names = [classification.subGenre?.name, classification.genre?.name, classification.segment?.name, classification.subType?.name, classification.type?.name];
        const filteredNames = names.filter(name => name !== "Undefined");
        return filteredNames.join(' | ');
      }).join(' | ')}`;
    } else {
      cardGenres.style.display = 'none';
    }

    const cardPriceRanges = document.querySelector('#cardPriceRanges');
    cardPriceRanges.style.display = 'block';
    if (eventData.priceRanges && eventData.priceRanges.length > 0) {
      cardPriceRanges.innerHTML = `<strong class="lime-text-size-14">Price Ranges</strong><br>${eventData.priceRanges.map(price => `${price.min} - ${price.max} USD`).join(', ')}`;
    } else {
      cardPriceRanges.style.display = 'none';
    }

    const cardTicketStatus = document.querySelector('#cardTicketStatus');
    cardTicketStatus.style.display = 'block';
    if (eventData.dates.status && eventData.dates.status.code) {
      const statusCode = eventData.dates.status.code.toLowerCase();
      let statusMessage, statusClass;
      switch (statusCode) {
        case 'onsale':
          statusMessage = 'On Sale';
          statusClass = 'on-sale';
          break;
        case 'offsale':
          statusMessage = 'Off Sale';
          statusClass = 'off-sale';
          break;
        case 'canceled':
          statusMessage = 'Canceled';
          statusClass = 'canceled';
          break;
        case 'postponed':
          statusMessage = 'Postponed';
          statusClass = 'postponed';
          break;
        case 'rescheduled':
          statusMessage = 'Rescheduled';
          statusClass = 'rescheduled';
          break;
        default:
          cardTicketStatus.style.display = 'none';
          return;
      }
      cardTicketStatus.innerHTML = `<strong class="lime-text-size-14">Ticket status</strong><br><span class="${statusClass} badge">${statusMessage}</span>`;
    } else {
        cardTicketStatus.style.display = 'none';
    }

    const cardBuyTickets = document.querySelector('#cardBuyTickets');
    cardBuyTickets.style.display = 'block';
    if (eventData.url) {
      const ticketmasterLink = document.createElement('a');
      ticketmasterLink.textContent = 'Ticketmaster';
      ticketmasterLink.href = eventData.url;
      ticketmasterLink.style.textDecoration = 'none';
      cardBuyTickets.innerHTML = `<strong class="lime-text-size-14">Buy Tickets At: </strong><br>`;
      cardBuyTickets.appendChild(ticketmasterLink);
    } else {
      cardBuyTickets.style.display = 'none';
    }

    const cardSeatMap = document.querySelector('#cardSeatMap');
    cardSeatMap.style.display = 'block';
    if (eventData.seatmap && eventData.seatmap.staticUrl) {
      cardSeatMap.src = eventData.seatmap.staticUrl;
      cardSeatMap.alt = "Seat Map Not Available";
    } else {
      cardSeatMap.style.display = 'none';
    }
        // show event card and scroll to its location
    document.querySelector('#eventCard').style.display = 'block';
    document.querySelector('#eventCard').scrollIntoView();

    if(venueData._embedded){
      setVenueCard(venueData);
      document.querySelector('#venueToggle').style.display = 'block';
    } else {
      document.querySelector('#venueToggle').style.display = 'none';
    }  
  }
};



const setVenueCard = (venueData) => {
  // declare variables for venue data
  let venueName, venueAddress, venueCity, venueState, venuePostalCode, venueLocation;

  // check if venue data is available
  if (venueData && venueData._embedded && venueData._embedded.venues && venueData._embedded.venues.length > 0) {
    const venue = venueData._embedded.venues[0];

  // set variables for venue data
  venueName = venue.name || 'N/A';
  venueAddress = venue.address?.line1 || 'N/A';
  venueCity = venue.city?.name || 'N/A';
  venueState = venue.state?.name || 'N/A';
  venuePostalCode = venue.postalCode || 'N/A';
  venueLocation = `${venueAddress}, ${venueCity}, ${venueState}, ${venuePostalCode}`;
  }

  // create Venue Details card HTML elements
  const venueDetailsCard = document.createElement('div');
  venueDetailsCard.classList.add('venue-card');

  const venueDetailsTitle = document.createElement('h2');
  venueDetailsTitle.classList.add('venue-details-title');
  venueDetailsTitle.innerHTML = `${venueName}`

  const venueDetailsWrapper = document.createElement('div');
  venueDetailsWrapper.classList.add('venue-details-wrapper');

  const venueDetailsLocation = document.createElement('div');
  venueDetailsLocation.classList.add('left-col');
  venueDetailsLocation.innerHTML = `
    <p>Address: ${venueAddress}<br>${venueCity}, ${venueState}<br>${venuePostalCode}</p>
    <p><a href="https://www.google.com/maps/search/?api=1&query=${encodeURI(venueLocation)}" style="text-decoration:none; color: rgb(0, 191, 255);" target="_blank">Open in Google Maps</a></p>
  `;

  const venueDetailsEvents = document.createElement('div');
  venueDetailsEvents.classList.add('right-col');
  venueDetailsEvents.innerHTML = `
    <p><a href="https://www.ticketmaster.com/search?q=${encodeURI(venueName)}" style="text-decoration:none; color: rgb(0, 191, 255);" target="_blank">More events at this venue</a></p>
  `;

  // add Venue Details card to DOM
  venueDetailsWrapper.appendChild(venueDetailsLocation);
  venueDetailsWrapper.appendChild(venueDetailsEvents);
  venueDetailsCard.appendChild(venueDetailsTitle);
  venueDetailsCard.appendChild(venueDetailsWrapper);
  document.querySelector('#venueDetails').appendChild(venueDetailsCard);

  // hide the Venue Details card initially
  venueDetailsCard.style.display = 'none';

  const venueToggle = document.querySelector('#venueToggle')
  // add event listener to show/hide Venue Details card on click
  venueToggle.addEventListener('click', () => {
    if (venueDetailsCard.style.display === 'none') {
      venueDetailsCard.style.display = 'block';
      venueToggle.style.display = 'none';
    } else {
      venueDetailsWrapper.style.display = 'none';
      venueDetailsTitle.querySelector('.venue-details-title-arrow').innerHTML = '&#9660;';
    }
  });

};