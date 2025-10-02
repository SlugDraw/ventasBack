const mongoose = require("mongoose");

const salesSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    apertura: { type: Number, required: true },
    fechaApertura: { type: Date, required: true, default: Date.now },
    fechaCierre: { type: Date },
    status: { type: String, enum: ["abierta", "cerrada"], default: "abierta" },
    totalVentas: { type: Number, default: 0 },
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

module.exports = mongoose.model("Sale", salesSchema);
