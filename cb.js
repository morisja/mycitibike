//https://stackoverflow.com/a/18883819
//This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
function calcCrow(lat1, lon1, lat2, lon2) {
  var R = 6371; // km
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}
// Converts numeric degrees to radians
function toRad(Value) {
  return (Value * Math.PI) / 180;
}

function sortByKey(array, key) {
  return array.sort(function (a, b) {
    var x = a[key];
    var y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

function getFavourites() {
  stations = localStorage["mystations"];
  if (undefined == stations) {
    return [];
  }
  return JSON.parse(stations);
}
function setFavourites(stations) {
  localStorage["mystations"] = JSON.stringify(stations);
}
function clearFavourites() {
  localStorage.removeItem("mystations");
}
function rowStyle(row, index) {
  var classes = ["bg-blue", "bg-green", "bg-orange", "bg-yellow", "bg-red"];

  if (index % 2 === 0 && index / 2 < classes.length) {
    return {
      classes: classes[index / 2],
    };
  }
  return {
    css: {
      color: "blue",
    },
  };
}

function getStationUrl() {
  if (location.hostname === "localhost") {
    console.log("local");
    return "stations.json";
  }
  return "https://mycitibike.nyc3.cdn.digitaloceanspaces.com/stations.json";
}

function rowStyle(row, index) {
  console.log(index);
  var classes = ["bg-blue", "bg-green", "bg-orange", "bg-yellow", "bg-red"];

  if (index % 2 === 0 && index / 2 < classes.length) {
    return {
      classes: classes[index / 2],
    };
  }
  return {
    css: {
      color: "blue",
    },
  };
}

$(document).ready(function () {
  mystations = getFavourites();
  $.getJSON(getStationUrl(), function (rawData) {
    navigator.geolocation.getCurrentPosition(function (position) {
      lat = position.coords.latitude;
      lon = position.coords.longitude;
      for (var n = 0; n < rawData.length; n++) {
        rawData[n]["dist"] = calcCrow(
          rawData[n]["lat"],
          rawData[n]["lon"],
          lat,
          lon
        ).toFixed(1);
      }
      rawData = sortByKey(rawData, "dist").slice(0, 10);
      if (mystations.length > 0) {
        rawData = rawData.filter((item) =>
          mystations.includes(item.station_id)
        );
      }
      $("table").bootstrapTable({
        data: rawData,
      });
      console.log("rendered");
    });
  });
});
