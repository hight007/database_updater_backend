const dynamic_connection = require("./database/connection/dynamic_connection");
const { Sequelize, QueryTypes, Op } = require("sequelize");
const moment = require("moment");
const fs = require('fs');



const checkSession = async (round) => {
  const vision_db = new dynamic_connection(
    "clsmdbs-cth-dr-prd01.database.windows.net",
    "clsmdb-cth-ciena-prd01",
    "dbadmin",
    "CTHSPPR02k19"
  );
  const result = await vision_db.sequelize.query(
    `SELECT req.session_id
    , req.status
    , req.start_time
    , req.cpu_time AS 'cpu_time_ms'
    , req.logical_reads,req.dop
    , s.login_name
    , s.host_name
    , s.program_name
    , OBJECT_NAME(st.objectid,st.dbid) 'ObjectName'
    , REPLACE (REPLACE (SUBSTRING (st.text,(req.statement_start_offset/2) + 1,
       ((CASE req.statement_end_offset    WHEN -1    THEN DATALENGTH(st.text)
         ELSE req.statement_end_offset END - req.statement_start_offset)/2) + 1),
         CHAR(10), ' '), CHAR(13), ' ') AS statement_text

      FROM sys.dm_exec_requests as req
      JOIN sys.dm_exec_sessions as s on req.session_id=s.session_id
      CROSS APPLY sys.dm_exec_sql_text(req.sql_handle) as st
      OUTER APPLY sys.dm_exec_query_plan(req.plan_handle) as qp
      OUTER APPLY sys.dm_exec_query_statistics_xml(req.session_id) as qsx
      ORDER BY req.cpu_time desc;
      `,
    {
      type: QueryTypes.SELECT,
    }
  );

  // console.log(
  //   moment().format("DD-MMM-YYYY HH:mm:ss"),
  //   "round : " + round,
  //   "session found : " + result.length
  // );

  for (var i = 0; i < result.length; i++) {
    session = result[i];
    await fs.appendFileSync('session.txt', '\n' + moment().format("DD-MMM-YYYY HH:mm:ss") + ',\t' + "round : " + round + ',\t' + "session found : " + result.length + '\t' + "query : " + session.statement_text , function (err) {
      if (err) return console.log(err);
    });
  }

  await  fs.appendFileSync('session.txt', '\n' +'------------------------------------------' , function (err) {
    if (err) return console.log(err);
  });

  

  if (result.length > 1) {
    console.log(result);
  }
  return;
};

const init = () => {
  let i = 0;
  setInterval(() => {
    return new Promise((resolve, reject) => {
      i++;
      resolve(checkSession(i));
    });
  }, 1000);
};

init();
