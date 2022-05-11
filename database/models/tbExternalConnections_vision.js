const Sequelize = require("sequelize");

module.exports = class tbDashboard_dynamic {
  constructor(class_connection) {
    this.table = class_connection.sequelize.define(
      "tbExternalConnections",
      {
        // attributes
        externalConnectionsId: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          allowNull: false,
          primaryKey: true,
        },
        name: {
          type: Sequelize.STRING,
          unique: true,
          allowNull: false,
        },
        serverName: {
          type: Sequelize.STRING("MAX"),
        },
        database: {
          type: Sequelize.STRING("MAX"),
        },
        user: {
          type: Sequelize.STRING("MAX"),
        },
        password: {
          type: Sequelize.STRING("MAX"),
        },
        extConfig: {
          type: Sequelize.STRING("MAX"),
        },
        connectionProviderId: {
          type: Sequelize.INTEGER,
        },
        createdBy: {
          type: Sequelize.INTEGER,
        },

        createdDateTime: {
          type: Sequelize.DATE,
        },
        updatedBy: {
          type: Sequelize.INTEGER,
        },
        updatedDateTime: {
          type: Sequelize.DATE,
        },

        isDeleted: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },
      },
      {
        freezeTableName: true,
        timestamps: false,
      }
    );
  }

  async createTable(forceDeleted = false) {
    await this.table.sync({ force: forceDeleted });
  }
};
