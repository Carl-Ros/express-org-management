const Geolocation = require("../../models/geolocation")
const assert = require("assert");
const { describe, it, afterEach } = require("node:test");
require("../../db.js");


const cleanupEntries = [];

function addToCleanup(model, objectId) {
    cleanupEntries.push({ model, objectId })
}

function clearCleanup() {
    cleanupEntries.splice(0, cleanupEntries.length)
}

describe("Geolocation", () => {

    afterEach(async () => {
        // Clean up the test objects
        await Promise.all(cleanupEntries.map(({ model, objectId }) => model.findByIdAndDelete(objectId)));
        clearCleanup();
    });

    it("Should have additional geocoding properties when created", async () => {
        const locationData = {
            latitude: 59.327,
            longitude: 13.035261718750014,
        };

        const newLocation = new Geolocation(locationData);
        const savedLocation = await newLocation.save();
        addToCleanup(Geolocation, savedLocation._id);
        assert.equal(savedLocation.country, 'Sweden');
        assert.equal(savedLocation.countryCodeAlpha2, 'SE');
    });
});