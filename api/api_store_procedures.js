const express = require("express");
const router = express.Router();
const constant = require("../util/constants");
const { QueryTypes } = require("sequelize");
//connection
const dynamic_connection = require("../database/connection/dynamic_connection");
const tbStoreProceduresVersion_dynamic = require("../database/models/tbStoreProceduresVersion_dynamic");

router.post("/snap", async (req, res) => {
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

    const sp_list = await store_procedures_db.sequelize.query(
      `WITH SP as 
        (
        SELECT [schema] = SCHEMA_NAME([schema_id]),
          name
        FROM sys.procedures
        )
        select name from SP where [name] like 'spReport%'`,
      {
        type: QueryTypes.SELECT,
      }
    );

    let error_list = [];
    let success_list = [];
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
      store_code = store_code.replace(
        "CREATE PROCEDURE",
        "CREATE  OR   ALTER   PROCEDURE"
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
    }

    res.json({ success_list, error_list });
  } catch (error) {
    console.log(error);
    res.json({ error: error, api_result: constant.nok });
  }
});

module.exports = router;
