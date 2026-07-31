function initTravellerMap() {

  const mapElement = document.getElementById("travellerMap");

  if (!mapElement || !window.google?.maps) {

    return;

  }

  const edmonton = {

    lat: 53.5461,

    lng: -113.4938

  };

  new google.maps.Map(mapElement, {

    center: edmonton,

    zoom: 10

  });

}

window.initTravellerMap = initTravellerMap;