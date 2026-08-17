/**
 * Middleware decorator that validates request bodies against a Zod schema
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Parse will strip any fields not defined in the schema
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = validate;
