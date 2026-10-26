import Ajv2020 from 'ajv/dist/2020.js'
import schema from './riddle-config.schema.json' with { type: 'json' }

const validate = new Ajv2020({ allErrors: true }).compile(schema)

/**
 * Checks a parsed riddle-config.json against the shared schema.
 * @param {Object} config - parsed riddle-config.json.
 * @returns {{valid: boolean, errors: Array<{path: string, message: string}>}} result with each error's JSON path and Ajv message.
 */
export function validateRiddleConfig(config) {
  const valid = validate(config)
  const errors = []
  for (const error of validate.errors || []) {
    errors.push({ path: error.instancePath || '/', message: error.message })
  }
  return { valid, errors }
}
