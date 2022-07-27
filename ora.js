const oracledb = require("oracledb");

async function run() {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: "LANDIS_GYR",
      password: "landiS_gYr10",
      connectionString: "xsdc-scan.th-lcb.celestica.com/o4ibs",
    });

    console.log("Successfully connected to Oracle Database");

    // Now query the rows back 

    const result = await connection.execute( 
      `SELECT * FROM line_master` // bind value for :id
    );
    console.log(result);
 
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) { 
      try { 
        await connection.close();
      } catch (err) {  
        console.error(err);
      }
    }
  }
}

run();