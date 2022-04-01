const Sequelize = require("sequelize");

module.exports = class tbStoreConnection_dynamic {
  constructor(class_connection) {
    this.table = class_connection.sequelize.define(
      "tbStoreConnection",
      {
        // attributes
        connection_name: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
        connection_string_encrypt: {
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
