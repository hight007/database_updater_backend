const Sequelize = require("sequelize");

module.exports = class tbDashboard_dynamic {
  constructor(class_connection) {
    this.table = class_connection.sequelize.define(
      "tbDashboard",
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
      },
      {
        freezeTableName: true,
        timestamps: false,
      }
    );
  }

  async createTable() {
      await this.table.sync({ force: false });
  }
};
