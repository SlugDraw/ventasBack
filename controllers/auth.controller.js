const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/Usuario");

// Registrar usuario
exports.register = async (req, res) => {
  try {
    const { nombre, apellidos, username, password, rol } = req.body;

    // Validar duplicados
    const userExists = await User.findOne({ username });
    if (userExists)
      return res
        .status(400)
        .json({ message: "El username ya está registrado" });

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      nombre,
      apellidos,
      username,
      password: hashedPassword,
      rol,
    });
    await newUser.save();

    res.status(201).json({ message: "Usuario registrado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login usuario
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log(username, password);

    // Buscar por nombre de usuario
    const user = await User.findOne({ username });
    console.log(user);

    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    // Comparar contraseña encriptada
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({ message: "Contraseña incorrecta" });

    // Generar token
    const token = jwt.sign(
      { id: user.id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Devolver token + datos del usuario
    res.json({
      token,
      user: user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
