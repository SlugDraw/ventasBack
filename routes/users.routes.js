const express = require("express");
const auth = require("../middleware/auth");
const userController = require("../controllers/usuarios.controller");
const router = express.Router();

/* GET users listing. */
router.get("/", auth, function (req, res, next) {
  userController.getUsuarios(req, res, next);
});

router.delete("/:username", auth, function (req, res, next) {
  userController.deleteUsuario(req, res, next);
});

router.put("/:id", auth, function (req, res, next) {
  userController.updateUsuario(req, res, next);
});

module.exports = router;
