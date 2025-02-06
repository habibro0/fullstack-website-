const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  productId: String,
  quantity: Number,
  price: Number,
});

module.exports = mongoose.model('Cart', cartSchema);

