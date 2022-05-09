const express = require("express");
const router = express.Router();
const constant = require("../util/constants");
const { Sequelize, QueryTypes , Op } = require("sequelize");
const fs = require("fs");
const _ = require("lodash");

//connection
const dynamic_connection = require("../database/connection/dynamic_connection");
const tbStoreProceduresVersion_dynamic = require("../database/models/tbStoreProceduresVersion_dynamic");

router.get("/query/version=:version", async (req, res) => {
  const { version } = req.params;
  try {
    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );
    const tbStoreProcedures_version = new tbStoreProceduresVersion_dynamic(
      vision_db
    );
    const result = await tbStoreProcedures_version.table.findAll({
      where: { version },
    });

    let sqlString = "";
    for (let index = 0; index < result.length; index++) {
      const item = result[index];
      sqlString += item.code + "\nGO\n";
    }

    res.setHeader("Content-type", "application/octet-stream");
    res.setHeader(
      "Content-disposition",
      `attachment; filename=Vision 2.x store_procedures ${version}.sql`
    );
    res.send(sqlString);
  } catch (error) {
    console.log(error);
    res.json({ error: error, api_result: constant.nok });
  }
});

router.get("/versionList", async (req, res) => {
  try {
    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );
    const tbStoreProcedures_version = new tbStoreProceduresVersion_dynamic(
      vision_db
    );

    let result = await tbStoreProcedures_version.table.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("version")), "version"],
      ],
      order: [["version", "desc"]],
    });
    result = _.map(result, "version");

    res.json({ result, api_result: constant.ok });
  } catch (error) {
    console.log(error);
    res.json({ error: error, api_result: constant.nok });
  }
});

//storeProcedures
router.get("/storeProcedures/version=:version", async (req, res) => {
  const { version } = req.params;
  try {
    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );
    const tbStoreProcedures_version = new tbStoreProceduresVersion_dynamic(
      vision_db
    );
    const result = await tbStoreProcedures_version.table.findAll({
      where: { version },
    });
    res.json({ result, api_result: constant.ok });
  } catch (error) {
    console.log(error);
    res.json({ error: error, api_result: constant.nok });
  }
});

router.post("/storeProcedures", async (req, res) => {
  try {
    const { version } = req.body;
    const store_procedures_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-ibm-prd01-temp",
      "cthadmin",
      "CLS0DC2k3"
    );
    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );
    const tbStoreProcedures_version = new tbStoreProceduresVersion_dynamic(
      vision_db
    );

    // const sp_list = await store_procedures_db.sequelize.query(
    //   `WITH SP as
    //     (
    //     SELECT [schema] = SCHEMA_NAME([schema_id]),
    //       name
    //     FROM sys.procedures
    //     )
    //     select name from SP where [name] like 'spReport%'`,
    //   {
    //     type: QueryTypes.SELECT,
    //   }
    // );

    const sp_list = await store_procedures_db.sequelize.query(
      `select routine_name as name 
      from information_schema.routines  
      where routine_name in ('fnGetStockIdForReportPortal') or routine_name like 'spReport%'`,
      {
        type: QueryTypes.SELECT,
      }
    );

    let error_list = [];
    let success_list = [];
    for (let index = 0; index < sp_list.length; index++) {
      const sp_name = sp_list[index].name;
      try {
        const result = await store_procedures_db.sequelize.query(
          `EXEC sp_helptext N'${sp_name}';`,
          {
            type: QueryTypes.SELECT,
          }
        );

        let store_code = "";
        for (let index = 0; index < result.length; index++) {
          const item = result[index];
          store_code += item.Text;
        }
        store_code.trim();
        store_code = store_code.replace(/[\r]+/g, "\r");
        store_code = store_code.replace(/[\n]+/g, "\n");
        store_code = store_code.replace(/[\t]+/g, "\t");
        store_code = store_code.replace("CREATE  ", "CREATE  OR   ALTER   ");
        store_code = store_code.replace("Create  ", "CREATE  OR   ALTER   ");
        store_code = store_code.replace(
          "CREATE PROCEDURE",
          "CREATE  OR   ALTER   PROCEDURE"
        );
        store_code = store_code.replace(
          "CREATE FUNCTION",
          "CREATE  OR   ALTER   FUNCTION"
        );

        tbStoreProcedures_version.createTable();
        try {
          await tbStoreProcedures_version.table.create({
            name: sp_name,
            code: store_code,
            version,
          });
          success_list.push(sp_name);
        } catch (error) {
          error_list.push(sp_name);
        }
      } catch (error) {
        error_list.push(sp_name);
      }
    }

    res.json({ success_list, error_list, api_result: constant.ok });
  } catch (error) {
    console.log(error);
    res.json({ error: error, api_result: constant.nok });
  }
});
 
router.delete("/storeProcedures/", async (req, res) => {
  const { version } = req.body;
  try {
    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );
    const tbStoreProcedures_version = new tbStoreProceduresVersion_dynamic(
      vision_db
    );
    const result = await tbStoreProcedures_version.table.destroy({
      where: { version },
    });
    res.json({ result, api_result: constant.ok });
  } catch (error) {
    console.log(error);
    res.json({ error: error, api_result: constant.nok });
  }
});

router.patch("/storeProcedures", async (req, res) => {
  
});

module.exports = router;
