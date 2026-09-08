const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);
const Sales = require("../models/Sales");
const Ticket = require("../models/Tickets");

const TIME_ZONE = "America/Mexico_City";

const getTotalVentas = async (inicio, fin) => {
  const resultado = await Sales.aggregate([
    {
      $match: {
        status: "cerrada",
        fechaCierre: { $gte: inicio.toDate(), $lt: fin.toDate() },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: { $ifNull: ["$totalVentas", 0] } },
      },
    },
  ]);

  return resultado[0]?.total || 0;
};

const getTotalVentasAyer = async (req, res) => {
  const ayer = dayjs().tz(TIME_ZONE).subtract(1, "day");
  const inicioDiaAnterior = ayer.startOf("day");
  const inicioDiaActual = ayer.add(1, "day").startOf("day");

  try {
    const totalVentasAyer = await getTotalVentas(
      inicioDiaAnterior,
      inicioDiaActual,
    );
    res.json({ total: totalVentasAyer });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener las ventas", error: error.message });
  }
};

const getTotalVentaMes = async (req, res) => {
  const inicioMes = dayjs().tz(TIME_ZONE).startOf("month");
  const inicioMesSiguiente = inicioMes.add(1, "month").startOf("month");

  try {
    const totalVentaMensual = await getTotalVentas(
      inicioMes,
      inicioMesSiguiente,
    );
    res.json({ total: totalVentaMensual });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener las ventas", error: error.message });
  }
};

const getTotalVentaMeses = async (req, res) => {
  const fechaInicio = dayjs()
    .tz(TIME_ZONE)
    .subtract(4, "month")
    .startOf("month");
  const fechaFin = dayjs().tz(TIME_ZONE).add(1, "month").startOf("month");

  try {
    const resultado = await Sales.aggregate([
      {
        $match: {
          status: "cerrada",
          fechaCierre: {
            $gte: fechaInicio.toDate(),
            $lt: fechaFin.toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              date: "$fechaCierre",
              timezone: TIME_ZONE,
              format: "%Y-%m",
            },
          },
          total: { $sum: { $ifNull: ["$totalVentas", 0] } },
          cantidadCajas: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          mes: "$_id",
          total: 1,
          cantidadCajas: 1,
        },
      },
      { $sort: { mes: 1 } },
    ]);

    res.json({ resultado });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener las ventas", error: error.message });
  }
};

const getVentasByDates = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const inicio = dayjs.tz(fechaInicio, TIME_ZONE).startOf("day");
    const inicioFin = dayjs.tz(fechaFin, TIME_ZONE).startOf("day");
    const fin = dayjs.tz(fechaFin, TIME_ZONE).add(1, "day").startOf("day");

    if (
      !fechaInicio ||
      !fechaFin ||
      !inicio.isValid() ||
      !inicioFin.isValid() ||
      !fin.isValid() ||
      inicio.isAfter(inicioFin)
    ) {
      return res.status(400).json({
        message: "Las fechas deben tener un formato válido",
      });
    }

    const resultados = await Ticket.aggregate([
      {
        $match: {
          fecha: {
            $gte: inicio.toDate(),
            $lt: fin.toDate(),
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "empleado",
          foreignField: "_id",
          as: "empleado",
        },
      },
      { $unwind: "$empleado" },
      {
        $group: {
          _id: {
            empleado: "$empleado.username",
            fecha: {
              $dateToString: {
                date: "$fecha",
                timezone: TIME_ZONE,
                format: "%Y-%m",
              },
            },
          },
          ventas: { $sum: { $ifNull: ["$total", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          empleado: "$_id.empleado",
          fecha: "$_id.fecha",
          ventas: 1,
        },
      },
      { $sort: { empleado: 1, fecha: 1 } },
    ]);

    res.json(resultados);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener las ventas", error: error.message });
  }
};

module.exports = {
  getTotalVentasAyer,
  getTotalVentaMes,
  getTotalVentaMeses,
  getVentasByDates,
};
