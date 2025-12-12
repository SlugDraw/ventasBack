const express = require("express");
const auth = require("../middleware/auth");
const productoController = require("../controllers/productos.controller");
const router = express.Router();

router.get("/", auth, function (req, res, next) {
  productoController.getProductos(req, res, next);
});

router.get("/:id", auth, function (req, res, next) {
  productoController.getProductoById(req, res, next);
});

router.post("/", auth, function (req, res, next) {
  productoController.createProducto(req, res, next);
});

router.put("/:id", auth, function (req, res, next) {
  productoController.updateProducto(req, res, next);
});

router.delete("/:id", auth, function (req, res, next) {
  productoController.deleteProducto(req, res, next);
});

module.exports = router;
