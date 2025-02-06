const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  address: { type: String, required: true },
  city: { type: String, required: true },
  zip: { type: String, required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true }, // Referencing Listing collection
      quantity: { type: Number, required: true }
    }
  ],
  status: { type: String, default: 'Pending' }, // Order status
  createdAt: { type: Date, default: Date.now } // Order creation time
});

// Adding a method to populate product details in the order
orderSchema.methods.populateProductDetails = async function() {
  for (let item of this.items) {
    item.productId = await item.populate('productId', 'title price'); // Populating the title and price of product
  }
};

module.exports = mongoose.model('Order', orderSchema);
