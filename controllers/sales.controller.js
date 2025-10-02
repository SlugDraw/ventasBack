const Sales = require("../models/Sales");

const cajasAbiertas = async (req, res) => {
  try {
    const abiertas = await Sales.find({ status: "abierta" }).populate(
      "usuario"
    );
    res.json(abiertas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cajaUsuario = async (req, res) => {
  try {
    const caja = await Sales.findOne({
      usuario: req.params.userId,
      status: "abierta",
    });

    if (!caja)
      return res
        .status(204)
        .json({ message: "No hay caja abierta para este usuario" });
    res.json(caja);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const abrirCaja = async (req, res) => {
  try {
    const nuevaCaja = new Sales(req.body);
    const cajaGuardada = await nuevaCaja.save();
    res.status(201).json(cajaGuardada);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const cerrarCaja = async (req, res) => {
  try {
    const cajaCerrada = await Sales.findByIdAndUpdate(
      req.params.id,
      { status: "cerrada", cierre: new Date() },
      { new: true, runValidators: true }
    );
    if (!cajaCerrada)
      return res.status(404).json({ message: "Caja no encontrada" });
    res.json(cajaCerrada);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getCajaById = async (req, res) => {
  console.log(req.params);
  try {
    const caja = await Sales.findById(req.params.id);
    if (!caja) return res.status(404).json({ message: "Caja no encontrada" });
    res.json(caja);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  cajasAbiertas,
  abrirCaja,
  cerrarCaja,
  cajaUsuario,
  getCajaById,
};
