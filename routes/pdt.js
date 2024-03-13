const express = require('express');
const { getproducts, newProduct, getSingleProduct, updateProduct, deleteProduct, createReview, getReviews, deleteReview } = require('../controllers/pdtcntrl'); 
const router = express.Router();
const {isAuthenticatedUser,authorizeRoles}=require('../middlewares/authenticate')

router.route('/product').get(isAuthenticatedUser,getproducts);

router.route('/product/:id')
                       .get(getSingleProduct)
                       .put(updateProduct)
                       .delete(deleteProduct); 
router.route('/review').put(isAuthenticatedUser,createReview)                 
                       .delete(deleteReview)   
router.route('/reviews').get(getReviews)     

//admin routes                       
 router.route('admin/product/new').post(isAuthenticatedUser,authorizeRoles('admin'), newProduct);                       

module.exports = router;
