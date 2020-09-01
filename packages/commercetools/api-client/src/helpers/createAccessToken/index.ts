import SdkAuth, { TokenProvider } from '@commercetools/sdk-auth';
import { Token, ApiConfig, CustomerCredentials } from '../../types/setup';
import { getSettings } from './../../index';

interface FlowOptions {
  currentToken?: Token;
  customerCredentials?: CustomerCredentials;
}

const createAuthClient = (config: ApiConfig): SdkAuth =>
  new SdkAuth({
    host: config.authHost,
    projectKey: config.projectKey,
    disableRefreshToken: false,
    credentials: {
      clientId: config.clientId,
      clientSecret: config.clientSecret
    },
    scopes: config.scopes
  });

const getCurrentToken = (options: FlowOptions = {}) => {
  const { currentToken } = getSettings();

  if (currentToken) {
    return currentToken;
  }

  return options.currentToken;
};

const isTokenActive = async (sdkAuth: SdkAuth, token: Token) => {
  const tokenIntrospection = await sdkAuth.introspectToken(token.access_token);

  return tokenIntrospection.active;
};

const getTokenFlow = async (sdkAuth: SdkAuth, options: FlowOptions = {}) => {
  const currentToken = getCurrentToken(options);

  if (options.customerCredentials) {
    return sdkAuth.customerPasswordFlow(options.customerCredentials);
  }

  if (currentToken) {
    const tokenActive = await isTokenActive(sdkAuth, currentToken);

    if (tokenActive) {
      return Promise.resolve(currentToken);
    }
  }

  return sdkAuth.anonymousFlow();
};

const createAccessToken = async (options: FlowOptions = {}): Promise<Token> => {
  const { api } = getSettings();
  const sdkAuth = createAuthClient(api);
  const tokenInfo = await getTokenFlow(sdkAuth, options);
  const tokenProvider = new TokenProvider({ sdkAuth }, tokenInfo);

  return tokenProvider.getTokenInfo();
};

const group = (fn, groups = new Map(), cache = false,
  getKey = (args) => JSON.stringify(args)) => (...args) => {
  const key = getKey(args);
  const existing = groups.get(key);
  if (existing) {
    return existing;
  }
  const result = fn(...args);
  result.then(
    () => !cache && groups.delete(key),
    () => !cache && groups.delete(key)
  );
  groups.set(key, result);
  return result;
};

export default group(createAccessToken);

