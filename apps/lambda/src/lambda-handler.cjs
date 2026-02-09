const path = require("path");

process.env.TS_NODE_PROJECT =
    process.env.TS_NODE_PROJECT ?? path.resolve(__dirname, "..", "tsconfig.json");

require("ts-node/register/transpile-only");

const { lambdaHandler } = require("./lambda");

exports.handler = async (event, context) => {
    return lambdaHandler(event, context);
};
