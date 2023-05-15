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

function getStationUrl() {
  if (location.hostname === "localhost") {
    return "stations.json";
  }
  return "https://mycitibike.nyc3.digitaloceanspaces.com/stations.json";
}

function getFavouriteState() {
  f = localStorage.getItem("showFavourites");
  if (undefined == stations) {
    return false;
  }
  if (f == 1) {
    return true;
  }
  return false;
}
function setShowFavourites() {
  localStorage.setItem("showFavourites", 1);
}
function removeShowFavourites() {
  localStorage.setItem("showFavourites", 0);
}
function getFavourites() {
  stations = localStorage.getItem("mystations");
  if (undefined == stations) {
    return [];
  }
  return JSON.parse(stations);
}
function setFavourites(stations) {
  localStorage.setItem("mystations", JSON.stringify(stations));
}
function clearFavourites() {
  localStorage.removeItem("mystations");
}
function addFavourite(station) {
  f = getFavourites();
  if (f.includes(station)) {
    return;
  }
  f.push(station);
  setFavourites(f);
}
function removeFavourite(station) {
  f = getFavourites();
  if (f.includes(station)) {
    x = f.filter(function (item) {
      return item !== station;
    });
    setFavourites(x);
  }
}
function getDefaultLocation(){
  return  {
    coords: {
        latitude:40.7350569,
        longitude: -74.0052955
    }
  };
}
function sortByDist(rawData, position) {
  lat = position.coords.latitude;
  lon = position.coords.longitude;
  for (var n = 0; n < rawData.length; n++) {
    rawData[n]["dist"] = parseFloat(calcCrow(
      rawData[n]["lat"],
      rawData[n]["lon"],
      lat,
      lon
    ).toFixed(1));
  }
  return sortByKey(rawData, "dist");
}

function renderTable1(rawData) {
  $("table").bootstrapTable({
    data: rawData,
    onClickRow: function (row, $element) {},
  });
}

function operateFormatter1(value, row, index) {
  return [
    '<a class="like" href="javascript:void(0)" title="Like">',
    '<i class="fa fa-heart"></i>',
    "</a>  ",
    '<a class="remove" href="javascript:void(0)" title="Remove">',
    '<i class="fa fa-trash"></i>',
    "</a>",
  ].join("");
}

function renderTable(rawData) {
  $("table").bootstrapTable({
    data: rawData,
    onClickRow: function (i, j) {
      var favouriteState = getFavouriteState();

      if ("selected" === j.attr("class")) {
        j.removeClass("selected");
        if (getFavouriteState()) {
          removeFavourite(i.i);
        } else {
          addFavourite(i.i);
        }
        var $table = $("#stationView");

        if (favouriteState) {
          $table.bootstrapTable("filterBy", {
            i: getFavourites(),
          });
        } else {
        }
      } else {
        j.addClass("selected");
        if (getFavouriteState()) {
          removeFavourite(i.i);
        } else {
          addFavourite(i.i);
        }
        var $table = $("#stationView");
        if (favouriteState) {
          $table.bootstrapTable("filterBy", {
            i: getFavourites(),
          });
        } else {
        }
      }
    },
  });
  var $table = $("#stationView");
  var favouriteState = getFavouriteState();

  if (favouriteState) {
    $table.bootstrapTable("filterBy", {
      i: getFavourites(),
    });
  }
}

function getLocation(cb) {
  function locationError(err) {
    var alert=$('#locationAlert');
    alert.removeClass("d-none");
    return cb(getDefaultLocation());
  }

  function handleLocation(position) {
    return cb(position);
  }
  if (location.hostname === "localhost") {
    return cb(getDefaultLocation());
  }
  navigator.geolocation.getCurrentPosition(handleLocation, locationError);
}

$(document).ready(function () {
  var mystations = getFavourites();
  var favouriteState = getFavouriteState();
  var button = $("#toggleFavourites");

  $.getJSON(getStationUrl(), function (rawData) {
    getLocation(function (position) {
      rawData = sortByDist(rawData, position);
      renderTable(rawData);
      if (favouriteState) {
        button.removeClass("btn-secondary");
        button.addClass("btn-primary");
      }
    });
  });

  //https://examples.bootstrap-table.com/#methods/filter-by.html#view-source
  var $table = $("#stationView");
  var $button = $("#toggleFavourites");
  $(function () {
    $button.click(function () {
      var checkbox = $(this);
      if (checkbox.hasClass("btn-secondary")) {
        checkbox.removeClass("btn-secondary");
        checkbox.addClass("btn-primary");
        setShowFavourites();
        $table.bootstrapTable("filterBy", {
          i: getFavourites(),
        });
      } else {
        checkbox.removeClass("btn-primary");
        checkbox.addClass("btn-secondary");
        removeShowFavourites();
        $table.bootstrapTable("filterBy", {});
      }
    });
  });
});
