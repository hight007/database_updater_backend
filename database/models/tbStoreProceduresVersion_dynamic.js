const Sequelize = require("sequelize");

module.exports = class tbStoreConnection_dynamic {
  constructor(class_connection) {
    this.table = class_connection.sequelize.define(
      "tbStoreProceduresVersion",
      {
        // attributes
        name: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
        code: {
          type: Sequelize.TEXT,
        },
        version : {
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
