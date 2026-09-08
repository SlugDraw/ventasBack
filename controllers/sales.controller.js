const mongoose = require("mongoose");
const Sales = require("../models/Sales");
const Ticket = require("../models/Tickets");
const Producto = require("../models/Productos");
const Usuario = require("../models/Usuario");

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
    res.status(400).json({ message: error.message });
  }
};

const cerrarCaja = async (req, res) => {
  try {
    const cajaCerrada = await Sales.findByIdAndUpdate(
      req.params.id,
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
    const tickets = await populateTicketData(Ticket.find());
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

    const ultimo = await Ticket.findOne().sort({ createdAt: -1 });
    let siguienteSerial = "TCK-00001";
    if (ultimo) {
      const match = ultimo.serial.match(/(\d+)$/);
      if (match) {
        const numero = parseInt(match[1], 10);
        const nuevoNumero = numero + 1;
        siguienteSerial = `TCK-${nuevoNumero.toString().padStart(5, "0")}`;
      }
    }
    for (const item of productos) {
      console.log(item);
      const producto = await Producto.findOne({ _id: item.producto });
      if (!producto) {
        return res.status(500).json({ message: "Producto no encontrado" });
      }
      if (Number(producto.stock) < Number(item.cantidad)) {
        return res.status(500).json({
          message: `No hay suficiente stock del producto: ${producto.nombre}`,
        });
      }
    }

    for (const item of productos) {
      await Producto.findByIdAndUpdate(
        item.producto,
        { $inc: { stock: -item.cantidad } }, // resta segura
      );
    }

    const nuevoTicket = new Ticket({
      ...req.body,
      empleado: empleadoEncontrado._id,
      productos,
      pagosMixtos,
    });
    nuevoTicket.serial = siguienteSerial;
    const ticketGuardado = await nuevoTicket.save();
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
