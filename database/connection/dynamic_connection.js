const Sequelize = require("sequelize");

module.exports = class dynamic_connection {
  constructor(host, database, usename, password) {
    this.sequelize = new Sequelize(database, usename, password, {
      logging: false,
      host,
      dialect: "mssql",
      dialectOptions: {
        options: {
          instanceName: "",
          requestTimeout: 60000000,
          connectTimeout: 60000000
        },  
      },
      pool: {
        max: 10, 
        min: 0,
        acquire: 12000000,
        idle: 1200000,
        evict: 12000000, 
      },
    });
  }
}; 
