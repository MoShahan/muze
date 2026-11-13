const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const fileTypeStub = path.resolve(__dirname, 'src/lib/metadata/file-type-stub.js');

const previousResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Keep music-metadata off the Node-only file-type build that Hermes cannot parse.
  if (moduleName === 'file-type' || moduleName.startsWith('file-type/')) {
    return {
      type: 'sourceFile',
      filePath: fileTypeStub,
    };
  }

  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
