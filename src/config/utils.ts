import * as fcl from '@onflow/fcl';

export default {
  env() {
    return process.env.NODE_ENV;
  },
  setFlowConfig() {
    if (process.env.NODE_ENV === 'testnet') {
      fcl
        .config()
        .put('grpc.metadata', { api_key: process.env.ALCHEMY_API_KEY })
        .put('accessNode.api', 'https://flow-testnet.g.alchemy.com')
        .put(
          'discovery.wallet',
          'https://fcl-discovery.onflow.org/testnet/authn',
        );
    }
  },
  redisServer() {
    return {
      host: 'redis', // 'redis' in docker, 'localhost' at local environment
      port: '6379',
      db: 3,
      password: '',
      keyPrefix: '',
    };
  },
};
