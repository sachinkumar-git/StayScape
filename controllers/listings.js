const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }
  console.log("Current Listing Geometry:", listing.geometry);
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  let url = req.file.path;
  let filename = req.file.filename;
  
  const locationQuery = req.body.listing.location;
  
  let geometry = { type: "Point", coordinates: [77.209, 28.6139] }; 
  
  try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}`, {
          headers: {
              "User-Agent": "Wanderlust-MERN-Project/1.0"
          }
      });
      const geoData = await response.json();
      
      if (geoData && geoData.length > 0) {
          geometry.coordinates = [parseFloat(geoData[0].lon), parseFloat(geoData[0].lat)];
      }
  } catch(err) {
      console.log("Geocoding failed, using default coordinates.", err);
  }

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = {url, filename};
  newListing.geometry = geometry; 
  
  await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  
  let geometry = undefined;
  if(req.body.listing.location) {
      try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(req.body.listing.location)}`, {
              headers: {
                  "User-Agent": "Wanderlust-MERN-Project/1.0"
              }
          });
          const geoData = await response.json();
          if (geoData && geoData.length > 0) {
              geometry = { 
                  type: "Point", 
                  coordinates: [parseFloat(geoData[0].lon), parseFloat(geoData[0].lat)] 
              };
          }
      } catch(err) {
          console.log("Geocoding failed during update.");
      }
  }

  let updatedData = { ...req.body.listing };
  if(geometry) {
      updatedData.geometry = geometry;
  }
  
  let listing = await Listing.findByIdAndUpdate(id, updatedData);
    
  if (typeof req.file !== "undefined") {
      let url = req.file.path;
      let filename = req.file.filename;
      listing.image = { url, filename };
      await listing.save();
  }
    
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};