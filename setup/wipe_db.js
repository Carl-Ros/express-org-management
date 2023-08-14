require('dotenv').config({ path: '../.env'});
require("../db.js");

const {Company} = require('../models/company')
const {Department} = require('../models/department')
const User = require('../models/user')
const Geolocation = require('../models/geolocation')




const modelsToDrop = [Company, Department, User, Geolocation];

(async () => {
    for (const model of modelsToDrop) {
        try {
            await model.collection.drop();
            console.log(`Collection for ${model.modelName} dropped successfully.`);
        } catch (error) {
            console.error(`Error dropping collection for ${model.modelName}:`, error);
        }
    }
})();