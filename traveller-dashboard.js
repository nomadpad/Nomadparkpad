function initTravellerMap() {

  const mapElement = document.getElementById("travellerMap");

  if (!mapElement || !window.google?.maps) {

    return;

  }

  const fallbackLocation = {

    lat: 53.5461,

    lng: -113.4938

  };

  const map = new google.maps.Map(mapElement, {

    center: fallbackLocation,

    zoom: 10

  });

  if (!navigator.geolocation) {

    return;

  }

  navigator.geolocation.getCurrentPosition(

    (position) => {

      const travellerLocation = {

        lat: position.coords.latitude,

        lng: position.coords.longitude

      };

      map.setCenter(travellerLocation);

      map.setZoom(11);

    },

    () => {

      console.warn("Traveller location could not be loaded.");

    }

  );

}

window.initTravellerMap = initTravellerMap;