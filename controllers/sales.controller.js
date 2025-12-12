const Sales = require("../models/Sales");
const Ticket = require("../models/Tickets");
const Producto = require("../models/Productos");

//sales
const cajasAbiertas = async (req, res) => {
  try {
    const abiertas = await Sales.find({ status: "abierta" }).populate(
      "usuario"
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
      { new: true, runValidators: true }
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
const getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().populate("caja");
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTicketsByIdCaja = async (req, res) => {
  try {
    const tickets = await Ticket.find({
      caja: req.params.idCaja,
    });

    if (!tickets)
      return res
        .status(204)
        .json({ message: "Aun no hay tickets en esta caja" });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTicket = async (req, res) => {
  try {
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
    for (const item of req.body.productos) {
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

    for (const item of req.body.productos) {
      await Producto.findByIdAndUpdate(
        item.producto,
        { $inc: { stock: -item.cantidad } } // resta segura
      );
    }

    const nuevoTicket = new Ticket(req.body);
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
    const ticket = await Ticket.findById(req.params.idTicket).populate({
      path: "productos.producto",
      model: "Producto",
      select: "nombre precio code",
    });

    if (!ticket)
      return res
        .status(204)
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

    inicio.setHours(23, 59, 59, 999);
    fin.setHours(23, 59, 59, 999);

    const cajasUsuario = await Sales.find({ usuario: id }).select("_id");
    const cajasIds = cajasUsuario.map((c) => c._id);

    const tickets = await Ticket.find({
      caja: { $in: cajasIds },
      fecha: { $gte: inicio, $lte: fin },
    });

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

    inicio.setHours(23, 59, 59, 999);
    fin.setHours(23, 59, 59, 999);

    const tickets = await Ticket.find({
      fecha: { $gte: inicio, $lte: fin },
    });

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
