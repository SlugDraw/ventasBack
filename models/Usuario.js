const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    apellidos: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // encriptada
    rol: {
      type: String,
      required: true,
      enum: ["admin", "empleado"],
      default: "empleado",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id; // Agregar el campo id con el valor de _id
        delete ret.password; // Eliminar el campo password al convertir a JSON
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("User", userSchema);
