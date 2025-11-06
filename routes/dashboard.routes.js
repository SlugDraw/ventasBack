const express = require("express");
const auth = require("../middleware/auth");
const dashboardController = require("../controllers/dashboard.controller");
const router = express.Router();

router.get("/totalAyer", auth, function (req, res, next) {
  dashboardController.getTotalVentasAyer(res, req, next);
});

router.get("/totalMes", auth, function (req, res, next) {
  dashboardController.getTotalVentaMes(res, req, next);
});

router.get("/totalMeses", auth, function (req, res, next) {
  dashboardController.getTotalVentaMeses(res, req, next);
});

router.get("/ventasEmpleados", auth, function (req, res, next) {
  dashboardController.getVentasByDates(res, req, next);
});

module.exports = router;
