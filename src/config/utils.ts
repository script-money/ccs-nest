import * as fcl from '@onflow/fcl';
import * as config from './dapp-config.json';

export default {
  env() {
    return process.env.NODE_ENV;
  },
  setFlowConfig() {
    if (process.env.NODE_ENV === 'local') {
      fcl.config().put('accessNode.api', config.httpUri);
    }
    if (process.env.NODE_ENV === 'testnet') {
      fcl
        .config()
        .put('accessNode.api', 'https://access-testnet.onflow.org')
        .put(
          'discovery.wallet',
          'https://fcl-discovery.onflow.org/testnet/authn',
        );
    }
  },
  redisServer() {
    return {
      host: 'localhost',
      port: '6379',
      db: 3,
      password: '',
      keyPrefix: '',
    };
  },
};
