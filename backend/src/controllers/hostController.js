const hostService = require("../services/hostService");

async function dashboard(req, res) {
  res.json(await hostService.getOverview(req.user._id));
}

module.exports = { dashboard };
