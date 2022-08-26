const Sequelize = require("sequelize");
const { DataTypes } = require('sequelize');

module.exports = class tbDatasource_dynamic {
  constructor(class_connection) {
    this.table = class_connection.sequelize.define(
      "tbEventLog",
      {
        // attributes
        logId: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          allowNull: false,
          primaryKey: true,
        },
        logType: {
          type: Sequelize.STRING("MAX"),
        },
        logDetail: {
          type: Sequelize.STRING("MAX"),
        },
        parameter: {
          type: Sequelize.TEXT,
        },
        storedProcedureName: {
          type: Sequelize.STRING("MAX"),
        },
        apiName: {
          type: Sequelize.STRING("MAX"),
        },
        apiStartTime: {
          type: DataTypes.STRING ,
        },
        apiEndTime: {
          type: DataTypes.STRING ,
        },
        apiDuration: {
          type: Sequelize.FLOAT,
        },
        apiUser: {
          type: Sequelize.STRING("MAX"),
        },
        bu: {
          type: Sequelize.STRING("MAX"),
        },
        ip: {
          type: Sequelize.STRING("MAX"),
        },
        createdDateTime: {
          type: Sequelize.DATE,
        },
        isDeleted: {
          type: Sequelize.BOOLEAN,
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
