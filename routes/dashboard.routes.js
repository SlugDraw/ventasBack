const express = require("express");
const auth = require("../middleware/auth");
const dashboardController = require("../controllers/dashboard.controller");
const router = express.Router();

router.get("/totalAyer", auth, function (req, res, next) {
  dashboardController.getTotalVentasAyer(req, res, next);
});

router.get("/totalMes", auth, function (req, res, next) {
  dashboardController.getTotalVentaMes(req, res, next);
});

router.get("/totalMeses", auth, function (req, res, next) {
  dashboardController.getTotalVentaMeses(req, res, next);
});

router.get("/ventasEmpleados", auth, function (req, res, next) {
  dashboardController.getVentasByDates(req, res, next);
});

module.exports = router;
