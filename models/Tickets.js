const mongoose = require("mongoose");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

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
      ref: "Caja", // referencia al modelo Caja
      required: true,
    },
    total: { type: Number, required: true },
    fecha: {
      type: Date,
      required: true,
      default: () => dayjs().tz("America/Mexico_City").toDate(),
    },
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
