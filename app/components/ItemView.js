import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import template from '../templates/item.jst';

export default Marionette.View.extend({
    template: template,

    dataCollection: Backbone.Collection.extend({
        url: 'https://data.police.uk/api/crimes-street/all-crime'
    }),

    markers: [],

    initialize: function() {
        this.collection = new this.dataCollection();

        String.prototype.formatTitle = function() {
            var removeDash = this.replace(/-/g,' ');
            return removeDash.charAt(0).toUpperCase() + removeDash.slice(1);
        };
    },

    onRender: function() {
        this.initializeMap();
    },

    initializeMap: function() {
        // center map to Syzygy office
        this.mapOptions = {
            center: {lat: 51.5203, lng: -0.1202},
            zoom: 15
        };

        this.map = new google.maps.Map(this.$el.find('#map')[0],
                                        this.mapOptions);

        var bounds = {
            north: 51.523,
            south: 51.516,
            east: -0.1119,
            west: -0.1250
        };

        this.rectangle = new google.maps.Rectangle({
            bounds: bounds,
            draggable: true
        });

        this.rectangle.setMap(this.map);
        this.rectangle.addListener('dragend', _.bind(
            this.getRectangleCoordinates, this));

        // get rectangle coordinates on first load
        this.getRectangleCoordinates();

        this.infoWindow = new google.maps.InfoWindow();
    },

    getRectangleCoordinates: function() {
        // get coordinates for the four corners of the rectangle
        var rectangleBounds = this.rectangle.getBounds(),
            ne = rectangleBounds.getNorthEast(),
            sw = rectangleBounds.getSouthWest(),
            nw = new google.maps.LatLng(ne.lat(), sw.lng()),
            se = new google.maps.LatLng(sw.lat(), ne.lng()),
            cornersArr = [],
            polyArr = [];

        cornersArr.push(nw, ne, se, sw);

        // build format API expects for poly
        _.each(cornersArr, function(corner) {
            var coordinates = corner.lat() + ',' + corner.lng();
            polyArr.push(coordinates);
        });

        var poly = polyArr.join(':');
        this.getCrimeData(poly, '2017-09');
    },

    getCrimeData: function(poly, date) {
        this.collection.fetch({
            data: { poly: poly, date: date },
            processData: true
        }).done(_.bind(this.renderCrimeData, this));
    },

    renderCrimeData: function() {
        // clear previous markers
        this.clearMapMarkers();

        this.collection.each(_.bind(function(crime) {
            var pos = new google.maps.LatLng(
                    crime.get('location').latitude,
                    crime.get('location').longitude
                ),
                marker = new google.maps.Marker({
                    position: pos,
                    map: this.map,
                    title: crime.get('category').formatTitle()
                });

            this.markers.push(marker);

            marker.addListener('click', _.bind(
                this.showInfoWindow, this, marker, crime
            ));
        }, this));
    },

    showInfoWindow: function(marker, crime) {
        var content = crime.get('category').formatTitle() + '<br />' +
                        crime.get('month') + ' ' +
                        crime.get('location').street.name;

        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, marker);
    },

    clearMapMarkers: function() {
        for (var i = 0; i < this.markers.length; i++) {
            this.markers[i].setMap(null);
        }
        this.markers = [];
    }

});
