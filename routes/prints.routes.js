const express = require("express");
const auth = require("../middleware/auth");
const printsController = require("../controllers/impresoras.controller");
const router = express.Router();

router.get("/", auth, function (req, res, next) {
  printsController.getImpresoras(req, res, next);
});

router.post("/", auth, function (req, res, next) {
  printsController.createImpresora(req, res, next);
});

router.put("/:id", auth, function (req, res, next) {
  printsController.updateImpresora(req, res, next);
});

module.exports = router;
