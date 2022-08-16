const express = require("express");
const router = express.Router();
const constant = require("../util/constants");
const { Sequelize, QueryTypes, Op } = require("sequelize");
const fs = require("fs");
const _ = require("lodash");
const moment = require("moment");

//connection
const dynamic_connection = require("../database/connection/dynamic_connection");
const tbStoreProceduresVersion_dynamic = require("../database/models/tbStoreProceduresVersion_dynamic");
const tbStoreProceduresUpdate_dynamic = require("../database/models/tbStoreProcedureUpdate_dynamic");

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

router.get("/query_updated/version=:version", async (req, res) => {
  const { version } = req.params;
  try {
    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );

    const tbStoreProcedures_update = new tbStoreProceduresUpdate_dynamic(
      vision_db
    );
    const spName_updated = await tbStoreProcedures_update.table.findAll({
      where: { version },
      attributes: ["name"],
    });
    const spName_updated_list = _.map(spName_updated, "name");

    const tbStoreProcedures_version = new tbStoreProceduresVersion_dynamic(
      vision_db
    );
    const result = await tbStoreProcedures_version.table.findAll({
      where: { version, name: { [Op.in]: spName_updated_list } },
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
    const tbStoreProcedures_update = new tbStoreProceduresUpdate_dynamic(
      vision_db
    );

    let result = await tbStoreProcedures_version.table.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("version")), "version"],
        [Sequelize.fn("MAX", Sequelize.col("createdAt")), "createdAt"],
      ],
      group: "version",
      limit: 10,
      order: [[Sequelize.fn("max", Sequelize.col("createdAt")), "DESC"]],
    });
    result = _.map(result, "version");

    let result_u = await tbStoreProcedures_update.table.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("version")), "version"],
        [Sequelize.fn("MAX", Sequelize.col("createdAt")), "createdAt"],
      ],
      group: "version",
      limit: 10,
      order: [[Sequelize.fn("max", Sequelize.col("createdAt")), "DESC"]],
    });
    result_u = _.map(result_u, "version");

    result = _.unionBy(result_u, result);

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
    const tbStoreProcedures_update = new tbStoreProceduresUpdate_dynamic(
      vision_db
    );

    const sp_list = await store_procedures_db.sequelize.query(
      `select routine_name as name 
      from information_schema.routines  
      where routine_name in ('fnGetStockIdForReportPortal' , 'fnGetBlockId' , 'fnGetBlockId2' , 'fnGetValidSNStatus') or routine_name like 'spReport%'`,
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

router.patch("/storeProcedures", async (req, res) => {});

router.get("/stringMatching/:text", async (req, res) => {
  try {
    const { text } = req.params;
    let inCludeText = [];
    let inCludeTextDetail = [];
    const store_procedures_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-ibm-prd01-temp",
      "cthadmin",
      "CLS0DC2k3"
    );
    const sp_list = await store_procedures_db.sequelize.query(
      `select routine_name as name 
      from information_schema.routines  
      where routine_name in ('fnGetStockIdForReportPortal' , 'fnGetBlockId' , 'fnGetBlockId2') or routine_name like 'spReport%'`,
      {
        type: QueryTypes.SELECT,
      }
    );

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
        store_code = store_code.toUpperCase();

        if (store_code.includes(text.toUpperCase())) {
          console.log(sp_name);
          inCludeText.push(sp_name);
          inCludeTextDetail.push({ store_code, sp_name });
        }
      } catch (error) {
        // error_list.push(sp_name);
        console.log(error);
      }
    }
    console.log("-------------------------------");
    res.json({ isIncludeText: inCludeText });
    // res.json(sp_list);
  } catch (error) {}
});

router.get("/tableIncludes/", async (req, res) => {
  try {
    let inCludeTbList = [];
    const store_procedures_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-ibm-prd01-temp",
      "cthadmin",
      "CLS0DC2k3"
    );
    const sp_list = await store_procedures_db.sequelize.query(
      `select routine_name as name 
      from information_schema.routines  
      where routine_name in ('fnGetStockIdForReportPortal' , 'fnGetBlockId' , 'fnGetBlockId2') or routine_name like 'spReport%'`,
      {
        type: QueryTypes.SELECT,
      }
    );

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
        store_code = store_code.toUpperCase();

        // console.log(store_code);
        const store_code_wording_list = store_code.split(" ");
        let inCludeTb = [];
        for (let w = 0; w < store_code_wording_list.length; w++) {
          const word = store_code_wording_list[w];
          if (word.includes("tb".toUpperCase()) && !word.includes("@")) {
            let clearnWord = word.toLowerCase();
            clearnWord = clearnWord.replace("\ta", "");
            clearnWord = clearnWord.replace("\n", "");
            clearnWord = clearnWord.replace("\r", "");
            clearnWord = clearnWord.replace("\t", "");
            clearnWord = clearnWord.replace("from", "");
            clearnWord = clearnWord.replace("[dbo]", "");
            clearnWord = clearnWord.replace("]", "");
            clearnWord = clearnWord.replace("[", "");
            inCludeTb.push(clearnWord);
          }
        }

        inCludeTb = _.uniq(inCludeTb);
        console.log(sp_name, inCludeTb);

        inCludeTbList.push({ sp_name, inCludeTb });
      } catch (error) {
        // error_list.push(sp_name);
        console.log(error);
      }
    }
    console.log("-------------------------------");
    res.json(inCludeTbList);
    // res.json(sp_list);
  } catch (error) {}
});

//tbStoreProceduresUpdate
router.get("/storeList", async (req, res) => {
  try {
    const { version } = req.body;
    const store_procedures_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-ibm-prd01-temp",
      "cthadmin",
      "CLS0DC2k3"
    );

    const sp_list = await store_procedures_db.sequelize.query(
      `select routine_name as name 
      from information_schema.routines  
      where routine_name in ('fnGetStockIdForReportPortal' , 'fnGetBlockId' , 'fnGetBlockId2') or routine_name like 'spReport%'`,
      {
        type: QueryTypes.SELECT,
      }
    );

    res.json(_.map(sp_list, "name"));
  } catch (error) {
    console.log(error);
    res.json({ error: error, api_result: constant.nok });
  }
});

router.post("/storeProceduresUpdate", async (req, res) => {
  try {
    const body = req.body;
    console.log(body);

    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );
    const tbStoreProcedures_update = new tbStoreProceduresUpdate_dynamic(
      vision_db
    );
    tbStoreProcedures_update.createTable();

    const result = await tbStoreProcedures_update.table.create(body);

    res.json({ result, api_result: constant.ok });
  } catch (error) {
    console.log(error);
    res.json({ error: error, api_result: constant.nok });
  }
});

router.get("/storeProceduresUpdate/:version", async (req, res) => {
  try {
    const { version } = req.params;

    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );
    const tbStoreProcedures_update = new tbStoreProceduresUpdate_dynamic(
      vision_db
    );

    const result = await tbStoreProcedures_update.table.findAll({
      where: { version },
      attributes: ["name", "version", "createdAt", "updatedAt"],
    });

    res.json({ result, api_result: constant.ok });
  } catch (error) {
    console.log(error);
    res.json({ error: error, api_result: constant.nok });
  }
});

router.get("/storeProceduresUpdate/", async (req, res) => {
  try {
    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );
    const tbStoreProcedures_update = new tbStoreProceduresUpdate_dynamic(
      vision_db
    );

    const result = await tbStoreProcedures_update.table.findAll({
      where: {
        createdAt: { [Op.gt]: moment().add(-3, "M").toDate() },
      },
      order: [["createdAt", "DESC"]],
      attributes: ["name", "version", "createdAt", "updatedAt"],
    });

    res.json({ result, api_result: constant.ok });
  } catch (error) {
    console.log(error);
    res.json({ error: error, api_result: constant.nok });
  }
});

router.delete("/storeProceduresUpdate/", async (req, res) => {
  try {
    const { name, version } = req.body;
    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );
    const tbStoreProcedures_update = new tbStoreProceduresUpdate_dynamic(
      vision_db
    );

    const result = await tbStoreProcedures_update.table.destroy({
      where: {
        name,
        version,
      },
    });

    res.json({ result, api_result: constant.ok });
  } catch (error) {
    console.log(error);
    res.json({ error: error, api_result: constant.nok });
  }
});

router.get("/compareStoreProceduresWithLastVersion/", async (req, res) => {
  try {
    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );
    const store_procedures_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-ibm-prd01-temp",
      "cthadmin",
      "CLS0DC2k3"
    );

    const tbStoreProcedures_version = new tbStoreProceduresVersion_dynamic(
      vision_db
    );
    const tbStoreProcedures_update = new tbStoreProceduresUpdate_dynamic(
      vision_db
    );

    //get last version from tbStoreProcedures_version
    const last_version = await tbStoreProcedures_version.table.findOne({
      attributes: ["version"],
      order: [["createdAt", "DESC"]],
    });

    //get lastest store procedures
    const lastest_store_procedures =
      await tbStoreProcedures_version.table.findAll({
        where: { version: last_version.version },
      });

    //get all current store procedures
    const sp_list = await store_procedures_db.sequelize.query(
      `select routine_name as name 
      from information_schema.routines  
      where routine_name in ('fnGetStockIdForReportPortal' , 'fnGetBlockId' , 'fnGetBlockId2') or routine_name like 'spReport%'`,
      {
        type: QueryTypes.SELECT,
      }
    );

    let current_storeProcedure = [];

    for (let index = 0; index < sp_list.length; index++) {
      const sp_name = sp_list[index].name;
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

      current_storeProcedure.push({ sp_name, store_code });
    }

    //compare store
    let updated_store_procedure = [];

    for (let index = 0; index < current_storeProcedure.length; index++) {
      const item = current_storeProcedure[index];
      const lastest_code = _.find(lastest_store_procedures, function (o) {
        return o.name == item.sp_name;
      });

      if (lastest_code == null) {
        updated_store_procedure.push(item.sp_name);
      } else if (item.store_code != lastest_code.code) {
        updated_store_procedure.push(item.sp_name);
      }
    }

    res.json({
      updated_store_procedure,
      api_result: constant.ok,
    });
  } catch (error) {
    console.log(error);
    res.json({ error: error, api_result: constant.nok });
  }
});

router.get("/test/:version", async (req, res) => {
  const vision_db = new dynamic_connection(
    "clsmessp20dev.database.windows.net",
    "clsmdb-cth-vision-qa03_Copy",
    "cthadmin",
    "CLS0DC2k3"
  );
  const tbStoreProcedures_update = new tbStoreProceduresUpdate_dynamic(
    vision_db
  );

  const { version } = req.params;
  const sp_name_updated = await tbStoreProcedures_update.table.findAll({
    where: { version },
  });

  let result = _.map(sp_name_updated, "name");

  res.json({ result, version });
});

module.exports = router;
