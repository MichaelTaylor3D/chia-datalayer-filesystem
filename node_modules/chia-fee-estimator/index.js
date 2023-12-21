const superagent = require("superagent");
const https = require("https");
const defaultConfig = require("./defaultConfig");
const { getChiaRoot  } = require("chia-root-resolver");
const path = require("path");
const os = require("os");
const fs = require("fs");

let currentConfig = defaultConfig;

function configure(newConfig) {
  currentConfig = { ...currentConfig, ...newConfig };
}

const getBaseOptions = (config) => {
  if (!config) {
    config = currentConfig;
  }

  const chiaRoot = getChiaRoot();
  let cert, key;

  if (process.env.CHIA_CERT_BASE64 && process.env.CHIA_KEY_BASE64) {
    console.log(`Using cert and key from environment variables.`);

    cert = Buffer.from(process.env.CHIA_CERT_BASE64, "base64").toString(
      "ascii"
    );
    key = Buffer.from(process.env.CHIA_KEY_BASE64, "base64").toString("ascii");
  } else {
    let certificateFolderPath =
      config.certificate_folder_path || `${chiaRoot}/config/ssl`;

    // If certificateFolderPath starts with "~", replace it with the home directory
    if (certificateFolderPath.startsWith("~")) {
      certificateFolderPath = path.join(
        os.homedir(),
        certificateFolderPath.slice(1)
      );
    }

    const certFile = path.resolve(
      `${certificateFolderPath}/data_layer/private_data_layer.crt`
    );
    const keyFile = path.resolve(
      `${certificateFolderPath}/data_layer/private_data_layer.key`
    );

    cert = fs.readFileSync(certFile);
    key = fs.readFileSync(keyFile);
  }

  const baseOptions = {
    method: "POST",
    cert,
    key,
    timeout: 300000,
  };

  return baseOptions;
};

const getFeeEstimate = async (config) => {
  if (!config) {
    config = currentConfig;
  }
  
  const { cert, key } = getBaseOptions(config);

  if (!config.full_node_host) {
    console.log(`Using default fee estimate: ${config.default_fee}`);
    return config.default_fee;
  }

  try {
    const response = await superagent
      .post(`${config.full_node_host}/get_fee_estimate`)
      .send({
        target_times: [60, 120, 300],
        spend_type: "send_xch_transaction",
      })
      .set("Content-Type", "application/json")
      .key(key)
      .cert(cert)
      .agent(new https.Agent({ rejectUnauthorized: false }));

    const estimates = response?.body?.estimates;
    const mojos = estimates && estimates[0] ? estimates[0] : config.default_fee;

    // If the mojos are over 1 trillion, use the default fee
    if (mojos > convertXchToMojos(1)) {
      console.log(
        `Current fee estimate is too high: ${mojos} mojos, using default fee. ${config.default_fee} mojos`
      );
      return config.default_fee;
    }

    console.log(`Current fee estimate: ${mojos} mojos`);
    return mojos;
  } catch {
    console.log(
      `Fullnode not available to get Fee Estimate. Using default fee. ${config.default_fee} mojos`
    );
    return config.default_fee;
  }
};

module.exports = {
  getFeeEstimate,
  configure,
};
