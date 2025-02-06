const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const multer = require("multer");
const Order = require('./models/order');
const bodyParser = require('body-parser');
const ExpressError = require("./utils/ExpressError.js")


// MongoDB URL
const MONGO_URL = "mongodb://127.0.0.1:27017/KhasMayar";

// Connect to DB
async function main() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("connected to DB");
  } catch (err) {
    console.log("DB Connection Error:", err);
  }
}

main();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true })); // یہ ضروری ہے!

app.use(express.json()); // To parse JSON bodies

app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "/public")));

// Set up multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '/public/images'));  // Image folder path
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Adds timestamp to image name
  }
});

const upload = multer({ storage: storage });


app.get('/api/country', (req, res) => {
  // If there's a session or user-specific data, you can get it here
  const selectedCountry = req.session ? req.session.selectedCountry : 'Not selected';
  res.json({ selectedCountry });
});

app.post('/api/country', (req, res) => {
  const { country } = req.body;
  let currencyField = "";

  if (country === "Pakistan") {
      currencyField = "pricePak";
  } else if (country === "UAE") {
      currencyField = "priceUae";
  } else if (country === "USA") {
      currencyField = "priceUsa";
  } else {
      return res.json({ error: "Invalid country", prices: "Price Not Available" });
  }

  Listing.find({}, { title: 1, [currencyField]: 1 }) // صرف ٹائٹل اور متعلقہ کرنسی فیلڈ لائیں
      .then(listings => {
          const prices = listings.map(item => ({
              id: item._id,
              title: item.title,
              price: item[currencyField] || "Price Not Available"
          }));
          res.json({ country, prices });
      })
      .catch(err => res.status(500).json({ error: "Database error" }));
});


// Route to set selected country
app.post('/api/country', (req, res) => {
  const { country } = req.body;
  
  // Save the selected country in the session
  if (req.session) {
      req.session.selectedCountry = country;
  }

  // Respond with the selected country
  res.json({ message: 'Country saved', country });
});


// Index Route
app.get("/listings", async (req, res) => {
  try {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { 
      allListings, 
      showSlidebar: true // Sidebar ko enable kiya
    });
  } catch (err) {
    console.log("Error fetching listings:", err);
    res.status(500).send("Server Error");
  }
});

// New Route (form to create a new listing)
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

// Show Route (for each listing)
app.get("/listings/:id", async (req, res) => {
  let { id } = req.params;
  try {
    const listing = await Listing.findById(id);

    // Ensure the location is properly formatted if it is an array
    if (Array.isArray(listing.location)) {
      listing.location = listing.location.join(', ');  // Convert array to a string
    }

    res.render("listings/show.ejs", { listing });
  } catch (err) {
    console.log("Error fetching listing:", err);
    res.status(500).send("Server Error");
  }
});

// Create Route (save a new listing to DB)
app.post("/listings", upload.single('image'), async (req, res) => {
  const newListing = new Listing(req.body.listing);

  // If an image is uploaded, save the path of the image
  if (req.file) {
    newListing.image = '/images/' + req.file.filename; // Save the path of the uploaded image
  }

  try {
    await newListing.save();
    res.redirect("/listings");
  } catch (err) {
    console.log("Error saving listing:", err);
    res.status(500).send("Server Error");
  }
});

app.get("/listings/:id", async (req, res) => {
  let { id } = req.params;
  try {
    const listing = await Listing.findById(id);

    // Ensure the location is properly formatted if it is an array
    if (Array.isArray(listing.location)) {
      listing.location = listing.location.join(', ');  // Convert array to a string
    }

    res.render("listings/show.ejs", { listing });
  } catch (err) {
    console.log("Error fetching listing:", err);
    res.status(500).send("Server Error");
  }
});

// Edit Route (show the edit form)
app.get("/listings/:id/edit", async (req, res) => {
  let { id } = req.params;
  try {
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
  } catch (err) {
    console.log("Error fetching listing for edit:", err);
    res.status(500).send("Server Error");
  }
});

// Update Route (update an existing listing)
app.put("/listings/:id", upload.single('image'), async (req, res) => {
  let { id } = req.params;

  console.log("Request body:", req.body); // Debugging ke liye

  if (Array.isArray(req.body.listing.location)) {
    req.body.listing.location = req.body.listing.location.join(', '); 
  }

  if (req.file) {
    req.body.listing.image = '/images/' + req.file.filename;
  }

  try {
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
  } catch (err) {
    console.log("Error updating listing:", err);
    res.status(500).send("Error updating listing");
  }
});

// Delete Route (delete a listing)
app.delete("/listings/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
  } catch (err) {
    console.log("Error deleting listing:", err);
    res.status(500).send("Server Error");
  }
});

// Index Route (Modified to handle category filter)
app.get("/listings", async (req, res) => {
  try {
    const category = req.query.category || "All Items";
    let listings = category !== "All Items" ? await Listing.find({ category }) : await Listing.find({});
    res.render("listings/index", { allListings: listings, selectedCategory: category });
  } catch (err) {
    console.log("Error fetching listings:", err);
    res.status(500).send("Internal Server Error");
  }
});

// New Listing Form
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

// Create Listing
app.post("/listings", upload.single('image'), async (req, res) => {
  try {
    console.log("Received Data:", req.body);
    if (!req.body.listing || !req.body.listing.category) {
      throw new Error("Category is required");
    }
    const newListing = new Listing(req.body.listing);
    if (req.file) {
      newListing.image = '/images/' + req.file.filename;
    }
    await newListing.save();
    res.redirect("/listings");
  } catch (err) {
    console.log("Error saving listing:", err);
    res.status(400).send("Listing validation failed");
  }
});

app.get("/listings", async (req, res) => {
  const { category } = req.query;  // Get category from URL query parameter

  if (category && category !== "All Items") {
    // If a category is selected, find listings that match the selected category
    const filteredListings = await Listing.find({ category: category });
    res.render("listings/index", { allListings: filteredListings, selectedCategory: category });
  } else {
    // If no category is selected, or "All Items" is selected, show all listings
    const allListings = await Listing.find({});
    res.render("listings/index", { allListings, selectedCategory: "All Items" });
  }
});


// Cart logic: Using a simple array for now (can be stored in session or DB)
let cart = [];

// Add to Cart
app.post('/cart/add', (req, res) => {
  try {
    const { productId } = req.body; // Product ID from the form
    const existingProduct = cart.find(item => item.productId === productId);

    if (existingProduct) {
      existingProduct.quantity += 1;  // Increase quantity if product already exists
    } else {
      cart.push({ productId, quantity: 1 });  // Add new product to cart
    }

    // Redirect to /cart after adding the item to cart
    res.redirect('/cart');
  } catch (err) {
    console.log("Error adding to cart:", err);
    res.status(500).send("Server Error");
  }
});

// View Cart
app.get('/cart', async (req, res) => {
  try {
    // Fetch details of items in cart
    const cartDetails = await Promise.all(
      cart.map(async (item) => {
        const product = await Listing.findById(item.productId);
        return { ...product.toObject(), quantity: item.quantity };
      })
    );
    res.render('listings/cart.ejs', { cartDetails });
  } catch (err) {
    console.log("Error fetching cart:", err);
    res.status(500).send("Server Error");
  }
});
// Update Cart
app.post('/cart/update', async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ message: 'Invalid data provided.' });
    }

    const cartItem = cart.find(item => item.productId === productId);
    if (!cartItem) {
      return res.status(404).json({ message: 'Product not found in cart.' });
    }

    cartItem.quantity = quantity;

    const product = await Listing.findById(productId);
    const totalPrice = product.price * cartItem.quantity;

    let totalCartPrice = 0;
    for (let item of cart) {
      const product = await Listing.findById(item.productId);
      totalCartPrice += product.price * item.quantity;
    }

    res.json({ quantity: cartItem.quantity, totalPrice, totalCartPrice });
  } catch (err) {
    console.log("Error updating cart:", err);
    res.status(500).send("Server Error");
  }
});

// Remove from Cart
app.post('/cart/remove', (req, res) => {
  try {
    const { productId } = req.body;
    cart = cart.filter(item => item.productId !== productId);
    res.redirect('/cart');
  } catch (err) {
    console.log("Error removing from cart:", err);
    res.status(500).send("Server Error");
  }
});

// Search Route (search listings by query)
app.get("/search", async (req, res) => {
  const { query } = req.query;  // Get search query from URL

  if (query) {
    const searchResults = await Listing.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
        { country: { $regex: query, $options: 'i' } }
      ]
    });
    res.render("listings/index.ejs", { allListings: searchResults });
  } else {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
  }
});

// Checkout Page
app.get('/checkout', (req, res) => {
  res.render('listings/checkout.ejs');
});

// Process Checkout
app.post('/checkout', async (req, res) => {
  const { address, city, zip } = req.body;

  try {
    const newOrder = new Order({
      address,
      city,
      zip,
      items: cart, // Add cart items to order
    });
    await newOrder.save();

    cart = []; // Clear cart after order

    res.redirect(`/order/${newOrder._id}`);
  } catch (err) {
    console.log("Error processing checkout:", err);
    res.status(500).send("Server Error");
  }
});

// View Order Details
app.get('/order/:id', async (req, res) => {
  const { id } = req.params;

  // آرڈر لائیں
  const order = await Order.findById(id).populate('items.productId');

  if (!order) {
    return res.status(404).send("Order not found");
  }

  // اگر 24 گھنٹے مکمل ہو گئے تو آرڈر کینسل کر دیں
  const now = new Date();
  const expiryTime = new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000;

  if (now.getTime() > expiryTime && order.status === "Pending") {
    order.status = "Cancelled";
    await order.save();
  }

  res.render('listings/orderDetails.ejs', { order });
});

// Search Route
// Search Route
app.all("*",(req,res,next) => {
  next(new ExpressError(404, "Not Found"));
})

app.use((err,req,res,next) => {
  let{statuscode= 500,message="something went wrong"} = err;
  res.render("error.ejs",message,{statuscode:statuscode})
})

// Start server
app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
