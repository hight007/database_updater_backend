const express = require("express");
const router = express.Router();
const constant = require("../util/constants");
const { Sequelize, QueryTypes, Op } = require("sequelize");
const fs = require("fs");
const _ = require("lodash");
const moment = require("moment");
const CryptoJS = require("crypto-js");

//models
const dynamic_connection = require("../database/connection/dynamic_connection");
const event_log_dynamic_connection = require("../database/models/tbEventLog_dynamic");

router.post("/bu", async (req, res) => {
  try {
    const { connection } = req.body;
    console.log(connection);
    const vision_db = new dynamic_connection(
      connection.connection,
      connection.database,
      connection.username,
      connection.password
    );

    const tb_event_log = new event_log_dynamic_connection(vision_db);

    //get bu data
    const bu_result = await tb_event_log.table.findAll({
      attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("bu")), "bu"]],
    });

    let bu = [];
    //get bu
    for (let index = 0; index < bu_result.length; index++) {
      const item = bu_result[index];
      bu.push(item.bu);
    }
    res.json({ bu, api_result: constant.ok });
  } catch (error) {
    console.log(error);
    res.json({ error: error, api_result: constant.nok });
  }
});

router.post("/eventLogRawData", async (req, res) => {
  try {
    const { connection, bu, startDate, endDate, apiDuration } = req.body;

    const bytes = CryptoJS.AES.decrypt(connection, constant.secretKey);
    const connection_ = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    const vision_db = new dynamic_connection(
      connection_.connection,
      connection_.database,
      connection_.username,
      connection_.password
    );

    let whereCondition = {
      apiStartTime: {
        [Op.between]: [
          moment(startDate).format("MM/DD/yyyy HH:mm:ss"),
          moment(endDate).format("MM/DD/yyyy HH:mm:ss"),
        ],
      },
      apiDuration: { [Op.gt]: apiDuration },
    };
    if (bu.length > 0) {
      whereCondition.bu = { [Op.in]: bu };
    }
    const tb_event_log = new event_log_dynamic_connection(vision_db);

    console.log(whereCondition);
    const result = await tb_event_log.table.findAll({
      where: whereCondition,
      attributes: [
        ["logId", "id"],
        "logType",
        "logDetail",
        "parameter",
        "storedProcedureName",
        "apiName",
        "apiStartTime",
        "apiEndTime",
        "apiDuration",
        "bu",
      ],
    });

    res.json({ result, api_result: constant.ok });
  } catch (error) {
    console.log(error);
    res.json({ error: error, api_result: constant.nok });
  }
});

router.post("/duration_analysis", async (req, res) => {
  try {
    const { connection, bu, startDate, endDate } = req.body;

    const bytes = CryptoJS.AES.decrypt(connection, constant.secretKey);
    const connection_ = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    const vision_db = new dynamic_connection(
      connection_.connection,
      connection_.database,
      connection_.username,
      connection_.password
    );

    const tb_event_log = new event_log_dynamic_connection(vision_db);

    let whereCondition = {
      apiStartTime: {
        [Op.between]: [
          moment(startDate).format("MM/DD/yyyy HH:mm:ss"),
          moment(endDate).format("MM/DD/yyyy HH:mm:ss"),
        ],
      },
    };
    if (bu.length > 0) {
      whereCondition.bu = { [Op.in]: bu };
    }

    //get distinct bu
    const distinct_bu = await tb_event_log.table.findAll({
      attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("bu")), "bu"]],
      where: whereCondition,
      raw: true,
    });
    const buList = _.map(distinct_bu, (m) => m.bu);

    //get distinct api date
    const distinct_date = await tb_event_log.table.findAll({
      attributes: [
        [
          Sequelize.fn(
            "DISTINCT",
            Sequelize.cast(Sequelize.col("apiStartTime"), "DATE")
          ),
          "api_date",
        ],
      ],
      where: whereCondition,
      order : [[Sequelize.cast(Sequelize.col("apiStartTime"), "DATE") , 'desc']],
      raw: true,
    });

    const dateList = _.map(distinct_date, (m) => m.api_date);

    //create chart data
    let series = [];
    const categories = dateList;

    for (i in buList) {
      const bu = buList[i];
      whereCondition.bu = bu;
      const data_ = await tb_event_log.table.findAll({
        attributes: [
          [Sequelize.cast(Sequelize.col("apiStartTime"), "DATE"), "api_date"],
          [Sequelize.fn("avg", Sequelize.col("apiDuration")), "avg_duration"],
        ],
        group: [Sequelize.cast(Sequelize.col("apiStartTime"), "DATE")],
        where: whereCondition,
        raw: true,
      });

      let chartData = [];
      for (j in dateList) {
        const date = dateList[j];
        const data = _.find(data_, { api_date: date }); 
        // console.log(bu ,' | ' , date , ' : ' ,data);
        if (data == null) {
          chartData.push(null);
        } else {
          chartData.push(data.avg_duration.toFixed(2));
        }
      }
      series.push({
        name: bu,
        data: chartData,
        color : getRandomColor()
      });
    }

    res.json({
      api_result: constant.ok,
      series,
      categories,
    });
  } catch (error) {
    console.log(error);
    res.json({ error, api_result: constant.nok });
  }
});

function getRandomColor() {
  var letters = "0123456789ABCDEF".split("");
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

module.exports = router;
