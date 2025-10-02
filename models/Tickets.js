const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    serial: {
      type: String,
      required: true,
      unique: true, // asegura que no se repita el serial
    },
    productos: [
      {
        producto: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Producto",
          required: true,
        },
        cantidad: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
      },
    ],
    caja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Caja", // referencia al modelo Caja
      required: true,
    },
    total: { type: Number, required: true },
    fecha: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id; // convertir _id en id
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("Ticket", ticketSchema);
