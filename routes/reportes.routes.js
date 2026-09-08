const express = require("express");
const auth = require("../middleware/auth");
const {
  getVentasTotalesPorFecha,
  getVentasPorEmpleado,
} = require("../controllers/reportes.controller");

const router = express.Router();

router.post("/ventas/fecha", auth, getVentasTotalesPorFecha);
router.post("/ventas/empleado", auth, getVentasPorEmpleado);

module.exports = router;
