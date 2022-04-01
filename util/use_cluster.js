const cluster = require("cluster");
const cCPUs = require('os').cpus().length;

module.exports = function (isUseCluster, port, app) {
  if (isUseCluster) {
    if (cluster.isMaster) {
      // Create a worker for each CPU
      for (var i = 0; i < cCPUs; i++) {
        cluster.fork();
      }

      cluster.on("online", function (worker) {
        console.log("Worker " + worker.process.pid + " is online.");
      });
      cluster.on("exit", function (worker, code, signal) {
        console.log("worker " + worker.process.pid + " died.");
      });
    } else {
      app.listen(port, () => {
        console.log(`Backend is running port : ${port} ...`);
      });
    }
  } else {
    app.listen(port, () => {
      console.log(`Backend is running port : ${port} ...`);
    });
  }
};
