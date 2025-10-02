const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");
// Obtener todos los usuarios
exports.getUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un usuario por ID
exports.getUsuarioByUsername = async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ username: req.params.username });
    if (!usuario)
      return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar un usuario existente
exports.updateUsuario = async (req, res) => {
  try {
    if (req.body?.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!usuarioActualizado)
      return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(usuarioActualizado);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar un usuario
exports.deleteUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ username: req.params.username });
    const usuarioEliminado = await Usuario.findByIdAndDelete(usuario.id);
    if (!usuarioEliminado)
      return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ message: "Usuario eliminado" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
