const Sequelize = require("sequelize");

module.exports = class tbFilterVersion_dynamic {
  constructor(class_connection) {
    this.table = class_connection.sequelize.define(
      "tbFilterVersion",
      {
        // attributes
        name: {
          type: Sequelize.STRING,
        },
        xml: {
          type: Sequelize.STRING("MAX"),
        },
        UpdateBy: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        filterId: {
          type: Sequelize.INTEGER,
          primaryKey: true,
        },
        version : {
          type: Sequelize.STRING,
          primaryKey: true,
        }
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
