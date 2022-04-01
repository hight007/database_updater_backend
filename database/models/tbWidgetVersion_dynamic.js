const Sequelize = require("sequelize");

module.exports = class tbWidgetVersion_dynamic {
  constructor(class_connection) {
    this.table = class_connection.sequelize.define(
      "tbWidgetVersion",
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
        version : {
          type: Sequelize.STRING,
          primaryKey: true,
        }
      },
      {
        freezeTableName: true,
        // timestamps: false,
      }
    );
  }

  async createTable(force = false) {
    await this.table.sync({ force });
  }
};
