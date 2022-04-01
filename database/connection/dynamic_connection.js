const Sequelize = require("sequelize");

module.exports = class dynamic_connection {
  constructor(host, database, usename, password) {
    this.sequelize = new Sequelize(database, usename, password, {
      // logging: false,
      host,
      dialect: "mssql",
      dialectOptions: {
        options: {
          instanceName: "",
        },
      },
    });
  }
};
