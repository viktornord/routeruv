const { router, RouterError } = require('./router');
const { STATUS_CODES } = require('http');

const DEFAULT_SUCCESS_STATUS_CODE = 200;
const DEFAULT_ERROR_STATUS_CODE = 500;

const paramsRegexp = /:[^/]+/g;
const getRouteRegexp = route => new RegExp(`^${route}$`.replace(paramsRegexp, '([^/]+)'));

/**
 * @param {{
 *   httpMethod: 'GET'|'PUT'|'POST'|'DELETE'|'PATCH'
 *   path: string
 *   queryStringParameters: {}
 *   body: {}
 * }} event
 * @return {Promise<*>}
 */
async function passEvent(event) {
  const { eventMapper, errorHandler } = router.__getConfig();
  const { path, httpMethod } = eventMapper(event);
  try {
    const handlersByHTTPMethod = router.__getRoutes().get(httpMethod.toUpperCase());
    // get configured handlers
    const matchedRoute = (handlersByHTTPMethod ? [...handlersByHTTPMethod.keys()] : [])
      .find(route => getRouteRegexp(route).test(path));
    const routeConfig = handlersByHTTPMethod.get(matchedRoute);
    const { handlers } = routeConfig || {};
    // check if end point with corresponding HTTP method and path configured
    if (!handlers || !handlers.length) {
      throw new RouterError({
        message: `End point ${httpMethod.toUpperCase()} ${path} is not configured`,
        NO_END_POINT_ERROR: true,
      });
    }
    // prepare additional data for the next handlers
    /** @member {object} additionalRouteData */
    const additionalRouteData = await Promise.all(
      router.__getRouteMatches()
        .filter(({ checkEventMatchFn }) => checkEventMatchFn(event))
        .map(({ handler }) => handler(event)),
    ).then(additionalData => (
      additionalData.reduce((result, data) => ({ ...result, ...(data || {}) }), {})
    ));
    // prepare request body and query for the next handlers
    const requestQuery = event.queryStringParameters || {};
    const requestBody = ['POST', 'PUT', 'PATCH'].includes(httpMethod.toUpperCase())
      ? tryParseBody(event.body)
      : null;
    // extract route params
    const paramNames = (matchedRoute.match(paramsRegexp) || []).map(item => item.substring(1));
    const routeParams = paramNames ? path.match(getRouteRegexp(matchedRoute))
      .slice(1)
      .reduce((res, val, idx) => (Object.assign(res, { [paramNames[idx]]: val })), {}) : {};
    // prepare request data
    const requestData = {
      ...additionalRouteData,
      requestQuery,
      ...(requestBody && { requestBody }),
      routeParams,
    };

    // invoke handlers with additional data
    const responseData = await handlers.reduce(
      (chain, handler) => chain.then(result => handler(event, {
        ...requestData,
        ...(typeof result === 'object' && result !== null && result),
      })),
      Promise.resolve(),
    );

    const { statusCode, body } = responseData || {};

    return {
      statusCode: statusCode || DEFAULT_SUCCESS_STATUS_CODE,
      body: statusCode ? body : responseData,
    };
  } catch (error) {
    const {
      statusCode = DEFAULT_ERROR_STATUS_CODE,
      body = STATUS_CODES[statusCode],
    } = errorHandler(error);


    return { statusCode, body };
  }
}

function tryParseBody(body) {
  try {
    return body ? JSON.parse(body) : null;
  } catch (e) {
    return body;
  }
}

module.exports.router = router;
module.exports.passEvent = passEvent;
