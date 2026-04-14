export function parseBoolean(value: string | undefined | boolean): boolean {
  if (value === undefined) return false;
  return (
    value === "true" ||
    value === "1" ||
    value === "on" ||
    value === "yes" ||
    value === "y" ||
    value === true
  );
}
export function parseRequestBody(body: string | undefined, event: any) {
  let requestData = {};
  if (!body) {
    event.node.res.statusCode = 400;
    return { error: "Request body is empty" };
  }
  try {
    requestData = JSON.parse(body);
  } catch (error) {
    event.node.res.statusCode = 400;
    return { error: "Invalid JSON in request body" };
  }
  return requestData;
}
