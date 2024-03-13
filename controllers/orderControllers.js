const catchAsyncerror = require('../middlewares/catchAsyncerror')
const catchAsyncError=require('../middlewares/catchAsyncerror')
const Order=require('../models/orderModel')
const ErrorHandler = require('../utils/errorHandler')
const Product=require('../models/pdtModel')

//create new order-/api/v1/order/new
exports.newOrder=catchAsyncError(async(req,res,next)=>{
    const {
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo
    }=req.body

    const order=await Order.create({
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt:Date.now(),
        user:req.user.id
    })
    res.status(200).json({
        success:true,
        order
    })

})

//get single order-api/v1/order/:id
exports.getSingleOrder=catchAsyncerror(async(req,res,next)=>{
    const order=await Order.findById(req.params.id).populate('user','name email')
    if(!order){
        return next(new ErrorHandler(`order not found with this id ${req.params.id}`,404))
    }

    res.status(200).json({
        success:true,
        order
    })
})

//get loggedin user order-/api/v1/myorders

exports.myOrders = catchAsyncError(async (req, res, next) => {
    // Find orders associated with the authenticated user
    const orders = await Order.find({ user: req.user.id });

    res.status(200).json({
        success: true,
        orders: orders // You can directly pass 'orders' as it has the same name
    });
});


//admin:get all orders-api/v1/orders
exports.orders=catchAsyncError(async (req, res, next) => {
    const orders = await Order.find();

    let totalAmount=0

    orders.forEach(order => {
        totalAmount +=order.totalPrice
    });

    res.status(200).json({
        success: true,
        totalAmount,
        orders: orders // You can directly pass 'orders' as it has the same name
    });
})

//admin:update order /order status-api/v1/order:id
exports.updateOrder = catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id)
    //console.log(order)
    if (!order) {
        return next(new ErrorHandler('Order not found', 404));
    }
    if (order.orderStatus == 'Delivered') {
        return next(new ErrorHandler('Order has already been delivered', 400))
    }
    // Check if orderStatus is provided in the request body
    if (!req.body.orderStatus) {
        return next(new ErrorHandler('Order status is required', 400));
    }

    // Updating the product stock for each product item
    for (const orderItem of order.orderItems) {
        await updateStock(orderItem.product, orderItem.quantity)
    }

    order.orderStatus = req.body.orderStatus
    order.deliveredAt = Date.now()
    await order.save()

    res.status(200).json({
        success: true
    })
})

async function updateStock(productId, quantity) {
    const product = await Product.findById(productId)
    product.stock -= quantity
    await product.save({ validateBeforeSave: false })
}

//admin:Delete order-api/v1/order/:id
exports.deleteOrder = catchAsyncError(async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return next(new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404));
        }
        
        await order.deleteOne(); // Use deleteOne() to remove the order
        
        res.status(200).json({
            success: true,
            message: "Order deleted successfully"
        });
    } catch (error) {
        return next(new ErrorHandler(`Error deleting order: ${error.message}`, 500));
    }
});


