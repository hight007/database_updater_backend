const Sequelize = require("sequelize");

module.exports = class tbGeckoItemName_dynamic {
  constructor(class_connection) {
    this.table = class_connection.sequelize.define(
      "tbGeckoItemNameList",
      {
        // attributes
        name: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
        type: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
        isDeleted: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        UpdateBy: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
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
