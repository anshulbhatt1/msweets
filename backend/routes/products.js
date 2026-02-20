const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// GET /api/products - list all active products (with filters)
router.get('/', productController.getProducts);

// GET /api/products/categories - get all categories
router.get('/categories', productController.getCategories);

// GET /api/products/:id - get single product
router.get('/:id', productController.getProduct);

module.exports = router;
