const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
 
  country: String,
  location: String,
  stock: {
    type: String,
    enum: ['In Stock', 'Out of Stock'],
    default: 'In Stock'
  },
  pricePak: { type: Number, required: true },
  priceUae: { type: Number, required: true },
  priceUsa: { type: Number, required: true },

  
  category: {
    type: String,
 // یہ فیلڈ ضروری ہے
    enum: ["Khaas Mayar",
"Biscuits & Cookies",
 "Ready-to-Eat",
"Nimco & Dry Snacks",
"Beverages & Cold Drinks",
"Spices & Condiments",
"Noodles & Pasta", 
"All Items"], // Allowed categories
  },
  company: String,
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
