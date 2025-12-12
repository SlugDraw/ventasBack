const mongoose = require("mongoose");

const connectDB = async () => {    
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB conectado con éxito");
  } catch (err) {
    console.error("❌ Error al conectar MongoDB:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
