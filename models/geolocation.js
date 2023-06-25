const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const GeolocationSchema = new Schema({
  latitude: { type: String, required: true },
  longitude: { type: String, required: true },
  //countryCodeAlpha2: { type: String, enum: ["SE", "DK", "NO", "FI"]},
  //countryCodeAlpha3: { type: String, enum: ["SWE", "DEN", "NOR", "FIN"]},
  city: { type: String },
  primaryLanguage: { type: String }
});

// Virtual for Geolocation's URL
GeolocationSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/catalog/Geolocation/${this._id}`;
});


// Could probably have a lot of virutal data.. integrate with google
// https://developers.google.com/maps/documentation/geocoding/client-library
GeolocationSchema.virtual("countryCodeAlpha3").get(function () {
    // We don't use an arrow function as we'll need the this object

    return `/catalog/Geolocation/${this._id}`;
  });
  

// Export model
module.exports = mongoose.model("Geolocation", GeolocationSchema);
