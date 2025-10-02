const express = require("express");
const auth = require("../middleware/auth");
const {
  cajasAbiertas,
  cajaUsuario,
  abrirCaja,
  cerrarCaja,
  getCajaById,
} = require("../controllers/sales.controller");

const {
  getTickets,
  getTicketsByIdCaja,
  createTicket,
  getTicketById,
} = require("../controllers/tickets.controller");
const router = express.Router();

const noCache = (req, res, next) => {
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
};

// Todas las cajas abiertas
router.get("/", noCache, auth, function (req, res, next) {
  cajasAbiertas(req, res, next);
});

//Caja abierta del usuario
router.get("/:userId", auth, function (req, res, next) {
  cajaUsuario(req, res, next);
});

// Abrir y cerrar caja

router.post("/", auth, function (req, res, next) {
  abrirCaja(req, res, next);
});

router.post("/close/:id", auth, function (req, res, next) {
  cerrarCaja(req, res, next);
});

//Info y actualización de caja
router.get("/open/:id", auth, function (req, res, next) {
  getCajaById(req, res, next);
});

//rutas de los tickets

router.get("/tickets", auth, function (req, res, next) {
  getTickets(req, res, next);
});

router.post("/ticket", auth, function (req, res, next) {
  createTicket(req, res, next);
});

router.get("/tickets/:idCaja", auth, function (req, res, next) {
  getTicketsByIdCaja(req, res, next);
});

router.get("/ticket/:idTicket", noCache, auth, function (req, res, next) {
  getTicketById(req, res, next);
});

module.exports = router;
