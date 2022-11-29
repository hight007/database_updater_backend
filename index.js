const express = require("express");
const cors = require("cors");
const use_cluster = require("./util/use_cluster");
const port = 2010;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

//api require module
app.use("/api/gecko/", require("./api/api_gecko"));
app.use("/api/storeConnection/", require("./api/api_store_connection"));
app.use("/api/storeProcedures/", require("./api/api_store_procedures"));
app.use("/api/migration/", require("./api/api_migration"));
app.use("/api/oracle_migration/", require("./api/api_oracle_migration"));
app.use("/api/analytics/", require("./api/api_analytics"));
app.use("/api/omise" , require("./api/api_omise"));

// use cluster
use_cluster(false, 2010, app);

// app.listen(port, () => {
//   console.log(`Backend is running port : ${port} ...`);
// });
 