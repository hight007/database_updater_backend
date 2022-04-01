const Sequelize = require("sequelize");

module.exports = class tbFilter_dynamic {
  constructor(class_connection) {
    this.table = class_connection.sequelize.define(
      "tbFilter",
      {
        // attributes
        name: {
          type: Sequelize.STRING,
          unique: true
        },
        xml: {
          type: Sequelize.STRING("MAX"),
        },
        UpdateBy: {
          type: Sequelize.INTEGER,
        },
        filterId: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
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
