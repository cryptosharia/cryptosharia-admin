const fs = require('fs');
const spec = JSON.parse(fs.readFileSync('api-1.json'));
const result = {};
for (const [name, schema] of Object.entries(spec.components.schemas)) {
  let properties = {};
  if (schema.properties) {
    Object.assign(properties, schema.properties);
  }
  if (schema.allOf) {
    for (const part of schema.allOf) {
      if (part.properties) {
         Object.assign(properties, part.properties);
      }
    }
  }

  result[name] = {};
  for (const [prop, meta] of Object.entries(properties)) {
    const rules = {};
    if (meta.minLength !== undefined) rules.minLength = meta.minLength;
    if (meta.maxLength !== undefined) rules.maxLength = meta.maxLength;
    if (meta.minimum !== undefined) rules.min = meta.minimum;
    if (meta.maximum !== undefined) rules.max = meta.maximum;
    if (meta.enum) rules.enum = meta.enum;
    if (meta.format) rules.format = meta.format;
    if (Object.keys(rules).length > 0) result[name][prop] = rules;
  }
  if (Object.keys(result[name]).length === 0) delete result[name];
}
console.log(JSON.stringify(result, null, 2));
