const Sequelize = require("sequelize");

module.exports = class tbDatasource_dynamic {
  constructor(class_connection) {
    this.table = class_connection.sequelize.define(
      "tbDatasource",
      {
        // attributes
        datasourceId: {
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
        xml: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        connectionProviderId: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },

        createdBy: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        createdDateTime: {
          type: Sequelize.DATE,
          allowNull: false,
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

  async createTable() {
    await this.table.sync({ force: false });
  }
};
