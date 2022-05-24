const express = require("express");
const constant = require("../util/constants");
const router = express.Router();
const moment = require("moment");
const { parseString, parseStringPromise } = require("xml2js");
const xml2js = require("xml2js");

//models
const dynamic_connection = require("../database/connection/dynamic_connection");

const tbExternalConnections_mantis = require("../database/models/tbExternalConnections_mantis");
const tbExternalConnections_vision = require("../database/models/tbExternalConnections_vision");

const tbDatasource_dynamic_mantis = require("../database/models/tbDatasource_dynamic_mantis");
const tbDatasource_dynamic_vision = require("../database/models/tbDatasource_dynamic_vision");

router.get("/tbExternalConnections", async (req, res) => {
  try {
    const mantis_connection = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-mantis-qa04_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );

    const result_tbExternalConnections_mantis =
      new tbExternalConnections_mantis(mantis_connection);

    const result_ExternalConnections_mantis =
      await result_tbExternalConnections_mantis.table.findAll();

    res.json({ result_ExternalConnections_mantis, api_result: constant.ok });
  } catch (error) {
    console.log(error);
    res.json({ error: error, api_result: constant.nok });
  }
});

router.patch("/tbExternalConnections", async (req, res) => {
  try {
    const { mantis_connection, vision_connection, forceCreateTable } = req.body;
    const connection_mantis = new dynamic_connection(
      mantis_connection.connection,
      mantis_connection.database,
      mantis_connection.username,
      mantis_connection.password
    );
    const connection_vision = new dynamic_connection(
      vision_connection.connection,
      vision_connection.database,
      vision_connection.username,
      vision_connection.password
    );

    const mantis_tb = new tbExternalConnections_mantis(connection_mantis);
    const vision_tb = new tbExternalConnections_vision(connection_vision);

    //create table
    await vision_tb.createTable(forceCreateTable ? forceCreateTable : false);

    //get mantis data
    const mantis_result = await mantis_tb.table.findAll();

    let dataToVision_success = [];
    let dataToVision_failed = [];
    let original_success_data = [];

    let i = 0;
    mantis_result.forEach(async (item) => {
      try {
        const vision_result = await vision_tb.table.create({
          name: item.name,
          serverName: item.serverName,
          database: item.database,
          user: item.user,
          password: item.password,
          extConfig: item.extConfig,
          connectionProviderId: item.conProId,
          createdBy: 0,
          createdDateTime: moment().toDate(),
          updatedBy: null,
          updatedDateTime: null,
          isDeleted: false,
          isActive: true,
        });
        dataToVision_success.push(vision_result);
        original_success_data.push(item);
      } catch (error) {
        dataToVision_failed.push({ item, error });
        console.log(error);
      } finally {
        i++;
      }

      if (i >= mantis_result.length) {
        res.json({
          original_success_data,
          dataToVision_success,
          dataToVision_failed,
          api_result: constant.ok,
        });
        return;
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ error: error, api_result: constant.nok });
  }
});

router.patch("/tbDatasource", async (req, res) => {
  try {
    const { mantis_connection, vision_connection, forceCreateTable } = req.body;
    const connection_mantis = new dynamic_connection(
      mantis_connection.connection,
      mantis_connection.database,
      mantis_connection.username,
      mantis_connection.password
    );
    const connection_vision = new dynamic_connection(
      vision_connection.connection,
      vision_connection.database,
      vision_connection.username,
      vision_connection.password
    );

    const mantis_tb = new tbDatasource_dynamic_mantis(connection_mantis);
    const vision_tb = new tbDatasource_dynamic_vision(connection_vision);

    //create table
    // await vision_tb.createTable(forceCreateTable ? forceCreateTable : false);

    try {
      const dropTableQuery = `DROP TABLE [dbo].[tbDatasource];`;
      await vision_tb.table.sequelize.query(`
    ${forceCreateTable == true ? dropTableQuery : ""}

    CREATE TABLE [dbo].[tbDatasource](
        [datasourceId] [int] IDENTITY(1,1) NOT NULL,
        [name] [nvarchar](255) NOT NULL,
        [xml] [xml] NOT NULL,
        [connectionProviderId] [int] NOT NULL,
        [externalConnectionsId] [int] NOT NULL,
        [createdBy] [int] NOT NULL,
        [createdDateTime] [datetimeoffset](7) NOT NULL,
        [updatedBy] [int] NULL,
        [updatedDateTime] [datetimeoffset](7) NULL,
        [isDeleted] [bit] NOT NULL,
        [isActive] [bit] NOT NULL,
    PRIMARY KEY CLUSTERED 
    (
        [datasourceId] ASC
    )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY],
    UNIQUE NONCLUSTERED 
    (
        [name] ASC
    )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
    `);
    } catch (error) {
      console.log(error);
    }

    //get mantis data
    const mantis_result = await mantis_tb.table.findAll();

    let dataToVision_success = [];
    let dataToVision_failed = [];
    let original_success_data = [];

    const result_tbExternalConnections_vision =
      new tbExternalConnections_vision(connection_vision);

    let i = 0;
    mantis_result.forEach(async (item) => {
      try {
        let exCon = await parseStringPromise(item.xml, {
          mergeAttrs: false,
        });
        const exConName = exCon.datasource.connection[0].$.name;
        const result_exCon =
          await result_tbExternalConnections_vision.table.findOne({
            where: { name: exConName },
          });
        exCon.datasource.connection[0].$.name =
          result_exCon.externalConnectionsId
            ? result_exCon.externalConnectionsId
            : 1;

        //exCon to xml
        const builder = new xml2js.Builder();
        let xml = builder.buildObject(exCon);
        xml = xml.replace(
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
          ""
        );

        const vision_result = await vision_tb.table.create({
          name: item.name,
          xml,
          connectionProviderId: 1,
          externalConnectionsId: result_exCon.externalConnectionsId
            ? result_exCon.externalConnectionsId
            : 1,
          createdBy: 0,
          createdDateTime: moment().toDate(),
          updatedBy: null,
          updatedDateTime: null,
          isDeleted: false,
          isActive: true,
        });
        dataToVision_success.push(vision_result);
        original_success_data.push(item);
      } catch (error) {
        dataToVision_failed.push({ item, error });
        console.log(error);
      } finally {
        i++;
      }

      if (i >= mantis_result.length) {
        res.json({
          original_success_data,
          dataToVision_success,
          dataToVision_failed,
          api_result: constant.ok,
        });
        return;
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ error: error, api_result: constant.nok });
  }
});

router.get("/xml", async (req, res) => {
  const xml = `<datasource name="testSearchFilter"><connection name="EMS-QA" /><query /><parameters><parameter name="orderName" type="varchar" value="NULL" size="50" /></parameters><columns /></datasource>`;
  const jsonXml = await parseStringPromise(xml, {
    mergeAttrs: false,
  });

  var builder = new xml2js.Builder();
  var js2xml = builder.buildObject(jsonXml);

  const result = jsonXml.datasource.connection[0].$.name;

  res.json({ result, jsonXml, js2xml });
});

module.exports = router;
