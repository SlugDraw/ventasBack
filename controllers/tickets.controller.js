const Ticket = require("../models/Tickets");

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
        siguienteSerial = `TCK-${nuevoNumero.toString().padStart(4, "0")}`;
      }
    }
    const nuevoTicket = new Ticket(req.body);
    nuevoTicket.serial = siguienteSerial;
    const ticketGuardado = await nuevoTicket.save();
    res.status(201).json(ticketGuardado);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTicketById = async (req, res) => {
  try {
    console.log(req.params.idTicket);
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

module.exports = {
  getTickets,
  getTicketsByIdCaja,
  createTicket,
  getTicketById,
};
