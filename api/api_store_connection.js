const express = require("express");
const router = express.Router();
const constant = require("../util/constants");

const { Sequelize, DataTypes, Op } = require("sequelize");
const dynamic_connection = require("../database/connection/dynamic_connection");
const _ = require("lodash");
const secretKey = 'C31e$t!c@'
var CryptoJS = require("crypto-js");

router.get("/encrypt", async (req, res) => {
  try {
    const data = [{ id: 1 }, { id: 2 }];

    const ciphertext = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      "secret key 123"
    ).toString();

    var bytes = CryptoJS.AES.decrypt(ciphertext, "secret key 123");
    var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    let result = ciphertext;
    res.json({ result, decryptedData, api_result: constant.ok });
  } catch (error) {
    res.json({ error: error, api_result: constant.nok });
  }
});

router.post("/connection", async (req, res) => {
  try {
    const data = req.body;

    const ciphertext = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      "secret key 123"
    ).toString();

    var bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    let result = ciphertext;
    res.json({ result, decryptedData, api_result: constant.ok });
  } catch (error) {
    res.json({ error: error, api_result: constant.nok });
  }
});

module.exports = router;
