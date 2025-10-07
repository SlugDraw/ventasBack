const express = require("express");
const auth = require("../middleware/auth");
const {
  cajasAbiertas,
  cajaUsuario,
  abrirCaja,
  cerrarCaja,
  getCajaById,
  getTickets,
  getTicketsByIdCaja,
  createTicket,
  getTicketById,
  getTicketsByUserAndDates,
  getAllTicketsBydDates,
} = require("../controllers/sales.controller");

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

router.get("/", noCache, auth, function (req, res, next) {
  cajasAbiertas(req, res, next);
});

router.get("/:userId", noCache, auth, function (req, res, next) {
  cajaUsuario(req, res, next);
});

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

//Rutas de los tickets
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

//Rutas de historial de Tickets (info que trae tickets y cajas

router.get("/ticket/user/:id", auth, function (req, res, next) {
  getTicketsByUserAndDates(req, res, next);
});

router.get("/tickets/admin/all", auth, function (req, res, next) {
  getAllTicketsBydDates(req, res, next);
});

module.exports = router;
