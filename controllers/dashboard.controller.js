const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);
const Sales = require("../models/Sales");

const getTotalVentasAyer = async (res, req) => {
  const inicioDiaAnterior = dayjs().subtract(1, "day").startOf("day").toDate();
  const finDiaAnterior = dayjs().subtract(1, "day").endOf("day").toDate();

  try {
    const cajasDiaAnterior = await Sales.find({
      fechaCierre: { $gte: inicioDiaAnterior, $lte: finDiaAnterior },
    });

    const totalVentasAyer = cajasDiaAnterior.reduce(
      (total, caja) => total + caja.totalVentas,
      0
    );
    res.json({ total: totalVentasAyer });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener las ventas", error: error.message });
  }
};

const getTotalVentaMes = async (res, req) => {
  const inicioMes = dayjs().startOf("month").toDate();
  const finMes = dayjs().endOf("month").toDate();

  try {
    const cajasDelMes = await Sales.find({
      fechaCierre: { $gte: inicioMes, $lte: finMes },
    });

    const totalVentaMensual = cajasDelMes.reduce(
      (total, caja) => total + caja.totalVentas,
      0
    );
    res.json({ total: totalVentaMensual });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener las ventas", error: error.message });
  }
};

const getTotalVentaMeses = async (res, req) => {
  const fechaInicio = dayjs()
    .tz("America/Mexico_City")
    .subtract(4, "month") // 4 atrás + el actual = 5 meses
    .startOf("month")
    .toDate();

  console.log(fechaInicio);

  const fechaFin = dayjs().tz("America/Mexico_City").endOf("month").toDate();
  console.log(fechaFin);

  try {
    const resultado = await Sales.aggregate([
      {
        // Filtrar cajas cerradas dentro del rango
        $match: {
          status: "cerrada",
          fechaCierre: { $gte: fechaInicio, $lte: fechaFin },
        },
      },
      {
        // Ajustar fecha a zona horaria de México antes de agrupar
        $addFields: {
          fechaCierreLocal: {
            $dateToString: {
              date: "$fechaCierre",
              timezone: "America/Mexico_City",
              format: "%Y-%m-%dT%H:%M:%S",
            },
          },
        },
      },
      {
        // Convertir fechaCierreLocal de nuevo a tipo Date para extraer mes y año
        $addFields: {
          fechaCierreDate: {
            $toDate: "$fechaCierreLocal",
          },
        },
      },
      {
        // Agrupar por año y mes en hora local
        $group: {
          _id: {
            year: { $year: "$fechaCierreDate" },
            month: { $month: "$fechaCierreDate" },
          },
          total: { $sum: "$totalVentas" },
          cantidadCajas: { $sum: 1 },
        },
      },
      {
        // Dar formato al campo "mes"
        $project: {
          _id: 0,
          mes: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              {
                $cond: [
                  { $lt: ["$_id.month", 10] },
                  { $concat: ["0", { $toString: "$_id.month" }] },
                  { $toString: "$_id.month" },
                ],
              },
            ],
          },
          total: 1,
          cantidadCajas: 1,
        },
      },
      {
        // Ordenar de más antiguo a más reciente
        $sort: { mes: 1 },
      },
    ]);

    res.json({ resultado });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener las ventas", error: error.message });
  }
};

const getVentasByDates = async (res, req) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const resultados = await Sales.aggregate([
      {
        $match: {
          status: "cerrada",
          fechaCierre: { $gte: inicio, $lte: fin },
        },
      },
      {
        $lookup: {
          from: "users", // nombre de la colección de usuarios
          localField: "usuario",
          foreignField: "_id",
          as: "usuario",
        },
      },
      { $unwind: "$usuario" },
      {
        $group: {
          _id: {
            empleado: "$usuario.username", // o "$usuario.username" según tu modelo
            anio: { $year: "$fechaCierre" },
            mes: { $month: "$fechaCierre" },
          },
          ventas: { $sum: "$totalVentas" },
        },
      },
      {
        $project: {
          _id: 0,
          empleado: "$_id.empleado",
          fecha: {
            $concat: [
              { $toString: "$_id.anio" },
              "-",
              {
                $cond: {
                  if: { $lt: ["$_id.mes", 10] },
                  then: { $concat: ["0", { $toString: "$_id.mes" }] },
                  else: { $toString: "$_id.mes" },
                },
              },
            ],
          },
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
