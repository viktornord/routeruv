/** @type {
 *  Map<
 *    'GET'|'POST'|'PUT'|'PATCH'|'DELETE',
 *    Map<
 *      string,
 *      {
 *        handlers: Array<function(object, object):Promise<*>>,
 *        validator?: function(object, object):{value: *, firstErrorMessage: string, error: object}
 *      }
 *    >
 *  >} */

const routes = new Map();
const METHODS = ['POST', 'PUT', 'PATCH', 'DELETE', 'GET'];
METHODS.forEach(method => routes.set(method, new Map()));

const defaultRouterConfig = {
  urlPrefix: '',
  eventMapper: e => e,
  errorHandler: e => {
    console.error(e);
    return e;
  },
};
const userRouterConfig = { ...defaultRouterConfig };

const routeMatches = [];
const router = {
  whenMatches(checkEventMatchFn) {
    return {
      do: (handler) => {
        routeMatches.push({ checkEventMatchFn, handler });

        return router;
      },
    };
  },
  get(path, ...handlers) {
    const httpMethod = 'GET';
    addHandlers({ httpMethod, path, handlers });
    return router;
  },
  post(path, ...handlers) {
    const httpMethod = 'POST';
    addHandlers({ httpMethod, path, handlers });
    return router;
  },
  put(path, ...handlers) {
    const httpMethod = 'PUT';
    addHandlers({ httpMethod, path, handlers });
    return router;
  },
  patch(path, ...handlers) {
    const httpMethod = 'PATCH';
    addHandlers({ httpMethod, path, handlers });
    return router;
  },
  delete(path, ...handlers) {
    const httpMethod = 'DELETE';
    addHandlers({ httpMethod, path, handlers });
    return router;
  },


  /**
   * @param {string} urlPrefix
   * @param {function():{path:string, httpMethod:string, query:{}}} eventMapper
   * @param {function} errorHandler
   */
  configure({
    urlPrefix = defaultRouterConfig.urlPrefix,
    eventMapper = defaultRouterConfig.eventMapper,
    errorHandler = defaultRouterConfig.errorHandler,
  }) {
    Object.assign(
      userRouterConfig,
      { urlPrefix, eventMapper, errorHandler },
    );
  },

  __getRouteMatches() {
    return [...routeMatches];
  },

  __getConfig() {
    return { ...userRouterConfig };
  },

  __getRoutes() {
    return routes;
  },
};

function addHandlers({ httpMethod, path, handlers }) {
  const pathWithPrefix = `${userRouterConfig.urlPrefix}${path}`;
  const routeConfig = routes.get(httpMethod).get(pathWithPrefix) || {
    handlers: [],
  };
  routes.get(httpMethod).set(pathWithPrefix, {
    ...routeConfig,
    handlers: [...routeConfig.handlers, ...handlers],
  });
}


class RouterError extends Error {
  NO_END_POINT_ERROR = false;

  constructor({ message, NO_END_POINT_ERROR = false }) {
    super(message);
    this.NO_END_POINT_ERROR = NO_END_POINT_ERROR;
  }
}
module.exports.router = router;
module.exports.RouterError = RouterError;
