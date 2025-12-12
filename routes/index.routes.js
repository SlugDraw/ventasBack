const express = require("express");
const router = express.Router();

const mainRouter = require("./main.routes");
const authRouter = require("./auth.routes");
const usersRouter = require("./users.routes");
const productosRouter = require("./productos.routes");
const printersRouter = require("./prints.routes");
const salesRouter = require("./sales.routes");
const dashboardRouter = require("./dashboard.routes");

const API_PREFIX = "/api/v1";

router.use("/", mainRouter);
router.use(`${API_PREFIX}/auth`, authRouter);
router.use(`${API_PREFIX}/users`, usersRouter);
router.use(`${API_PREFIX}/products`, productosRouter);
router.use(`${API_PREFIX}/printers`, printersRouter);
router.use(`${API_PREFIX}/sales`, salesRouter);
router.use(`${API_PREFIX}/dashboard`, dashboardRouter);

module.exports = router;
