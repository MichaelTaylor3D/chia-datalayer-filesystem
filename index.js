const fuse = require("fuse-bindings");
const DataLayer = require("chia-datalayer");

const MOUNT_PATH = "/chia";

const datalayer = new DataLayer();

const getSubscriptions = async () => {
  try {
    const response = await datalayer.getSubscriptions();

    if (response.body && response.body.success) {
      return response.body.store_ids;
    } else {
      throw new Error("Failed to fetch subscriptions");
    }
  } catch (error) {
    console.error("Error in getSubscriptions:", error.message);
    throw error;
  }
};

const getKeys = async (storeId) => {
  try {
    const response = await datalayer.getKeys({ id: storeId });

    if (response.body && response.body.success) {
      return response.body.keys.map((key) =>
        Buffer.from(key.slice(2), "hex").toString()
      );
    } else {
      throw new Error("Failed to fetch keys");
    }
  } catch (error) {
    console.error("Error in getKeys:", error.message);
    throw error;
  }
};

const getValue = async (storeId, key) => {
  try {
    const response = await datalayer.getValue({ id: storeId, key: key });

    if (response.body && response.body.success) {
      return Buffer.from(response.body.value, "hex");
    } else {
      throw new Error("Failed to fetch file content");
    }
  } catch (error) {
    console.error("Error in getValue:", error.message);
    throw error;
  }
};

const myFilesystem = {
  readdir: async (path, cb) => {
    try {
      if (path === "/") {
        const storeIds = await getSubscriptions();
        cb(0, storeIds);
      } else {
        const storeId = path.slice(1);
        const keys = await getKeys(storeId);
        cb(0, keys);
      }
    } catch (error) {
      cb(fuse.ENOENT);
    }
  },

  open: async (path, flags, cb) => {
    const [storeId, filePath] = path.slice(1).split("/");
    try {
      const keys = await getKeys(storeId);
      if (keys.includes(filePath)) {
        cb(0, 0); // 0 as a file handle
      } else {
        cb(fuse.ENOENT);
      }
    } catch (error) {
      cb(fuse.EIO);
    }
  },

  read: async (path, fd, buffer, length, position, cb) => {
    const [storeId, filePath] = path.slice(1).split("/");
    try {
      const content = await getValue(storeId, filePath);
      const part = content.slice(position, position + length);
      part.copy(buffer);
      cb(part.length);
    } catch (error) {
      cb(0); // Indicate an error
    }
  },
};

fuse.mount(MOUNT_PATH, myFilesystem, (err) => {
  if (err) throw err;
  console.log("Filesystem mounted at " + MOUNT_PATH);
});

process.on("SIGINT", () => {
  fuse.unmount(MOUNT_PATH, (err) => {
    if (err) throw err;
    console.log("Filesystem unmounted");
    process.exit(0);
  });
});
