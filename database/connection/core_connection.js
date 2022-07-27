const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  "clsmdb-cth-ibm-prd01-temp",
  "cthadmin",
  "CLS0DC2k3",
  {
    // logging: false,
    host: "clsmessp20dev.database.windows.net",
    dialect: "mssql",
    dialectOptions: {
      options: {
        instanceName: "",
        requestTimeout: 0,
      },
    },
  }
);

(async () => {
  await sequelize.authenticate();
})();

module.exports = sequelize;
