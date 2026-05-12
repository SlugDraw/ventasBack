const Productos = require("../models/Productos");

// Obtener todos los productos
exports.getProductos = async (req, res) => {
  try {
    const productos = await Productos.find({ activo: true });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un producto por ID
exports.getProductoById = async (req, res) => {
  try {
    const producto = await Productos.findById(req.params.id);
    if (!producto)
      return res.status(404).json({ message: "Producto no encontrado" });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear un nuevo producto
exports.createProducto = async (req, res) => {
  try {
    const nuevoProducto = new Productos(req.body);
    const productoGuardado = await nuevoProducto.save();
    res.status(201).json(productoGuardado);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Actualizar un producto existente
exports.updateProducto = async (req, res) => {
  try {
    const productoActualizado = await Productos.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!productoActualizado)
      return res.status(404).json({ message: "Producto no encontrado" });
    res.json(productoActualizado);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar un producto
exports.deleteProducto = async (req, res) => {
  try {
    const nuevoCode = `ELIMINADO_${Date.now()}`;
    const productoEliminado = await Productos.findOneAndUpdate(
      { _id: req.params.id, activo: true },
      { activo: false, code: nuevoCode },
      { new: true, runValidators: true },
    );
    if (!productoEliminado)
      return res.status(404).json({ message: "Producto no encontrado" });
    res.json({ message: "Producto eliminado", producto: productoEliminado });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
