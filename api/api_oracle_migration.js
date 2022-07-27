const express = require("express");
const constant = require("../util/constants");
const router = express.Router();
const oracledb = require("oracledb");
const { Sequelize, QueryTypes, Op } = require("sequelize");
const moment = require("moment");

//models
const dynamic_connection = require("../database/connection/dynamic_connection");

router.patch("/tbDESResult", async (req, res) => {
  try {
    const { user, password, connectionString } = req.body.oracle;
    const { user_, password_, connectionString_, database_ } =
      req.body.sqlserver;

    let connection;
    try {
      connection = await oracledb.getConnection({
        user,
        password,
        connectionString,
      });

      const result = await connection.execute(
        `SELECT * FROM des_result `, // bind value for :id
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const sql_connection = new dynamic_connection(
        connectionString_,
        database_,
        user_,
        password_
      );

      let n = 0;
      result.rows.forEach(async (item) => {
        try {
          const requestLoop = item.TEST_LOOP;
          const ticket = item.TICKET;

          const stock = await sql_connection.sequelize.query(
            `select stockId from tbstock where name = '${item.SN}' order by startDate desc`,
            { type: QueryTypes.SELECT }
          );
          const stockId = stock[0].stockId;

          const ip = item.IP;
          const hostname = item.HOSTNAME;

          const rawData = item.RESULT;
          const rawDataType = "XML";
          const status = item.STATUS;
          const updatedDateTime = null;
          const updatedBy = null;
          const createdDateTime = moment(item.DATETIME).format(
            "DD-MMM-YYYY HH:mm:ss"
          );
          const createdBy = 2;
          const identyfy = item.IDENTIFY == "N" ? 0 : 1;

          console.log(stockId);

          const sql_result = await sql_connection.sequelize.query(
            `INSERT INTO [dbo].[tbDESResult]
            ([requestLoop]
            ,[stockTicketId]
            ,[stockId]
            ,[IP]
            ,[hostName]
            ,[rawData]
            ,[rawDataType]
            ,[status]
            ,[updatedDateTime]
            ,[updatedBy]
            ,[createdDateTime]
            ,[createdBy]
            ,[isArchive]
            ,[archiveDate]
            ,[isDeleted]
            ,[ticket]
            ,[isActive]
            ,[siteBuId]
            ,[isIdentify])
      VALUES
            ('${requestLoop}'
            ,null
            ,'${stockId}'
            ,'${ip}'
            ,'${hostname}'
            ,'${rawData}'
            ,'${rawDataType}'
            ,'${status}'
            ,null
            ,null
            ,'${createdDateTime}'
            ,2
            ,null
            ,null
            ,0
            ,'${ticket}'
            ,1
            ,null
            ,'${identyfy}')`
          );

          console.log(sql_result);
          console.log(n, result.rows.length - 1);
          if (n >= result.rows.length - 1) {
            res.json({ result: result.rows, api_result: constant.ok });
          } else {
            n++;
          }
        } catch (error) {
          console.error(error);
          // res.json({ error, api_result: constant.nok });
        }
      });
    } catch (err) {
      console.error(err);
      res.json({ err, api_result: constant.nok });
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error(err);
          res.json({ err, api_result: constant.nok });
        }
      }
    }
  } catch (error) {
    console.error(error);
    res.json({ error, api_result: constant.nok });
  }
});
 
router.patch("/tbStockComponent", async (req, res) => {
  try {
    const { user, password, connectionString } = req.body.oracle;
    const { user_, password_, connectionString_, database_ } =
      req.body.sqlserver;

    let connection;
    try {
      connection = await oracledb.getConnection({
        user,
        password,
        connectionString,
      });
      const sql_connection = new dynamic_connection(
        connectionString_,
        database_,
        user_,
        password_
      );

      const totalData = await connection.execute(
        `SELECT count(*) as count from sn_component
        WHERE sn in(select sn from sn_master WHERE 
        to_char(trunc(REGIST_DATE),'YYYYMMDD') > '20210701')`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const rowsPerLoop = 100000;
      const totalRows = totalData.rows[0].COUNT;
      const loopTime = parseInt(totalRows / rowsPerLoop);

      let nn = 0;
      for (let index = 26; index < loopTime + 1; index++) {
        const result = await connection.execute(
          `SELECT * from sn_component
          WHERE sn in(select sn from sn_master WHERE 
          to_char(trunc(REGIST_DATE),'YYYYMMDD') > '20210701')
          order by sn
          OFFSET ${index * rowsPerLoop} ROWS 
          FETCH NEXT ${rowsPerLoop} ROWS ONLY
          `,
          [],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        console.log(result.rows.length);
        //insert data to sql server
        try {
          let n = 0;
          result.rows.forEach(async (item) => {
            //SN
            const stock = await sql_connection.sequelize.query(
              `select stockId from tbstock where name = '${item.SN}' order by startDate desc`,
              { type: QueryTypes.SELECT }
            );
            const stockId = stock[0].stockId;
            // console.log(stock);

            //PN
            const pn = await sql_connection.sequelize.query(
              `select partId from tbPartNumber where pn = '${item.PN}'`,
              { type: QueryTypes.SELECT }
            );
            const partId = pn[0].partId;
            // console.log(pn);

            //KIT
            const kit = await sql_connection.sequelize.query(
              `select kitid from tbKit where name = '${item.PN}'`,
              { type: QueryTypes.SELECT }
            );
            const kitId = kit.length > 0 ? kit[0].kitid : "null";

            //assyProfileDetailId
            const assyProfile = await sql_connection.sequelize.query(
              `select ad.assyProfileDetailId from tbOrder o 
              join tbBom b on b.bomId = o.bomId
              join tbBomDetail bd on bd.bomId = b.bomId
              join tbBomDetailRD brd on brd.bomDetailId = bd.bomDetailId
              join tbRD rd on brd.rdId = rd.rdId
              join tbAssyprofileDetail ad on ad.bomDetailId = brd.bomDetailId and ad.bomDetailRDId = brd.bomDetailRDId
              join tbAssyProfile ap on ap.assyProfileId = ad.assyProfileId
              where o.name = '${item.SO}' and rd.name = '${item.RD}' and ap.name = '${item.ASSY_PROFILE_ID}'`,
              { type: QueryTypes.SELECT }
            );
            const assyProfileDetailId =
              assyProfile.length > 0
                ? assyProfile[0].assyProfileDetailId
                : "null";
            // console.log(assyProfile);

            //login
            const login = await sql_connection.sequelize.query(
              `select loginId from tblogin where en = '${item.ACTOR}''`,
              { type: QueryTypes.SELECT }
            );
            const loginId = login.length > 0 ? login[0].loginId : "null";
            // console.log(login);

            //Operation
            const operation = await sql_connection.sequelize.query(
              `select operationId from tbOperation where name= '${item.STATION}''`,
              { type: QueryTypes.SELECT }
            );
            const operationId = operation.length > 0 ? operation[0].operationId : "null";
            // console.log(operation);

            //rd
            const rd = await sql_connection.sequelize.query(
              `select rdId from tbrd where name= '${item.RD}''`,
              { type: QueryTypes.SELECT }
            );
            const rdId = rd.length > 0 ? rd[0].rdId : "null";
            // console.log(rd);

            const sql_result = await sql_connection.sequelize.query(
              `INSERT INTO [dbo].[tbStockComponent]
              ([stockId]
              ,[partId]
              ,[kitId]
              ,[qty]
              ,[componentLevel]
              ,[assyProfileDetailId]
              ,[createdBy]
              ,[updatedBy]
              ,[isActive]
              ,[updatedDateTime]
              ,[createdDateTime]
              ,[isArchive]
              ,[archiveDate] 
              ,[transDate]
              ,[isDeleted]
              ,[siteBuId]
              ,[operationId]
              ,[rdId])
        VALUES
              (${stockId}
              ,${partId}
              ,${kitId}
              ,${item.QTY}
              ,${item.COMP_LEVEL}
              ,${assyProfileDetailId ? assyProfileDetailId : "null"}
              ,${loginId}
              ,null
              ,1
              ,null
              ,'${moment(item.DATETIME).format("DD-MMM-YYYY HH:mm:ss")}'
              ,0
              ,null
              ,'${moment(item.DATETIME).format("DD-MMM-YYYY")}'
              ,0
              ,NULL
              ,${operationId}
              ,${rdId}`
            );

            console.log(sql_result);

            if (n >= result.rows.length - 1) {
              nn += n;
            } else {
              n++;
            }
          });

          // if (nn == totalRows ) {
          if (nn == totalRows - index * rowsPerLoop) {
            res.json({ api_result: constant.ok, loopTime, totalRows });
          }
        } catch (error) {
          console.log(error);
        }
      }
    } catch (err) {
      console.error(err);
      res.json({ err, api_result: constant.nok });
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error(err);
          res.json({ err, api_result: constant.nok });
        }
      }
    }
  } catch (error) {
    console.error(error);
    res.json({ error, api_result: constant.nok });
  }
});

module.exports = router;
