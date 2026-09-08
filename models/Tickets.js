const mongoose = require("mongoose");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const pagoMixtoSchema = new mongoose.Schema(
  {
    formaDePago: { type: String, required: true },
    monto: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

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
        descuento: { type: Number, default: 0 }, // descuento en porcentaje
      },
    ],
    caja: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale", // referencia al modelo de caja
      required: true,
    },
    empleado: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    total: { type: Number, required: true },
    descuentoTotal: { type: Number, required: true, min: 0, default: 0 },
    pagosMixtos: {
      type: [pagoMixtoSchema],
      default: [],
    },
    fecha: {
      type: Date,
      required: true,
      default: () => dayjs().tz("America/Mexico_City").toDate(),
    },
    formaDePago: { type: String, required: true, default: "Efectivo" },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        if (ret.fecha) {
          ret.fecha = dayjs(ret.fecha)
            .tz("America/Mexico_City")
            .format("YYYY-MM-DD HH:mm:ss");
        }
        return ret;
      },
    },
  },
);

module.exports = mongoose.model("Ticket", ticketSchema);
