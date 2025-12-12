const mongoose = require("mongoose");

const impresoraSchema = new mongoose.Schema(
  {
    isDirecto: { type: Boolean, required: true },
    nombre: { type: String, required: true },
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
  }
);

module.exports = mongoose.model("Impresora", impresoraSchema);
