const products = require('../data/products.json');
const Product = require('../models/pdtModel');
const dotenv = require('dotenv');
const connectedDatabase = require('../config/database');

dotenv.config({ path: 'backend/config/config.env' });
connectedDatabase();

const seedProducts = async () => {
    try {
        await Product.deleteMany();
        console.log("All products deleted");
        await Product.insertMany(products);
        console.log("All products added");
    } catch (error) { // Catch the error object
        console.log(error.message);
    }
    process.exit()
}

seedProducts(); 
