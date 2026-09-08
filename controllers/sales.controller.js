const mongoose = require("mongoose");
const Sales = require("../models/Sales");
const Ticket = require("../models/Tickets");
const Producto = require("../models/Productos");
const Usuario = require("../models/Usuario");

const isDuplicateKeyError = (error) => error?.code === 11000;

const getSiguienteSerial = async () => {
  const ultimo = await Ticket.findOne({ serial: /^TCK-\d+$/ })
    .sort({ createdAt: -1 })
    .select("serial");
  if (!ultimo) return "TCK-00001";

  const match = ultimo.serial.match(/(\d+)$/);
  if (!match) return "TCK-00001";

  return `TCK-${(parseInt(match[1], 10) + 1).toString().padStart(5, "0")}`;
};

const guardarTicketConSerial = async (datosTicket) => {
  // A unique index protects the serial. If another request inserted the same
  // serial first, calculate a new one and retry without touching stock again.
  for (;;) {
    try {
      return await Ticket.create({
        ...datosTicket,
        serial: await getSiguienteSerial(),
      });
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
    }
  }
};

//sales
const cajasAbiertas = async (req, res) => {
  try {
    const abiertas = await Sales.find({ status: "abierta" }).populate(
      "usuario",
    );
    res.json(abiertas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cajaUsuario = async (req, res) => {
  try {
    const caja = await Sales.findOne({
      usuario: req.params.userId,
      status: "abierta",
    }).populate("usuario");

    if (!caja)
      return res
        .status(204)
        .json({ message: "No hay caja abierta para este usuario" });
    res.json(caja);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const abrirCaja = async (req, res) => {
  try {
    const nuevaCaja = new Sales(req.body);
    const cajaGuardada = await nuevaCaja.save();
    res.status(201).json(cajaGuardada);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res
        .status(409)
        .json({ message: "El usuario ya tiene una caja abierta" });
    }
    res.status(400).json({ message: error.message });
  }
};

const cerrarCaja = async (req, res) => {
  try {
    const cajaCerrada = await Sales.findOneAndUpdate(
      { _id: req.params.id, status: "abierta" },
      {
        status: "cerrada",
        fechaCierre: new Date(),
        totalVentas: req.body.totalVenta,
      },
      { new: true, runValidators: true },
    );
    if (!cajaCerrada)
      return res.status(404).json({ message: "Caja no encontrada" });
    res.json(cajaCerrada);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getCajaById = async (req, res) => {
  try {
    const caja = await Sales.findById(req.params.id);
    if (!caja) return res.status(404).json({ message: "Caja no encontrada" });
    res.json(caja);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Tickets
const populateTicketData = (query) =>
  query
    .populate("caja")
    .populate({
      path: "empleado",
      select: "nombre apellidos username rol activo codigo",
    })
    .populate({
      path: "productos.producto",
      model: "Producto",
      select: "nombre precio code descripcion",
    });

const getTickets = async (req, res) => {
  try {
    const tickets = await populateTicketData(
      Ticket.find().sort({ fecha: -1 }).limit(100),
    );
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTicketsByIdCaja = async (req, res) => {
  try {
    const tickets = await populateTicketData(
      Ticket.find({
        caja: req.params.idCaja,
      }).sort({ fecha: -1 }),
    );

    if (tickets.length === 0) return res.json([]);
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTicket = async (req, res) => {
  try {
    const { empleado, pagosMixtos = [], productos = [], total } = req.body;

    if (!empleado) {
      return res.status(400).json({ message: "El empleado es obligatorio" });
    }
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({
        message: "Debe incluir al menos un producto",
      });
    }
    if (!Array.isArray(pagosMixtos)) {
      return res.status(400).json({
        message: "pagosMixtos debe ser un arreglo",
      });
    }
    if (pagosMixtos.length > 0) {
      const totalPagos = pagosMixtos.reduce(
        (suma, pago) => suma + Number(pago.monto),
        0,
      );
      if (!pagosMixtos.every((pago) => Number.isFinite(Number(pago.monto)))) {
        return res.status(400).json({
          message: "El monto de cada pago mixto debe ser numérico",
        });
      }
      if (Math.abs(totalPagos - Number(total)) > 0.01) {
        return res.status(400).json({
          message: "La suma de los pagos mixtos debe coincidir con el total",
        });
      }
    }

    const empleadoEncontrado = await Usuario.findOne(
      mongoose.isValidObjectId(empleado)
        ? { $or: [{ _id: empleado }, { codigo: empleado }] }
        : { codigo: empleado },
    );
    if (!empleadoEncontrado) {
      return res.status(404).json({ message: "Empleado no encontrado" });
    }

    // Fetching every product individually produced 2N database round trips per
    // ticket. Aggregate repeated products and validate them in a single query.
    const cantidadesPorProducto = new Map();
    for (const item of productos) {
      const productoId = String(item.producto);
      cantidadesPorProducto.set(
        productoId,
        (cantidadesPorProducto.get(productoId) || 0) + Number(item.cantidad),
      );
    }

    const productosEncontrados = await Producto.find({
      _id: { $in: [...cantidadesPorProducto.keys()] },
    })
      .select("nombre stock")
      .lean();
    const productosPorId = new Map(
      productosEncontrados.map((producto) => [String(producto._id), producto]),
    );

    for (const [productoId, cantidad] of cantidadesPorProducto) {
      const producto = productosPorId.get(productoId);
      if (!producto) {
        return res.status(500).json({ message: "Producto no encontrado" });
      }
      if (Number(producto.stock) < cantidad) {
        return res.status(500).json({
          message: `No hay suficiente stock del producto: ${producto.nombre}`,
        });
      }
    }

    await Producto.bulkWrite(
      [...cantidadesPorProducto].map(([productoId, cantidad]) => ({
        updateOne: {
          filter: { _id: productoId },
          update: { $inc: { stock: -cantidad } },
        },
      })),
    );

    const ticketGuardado = await guardarTicketConSerial({
      ...req.body,
      empleado: empleadoEncontrado._id,
      productos,
      pagosMixtos,
    });
    res.status(201).json(ticketGuardado);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

const getTicketById = async (req, res) => {
  try {
    const ticket = await populateTicketData(
      Ticket.findById(req.params.idTicket),
    );

    if (!ticket)
      return res
        .status(404)
        .json({ message: "No se encontro detalle del ticket" });
    res.json(ticket);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

const getTicketsByUserAndDates = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin } = req.query;

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      return res.status(400).json({
        message: "Las fechas deben tener un formato válido",
      });
    }
    if (inicio > fin) {
      return res.status(400).json({
        message: "La fecha inicial no puede ser posterior a la fecha final",
      });
    }

    inicio.setHours(0, 0, 0, 0);
    fin.setHours(23, 59, 59, 999);

    const cajasUsuario = await Sales.find({ usuario: id }).select("_id").lean();
    const cajasIds = cajasUsuario.map((c) => c._id);

    const tickets = await populateTicketData(
      Ticket.find({
        caja: { $in: cajasIds },
        fecha: { $gte: inicio, $lte: fin },
      }).sort({ fecha: -1 }),
    );

    res.json(tickets);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener tickets", error: error.message });
  }
};

const getAllTicketsBydDates = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      return res.status(400).json({
        message: "Las fechas deben tener un formato válido",
      });
    }
    if (inicio > fin) {
      return res.status(400).json({
        message: "La fecha inicial no puede ser posterior a la fecha final",
      });
    }

    inicio.setHours(0, 0, 0, 0);
    fin.setHours(23, 59, 59, 999);

    const tickets = await populateTicketData(
      Ticket.find({
        fecha: { $gte: inicio, $lte: fin },
      }).sort({ fecha: -1 }),
    );

    res.json(tickets);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener tickets", error: error.message });
  }
};

module.exports = {
  cajasAbiertas,
  abrirCaja,
  cerrarCaja,
  cajaUsuario,
  getCajaById,
  getTickets,
  getTicketsByIdCaja,
  createTicket,
  getTicketById,
  getTicketsByUserAndDates,
  getAllTicketsBydDates,
};
