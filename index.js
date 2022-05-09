const express = require("express");
const cors = require("cors");
const use_cluster = require("./util/use_cluster");
const port = 2010

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

//api require module
app.use("/api/gecko/", require("./api/api_gecko"));
app.use("/api/storeConnection/", require("./api/api_store_connection"));
app.use("/api/storeProcedures/", require("./api/api_store_procedures"));

// use cluster
use_cluster(true, 2010, app);

// app.listen(port, () => {
//   console.log(`Backend is running port : ${port} ...`);
// });
