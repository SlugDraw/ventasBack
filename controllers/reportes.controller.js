const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const Ticket = require("../models/Tickets");

dayjs.extend(utc);
dayjs.extend(timezone);

const TIME_ZONE = "America/Mexico_City";

const getDateRange = (req, res) => {
  const { fechaInicio, fechaFin } = req.body;
  const inicio = dayjs.tz(fechaInicio, TIME_ZONE).startOf("day");
  const inicioFin = dayjs.tz(fechaFin, TIME_ZONE).startOf("day");
  const fin = inicioFin.add(1, "day");

  if (
    !fechaInicio ||
    !fechaFin ||
    !inicio.isValid() ||
    !inicioFin.isValid() ||
    inicio.isAfter(inicioFin)
  ) {
    res.status(400).json({
      message:
        "fechaInicio y fechaFin deben ser fechas válidas y estar en orden",
    });
    return null;
  }

  return { inicio: inicio.toDate(), fin: fin.toDate() };
};

const getEmployeeLookup = () => [
  {
    $lookup: {
      from: "users",
      localField: "empleado",
      foreignField: "_id",
      as: "empleado",
    },
  },
  { $unwind: "$empleado" },
];

const getVentasTotalesPorFecha = async (req, res) => {
  try {
    const rango = getDateRange(req, res);
    if (!rango) return;

    const resultado = await Ticket.aggregate([
      { $match: { fecha: { $gte: rango.inicio, $lt: rango.fin } } },
      { $sort: { fecha: 1, serial: 1 } },
      {
        $group: {
          _id: {
            $dateToString: {
              date: "$fecha",
              timezone: TIME_ZONE,
              format: "%Y-%m-%d",
            },
          },
          totalVentas: { $sum: { $ifNull: ["$total", 0] } },
          cantidadTickets: { $sum: 1 },
          tickets: {
            $push: {
              $cond: [
                { $gt: [{ $ifNull: ["$descuentoTotal", 0] }, 0] },
                {
                  numeroTicket: "$serial",
                  subtotal: {
                    $subtract: [
                      { $ifNull: ["$total", 0] },
                      { $ifNull: ["$descuentoTotal", 0] },
                    ],
                  },
                  descuento: { $ifNull: ["$descuentoTotal", 0] },
                  total: { $ifNull: ["$total", 0] },
                },
                {
                  numeroTicket: "$serial",
                  subtotal: { $ifNull: ["$total", 0] },
                  total: { $ifNull: ["$total", 0] },
                },
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          fecha: "$_id",
          totalVentas: 1,
          cantidadTickets: 1,
          tickets: 1,
        },
      },
      { $sort: { fecha: 1 } },
    ]);

    res.json(resultado);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener las ventas por fecha",
      error: error.message,
    });
  }
};

const getVentasPorEmpleado = async (req, res) => {
  try {
    const rango = getDateRange(req, res);
    if (!rango) return;

    const { codigosEmpleado } = req.body;
    if (codigosEmpleado !== undefined && !Array.isArray(codigosEmpleado)) {
      return res.status(400).json({
        message: "codigosEmpleado debe ser un arreglo de códigos",
      });
    }

    const pipeline = [
      { $match: { fecha: { $gte: rango.inicio, $lt: rango.fin } } },
      ...getEmployeeLookup(),
    ];

    if (codigosEmpleado?.length) {
      pipeline.push({
        $match: { "empleado.codigo": { $in: codigosEmpleado } },
      });
    }

    pipeline.push(
      {
        $group: {
          _id: "$empleado._id",
          codigo: { $first: "$empleado.codigo" },
          empleado: { $first: "$empleado.username" },
          nombre: { $first: "$empleado.nombre" },
          apellidos: { $first: "$empleado.apellidos" },
          totalVentas: { $sum: { $ifNull: ["$total", 0] } },
          cantidadTickets: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          empleadoId: "$_id",
          codigo: 1,
          empleado: 1,
          nombre: 1,
          apellidos: 1,
          totalVentas: 1,
          cantidadTickets: 1,
        },
      },
      { $sort: { empleado: 1 } },
    );

    const resultado = await Ticket.aggregate(pipeline);

    res.json(resultado);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener las ventas por empleado",
      error: error.message,
    });
  }
};

module.exports = {
  getVentasTotalesPorFecha,
  getVentasPorEmpleado,
};
