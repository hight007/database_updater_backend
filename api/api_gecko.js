const express = require("express");
const constant = require("../util/constants");
const router = express.Router();

const { Sequelize, QueryTypes , Op } = require("sequelize");
const _ = require("lodash");

//import models
const sequelize = require("../database/connection/core_connection");
const dynamic_connection = require("../database/connection/dynamic_connection");
const tbGeckoItemNameList_dynamic = require("../database/models/tbGeckoItemNameList_dynamic");

const tbWidget_dynamic = require("../database/models/tbWidget_dynamic");
const tbWidgetVersion_dynamic = require("../database/models/tbWidgetVersion_dynamic");

const tbFilter_dynamic = require("../database/models/tbFilter_dynamic");
const tbFilterVersion_dynamic = require("../database/models/tbFilterVersion_dynamic");

const tbDashboard_dynamic = require("../database/models/tbDashBoard_dynamic");
const tbDashBoardVersion_dynamic = require("../database/models/tbDashBoardVersion_dynamic");

const tbDatasource_dynamic = require("../database/models/tbDatasource_dynamic_mantis");
const tbDatasourceVersion_dynamic = require("../database/models/tbDatasourceVersion_dynamic");

//widget_version
router.get("/tbWidgetVersion", async (req, res) => {
  try {
    //master connection
    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );
    const tbWidgetVersion = new tbWidgetVersion_dynamic(vision_db);

    const result = await tbWidgetVersion.table.findAll({
      attributes: [
        "name",
        [sequelize.fn("max", sequelize.col("version")), "version"],
      ],
      group: ["name"],
      raw: true,
    });

    res.json({ result, api_result: constant.ok });
  } catch (error) {
    res.json({ api_result: constant.nok, error: error.message });
  }
});

router.post("/tbWidgetVersion", async (req, res) => {
  try {
    const { version, name } = req.body;

    //master connection
    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );

    const TbWidget = new tbWidget_dynamic(vision_db);
    const tbWidgetVersion = new tbWidgetVersion_dynamic(vision_db);

    let condition = {
      raw: true,
    };
    if (name) {
      condition = {
        ...condition,
        where: {
          name: {
            [Op.or]: [...name],
          },
        },
      };
    }
    const result_widget = await TbWidget.table.findAll(condition);

    let snap_result = [];
    const nameList = _.map(result_widget, "name");
    let notFound_widget_list = [];
    for (let index = 0; index < name.length; index++) {
      const item = name[index];
      if (!nameList.includes(item)) {
        notFound_widget_list.push(item);
        snap_result.push({ name: item, status: "not_found" });
      }
    }

    let i = 0;
    let isError = false;
    let success_widget_list = [];
    let failed_widget_list = [];

    result_widget.forEach(async (item) => {
      try {
        item = { ...item, version };
        const create_result = await tbWidgetVersion.table.create(item);
        success_widget_list.push(create_result.name);
        snap_result.push({ name: create_result.name, status: "success" });
      } catch (error_) {
        failed_widget_list.push(item.name);
        snap_result.push({ name: item.name, status: "failed" });
        isError = true;
      } finally {
        i++;
        if (i >= result_widget.length) {
          if (isError) {
            res.json({
              api_result: constant.nok,
              success_widget_list,
              failed_widget_list,
              notFound_widget_list,
              snap_result,
            });
          } else {
            res.json({
              api_result: constant.ok,
              success_widget_list,
              failed_widget_list,
              notFound_widget_list,
              snap_result,
            });
          }
        }
      }
    });
  } catch (error) {
    res.json({ api_result: constant.nok, error: error.message });
  }
});

router.delete("/tbWidgetVersion", async (req, res) => {
  try {
    const { version, name } = req.body;

    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );

    let remove_condition = {
      version,
    };
    if (name) {
      remove_condition.name = {
        [Op.or]: [...name],
      };
    }

    const tbWidgetVersion = new tbWidgetVersion_dynamic(vision_db);

    const result_remove_widget = await tbWidgetVersion.table.destroy({
      where: remove_condition,
    });

    res.json({ api_result: constant.ok, result_remove_widget });
  } catch (error) {
    res.json({ api_result: constant.nok, error: error.message });
  }
});

router.patch("/tbWidget", async (req, res) => {
  try {
    const { version, connection, database, username, password } = req.body;

    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );

    const target_vision_db = new dynamic_connection(
      connection,
      database,
      username,
      password
    );

    const TbWidget_version = new tbWidgetVersion_dynamic(vision_db);
    const target_tbWidget = new tbWidget_dynamic(target_vision_db);
    await target_tbWidget.createTable();

    const result_widget_version = await TbWidget_version.table.findAll({
      raw: true,
      attributes: ["name", "xml", "UpdateBy"],
      where: { version },
    });

    if (result_widget_version.length <= 0) {
      res.json({
        api_result: constant.nok,
        error: `widget version ${version} not found`,
      });
      return;
    }

    let patch_result = [];
    let create_list = [];
    let update_list = [];
    let error_list = [];

    let i = 0;

    result_widget_version.forEach(async (item) => {
      //check is new widget
      const widget_count = await target_tbWidget.table.findAll({
        where: { name: item.name },
        attributes: ["name"],
      });

      try {
        if (widget_count.length > 0) {
          await target_tbWidget.table.update(item, {
            where: { name: item.name },
          });
          update_list.push(item.name);
          patch_result.push({ name: item.name, status: "update" });
        } else {
          await target_tbWidget.table.create(item);
          create_list.push(item.name);
          patch_result.push({ name: item.name, status: "create" });
        }
      } catch (error) {
        error_list.push(item.name);
        patch_result.push({ name: item.name, status: "error" });
      } finally {
        i++;
        if (i >= result_widget_version.length) {
          res.json({
            api_result: error_list.length > 0 ? constant.nok : constant.ok,
            create_list,
            update_list,
            error_list,
            patch_result,
          });
        }
      }
    });

    // res.json(result_widget_version);
  } catch (error) {
    res.json({ api_result: constant.nok, error: error.message });
  }
});

//filter
router.get("/tbFilterVersion", async (req, res) => {
  try {
    //master connection
    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );
    const tbFilterVersion = new tbFilterVersion_dynamic(vision_db);

    const result = await tbFilterVersion.table.findAll({
      attributes: [
        "name",
        [sequelize.fn("max", sequelize.col("version")), "version"],
      ],
      group: ["name"],
      raw: true,
    });

    res.json({ result, api_result: constant.ok });
  } catch (error) {
    res.json({ api_result: constant.nok, error: error.message });
  }
});

router.post("/tbFilterVersion", async (req, res) => {
  try {
    const { version, name } = req.body;

    //master connection
    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );

    const tbFilter = new tbFilter_dynamic(vision_db);
    const tbFilterVersion = new tbFilterVersion_dynamic(vision_db);

    let condition = {
      raw: true,
    };
    if (name) {
      condition = {
        ...condition,
        where: {
          name: {
            [Op.or]: [...name],
          },
        },
      };
    }

    const result_filter = await tbFilter.table.findAll(condition);
    let snap_result = [];
    const nameList = _.map(result_filter, "name");
    let notFound_filter_list = [];
    for (let index = 0; index < name.length; index++) {
      const item = name[index];
      if (!nameList.includes(item)) {
        notFound_filter_list.push(item);
        snap_result.push({ name: item, status: "not_found" });
      }
    }

    let i = 0;
    let isError = false;
    let success_filter_list = [];
    let failed_filter_list = [];
    result_filter.forEach(async (item) => {
      try {
        item = { ...item, version };
        const create_result = await tbFilterVersion.table.create(item);
        success_filter_list.push(create_result.name);
        snap_result.push({ name: create_result.name, status: "success" });
      } catch (error_) {
        failed_filter_list.push(item.name);
        snap_result.push({ name: item.name, status: "failed" });
        isError = true;
      } finally {
        i++;
        if (i >= result_filter.length) {
          if (isError) {
            res.json({
              api_result: constant.nok,
              success_filter_list,
              failed_filter_list,
              notFound_filter_list,
              snap_result,
            });
          } else {
            res.json({
              api_result: constant.ok,
              success_filter_list,
              failed_filter_list,
              notFound_filter_list,
              snap_result,
            });
          }
        }
      }
    });
  } catch (error) {
    res.json({ api_result: constant.nok, error: error.message });
  }
});

router.delete("/tbFilterVersion", async (req, res) => {
  try {
    const { version, name } = req.body;

    if (!version) {
      res.json({ api_result: constant.nok, error: "Please select version" });
      return;
    }
    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );

    let remove_condition = {
      version,
    };
    if (name) {
      remove_condition.name = {
        [Op.or]: [...name],
      };
    }

    const tbFilterVersion = new tbFilterVersion_dynamic(vision_db);

    const result_remove_filter = await tbFilterVersion.table.destroy({
      where: remove_condition,
    });

    res.json({ api_result: constant.ok, result_remove_filter });
  } catch (error) {
    res.json({ api_result: constant.nok, error: error.message });
  }
});

router.patch("/tbFilter", async (req, res) => {
  try {
    const { version, connection, database, username, password } = req.body;

    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );

    const target_vision_db = new dynamic_connection(
      connection,
      database,
      username,
      password
    );

    const tbFilter_version = new tbFilterVersion_dynamic(vision_db);
    const target_tbFilter = new tbFilter_dynamic(target_vision_db);
    await target_tbFilter.createTable();

    const result_filter_version = await tbFilter_version.table.findAll({
      raw: true,
      attributes: ["name", "xml", "UpdateBy"],
      where: { version },
    });

    if (result_filter_version.length <= 0) {
      res.json({
        api_result: constant.nok,
        error: `filter version ${version} not found`,
      });
      return;
    }

    let create_list = [];
    let update_list = [];
    let error_list = [];

    let i = 0;

    result_filter_version.forEach(async (item) => {
      //check is new filter
      const filter_count = await target_tbFilter.table.findAll({
        where: { name: item.name },
        attributes: ["name"],
      });

      try {
        if (filter_count.length > 0) {
          await target_tbFilter.table.update(item, {
            where: { name: item.name },
          });
          update_list.push(item.name);
        } else {
          await target_tbFilter.table.create(item);
          create_list.push(item.name);
        }
      } catch (error) {
        console.log(error);
        error_list.push(item.name);
      } finally {
        i++;
        if (i >= result_filter_version.length) {
          res.json({
            api_result: error_list.length > 0 ? constant.nok : constant.ok,
            create_list,
            update_list,
            error_list,
          });
        }
      }
    });

    // res.json(result_filter_version);
  } catch (error) {
    res.json({ api_result: constant.nok, error: error.message });
  }
});

//Dashboard
router.get("/tbDashboardVersion", async (req, res) => {
  try {
    //master connection
    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );
    const tbdashboardVersion = new tbDashBoardVersion_dynamic(vision_db);

    const result = await tbdashboardVersion.table.findAll({
      attributes: [
        "name",
        [sequelize.fn("max", sequelize.col("version")), "version"],
      ],
      group: ["name"],
      raw: true,
    });

    res.json({ result, api_result: constant.ok });
  } catch (error) {
    res.json({ api_result: constant.nok, error: error.message });
  }
});

router.post("/tbDashboardVersion", async (req, res) => {
  try {
    const { version, name } = req.body;

    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );

    const Tbdashboard = new tbDashboard_dynamic(vision_db);
    const tbdashboardVersion = new tbDashBoardVersion_dynamic(vision_db);

    let condition = {
      raw: true,
    };
    if (name) {
      condition = {
        ...condition,
        where: {
          name: {
            [Op.or]: [...name],
          },
        },
      };
    }
    const result_dashboard = await Tbdashboard.table.findAll(condition);

    let snap_result = [];
    const nameList = _.map(result_dashboard, "name");
    let notFound_dashboard_list = [];
    for (let index = 0; index < name.length; index++) {
      const item = name[index];
      if (!nameList.includes(item)) {
        notFound_dashboard_list.push(item);
        snap_result.push({ name: item, status: "not_found" });
      }
    }

    let i = 0;
    let isError = false;
    let success_dashboard_list = [];
    let failed_dashboard_list = [];
    result_dashboard.forEach(async (item) => {
      try {
        item = { ...item, version };
        const create_result = await tbdashboardVersion.table.create(item);
        success_dashboard_list.push(create_result.name);
        snap_result.push({ name: create_result.name, status: "success" });
      } catch (error_) {
        failed_dashboard_list.push(item.name);
        snap_result.push({ name: item.name, status: "failed" });
        isError = true;
      } finally {
        i++;
        if (i >= result_dashboard.length) {
          if (isError) {
            res.json({
              api_result: constant.nok,
              success_dashboard_list,
              failed_dashboard_list,
              notFound_dashboard_list,
              snap_result,
            });
          } else {
            res.json({
              api_result: constant.ok,
              success_dashboard_list,
              failed_dashboard_list,
              notFound_dashboard_list,
              snap_result,
            });
          }
        }
      }
    });
  } catch (error) {
    res.json({ api_result: constant.nok, error: error.message });
  }
});

router.delete("/tbDashboardVersion", async (req, res) => {
  try {
    const { version, name } = req.body;

    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );

    let remove_condition = {
      version,
    };
    if (name) {
      remove_condition.name = {
        [Op.or]: [...name],
      };
    }

    const tbdashboardVersion = new tbDashBoardVersion_dynamic(vision_db);

    const result_remove_dashboard = await tbdashboardVersion.table.destroy({
      where: remove_condition,
    });

    res.json({ api_result: constant.ok, result_remove_dashboard });
  } catch (error) {
    res.json({ api_result: constant.nok, error: error.message });
  }
});

router.patch("/tbDashboard", async (req, res) => {
  try {
    const { version, connection, database, username, password } = req.body;

    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );

    const target_vision_db = new dynamic_connection(
      connection,
      database,
      username,
      password
    );

    const Tbdashboard_version = new tbDashBoardVersion_dynamic(vision_db);
    const target_tbdashboard = new tbDashboard_dynamic(target_vision_db);
    await target_tbdashboard.createTable();

    const result_dashboard_version = await Tbdashboard_version.table.findAll({
      raw: true,
      attributes: ["name", "xml", "UpdateBy"],
      where: { version },
    });

    if (result_dashboard_version.length <= 0) {
      res.json({
        api_result: constant.nok,
        error: `dashboard version ${version} not found`,
      });
      return;
    }

    let create_list = [];
    let update_list = [];
    let error_list = [];

    let i = 0;

    result_dashboard_version.forEach(async (item) => {
      //check is new dashboard
      const dashboard_count = await target_tbdashboard.table.findAll({
        where: { name: item.name },
        attributes: ["name"],
      });

      try {
        if (dashboard_count.length > 0) {
          await target_tbdashboard.table.update(item, {
            where: { name: item.name },
          });
          update_list.push(item.name);
        } else {
          await target_tbdashboard.table.create(item);
          create_list.push(item.name);
        }
      } catch (error) {
        error_list.push(item.name);
      } finally {
        i++;
        if (i >= result_dashboard_version.length) {
          res.json({
            api_result: error_list.length > 0 ? constant.nok : constant.ok,
            create_list,
            update_list,
            error_list,
          });
        }
      }
    });

    // res.json(result_dashboard_version);
  } catch (error) {
    res.json({ api_result: constant.nok, error: error.message });
  }
});

//Mantis tbDatasource
router.get("/tbDatasourceVersion", async (req, res) => {
  try {
    //master connection
    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );
    const tbdatasourceVersion = new tbDatasourceVersion_dynamic(vision_db);

    const result = await tbdatasourceVersion.table.findAll({
      attributes: [
        "name",
        [sequelize.fn("max", sequelize.col("version")), "version"],
      ],
      group: ["name"],
      raw: true,
    });

    res.json({ result, api_result: constant.ok });
  } catch (error) {
    res.json({ api_result: constant.nok, error: error.message });
  }
});

router.post("/tbDatasourceVersion", async (req, res) => {
  try {
    const { version, name } = req.body;

    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );
    const mantis_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-mantis-qa04_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );

    const Tbdatasource = new tbDatasource_dynamic(mantis_db);
    const tbdatasourceVersion = new tbDatasourceVersion_dynamic(vision_db);
    tbdatasourceVersion.createTable();

    let condition = {
      raw: true,
    };
    if (name) {
      condition = {
        ...condition,
        where: {
          name: {
            [Op.or]: [...name],
          },
        },
      };
    }
    const result_datasource = await Tbdatasource.table.findAll(condition);

    let snap_result = [];
    const nameList = _.map(result_datasource, "name");
    let notFound_datasource_list = [];
    for (let index = 0; index < name.length; index++) {
      const item = name[index];
      if (!nameList.includes(item)) {
        notFound_datasource_list.push(item);
        snap_result.push({ name: item, status: "not_found" });
      }
    }

    let i = 0;
    let isError = false;
    let success_datasource_list = [];
    let failed_datasource_list = [];
    result_datasource.forEach(async (item) => {
      try {
        item = { ...item, version };
        const create_result = await tbdatasourceVersion.table.create(item);
        success_datasource_list.push(create_result.name);
        snap_result.push({ name: create_result.name, status: "success" });
      } catch (error_) {
        failed_datasource_list.push(item.name);
        snap_result.push({ name: item.name, status: "failed" });
        isError = true;
      } finally {
        i++;
        if (i >= result_datasource.length) {
          if (isError) {
            res.json({
              api_result: constant.nok,
              success_datasource_list,
              failed_datasource_list,
              notFound_datasource_list,
              snap_result,
            });
          } else {
            res.json({
              api_result: constant.ok,
              success_datasource_list,
              failed_datasource_list,
              notFound_datasource_list,
              snap_result,
            });
          }
        }
      }
    });
  } catch (error) {
    res.json({ api_result: constant.nok, error: error.message });
  }
});

router.delete("/tbDatasourceVersion", async (req, res) => {
  try {
    const { version, name } = req.body;

    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );

    let remove_condition = {
      version,
    };
    if (name) {
      remove_condition.name = {
        [Op.or]: [...name],
      };
    }

    const tbdatasourceVersion = new tbDatasourceVersion_dynamic(vision_db);

    const result_remove_datasource = await tbdatasourceVersion.table.destroy({
      where: remove_condition,
    });

    res.json({ api_result: constant.ok, result_remove_datasource });
  } catch (error) {
    res.json({ api_result: constant.nok, error: error.message });
  }
});

router.patch("/tbDatasource", async (req, res) => {
  try {
    const { version, connection, database, username, password } = req.body;

    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );

    const target_vision_db = new dynamic_connection(
      connection,
      database,
      username,
      password
    );

    const Tbdatasource_version = new tbDatasourceVersion_dynamic(vision_db);
    const target_tbdatasource = new tbDatasource_dynamic(target_vision_db);

    await target_tbdatasource.createTable();

    const result_datasource_version = await Tbdatasource_version.table.findAll({
      raw: true,
      attributes: [
        "name",
        "xml",
        "datasourceTypeID",
        "description",
        "extendedInfo",
      ],
      where: { version },
    });

    if (result_datasource_version.length <= 0) {
      res.json({
        api_result: constant.nok,
        error: `datasource version ${version} not found`,
      });
      return;
    }

    let create_list = [];
    let update_list = [];
    let error_list = [];

    const ems = await target_tbdatasource.table.sequelize.query(
      `SELECT [appID]
    FROM [dbo].[tbApps]
    where name like '%ems%'`,
      { type: QueryTypes.SELECT }
    );

    const checkPermissionMantis = async (name, DataSourceID) => {
      for (let index = 0; index < ems.length; index++) {
        const appID = ems[index].appID;
        const tbDatasourceApp = await target_tbdatasource.table.sequelize.query(
          `SELECT [datasourceAppId]
          FROM [dbo].[tbDatasourceApp]
          where [appId] = ${appID} and [DataSourceID] = ${DataSourceID}`,
          { type: QueryTypes.SELECT }
        );
        console.log(tbDatasourceApp.length);
        if (tbDatasourceApp.length == 0) {
          await target_tbdatasource.table.sequelize.query(
            `INSERT INTO [dbo].[tbDatasourceApp]
            ([datasourceName]
            ,[appId]
            ,[DataSourceID])
      VALUES
            ('${name}'
            ,${appID}
            ,${DataSourceID}) `,
            { type: QueryTypes.INSERT }
          );
        }
      }
    };

    let i = 0;

    result_datasource_version.forEach(async (item) => {
      //check is new datasource
      const datasource_count = await target_tbdatasource.table.findAll({
        where: { name: item.name },
        attributes: ["name"],
      });

      try {
        if (datasource_count.length > 0) {
          await target_tbdatasource.table.update(item, {
            where: { name: item.name },
          });

          const select_result = await target_tbdatasource.table.findOne({
            where: { name: item.name },
            attributes: ["DataSourceID"],
          });
          checkPermissionMantis(item.name, select_result.DataSourceID);

          update_list.push(item.name);
        } else {
          const create_result = await target_tbdatasource.table.create(item);
          checkPermissionMantis(item.name, create_result.DataSourceID);

          create_list.push(item.name);
        }
      } catch (error) {
        console.log(error);
        error_list.push(item.name);
      } finally {
        i++;
        if (i >= result_datasource_version.length) {
          res.json({
            api_result: error_list.length > 0 ? constant.nok : constant.ok,
            create_list,
            update_list,
            error_list,
          });
        }
      }
    });

    // res.json(result_datasource_version);
  } catch (error) {
    console.log(error);
    res.json({ api_result: constant.nok, error: error.message });
  }
});

//Gecko items
router.get("/tbGeckoItemNameList/type/:type", async (req, res) => {
  try {
    const { type } = req.params;

    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );
    const tbGeckoItemNameList = new tbGeckoItemNameList_dynamic(vision_db);

    const result = await tbGeckoItemNameList.table.findAll({
      where: {
        type,
      },
    });

    res.json({ api_result: constant.ok, result });
  } catch (error) {
    res.json({ api_result: constant.nok, error: error.message });
  }
});

router.post("/tbGeckoItemNameList", async (req, res) => {
  try {
    const data = req.body;

    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );
    const tbGeckoItemNameList = new tbGeckoItemNameList_dynamic(vision_db);
    await tbGeckoItemNameList.createTable();

    const create_result = await tbGeckoItemNameList.table.create(data);

    res.json({ api_result: constant.ok, create_result });
  } catch (error) {
    console.log(error);
    res.json({ api_result: constant.nok, error: error.message });
  }
});

router.delete("/tbGeckoItemNameList", async (req, res) => {
  try {
    const { name, type } = req.body;

    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );

    const tbGeckoItemNameList = new tbGeckoItemNameList_dynamic(vision_db);

    console.log(name, " ", type);
    const result_remove_GeckoItemNameList =
      await tbGeckoItemNameList.table.destroy({
        where: {
          name,
          type,
        },
      });

    res.json({ api_result: constant.ok, result_remove_GeckoItemNameList });
  } catch (error) {
    res.json({ api_result: constant.nok, error: error.message });
  }
});

router.put("/tbGeckoItemNameList", async (req, res) => {
  try {
    const { name, type, isDeleted } = req.body;

    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );

    const tbGeckoItemNameList = new tbGeckoItemNameList_dynamic(vision_db);

    const result_remove_GeckoItemNameList =
      await tbGeckoItemNameList.table.update(
        { isDeleted },
        {
          where: {
            name,
            type,
          },
        }
      );

    res.json({ api_result: constant.ok, result_remove_GeckoItemNameList });
  } catch (error) {
    res.json({ api_result: constant.nok, error: error.message });
  }
});

//filter version
router.get("/version/", async (req, res) => {
  try {
    const { type } = req.params;

    const vision_db = new dynamic_connection(
      "clsmessp20dev.database.windows.net",
      "clsmdb-cth-vision-qa03_Copy",
      "cthadmin",
      "CLS0DC2k3"
    );

    const tbWidgetVersion = new tbWidgetVersion_dynamic(vision_db);
    const tbFilterVersion = new tbFilterVersion_dynamic(vision_db);
    const tbDashBoardVersion = new tbDashBoardVersion_dynamic(vision_db);
    const tbDatasourceVersion = new tbDatasourceVersion_dynamic(vision_db);

    let widgetVersion = await tbWidgetVersion.table.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("version")), "version"],
      ],
      order: [["version", "desc"]],
    });
    let filterVersion = await tbFilterVersion.table.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("version")), "version"],
      ],
      order: [["version", "desc"]],
    });
    let dashBoardVersion = await tbDashBoardVersion.table.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("version")), "version"],
      ],
      order: [["version", "desc"]],
    });
    let datasourceVersion = await tbDatasourceVersion.table.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("version")), "version"],
      ],
      order: [["version", "desc"]],
    });

    const version = _.union(
      _.map(widgetVersion, "version"),
      _.map(filterVersion, "version"),
      _.map(dashBoardVersion, "version"),
      _.map(datasourceVersion, "version")
    );

    res.json({ api_result: constant.ok, version });
  } catch (error) {
    res.json({ api_result: constant.nok, error: error.message });
  }
});

module.exports = router;
