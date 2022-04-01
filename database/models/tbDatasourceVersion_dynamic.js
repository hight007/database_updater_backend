const Sequelize = require("sequelize");

module.exports = class tbDatasourceVersion_dynamic {
  constructor(class_connection) {
    this.table = class_connection.sequelize.define(
      "tbDatasourceVersion",
      {
        // attributes
        name: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
        xml: {
          type: Sequelize.STRING("MAX"),
        },
        datasourceTypeID: {
          type: Sequelize.INTEGER,
        },
        description: {
          type: Sequelize.STRING,
        },
        extendedInfo: {
          type: Sequelize.STRING,
        },
        DataSourceID: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          allowNull: false,
        },
        version: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
      },
      {
        freezeTableName: true,
      }
    );
  }

  async createTable() {
    await this.table.sync({ force: false });
  }
};
