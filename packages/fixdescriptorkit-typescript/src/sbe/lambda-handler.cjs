require("ts-node/register/transpile-only");

const { lambdaHandler } = require("./lambda");

exports.handler = async (event, context) => {
    return lambdaHandler(event, context);
};
