const express = require("express");
const router = express.Router();
const constant = require("../util/constants");

const { Sequelize, DataTypes, Op } = require("sequelize");

const _ = require("lodash");
const secretKey = "C31e$t!c@";
var CryptoJS = require("crypto-js");

//models
const dynamic_connection = require("../database/connection/dynamic_connection");
const tbStoreConnection_dynamic = require("../database/models/tbStoreConnection_dynamic");

router.get("/connection", async (req, res) => {
  try {
    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );
    const tbStoreConnection = new tbStoreConnection_dynamic(vision_db);
    const result = await tbStoreConnection.table.findAll();

    for (let index = 0; index < result.length; index++) {
      const item = result[index];
      const bytes = CryptoJS.AES.decrypt(
        item.connection_string_encrypt,
        secretKey
      );
      const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      item.connection_string_encrypt = decryptedData;
    }

    res.json({ result,  api_result: constant.ok });
  } catch (error) {
    console.log(error);
    res.json({ error: error, api_result: constant.nok });
  }
});

router.post("/connection", async (req, res) => {
  try {
    const { connection_name, connection_type, connection_string } = req.body;

    const connection_string_encrypt = CryptoJS.AES.encrypt(
      JSON.stringify(connection_string),
      secretKey
    ).toString();

    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );
    const tbStoreConnection = new tbStoreConnection_dynamic(vision_db);
    const data = {
      connection_name,
      connection_type,
      connection_string_encrypt,
    };
    await tbStoreConnection.createTable();
    const result = await tbStoreConnection.table.create(data);

    res.json({ result, api_result: constant.ok });
  } catch (error) {
    res.json({ error: error, api_result: constant.nok });
  }
});

module.exports = router;
