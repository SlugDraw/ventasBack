const mongoose = require("mongoose");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const salesSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    apertura: { type: Number, required: true },
    fechaApertura: {
      type: Date,
      required: true,
      default: () => dayjs().tz("America/Mexico_City").toDate(),
    },
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
        delete ret.__v;
        delete ret._id; // Eliminar el campo _id al convertir a JSON
        if (ret.fechaApertura) {
          ret.fechaApertura = dayjs(ret.fechaApertura)
            .tz("America/Mexico_City")
            .format("YYYY-MM-DD HH:mm:ss");
        }
        if (ret.fechaCierre) {
          ret.fechaCierre = dayjs(ret.fechaCierre)
            .tz("America/Mexico_City")
            .format("YYYY-MM-DD HH:mm:ss");
        }
        if (ret.createdAt) {
          ret.createdAt = dayjs(ret.createdAt)
            .tz("America/Mexico_City")
            .format("YYYY-MM-DD HH:mm:ss");
        }
        if (ret.updatedAt) {
          ret.updatedAt = dayjs(ret.updatedAt)
            .tz("America/Mexico_City")
            .format("YYYY-MM-DD HH:mm:ss");
        }

        return ret;
      },
    },
  }
);

module.exports = mongoose.model("Sale", salesSchema);
