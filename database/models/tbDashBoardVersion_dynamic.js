const Sequelize = require("sequelize");

module.exports = class tbDashboardVersion_dynamic {
  constructor(class_connection) {
    this.table = class_connection.sequelize.define(
      "tbDashboardVersion",
      {
        // attributes
        name: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
        xml: {
          type: Sequelize.STRING("MAX"),
        },
        UpdateBy: {
          type: Sequelize.INTEGER,
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
