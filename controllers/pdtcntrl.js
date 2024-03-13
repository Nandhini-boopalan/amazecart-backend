const Product = require('../models/pdtModel');
const ErrorHandler=require('../utils/errorHandler')
const catchAsyncError=require('../middlewares/catchAsyncerror')
const APIFeatures=require('../utils/api features')

//get product-  /api/v1/product
exports.getproducts = async(req, res, next) => {
    const resPerPage=2
    const apiFeatures = new APIFeatures(Product.find(), req.query)
    apiFeatures.search().filter().paginate(resPerPage)
const products = await apiFeatures.query; // Accessing apiFeatures.query, not APIFeatures.query

    res.status(200).json({
        success: true,
        count:products.length,
        products
    });
};

// Create product - /api/v1/product/new
exports.newProduct = catchAsyncError(async (req, res, next) => {
    try {
        req.body.user=req.user.id
        console.log("Request Body:", req.body); // Log the request body for debugging

        const product = await Product.create(req.body);
        console.log("Created Product:", product); // Log the created product for debugging

        res.status(201).json({
            success: true,
            product
        });
    } catch (err) {
        // Handle any errors that occur during product creation
        console.error("Error Creating Product:", err); // Log the error for debugging

        res.status(500).json({
            success: false,
            message: "Failed to create product"
        });
    }
});


// get single product- 
exports.getSingleProduct=async(req,res,next)=>{
    const product=await Product.findById(req.params.id)

    if(!product){
        return next(new ErrorHandler('product not found',400))
        
    }
    res.status(201).json({
        success:true,
        product
    })

}

//update product- /api/v1/product/:id
exports.updateProduct = async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true, 
        product
    });
};


// delete product-  /api/v1/product/:id
exports.deleteProduct = async (req, res, next) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        await Product.deleteOne({ _id: req.params.id });

        res.status(200).json({
            success: true,
            message: "Product deleted"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to delete product"
        });
    }
};

//create Review-api/v1/review
exports.createReview = catchAsyncError(async (req, res, next) => {
    const { productId, rating, comment } = req.body;

    // Check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorHandler(`Product not found with this id: ${productId}`, 404));
    }

    // Check if the user has already reviewed the product
    const existingReviewIndex = product.reviews.findIndex(review => review.user.toString() === req.user.id.toString());
    if (existingReviewIndex !== -1) {
        // If the user has already reviewed, update the review
        product.reviews[existingReviewIndex].comment = comment;
        product.reviews[existingReviewIndex].rating = rating;
    } else {
        // If the user hasn't reviewed, create a new review
        product.reviews.push({
            user: req.user.id,
            rating,
            comment
        });
        // Increment the number of reviews
        product.numOfReviews++;
    }

    // Recalculate average rating
    const totalRating = product.reviews.reduce((acc, review) => acc + review.rating, 0);
    product.ratings = totalRating / product.reviews.length || 0; // Avoid NaN if there are no reviews

    // Save the product
    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true
    });
});


//get reviews-api/v1/reviews?id={productId}
exports.getReviews=catchAsyncError(async (req, res, next) => {
    const product=await Product.findById(req.query.id)
    res.status(200).json({
     success:true,
     reviews:product.reviews
    })
})

//delete review-api/v1/review
exports.deleteReview = catchAsyncError(async (req, res, next) => {
    const product = await Product.findById(req.query.productId);
    if (!product) {
        return next(new ErrorHandler(`Product not found with this id: ${req.query.productId}`, 404));
    }

    // Filter out the review to be deleted
    const updatedReviews = product.reviews.filter(review => review._id.toString() !== req.query.id.toString());

    // Update the number of reviews
    const numOfReviews = updatedReviews.length;

    // Recalculate the total rating
    const totalRating = updatedReviews.reduce((acc, review) => acc + review.rating, 0);
    const ratings = totalRating / numOfReviews || 0;

    // Update the product with the modified reviews, numOfReviews, and ratings
    await Product.findByIdAndUpdate(req.query.productId, {
        reviews: updatedReviews,
        numOfReviews,
        ratings
    });

    res.status(200).json({
        success: true
    });
});
