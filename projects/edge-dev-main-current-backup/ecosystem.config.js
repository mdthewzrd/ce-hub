module.exports = {
  "apps": [
    {
      "name": "edge-dev-prod",
      "script": "npm start",
      "instances": "max",
      "exec_mode": "fork",
      "watch": false,
      "max_memory_restart": "1G",
      "env": {
        "NODE_ENV": "production",
        "PORT": 5657
      },
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
      "error_file": "/var/log/edge-dev/error.log",
      "out_file": "/var/log/edge-dev/out.log",
      "log_file": "/var/log/edge-dev/combined.log"
    }
  ]
};