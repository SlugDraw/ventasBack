const Impresora = require("../models/Impresoras");

exports.getImpresoras = async (req, res) => {
  try {
    const impresoras = await Impresora.find();
    res.json(impresoras);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createImpresora = async (req, res) => {
  try {
    const nuevaImpresora = new Impresora(req.body);
    const impresoraGuardada = await nuevaImpresora.save();
    res.status(201).json(impresoraGuardada);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateImpresora = async (req, res) => {
  try {
    const impresoraActualizada = await Impresora.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!impresoraActualizada)
      return res.status(404).json({ message: "Impresora no encontrada" });
    res.json(impresoraActualizada);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
