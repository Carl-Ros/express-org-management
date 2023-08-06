const mongoose = require("mongoose");
const { Client } = require("@googlemaps/google-maps-services-js");
const client = new Client({});
require('dotenv').config();

const Schema = mongoose.Schema;

const GeolocationSchema = new Schema({
  latitude: { type: String, required: true },
  longitude: { type: String, required: true }, 
  country: { type: String}, 
  countryCodeAlpha2: { type: String, min:2, max:2}, 
  streetAddress: { type: String}, 
  city: { type: String}, 
});

async function _getLocationDetails(lat, lng) {
  const response = await client.reverseGeocode({
      params: {
          latlng: [lat, lng],
          key: process.env.GOOGLE_MAPS_API_KEY
      }
  });

  const result = {};

  const locality = response.data.results.find(({ types }) => types.includes('locality'));
  if (locality) {
      result.city = locality.address_components.find(({ types }) => types.includes('locality'))?.long_name;
  }

  const country = response.data.results.find(({ types }) => types.includes('country'));
  if (country) {
      const countryCodeComponent = country.address_components.find(({ types }) => types.includes('country'));
      result.countryCode = countryCodeComponent?.short_name;
      result.country = countryCodeComponent?.long_name;
  }

  const street = response.data.results.find(({ types }) => types.includes('route'));
  if (street) {
      result.streetAddress = street.address_components.find(({ types }) => types.includes('route'))?.long_name;
  }
  return result;
}


GeolocationSchema.virtual("url").get(function () {
  return `/catalog/Geolocation/${this._id}`;
});

GeolocationSchema.pre('save', async function (next) {
  if (!this.isNew) {
    return next();
  }
  const location = await _getLocationDetails(this.latitude, this.longitude);
  this.country = location?.country;
  this.countryCodeAlpha2 = location?.countryCode;
  this.streetAddress = location?.streetAddress;
  this.city = location?.city;
});


// Export model
module.exports = mongoose.model("Geolocation", GeolocationSchema);
