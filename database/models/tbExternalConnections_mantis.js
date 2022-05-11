const Sequelize = require("sequelize");

module.exports = class tbDashboard_dynamic {
  constructor(class_connection) {
    this.table = class_connection.sequelize.define(
      "tbExternalConnections",
      {
        // attributes
        name: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
        serverName: {
          type: Sequelize.STRING("MAX"),
        },
        database: {
          type: Sequelize.STRING,
        },
        user: {
          type: Sequelize.STRING,
        },
        password: {
          type: Sequelize.STRING,
        },
        extConfig: {
          type: Sequelize.STRING,
        },
        conProId: {
          type: Sequelize.INTEGER,
        },
        ConnectionID: {
          type: Sequelize.INTEGER,
          allowNull: false,
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
