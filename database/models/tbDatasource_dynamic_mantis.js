const Sequelize = require("sequelize");

module.exports = class tbDatasource_dynamic {
  constructor(class_connection) {
    this.table = class_connection.sequelize.define(
      "tbDatasource",
      {
        // attributes
        name: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
        xml: {
          type: Sequelize.STRING("MAX"),
        },
        datasourceTypeID: {
          type: Sequelize.INTEGER,
        },
        description: {
          type: Sequelize.STRING,
        },
        extendedInfo: {
          type: Sequelize.STRING,
        },
        DataSourceID: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
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
