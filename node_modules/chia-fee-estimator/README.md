# Chia Fee Estimator

This module provides functionalities to estimate transaction fees in the Chia network. It's designed with flexibility to work with different configurations and also provides a fallback mechanism when the full node is unreachable.

## Overview

The module retrieves the current fee estimate from a Chia full node. If the estimate exceeds certain thresholds or if the full node is unavailable, it falls back to a default fee provided in the configuration.

> **Note:** For an accurate fee estimate, ensure you are running the Chia FullNode. If the FullNode is not running or is unreachable, the estimator will fallback to the default fee.

## Default Configuration

The module comes pre-configured with the following settings:

```javascript
{
  full_node_host: "https://localhost:8555",
  certificate_folder_path: "~/.chia/mainnet/config/ssl",
  default_fee: 300_000_000, // This represents 0.0003 XCH
}
```

You can effortlessly override this configuration using the `configure` function.

### Environment Variables

The module also offers the flexibility to use Chia certificates and keys from environment variables:

- `CHIA_CERT_BASE64`: Base64 encoded Chia certificate.
- `CHIA_KEY_BASE64`: Base64 encoded Chia private key.

If these environment variables are set, the module will use them; otherwise, it will resort to using certificate and key files from the specified directory.

## Functions

### `getFeeEstimate(config)`

Fetches the current fee estimate from a Chia full node:

- **config**: An optional configuration object. If not provided, the function will use the current configuration of the module.

Returns the estimated fee in mojos.

### `configure(newConfig)`

Updates the current configuration of the module:

- **newConfig**: The configuration object containing the keys to be updated.

## Examples

Fetching the current fee estimate:

```javascript
const chiaFeeEstimator = require('chia-fee-estimator');

(async () => {
  const fee = await chiaFeeEstimator.getFeeEstimate();
  console.log(`Current fee estimate: ${fee} mojos`);
})();
```

## Errors & Logging

The module logs information and errors to the console during its operations. Ensure to check the logs for any issues related to fetching the fee estimate.

## Support the Project

If you found this tool helpful, consider donating to support the development of more Chia Datalayer Tools.

**Donation address:** `xch1es9faez5evlvdyfjdjth40fazfm3c9gptds0reuhryf30y3kl67qtcsc83`

Your support is greatly appreciated!