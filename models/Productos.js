const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true },
    descripcion: { type: String, required: true },
    precio: { type: Number, required: true },
    stock: { type: Number, required: true },
    minStock: { type: Number, required: true },
    maxStock: { type: Number, required: true },
    code: { type: String, required: true, unique: true },
    activo: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id; // Agregar el campo id con el valor de _id
        delete ret._id; // Eliminar el campo _id al convertir a JSON
        return ret;
      },
    },
  },
);

module.exports = mongoose.model("Producto", productoSchema);
